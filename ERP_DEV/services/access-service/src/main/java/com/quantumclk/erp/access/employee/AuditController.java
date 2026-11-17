package com.quantumclk.erp.access.employee;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** GET /api/v1/admin/audit: read-only view of the account audit trail (api.md §3; audit.read = ADMIN). */
@RestController
public class AuditController {

    private final JdbcTemplate jdbc;

    AuditController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/api/v1/admin/audit")
    @PreAuthorize("hasAuthority('PERM_audit.read')")
    EmployeeController.PageView<Map<String, Object>> list(@RequestParam(required = false) UUID entityId,
                                                          @RequestParam(required = false) UUID actorId,
                                                          @RequestParam(required = false) Instant from,
                                                          @RequestParam(required = false) Instant to,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "50") int size) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> args = new ArrayList<>();
        if (entityId != null) { where.append(" AND entity_id = ?"); args.add(entityId); }
        if (actorId != null) { where.append(" AND actor_id = ?"); args.add(actorId); }
        if (from != null) { where.append(" AND occurred_at >= ?"); args.add(Timestamp.from(from)); }
        if (to != null) { where.append(" AND occurred_at < ?"); args.add(Timestamp.from(to)); }
        int s = Math.min(Math.max(size, 1), 200), p = Math.max(page, 0);
        Long total = jdbc.queryForObject("SELECT count(*) FROM audit_event" + where, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(s);
        pageArgs.add((long) p * s);
        List<Map<String, Object>> items = jdbc.queryForList("""
                SELECT id, occurred_at AS "occurredAt", actor_id AS "actorId", actor_label AS "actor", actor_ip AS "actorIp",
                       action, entity_type AS "entityType", entity_id AS "entityId", before_json::text AS "before",
                       after_json::text AS "after", reason, correlation_id AS "correlationId", outcome
                FROM audit_event""" + where + " ORDER BY occurred_at DESC LIMIT ? OFFSET ?", pageArgs.toArray());
        return new EmployeeController.PageView<>(items, p, s, total == null ? 0 : total);
    }
}
