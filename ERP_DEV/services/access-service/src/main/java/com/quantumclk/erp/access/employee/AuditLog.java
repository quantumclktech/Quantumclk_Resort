package com.quantumclk.erp.access.employee;

import com.quantumclk.erp.access.web.CorrelationIdFilter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

/** Append-only audit (AUTHENTICATION §9, §11): employees and members. Never pass passwords, tokens or links in before/after. */
@Component
public class AuditLog {

    public record Actor(UUID id, String label, String ip) {
        public static final Actor BOOTSTRAP = new Actor(null, "SYSTEM_BOOTSTRAP", null);
        public static final Actor SYNC_JOB = new Actor(null, "SYSTEM_SYNC", null);
        /** created_by/updated_by need a value; system actors use the nil UUID. */
        public UUID idOrNil() { return id != null ? id : new UUID(0, 0); }
    }

    private final JdbcTemplate jdbc;
    private final JsonMapper json;

    AuditLog(JdbcTemplate jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public void record(Actor actor, String action, UUID employeeId, Object before, Object after, String reason, boolean success) {
        record(actor, action, "EMPLOYEE", employeeId, before, after, reason, success);
    }

    /** Any entity type (e.g. "MEMBER" for Gold Membership, ERP-05). Same append-only table and rules. */
    public void record(Actor actor, String action, String entityType, UUID entityId, Object before, Object after,
                       String reason, boolean success) {
        jdbc.update("""
                INSERT INTO audit_event (id, occurred_at, actor_id, actor_label, actor_ip, action, entity_type, entity_id,
                                         before_json, after_json, reason, correlation_id, outcome)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, ?, ?)""",
                UUID.randomUUID(), Timestamp.from(Instant.now()), actor.id(), actor.label(), actor.ip(), action, entityType, entityId,
                before == null ? null : json.writeValueAsString(before), after == null ? null : json.writeValueAsString(after),
                reason, CorrelationIdFilter.current(), success ? "SUCCESS" : "FAILURE");
    }
}
