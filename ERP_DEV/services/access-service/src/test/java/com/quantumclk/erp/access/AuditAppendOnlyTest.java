package com.quantumclk.erp.access;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** REQ-IAM-012: the audit trail can be appended to but never changed or deleted. */
@SpringBootTest(properties = {
        "erp.keycloak.issuer=" + TestSupport.ISSUER})
@Import(TestSupport.class)
class AuditAppendOnlyTest {

    @Autowired JdbcTemplate jdbc;

    @Test
    void insertWorksUpdateDeleteAndTruncateAreRefused() {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO audit_event (id, occurred_at, actor_label, action, entity_type, outcome) VALUES (?, now(), 'test', 'TEST', 'EMPLOYEE', 'SUCCESS')", id);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_event WHERE id = ?", Integer.class, id)).isEqualTo(1);

        assertThatThrownBy(() -> jdbc.update("UPDATE audit_event SET action = 'CHANGED' WHERE id = ?", id)).hasMessageContaining("append-only");
        assertThatThrownBy(() -> jdbc.update("DELETE FROM audit_event WHERE id = ?", id)).hasMessageContaining("append-only");
        assertThatThrownBy(() -> jdbc.execute("TRUNCATE audit_event")).hasMessageContaining("append-only");
    }

    @Test
    void employeeRowsRejectBadEmailUsernameMobileAndRole() {
        String sql = """
                INSERT INTO employee (id, first_name, last_name, email, username, mobile_e164, job_role, status,
                                      created_by, updated_by, created_at, updated_at)
                VALUES (gen_random_uuid(), 'A', 'B', ?, ?, ?, ?, 'INVITED', gen_random_uuid(), gen_random_uuid(), now(), now())""";
        assertThatThrownBy(() -> jdbc.update(sql, "Upper@Example.test", "ok.user", "+919800000002", "ADMIN")).hasMessageContaining("email");
        assertThatThrownBy(() -> jdbc.update(sql, "a@example.test", "Bad User", "+919800000003", "ADMIN")).hasMessageContaining("username");
        assertThatThrownBy(() -> jdbc.update(sql, "b@example.test", "ok.user2", "98000", "ADMIN")).hasMessageContaining("mobile");
        assertThatThrownBy(() -> jdbc.update(sql, "c@example.test", "ok.user3", "+919800000004", "OWNER")).hasMessageContaining("job_role");
    }
}
