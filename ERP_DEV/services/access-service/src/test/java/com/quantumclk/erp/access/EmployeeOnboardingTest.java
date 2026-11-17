package com.quantumclk.erp.access;

import com.quantumclk.erp.access.employee.AccountJobs;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.MountableFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Workflow 1 against a real Keycloak 26.8.2 importing infra/keycloak/gh-staff-realm.json, real Mailpit and real
 * PostgreSQL (REQ-IAM-002…005, 011, 012; D-113).
 */
class EmployeeOnboardingTest extends KeycloakStack {

    private ResultActions create(String body, String key, String token) throws Exception {
        return mvc.perform(post("/api/v1/admin/employees").header("Authorization", token)
                .header("Idempotency-Key", key).contentType("application/json").content(body));
    }

    private static String body(String username, String email, String mobile) {
        return """
                {"firstName":"Ravi","lastName":"Kumar","email":"%s","username":"%s","mobile":"%s","jobRole":"SALES_EXECUTIVE","whatsappOptIn":true,"pan":"%s"}"""
                .formatted(email, username, mobile, TestSupport.pan(username.toLowerCase()));
    }

    @Test
    void adminOnboardsAnEmployeeEndToEnd() throws Exception {
        String key = UUID.randomUUID().toString();
        String response = create(body("Ravi.Kumar", "Ravi.Kumar@Example.test", "+91 98765 43210"), key, ADMIN_TOKEN)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("INVITED"))
                .andExpect(jsonPath("$.email").value("ravi.kumar@example.test"))
                .andExpect(jsonPath("$.username").value("ravi.kumar"))
                .andExpect(jsonPath("$.mobile").value("+919876543210"))
                .andExpect(jsonPath("$.identityLinked").value(true))
                .andReturn().getResponse().getContentAsString();
        String id = JSON.readTree(response).get("id").asString();

        // Keycloak really has the user, with the required actions and the role (REQ-IAM-003)
        UUID kcId = jdbc.queryForObject("SELECT keycloak_user_id FROM employee WHERE id = ?::uuid", UUID.class, id);
        JsonNode user = admin("GET", "/users/" + kcId, null);
        assertThat(user.get("username").asString()).isEqualTo("ravi.kumar");
        assertThat(user.get("emailVerified").asBoolean()).isFalse();
        assertThat(JSON.convertValue(user.get("requiredActions"), List.class)).containsExactlyInAnyOrder("VERIFY_EMAIL", "UPDATE_PASSWORD");
        JsonNode roles = admin("GET", "/users/" + kcId + "/role-mappings/realm", null);
        assertThat(roles.findValuesAsString("name")).contains("SALES_EXECUTIVE");

        // Keycloak's own setup email went out through SMTP (REQ-IAM-004)
        JsonNode mail = JSON.readTree(send(HttpRequest.newBuilder(URI.create(mailpit() + "/api/v1/search?query="
                + URLEncoder.encode("to:ravi.kumar@example.test", StandardCharsets.UTF_8))).build()));
        assertThat(mail.get("messages_count").asInt()).isEqualTo(1);

        // Same Idempotency-Key + same body → the same answer, still one employee
        create(body("Ravi.Kumar", "Ravi.Kumar@Example.test", "+91 98765 43210"), key, ADMIN_TOKEN)
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(id));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM employee WHERE username = 'ravi.kumar'", Integer.class)).isEqualTo(1);
        // Same key, different body → 422
        create(body("other.name", "other@example.test", "+919876500000"), key, ADMIN_TOKEN).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("IDEMPOTENCY_MISMATCH"));
        // New key, same email → 409, and nothing created in Keycloak
        create(body("ravi.k2", "ravi.kumar@example.test", "+919876500001"), UUID.randomUUID().toString(), ADMIN_TOKEN)
                .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("An employee with this email already exists."));

        // Employee finishes the Keycloak actions → status sync turns INVITED into ACTIVE (REQ-IAM-005)
        admin("PUT", "/users/" + kcId, "{\"emailVerified\":true,\"requiredActions\":[]}");
        jobs.sync();
        mvc.perform(get("/api/v1/admin/employees/" + id).header("Authorization", ADMIN_TOKEN)).andExpect(jsonPath("$.status").value("ACTIVE"));

        // Audit trail (REQ-IAM-012)
        assertThat(jdbc.queryForList("SELECT action FROM audit_event WHERE entity_id = ?::uuid ORDER BY occurred_at", String.class, id))
                .containsExactly("EMPLOYEE_CREATED", "EMPLOYEE_INVITED", "EMPLOYEE_STATUS_SYNCED");
    }

    @Test
    void invalidInputIs400WithFieldErrors() throws Exception {
        create("""
                {"firstName":"","lastName":"K","email":"not-an-email","username":"x","mobile":"98765","jobRole":"SALES_EXECUTIVE"}""",
                UUID.randomUUID().toString(), ADMIN_TOKEN)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email").exists()).andExpect(jsonPath("$.fields.username").exists())
                .andExpect(jsonPath("$.fields.mobile").exists()).andExpect(jsonPath("$.fields.firstName").exists());
        create(body("a.b", "a@b.test", "+919800000001").replace("SALES_EXECUTIVE", "OWNER"), UUID.randomUUID().toString(), ADMIN_TOKEN)
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/admin/employees").header("Authorization", ADMIN_TOKEN).contentType("application/json")
                .content(body("c.d", "c@d.test", "+919800000002"))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Missing header: Idempotency-Key"));
    }

    @Test
    void onlyAdminsManageEmployees() throws Exception {   // D-113
        String manager = token(List.of("MANAGER"), List.of("employees.read", "leads.read_team"));
        create(body("m.try", "m.try@example.test", "+919800000003"), UUID.randomUUID().toString(), manager)
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("FORBIDDEN"));
        mvc.perform(get("/api/v1/admin/employees").header("Authorization", manager)).andExpect(status().isOk());
        String sales = token(List.of("SALES_EXECUTIVE"), List.of("leads.read_queue"));
        mvc.perform(get("/api/v1/admin/employees").header("Authorization", sales)).andExpect(status().isForbidden());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM employee WHERE username = 'm.try'", Integer.class)).isZero();
    }

}
