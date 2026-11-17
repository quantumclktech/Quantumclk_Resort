package com.quantumclk.erp.access;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** REQ-IAM-007/008: token rules (AUTHENTICATION §5 step 4) and /api/v1/me (api.md §3). */
@SpringBootTest(properties = {
        "erp.keycloak.issuer=" + TestSupport.ISSUER})
@AutoConfigureMockMvc
@Import(TestSupport.class)
class MeEndpointTest {

    static final UUID ADMIN_SUB = UUID.randomUUID();

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void employee() {
        jdbc.update("""
                INSERT INTO employee (id, keycloak_user_id, first_name, last_name, email, username, mobile_e164,
                                      job_role, status, created_by, updated_by, created_at, updated_at)
                VALUES (?, ?, 'Asha', 'Rao', 'asha.rao@example.test', 'asha.rao', '+919800000001',
                        'ADMIN', 'ACTIVE', ?, ?, now(), now())
                ON CONFLICT (keycloak_user_id) DO NOTHING""",
                UUID.randomUUID(), ADMIN_SUB, ADMIN_SUB, ADMIN_SUB);
    }

    private ResultActions me(String token) throws Exception {
        return mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + token));
    }

    private static String admin() {
        return TestSupport.sign(TestSupport.claims(ADMIN_SUB, List.of("ADMIN"),
                List.of("employees.read", "employees.manage", "audit.read")).build());
    }

    @Test
    void validTokenReturnsProfileRolesPermissionsAndModules() throws Exception {
        me(admin()).andExpect(status().isOk())
                .andExpect(jsonPath("$.employee.username").value("asha.rao"))
                .andExpect(jsonPath("$.roles", contains("ADMIN")))
                .andExpect(jsonPath("$.permissions", containsInAnyOrder("employees.read", "employees.manage", "audit.read")))
                .andExpect(jsonPath("$.modules", contains("employees", "audit")));
    }

    @Test
    void adminWithLeadsPermissionDoesNotSeeLeadsModule() throws Exception {
        String t = TestSupport.sign(TestSupport.claims(ADMIN_SUB, List.of("ADMIN"),
                List.of("employees.read", "employees.manage", "leads.read_team", "audit.read")).build());
        me(t).andExpect(status().isOk())
                .andExpect(jsonPath("$.modules", contains("employees", "audit")));
    }

    @Test
    void keycloakUserWithoutErpRecordGetsNullEmployee() throws Exception {
        String t = TestSupport.sign(TestSupport.claims(UUID.randomUUID(), List.of("SALES_EXECUTIVE"),
                List.of("leads.read_queue")).build());
        me(t).andExpect(status().isOk())
                .andExpect(jsonPath("$.employee").value(nullValue()))
                .andExpect(jsonPath("$.modules", contains("dashboard", "leads")));
    }

    @Test
    void aSalesExecutiveSeesOnlyMemberships() throws Exception {   // D-135: shown as their Dashboard
        String t = TestSupport.sign(TestSupport.claims(UUID.randomUUID(), List.of("SALES_EXECUTIVE"),
                List.of("leads.read_queue", "memberships.register", "memberships.read_own")).build());
        me(t).andExpect(status().isOk()).andExpect(jsonPath("$.modules", contains("memberships")));
    }

    @Test
    void noTokenIs401WithErrorBody() throws Exception {
        mvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REQUIRED"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(header().exists("X-Correlation-Id"));
    }

    @Test
    void expiredTokenIs401() throws Exception {
        Instant past = Instant.now().minusSeconds(600);
        String t = TestSupport.sign(TestSupport.claims(ADMIN_SUB, List.of("ADMIN"), List.of())
                .issueTime(Date.from(past.minusSeconds(300))).expirationTime(Date.from(past)).build());
        me(t).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenFromAnotherRealmIs401() throws Exception {   // e.g. a guest token (gh-guests)
        String t = TestSupport.sign(TestSupport.claims(ADMIN_SUB, List.of("ADMIN"), List.of())
                .issuer("http://test-keycloak/realms/gh-guests").build());
        me(t).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenForAnotherAudienceIs401() throws Exception {
        String t = TestSupport.sign(TestSupport.claims(ADMIN_SUB, List.of("ADMIN"), List.of())
                .audience("some-other-client").build());
        me(t).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenSignedWithUnknownKeyIs401() throws Exception {
        String t = TestSupport.sign(TestSupport.claims(ADMIN_SUB, List.of("ADMIN"), List.of()).build(), TestSupport.OTHER_KEY);
        me(t).andExpect(status().isUnauthorized());
    }

    @Test
    void safeCorrelationIdIsEchoedAndUnsafeOneReplaced() throws Exception {
        mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + admin()).header("X-Correlation-Id", "abc-123"))
                .andExpect(header().string("X-Correlation-Id", "abc-123"));
        mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + admin()).header("X-Correlation-Id", "bad\nvalue"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String id = result.getResponse().getHeader("X-Correlation-Id");
                    if (id == null || id.contains("\n") || id.equals("bad\nvalue")) throw new AssertionError("unsafe id echoed: " + id);
                });
    }

    @Test
    void healthIsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
