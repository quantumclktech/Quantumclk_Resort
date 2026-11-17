package com.quantumclk.erp.access.employee;

import com.quantumclk.erp.access.membership.IdentityNumbers;

import com.quantumclk.erp.access.employee.AuditLog.Actor;
import com.quantumclk.erp.access.keycloak.KeycloakAdmin;
import com.quantumclk.erp.access.keycloak.KeycloakAdmin.UserState;
import com.quantumclk.erp.access.web.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Workflow 1 — admin-driven onboarding (AUTHENTICATION §4, §7, §10). The ERP row is saved first, then Keycloak is
 * provisioned step by step; every step can be repeated, so failures leave a visible status and a retry path.
 */
@Service
public class EmployeeService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);

    /** pan: the normalised full PAN, or null (bootstrap ADMIN). Used only to mask and hash it; never stored or logged. */
    public record CreateCommand(String firstName, String lastName, String email, String username, String mobile,
                                JobRole jobRole, boolean whatsappOptIn, String pan) {
        @Override public String toString() { return "CreateCommand[" + username + "]"; }
    }

    public record Result(EmployeeView employee, boolean provisioned) { }

    private final EmployeeRepository employees;
    private final KeycloakAdmin keycloak;
    private final AuditLog audit;
    private final TransactionTemplate tx;
    private final JdbcTemplate jdbc;
    private final JsonMapper json;
    private final IdentityNumbers ids;

    EmployeeService(EmployeeRepository employees, KeycloakAdmin keycloak, AuditLog audit, TransactionTemplate tx,
                    JdbcTemplate jdbc, JsonMapper json, IdentityNumbers ids) {
        this.ids = ids;
        this.employees = employees;
        this.keycloak = keycloak;
        this.audit = audit;
        this.tx = tx;
        this.jdbc = jdbc;
        this.json = json;
    }

    public Result create(CreateCommand raw, Actor actor, UUID idempotencyKey) {
        CreateCommand c = normalise(raw);
        String panHash = c.pan() == null ? null : ids.hash(IdentityNumbers.PAN, c.pan());
        String panMasked = c.pan() == null ? null : IdentityNumbers.mask(IdentityNumbers.PAN, c.pan());
        // The request hash covers the PAN's keyed hash, not the PAN itself.
        String hash = sha256(json.writeValueAsString(new CreateCommand(c.firstName(), c.lastName(), c.email(), c.username(),
                c.mobile(), c.jobRole(), c.whatsappOptIn(), panHash)));
        Result replay = replay(actor, idempotencyKey, hash);
        if (replay != null) return replay;

        UUID id = UUID.randomUUID();
        try {
            tx.executeWithoutResult(s -> {
                // Claim the key and save the employee atomically: a double click can't create two employees.
                jdbc.update("INSERT INTO idempotency_key (key, actor_id, request_hash, created_at) VALUES (?, ?, ?, ?)",
                        idempotencyKey, actor.idOrNil(), hash, Timestamp.from(Instant.now()));
                Employee e = new Employee(id, c.firstName(), c.lastName(), c.email(), c.username(), c.mobile(),
                        c.jobRole().name(), c.whatsappOptIn(), panMasked, panHash, actor.idOrNil(), Instant.now());
                employees.saveAndFlush(e);
                audit.record(actor, "EMPLOYEE_CREATED", id, null, EmployeeView.of(e), null, true);
            });
        } catch (DataIntegrityViolationException e) {
            Result again = replay(actor, idempotencyKey, hash);   // lost a race on the same key
            if (again != null) return again;
            throw duplicate(e);
        }

        provision(id, actor);
        EmployeeView view = EmployeeView.of(employees.findById(id).orElseThrow());
        Result result = new Result(view, !"PENDING_PROVISIONING".equals(view.status()));
        jdbc.update("UPDATE idempotency_key SET response_json = ?::jsonb WHERE key = ? AND actor_id = ?",
                json.writeValueAsString(result), idempotencyKey, actor.idOrNil());
        return result;
    }

    /**
     * Brings Keycloak in line with the ERP row: create (or adopt) the user, map the role, send the setup email.
     * Holds a row lock that other instances skip, so the sync job and a retry never work on the same employee at once.
     */
    public void provision(UUID id, Actor actor) {
        tx.executeWithoutResult(s -> employees.lockById(id).ifPresent(e -> {
            if (!List.of("PENDING_PROVISIONING", "INVITE_EMAIL_FAILED").contains(e.getStatus())) return;
            String before = e.getStatus();
            try {
                if (e.getKeycloakUserId() == null) e.linkKeycloak(createOrAdopt(e));
                keycloak.assignRealmRole(e.getKeycloakUserId(), e.getJobRole());
                keycloak.sendSetupEmail(e.getKeycloakUserId());
                e.setStatus("INVITED", null, actor.idOrNil(), Instant.now());
                audit.record(actor, "EMPLOYEE_INVITED", id, Map.of("status", before), Map.of("status", "INVITED"), null, true);
            } catch (KeycloakAdmin.EmailFailed ex) {
                e.setStatus("INVITE_EMAIL_FAILED", "Invite email could not be sent", actor.idOrNil(), Instant.now());
                audit.record(actor, "EMPLOYEE_INVITE_FAILED", id, null, null, "email", false);
            } catch (KeycloakAdmin.Unavailable ex) {
                log.warn("Keycloak unavailable while provisioning employee {}; will retry", id);
                e.setStatus(before, "Identity system unavailable; retrying automatically", actor.idOrNil(), Instant.now());
                audit.record(actor, "EMPLOYEE_PROVISIONING_DEFERRED", id, null, null, "keycloak unavailable", false);
            } catch (KeycloakAdmin.Conflict ex) {
                e.setStatus(before, "Email or username already exists in the identity system", actor.idOrNil(), Instant.now());
                audit.record(actor, "EMPLOYEE_PROVISIONING_CONFLICT", id, null, null, "conflict", false);
            }
            employees.save(e);
        }));
    }

    /** Keycloak is the source of truth for activation (AUTHENTICATION §7 "Status sync"). */
    public void refreshStatus(UUID id, Actor actor) {
        tx.executeWithoutResult(s -> employees.lockById(id).ifPresent(e -> {
            if (e.getKeycloakUserId() == null) return;
            keycloak.getUser(e.getKeycloakUserId()).ifPresent(u -> {
                String next = derive(e.getStatus(), u);
                if (!next.equals(e.getStatus())) {
                    audit.record(actor, "EMPLOYEE_STATUS_SYNCED", id, Map.of("status", e.getStatus()), Map.of("status", next), null, true);
                    e.setStatus(next, null, actor.idOrNil(), Instant.now());
                    employees.save(e);
                }
            });
        }));
    }

    static String derive(String current, UserState u) {
        if (!u.enabled()) return "DISABLED";
        if (u.emailVerified() && u.requiredActions().isEmpty()) return "ACTIVE";
        return current;
    }

    public Page<EmployeeView> list(String status, String role, String q, int page, int size) {
        Specification<Employee> spec = (r, cq, cb) -> cb.conjunction();
        if (status != null) spec = spec.and((r, cq, cb) -> cb.equal(r.get("status"), status));
        if (role != null) spec = spec.and((r, cq, cb) -> cb.equal(r.get("jobRole"), role));
        if (q != null && !q.isBlank()) {
            String like = "%" + q.toLowerCase().replace("%", "\\%").replace("_", "\\_") + "%";
            spec = spec.and((r, cq, cb) -> cb.or(cb.like(cb.lower(r.get("firstName")), like), cb.like(cb.lower(r.get("lastName")), like),
                    cb.like(r.get("email"), like), cb.like(r.get("username"), like)));
        }
        Pageable p = PageRequest.of(page, Math.min(Math.max(size, 1), 100), org.springframework.data.domain.Sort.by("createdAt").descending());
        Page<Employee> found = employees.findAll(spec, p);
        // Best effort live status for people still setting up; Keycloak being down must not break the list.
        found.stream().filter(e -> "INVITED".equals(e.getStatus())).forEach(e -> {
            try { refreshStatus(e.getId(), Actor.SYNC_JOB); } catch (RuntimeException ex) { log.warn("Status refresh skipped: {}", ex.getMessage()); }
        });
        return employees.findAll(spec, p).map(EmployeeView::of);
    }

    public EmployeeView get(UUID id) {
        return employees.findById(id).map(EmployeeView::of)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Employee not found."));
    }

    private UUID createOrAdopt(Employee e) {
        try {
            return keycloak.createUser(new KeycloakAdmin.NewUser(e.getUsername(), e.getEmail(), e.getFirstName(), e.getLastName()));
        } catch (KeycloakAdmin.Conflict c) {
            // Adopt only our own earlier attempt: same username AND same email, and not linked to anyone else (F2).
            UserState existing = keycloak.findByUsername(e.getUsername()).orElseThrow(() -> c);
            if (e.getEmail().equalsIgnoreCase(existing.email()) && !employees.existsByKeycloakUserId(existing.id())) return existing.id();
            throw c;
        }
    }

    private Result replay(Actor actor, UUID key, String hash) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT request_hash, response_json::text AS response FROM idempotency_key WHERE key = ? AND actor_id = ?", key, actor.idOrNil());
        if (rows.isEmpty()) return null;
        if (!hash.equals(rows.getFirst().get("request_hash")))
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "IDEMPOTENCY_MISMATCH", "This Idempotency-Key was already used for a different request.");
        Object response = rows.getFirst().get("response");
        if (response == null) throw new ApiException(HttpStatus.CONFLICT, "CONFLICT", "The same request is still being processed.");
        return json.readValue((String) response, Result.class);
    }

    private static CreateCommand normalise(CreateCommand c) {
        return new CreateCommand(c.firstName().strip(), c.lastName().strip(), c.email().strip().toLowerCase(),
                c.username().strip().toLowerCase(), c.mobile().replaceAll("[\\s-]", ""), c.jobRole(), c.whatsappOptIn(),
                c.pan() == null ? null : IdentityNumbers.normalise(IdentityNumbers.PAN, c.pan()));
    }

    private static ApiException duplicate(DataIntegrityViolationException e) {
        String m = String.valueOf(e.getMostSpecificCause().getMessage());
        String field = m.contains("email") ? "email" : m.contains("username") ? "username" : m.contains("mobile") ? "mobile"
                : m.contains("pan_hash") ? "PAN" : "field";
        return new ApiException(HttpStatus.CONFLICT, "CONFLICT", "An employee with this " + field + " already exists.");
    }

    private static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
