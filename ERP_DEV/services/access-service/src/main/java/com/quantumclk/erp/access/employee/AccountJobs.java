package com.quantumclk.erp.access.employee;

import com.quantumclk.erp.access.employee.AuditLog.Actor;
import com.quantumclk.erp.access.employee.EmployeeService.CreateCommand;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/** Background work: retry provisioning, sync activation status, clean idempotency keys, bootstrap the first ADMIN. */
@Component
public class AccountJobs {

    private static final Logger log = LoggerFactory.getLogger(AccountJobs.class);

    private final EmployeeService service;
    private final EmployeeRepository employees;
    private final JdbcTemplate jdbc;
    private final BootstrapAdmin bootstrap;

    AccountJobs(EmployeeService service, EmployeeRepository employees, JdbcTemplate jdbc, BootstrapAdmin bootstrap) {
        this.service = service;
        this.employees = employees;
        this.jdbc = jdbc;
        this.bootstrap = bootstrap;
    }

    public record BootstrapAdmin(String email, String username, String firstName, String lastName, String mobile) {
        boolean configured() { return email != null && !email.isBlank(); }
    }

    /** Every 5 min by default (AUTHENTICATION §7). Row locks make it safe with several instances. */
    @Scheduled(initialDelayString = "${erp.sync.initial-delay:PT1M}", fixedDelayString = "${erp.sync.interval:PT5M}")
    public void sync() {
        for (UUID id : employees.idsWithStatus(List.of("PENDING_PROVISIONING", "INVITE_EMAIL_FAILED"), PageRequest.of(0, 50))) {
            run(() -> service.provision(id, Actor.SYNC_JOB));
        }
        for (UUID id : employees.idsWithStatus(List.of("INVITED", "ACTIVE"), PageRequest.of(0, 200))) {
            run(() -> service.refreshStatus(id, Actor.SYNC_JOB));
        }
        jdbc.update("DELETE FROM idempotency_key WHERE created_at < ?", Timestamp.from(Instant.now().minus(24, ChronoUnit.HOURS)));
    }

    /** KEYCLOAK-SETUP §10: while no usable ADMIN exists, invite the configured person through the normal flow. */
    @EventListener(ApplicationReadyEvent.class)
    public void bootstrapFirstAdmin() {
        if (!bootstrap.configured() || employees.existsByJobRoleAndStatusNot("ADMIN", "DISABLED")) return;
        try {
            // Same key on every restart, so a crash mid-way can't create the admin twice.
            UUID key = UUID.nameUUIDFromBytes(("bootstrap:" + bootstrap.email().toLowerCase()).getBytes(StandardCharsets.UTF_8));
            var r = service.create(new CreateCommand(bootstrap.firstName(), bootstrap.lastName(), bootstrap.email(),
                    bootstrap.username(), bootstrap.mobile(), JobRole.ADMIN, false, null), Actor.BOOTSTRAP, key);
            log.info("Bootstrap ADMIN {} is {}", r.employee().username(), r.employee().status());
        } catch (RuntimeException e) {
            log.error("Bootstrap ADMIN could not be created: {}", e.getMessage());
        }
    }

    private static void run(Runnable r) {
        try { r.run(); } catch (RuntimeException e) { log.warn("Account job step skipped: {}", e.getMessage()); }
    }
}
