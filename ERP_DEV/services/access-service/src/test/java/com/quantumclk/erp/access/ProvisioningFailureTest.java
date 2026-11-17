package com.quantumclk.erp.access;

import com.quantumclk.erp.access.employee.AccountJobs;
import com.quantumclk.erp.access.employee.EmployeeRepository;
import com.quantumclk.erp.access.keycloak.KeycloakAdmin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** AUTHENTICATION §10 F1–F4 and the first-ADMIN bootstrap (KEYCLOAK-SETUP §10), with a fake Keycloak. */
@SpringBootTest(properties = {
        "erp.keycloak.issuer=" + TestSupport.ISSUER,
        "BOOTSTRAP_ADMIN_EMAIL=Owner@Example.test", "BOOTSTRAP_ADMIN_USERNAME=owner",
        "BOOTSTRAP_ADMIN_FIRST_NAME=Resort", "BOOTSTRAP_ADMIN_LAST_NAME=Owner", "BOOTSTRAP_ADMIN_MOBILE=+919800000010"})
@AutoConfigureMockMvc
@Import({TestSupport.class, ProvisioningFailureTest.Fake.class})
class ProvisioningFailureTest {

    @TestConfiguration(proxyBeanMethods = false)
    static class Fake {
        static final FakeKeycloak KC = new FakeKeycloak();
        @Bean @Primary KeycloakAdmin fakeKeycloak() { return KC; }
    }

    static final UUID ADMIN = UUID.randomUUID();
    static final FakeKeycloak kc = Fake.KC;

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired EmployeeRepository employees;
    @Autowired AccountJobs jobs;

    @BeforeEach
    void healthyKeycloak() { kc.down = false; kc.emailBroken = false; }

    private ResultActions create(String username, String email) throws Exception {
        String token = TestSupport.sign(TestSupport.claims(ADMIN, List.of("ADMIN"), List.of("employees.manage", "employees.read")).build());
        return mvc.perform(post("/api/v1/admin/employees").header("Authorization", "Bearer " + token)
                .header("Idempotency-Key", UUID.randomUUID().toString()).contentType("application/json")
                .content("""
                        {"firstName":"Test","lastName":"Person","email":"%s","username":"%s","mobile":"+91 98000 %05d","jobRole":"SALES_EXECUTIVE","pan":"%s"}"""
                        .formatted(email, username, Math.abs(username.hashCode()) % 100000, TestSupport.pan(username))));
    }

    private String dbStatus(String username) {
        return jdbc.queryForObject("SELECT status FROM employee WHERE username = ?", String.class, username);
    }

    @Test
    void bootstrapInvitedTheFirstAdminThroughTheNormalFlow() {
        assertThat(dbStatus("owner")).isEqualTo("INVITED");
        assertThat(jdbc.queryForObject("SELECT email FROM employee WHERE username = 'owner'", String.class)).isEqualTo("owner@example.test");
        UUID kcId = jdbc.queryForObject("SELECT keycloak_user_id FROM employee WHERE username = 'owner'", UUID.class);
        assertThat(kc.roles.get(kcId)).containsExactly("ADMIN");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_event WHERE actor_label = 'SYSTEM_BOOTSTRAP'", Integer.class)).isGreaterThan(0);
        jobs.bootstrapFirstAdmin(); // a restart must not create a second admin
        assertThat(jdbc.queryForObject("SELECT count(*) FROM employee WHERE job_role = 'ADMIN'", Integer.class)).isEqualTo(1);
    }

    @Test
    void f1KeycloakDownGives202AndTheJobFinishesLater() throws Exception {
        kc.down = true;
        create("f1.user", "f1@example.test").andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("PENDING_PROVISIONING"))
                .andExpect(jsonPath("$.statusReason").value("Identity system unavailable; retrying automatically"));
        kc.down = false;
        jobs.sync();
        assertThat(dbStatus("f1.user")).isEqualTo("INVITED");
    }

    @Test
    void f2ConflictAdoptsOnlyOurOwnEarlierAttempt() throws Exception {
        UUID earlier = kc.createUser(new KeycloakAdmin.NewUser("f2.mine", "f2.mine@example.test", "A", "B"));
        create("f2.mine", "f2.mine@example.test").andExpect(status().isCreated());
        assertThat(jdbc.queryForObject("SELECT keycloak_user_id FROM employee WHERE username = 'f2.mine'", UUID.class)).isEqualTo(earlier);

        kc.createUser(new KeycloakAdmin.NewUser("f2.taken", "someone.else@example.test", "X", "Y"));
        create("f2.taken", "f2.taken@example.test").andExpect(status().isAccepted())
                .andExpect(jsonPath("$.statusReason").value("Email or username already exists in the identity system"))
                .andExpect(jsonPath("$.identityLinked").value(false));
    }

    @Test
    void f4EmailFailureIsVisibleAndRetryable() throws Exception {
        kc.emailBroken = true;
        String id = com.jayway.jsonpath.JsonPath.read(create("f4.user", "f4@example.test")
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("INVITE_EMAIL_FAILED"))
                .andReturn().getResponse().getContentAsString(), "$.id");
        kc.emailBroken = false;
        String token = TestSupport.sign(TestSupport.claims(ADMIN, List.of("ADMIN"), List.of("employees.manage", "employees.read")).build());
        mvc.perform(post("/api/v1/admin/employees/" + id + "/retry-provisioning").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("INVITED"));
    }

    private String adminToken(UUID sub) {
        return "Bearer " + TestSupport.sign(TestSupport.claims(sub, List.of("ADMIN"), List.of("employees.manage", "employees.read", "roles.assign")).build());
    }

    private String idOf(String username) {
        return jdbc.queryForObject("SELECT id::text FROM employee WHERE username = ?", String.class, username);
    }

    @Test
    void theLastActiveAdminCannotBeDeactivatedOrDemoted() throws Exception {
        String owner = idOf("owner");   // the only ADMIN in this context (bootstrap)
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/admin/employees/" + owner + "/status")
                        .header("Authorization", adminToken(UUID.randomUUID())).contentType("application/json")
                        .content("{\"active\":false,\"reason\":\"test\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("This is the last active administrator; add another one first."));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/admin/employees/" + owner + "/role")
                        .header("Authorization", adminToken(UUID.randomUUID())).contentType("application/json")
                        .content("{\"role\":\"SALES_EXECUTIVE\",\"reason\":\"test\"}"))
                .andExpect(status().isConflict());
        assertThat(dbStatus("owner")).isEqualTo("INVITED");
    }

    @Test
    void anAdminCannotDeactivateThemselves() throws Exception {
        UUID ownerSub = jdbc.queryForObject("SELECT keycloak_user_id FROM employee WHERE username = 'owner'", UUID.class);
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/admin/employees/" + idOf("owner") + "/status")
                        .header("Authorization", adminToken(ownerSub)).contentType("application/json")
                        .content("{\"active\":false,\"reason\":\"test\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("You can't deactivate your own account."));
    }

    @Test
    void keycloakDownOnDeactivateChangesNothing() throws Exception {
        create("down.user", "down.user@example.test").andExpect(status().isCreated());
        kc.down = true;
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/admin/employees/" + idOf("down.user") + "/status")
                        .header("Authorization", adminToken(UUID.randomUUID())).contentType("application/json")
                        .content("{\"active\":false,\"reason\":\"test\"}"))
                .andExpect(status().isBadGateway()).andExpect(jsonPath("$.code").value("UPSTREAM_FAILED"));
        assertThat(dbStatus("down.user")).isEqualTo("INVITED");
    }

    @Test
    void failedResendKeepsTheFailedStatus() throws Exception {
        create("resend.fail", "resend.fail@example.test").andExpect(status().isCreated());
        kc.emailBroken = true;
        mvc.perform(post("/api/v1/admin/employees/" + idOf("resend.fail") + "/resend-invite").header("Authorization", adminToken(UUID.randomUUID())))
                .andExpect(status().isBadGateway());
        assertThat(dbStatus("resend.fail")).isEqualTo("INVITE_EMAIL_FAILED"); // not rolled back with the error
    }
}
