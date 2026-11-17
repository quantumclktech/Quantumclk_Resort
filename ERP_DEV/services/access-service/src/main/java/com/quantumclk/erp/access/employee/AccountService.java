package com.quantumclk.erp.access.employee;

import com.quantumclk.erp.access.employee.AuditLog.Actor;
import com.quantumclk.erp.access.keycloak.KeycloakAdmin;
import com.quantumclk.erp.access.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Account management after onboarding (AUTHENTICATION §7). Order is always Keycloak first, then the ERP row:
 * if Keycloak fails nothing changes (fail closed); if the DB fails afterwards, the status sync repairs it.
 */
@Service
public class AccountService {

    static final int RESEND_LIMIT_PER_HOUR = 3;
    private static final List<String> JOB_ROLES = Arrays.stream(JobRole.values()).map(Enum::name).toList();

    private final EmployeeRepository employees;
    private final KeycloakAdmin keycloak;
    private final AuditLog audit;
    private final TransactionTemplate tx;
    private final JdbcTemplate jdbc;

    AccountService(EmployeeRepository employees, KeycloakAdmin keycloak, AuditLog audit, TransactionTemplate tx, JdbcTemplate jdbc) {
        this.employees = employees;
        this.keycloak = keycloak;
        this.audit = audit;
        this.tx = tx;
        this.jdbc = jdbc;
    }

    public EmployeeView setActive(UUID id, boolean active, String reason, Actor actor) {
        requireReason(reason);
        return tx.execute(s -> {
            guardAdmins();
            Employee e = locked(id);
            UUID kc = linked(e);
            if (!active) {
                if (e.getId().equals(actor.id())) throw conflict("You can't deactivate your own account.");
                if ("ADMIN".equals(e.getJobRole()) && otherUsableAdmins(e.getId()) == 0)
                    throw conflict("This is the last active administrator; add another one first.");
                upstream(() -> { keycloak.setEnabled(kc, false); keycloak.logout(kc); });
                return change(e, "DISABLED", reason, "EMPLOYEE_DEACTIVATED", actor);
            }
            upstream(() -> keycloak.setEnabled(kc, true));
            String next = upstream(() -> keycloak.getUser(kc)).map(u -> EmployeeService.derive("INVITED", u)).orElse("INVITED");
            return change(e, next, reason, "EMPLOYEE_REACTIVATED", actor);
        });
    }

    public EmployeeView resendInvite(UUID id, Actor actor) {
        // The transaction returns the outcome; the error is thrown after commit so the INVITE_EMAIL_FAILED status is kept.
        Object outcome = tx.execute(s -> {
            Employee e = locked(id);
            UUID kc = linked(e);
            if (!List.of("INVITED", "INVITE_EMAIL_FAILED").contains(e.getStatus()))
                throw conflict("Only employees who haven't finished setting up can get a new invite.");
            Integer recent = jdbc.queryForObject("""
                    SELECT count(*) FROM audit_event WHERE entity_id = ? AND action = 'EMPLOYEE_INVITE_RESENT'
                      AND occurred_at > now() - interval '1 hour'""", Integer.class, id);
            if (recent != null && recent >= RESEND_LIMIT_PER_HOUR)
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "Invite already resent 3 times in the last hour.");
            try {
                upstream(() -> keycloak.sendSetupEmail(kc));
            } catch (KeycloakAdmin.EmailFailed ex) {
                change(e, "INVITE_EMAIL_FAILED", "Invite email could not be sent", "EMPLOYEE_INVITE_FAILED", actor);
                return Boolean.FALSE;
            }
            return change(e, "INVITED", null, "EMPLOYEE_INVITE_RESENT", actor);
        });
        if (Boolean.FALSE.equals(outcome))
            throw new ApiException(HttpStatus.BAD_GATEWAY, "UPSTREAM_FAILED", "The invite email could not be sent. Try again later.");
        return (EmployeeView) outcome;
    }

    public EmployeeView changeRole(UUID id, JobRole role, String reason, Actor actor) {
        requireReason(reason);
        return tx.execute(s -> {
            guardAdmins();
            Employee e = locked(id);
            UUID kc = linked(e);
            if (role.name().equals(e.getJobRole())) return EmployeeView.of(e);
            if ("ADMIN".equals(e.getJobRole())) {
                if (e.getId().equals(actor.id())) throw conflict("You can't remove your own administrator role.");
                if (otherUsableAdmins(e.getId()) == 0) throw conflict("This is the last active administrator; add another one first.");
            }
            upstream(() -> {
                keycloak.replaceJobRole(kc, role.name(), JOB_ROLES);
                keycloak.logout(kc); // new permissions take effect at the next sign-in instead of in up to 5 minutes
            });
            String before = e.getJobRole();
            e.setJobRole(role.name(), actor.idOrNil(), Instant.now());
            employees.save(e);
            audit.record(actor, "EMPLOYEE_ROLE_CHANGED", id, Map.of("jobRole", before), Map.of("jobRole", role.name()), reason, true);
            return EmployeeView.of(e);
        });
    }

    /** Serialises admin-count checks so two admins can't remove each other at the same moment. */
    private void guardAdmins() {
        jdbc.queryForList("SELECT pg_advisory_xact_lock(7701)");
    }

    private int otherUsableAdmins(UUID except) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM employee WHERE job_role = 'ADMIN' AND status <> 'DISABLED' AND id <> ?",
                Integer.class, except);
        return n == null ? 0 : n;
    }

    private Employee locked(UUID id) {
        if (!employees.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Employee not found.");
        return employees.lockById(id).orElseThrow(() -> conflict("This employee is being updated right now; try again."));
    }

    private static UUID linked(Employee e) {
        if (e.getKeycloakUserId() == null) throw conflict("This employee's account isn't set up yet; use Retry first.");
        return e.getKeycloakUserId();
    }

    private EmployeeView change(Employee e, String status, String reason, String action, Actor actor) {
        String before = e.getStatus();
        e.setStatus(status, reason, actor.idOrNil(), Instant.now());
        employees.save(e);
        audit.record(actor, action, e.getId(), Map.of("status", before), Map.of("status", status), reason, true);
        return EmployeeView.of(e);
    }

    private static void requireReason(String reason) {
        if (reason == null || reason.isBlank())
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "A reason is required.");
    }

    private static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
    }

    private static void upstream(Runnable r) {
        upstream(() -> { r.run(); return null; });
    }

    private static <T> T upstream(java.util.function.Supplier<T> s) {
        try {
            return s.get();
        } catch (KeycloakAdmin.Unavailable e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "UPSTREAM_FAILED", "The identity system is unavailable; nothing was changed. Try again.");
        }
    }
}
