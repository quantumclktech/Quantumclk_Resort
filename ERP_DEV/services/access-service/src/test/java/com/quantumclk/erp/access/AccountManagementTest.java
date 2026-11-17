package com.quantumclk.erp.access;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpRequest;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** REQ-IAM-010 and account management against real Keycloak (AUTHENTICATION §7). */
class AccountManagementTest extends KeycloakStack {

    private String createSales(String username) throws Exception {
        String body = """
                {"firstName":"Sam","lastName":"Lee","email":"%s@example.test","username":"%s","mobile":"+9198%08d","jobRole":"SALES_EXECUTIVE","pan":"%s"}"""
                .formatted(username, username, Math.abs(username.hashCode()) % 100000000, TestSupport.pan(username));
        String r = mvc.perform(post("/api/v1/admin/employees").header("Authorization", ADMIN_TOKEN)
                        .header("Idempotency-Key", UUID.randomUUID().toString()).contentType("application/json").content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JSON.readTree(r).get("id").asString();
    }

    private UUID kcId(String id) {
        return jdbc.queryForObject("SELECT keycloak_user_id FROM employee WHERE id = ?::uuid", UUID.class, id);
    }

    @Test
    void deactivateDisablesInKeycloakAndReactivateRestores() throws Exception {
        String id = createSales("deact.user");
        mvc.perform(patch("/api/v1/admin/employees/" + id + "/status").header("Authorization", ADMIN_TOKEN)
                .contentType("application/json").content("{\"active\":false}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("A reason is required."));

        mvc.perform(patch("/api/v1/admin/employees/" + id + "/status").header("Authorization", ADMIN_TOKEN)
                .contentType("application/json").content("{\"active\":false,\"reason\":\"Left the company\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DISABLED"))
                .andExpect(jsonPath("$.statusReason").value("Left the company"));
        assertThat(admin("GET", "/users/" + kcId(id), null).get("enabled").asBoolean()).isFalse();

        // The sync job must not flip it back: Keycloak says disabled too.
        jobs.sync();
        mvc.perform(get("/api/v1/admin/employees/" + id).header("Authorization", ADMIN_TOKEN)).andExpect(jsonPath("$.status").value("DISABLED"));

        mvc.perform(patch("/api/v1/admin/employees/" + id + "/status").header("Authorization", ADMIN_TOKEN)
                .contentType("application/json").content("{\"active\":true,\"reason\":\"Rejoined\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("INVITED")); // setup still pending
        assertThat(admin("GET", "/users/" + kcId(id), null).get("enabled").asBoolean()).isTrue();
    }

    @Test
    void roleChangeNeedsRolesAssignAndOnlyAllowsSalesExecutive() throws Exception {   // D-138
        String id = createSales("role.user");
        String manager = token(List.of("MANAGER"), List.of("employees.read"));
        mvc.perform(put("/api/v1/admin/employees/" + id + "/role").header("Authorization", manager)
                .contentType("application/json").content("{\"role\":\"SALES_EXECUTIVE\",\"reason\":\"x\"}")).andExpect(status().isForbidden());

        for (String role : List.of("MANAGER", "ADMIN")) {
            mvc.perform(put("/api/v1/admin/employees/" + id + "/role").header("Authorization", ADMIN_TOKEN)
                    .contentType("application/json").content("{\"role\":\"" + role + "\",\"reason\":\"Promotion\"}"))
                    .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ROLE_NOT_ALLOWED"));
        }
        mvc.perform(put("/api/v1/admin/employees/" + id + "/role").header("Authorization", ADMIN_TOKEN)
                .contentType("application/json").content("{\"role\":\"SALES_EXECUTIVE\",\"reason\":\"No change\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.jobRole").value("SALES_EXECUTIVE"));
        JsonNode roles = admin("GET", "/users/" + kcId(id) + "/role-mappings/realm", null);
        assertThat(roles.findValuesAsString("name")).contains("SALES_EXECUTIVE").doesNotContain("MANAGER", "ADMIN");
    }

    @Test
    void onlySalesExecutivesCanBeCreated() throws Exception {   // D-138
        for (String role : List.of("MANAGER", "ADMIN")) {
            String body = """
                    {"firstName":"Max","lastName":"Roy","email":"max.%s@example.test","username":"max.%s","mobile":"+919811111111","jobRole":"%s","pan":"ABCPM1111M"}"""
                    .formatted(role.toLowerCase(), role.toLowerCase(), role);
            mvc.perform(post("/api/v1/admin/employees").header("Authorization", ADMIN_TOKEN)
                            .header("Idempotency-Key", UUID.randomUUID().toString()).contentType("application/json").content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.jobRole").exists());
        }
        String noRole = """
                {"firstName":"Nia","lastName":"Das","email":"nia.das@example.test","username":"nia.das","mobile":"+919822222222","pan":"abcpn 2222 n"}""";
        mvc.perform(post("/api/v1/admin/employees").header("Authorization", ADMIN_TOKEN)
                        .header("Idempotency-Key", UUID.randomUUID().toString()).contentType("application/json").content(noRole))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.jobRole").value("SALES_EXECUTIVE"))
                .andExpect(jsonPath("$.panMasked").value("XXXXXX222N"));   // normalised, then masked
        // Only the mask and a keyed hash are stored, never the PAN itself.
        assertThat(jdbc.queryForObject("SELECT pan_masked || pan_hash FROM employee WHERE username = 'nia.das'", String.class))
                .startsWith("XXXXXX222N").doesNotContain("ABCPN");
    }

    @Test
    void panIsRequiredValidatedAndUnique() throws Exception {   // D-139
        String base = """
                {"firstName":"Pan","lastName":"Test","email":"%s@example.test","username":"%s","mobile":"%s"%s}""";
        String[][] bad = {{"pan.none", "+919833333331", ""}, {"pan.short", "+919833333332", ",\"pan\":\"ABCP1234F\""},
                {"pan.company", "+919833333333", ",\"pan\":\"ABCCE1234F\""}};
        for (String[] b : bad) {
            mvc.perform(post("/api/v1/admin/employees").header("Authorization", ADMIN_TOKEN)
                            .header("Idempotency-Key", UUID.randomUUID().toString()).contentType("application/json")
                            .content(base.formatted(b[0], b[0], b[1], b[2])))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.pan").exists());
        }
        mvc.perform(post("/api/v1/admin/employees").header("Authorization", ADMIN_TOKEN)
                        .header("Idempotency-Key", UUID.randomUUID().toString()).contentType("application/json")
                        .content(base.formatted("pan.one", "pan.one", "+919833333334", ",\"pan\":\"ABCPQ4444Q\"")))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/admin/employees").header("Authorization", ADMIN_TOKEN)
                        .header("Idempotency-Key", UUID.randomUUID().toString()).contentType("application/json")
                        .content(base.formatted("pan.two", "pan.two", "+919833333335", ",\"pan\":\"abcpq4444q\"")))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("An employee with this PAN already exists."));
    }

    @Test
    void resendInviteSendsAnotherEmailAndIsLimitedTo3PerHour() throws Exception {
        String id = createSales("resend.user");
        for (int i = 0; i < 3; i++) {
            mvc.perform(post("/api/v1/admin/employees/" + id + "/resend-invite").header("Authorization", ADMIN_TOKEN))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("INVITED"));
        }
        mvc.perform(post("/api/v1/admin/employees/" + id + "/resend-invite").header("Authorization", ADMIN_TOKEN))
                .andExpect(status().isTooManyRequests());
        JsonNode mail = JSON.readTree(send(HttpRequest.newBuilder(URI.create(mailpit() + "/api/v1/search?query="
                + URLEncoder.encode("to:resend.user@example.test", StandardCharsets.UTF_8))).build()));
        assertThat(mail.get("messages_count").asInt()).isEqualTo(4); // first invite + 3 resends
    }

    @Test
    void auditViewShowsWhoDidWhatAndWhyAndIsAdminOnly() throws Exception {
        String id = createSales("audit.user");
        mvc.perform(patch("/api/v1/admin/employees/" + id + "/status").header("Authorization", ADMIN_TOKEN)
                .contentType("application/json").content("{\"active\":false,\"reason\":\"Contract ended\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/admin/audit?entityId=" + id).header("Authorization", ADMIN_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.items[0].action").value("EMPLOYEE_DEACTIVATED"))
                .andExpect(jsonPath("$.items[0].reason").value("Contract ended"));
        mvc.perform(get("/api/v1/admin/audit").header("Authorization", token(List.of("MANAGER"), List.of("employees.read"))))
                .andExpect(status().isForbidden());
    }
}
