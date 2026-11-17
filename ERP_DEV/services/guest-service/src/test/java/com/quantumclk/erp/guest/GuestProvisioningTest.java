package com.quantumclk.erp.guest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.json.JsonMapper;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Member accounts for verified Gold Memberships (REQ-MEM-008; D-120…D-122): provision, welcome email via Keycloak,
 * resend, own profile, and the two-realm security rules.
 */
@SpringBootTest(properties = {
        "erp.keycloak.staff-issuer=" + TestSupport.STAFF_ISSUER,
        "erp.keycloak.guest-issuer=" + TestSupport.GUEST_ISSUER,
        "erp.landing.public-url=https://landing.example.test"})
@AutoConfigureMockMvc
@Import(TestSupport.class)
class GuestProvisioningTest {

    static final FakeGuestIdentity kc = TestSupport.KC;
    static final String PROVISIONER = TestSupport.staff(List.of("guests.provision"));

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired JsonMapper json;

    @BeforeEach
    void reset() {
        kc.reset();
    }

    static Map<String, Object> member(String email) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("email", email);
        m.put("firstName", "Rohan");
        m.put("lastName", "Sharma");
        m.put("mobile", "+91 98765 43210");
        m.put("membershipId", "GRH-LM-0101");
        m.put("validUntil", "16 Nov 2027");
        m.put("requestedBy", "mohan.mgr");
        return m;
    }

    ResultActions provision(String token, Object body) throws Exception {
        var req = post("/internal/guests/provision").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
        if (token != null) req.header("Authorization", "Bearer " + token);
        return mvc.perform(req);
    }

    static String email() {
        return "Rohan." + UUID.randomUUID().toString().substring(0, 8) + "@Example.test";
    }

    @Test
    void newMemberGetsAnAccountAndTheWelcomeEmail() throws Exception {
        String email = email();
        String body = provision(PROVISIONER, member(email)).andExpect(status().isOk())
                .andExpect(jsonPath("$.welcomeSent").value(true)).andReturn().getResponse().getContentAsString();
        String id = json.readTree(body).get("guestUserId").asString();

        assertThat(kc.idsByEmail).containsEntry(email.toLowerCase(), id);   // stored lowercase
        assertThat(kc.membershipIds).containsEntry(id, "GRH-LM-0101");
        assertThat(kc.sent).containsExactly(new FakeGuestIdentity.Sent(id, "https://landing.example.test/member/activate", "16 Nov 2027"));
        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM guest_account WHERE keycloak_user_id = ?", UUID.fromString(id));
        assertThat(row.get("source")).isEqualTo("MEMBERSHIP");
        assertThat(row.get("mobile_e164")).isEqualTo("+919876543210");
        assertThat(row.get("welcome_count")).isEqualTo(1);
        assertThat(jdbc.queryForList("SELECT action FROM audit_event WHERE entity_id = ? ORDER BY occurred_at", String.class, UUID.fromString(id)))
                .containsExactly("GUEST_PROVISIONED", "GUEST_WELCOME_SENT");
        assertThat(jdbc.queryForObject("SELECT actor_label FROM audit_event WHERE entity_id = ? LIMIT 1", String.class, UUID.fromString(id)))
                .isEqualTo("access-service/mohan.mgr");
    }

    @Test
    void anExistingGuestAccountIsReusedAndBecomesAMember() throws Exception {
        String email = email().toLowerCase();
        kc.idsByEmail.put(email, "11111111-1111-1111-1111-111111111111");
        provision(PROVISIONER, member(email)).andExpect(status().isOk())
                .andExpect(jsonPath("$.guestUserId").value("11111111-1111-1111-1111-111111111111"));
        assertThat(kc.membershipIds).containsEntry("11111111-1111-1111-1111-111111111111", "GRH-LM-0101");
        provision(PROVISIONER, member(email)).andExpect(status().isOk());   // repeatable
        assertThat(kc.idsByEmail).hasSize(1);
        assertThat(kc.sent).hasSize(2);
    }

    @Test
    void aFailedEmailStillReturnsTheAccountSoItCanBeResent() throws Exception {
        kc.emailBroken = true;
        String body = provision(PROVISIONER, member(email())).andExpect(status().isOk())
                .andExpect(jsonPath("$.welcomeSent").value(false)).andReturn().getResponse().getContentAsString();
        String id = json.readTree(body).get("guestUserId").asString();

        kc.emailBroken = false;
        mvc.perform(post("/internal/guests/" + id + "/resend").header("Authorization", "Bearer " + PROVISIONER)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"validUntil\":\"16 Nov 2027\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.welcomeSent").value(true));
        assertThat(kc.sent).hasSize(1);
    }

    @Test
    void keycloakDownIs503AndNothingIsStored() throws Exception {
        kc.down = true;
        String email = email();
        provision(PROVISIONER, member(email)).andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("IDENTITY_UNAVAILABLE"));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM guest_account WHERE email = ?", Integer.class, email.toLowerCase())).isZero();
    }

    @Test
    void resendForAnUnknownAccountIs404() throws Exception {
        mvc.perform(post("/internal/guests/" + UUID.randomUUID() + "/resend").header("Authorization", "Bearer " + PROVISIONER))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidRequestIs400WithFields() throws Exception {
        Map<String, Object> bad = member("not-an-email");
        bad.put("membershipId", "GHR-GOLD-1");
        provision(PROVISIONER, bad).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email").exists()).andExpect(jsonPath("$.fields.membershipId").exists());
    }

    // --- Security ------------------------------------------------------------------------------------------------------

    @Test
    void internalNeedsAStaffServiceTokenWithGuestsProvision() throws Exception {
        provision(null, member(email())).andExpect(status().isUnauthorized());
        provision(TestSupport.staff(List.of("employees.read")), member(email())).andExpect(status().isForbidden());
        provision(TestSupport.guest(UUID.randomUUID(), "x@example.test"), member(email())).andExpect(status().isUnauthorized());
        assertThat(kc.sent).isEmpty();
    }

    @Test
    void portalMeReturnsOnlyTheCallersOwnProfile() throws Exception {
        String email = email();
        String id = json.readTree(provision(PROVISIONER, member(email)).andReturn().getResponse().getContentAsString()).get("guestUserId").asString();
        mvc.perform(get("/api/v1/portal/me").header("Authorization", "Bearer " + TestSupport.guest(UUID.fromString(id), email.toLowerCase())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.guestId").value(id))
                .andExpect(jsonPath("$.source").value("MEMBERSHIP"))
                .andExpect(jsonPath("$.emailVerified").value(true));
        mvc.perform(get("/api/v1/portal/me").header("Authorization", "Bearer " + PROVISIONER)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/portal/me")).andExpect(status().isUnauthorized());
    }

    // --- Sign-in record (D-128) --------------------------------------------------------------------------------------

    ResultActions me(UUID id, String email, String sid) throws Exception {
        return mvc.perform(get("/api/v1/portal/me").header("Authorization", "Bearer " + TestSupport.guest(id, email, sid)));
    }

    @Test
    void eachSignInIsRecordedOncePerSessionWithAnAuditEntry() throws Exception {
        String email = email();
        UUID id = UUID.fromString(json.readTree(provision(PROVISIONER, member(email)).andReturn().getResponse().getContentAsString())
                .get("guestUserId").asString());

        me(id, email.toLowerCase(), "sid-a").andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACTIVE"));
        me(id, email.toLowerCase(), "sid-a").andExpect(status().isOk());   // another page, same sign-in
        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM guest_account WHERE keycloak_user_id = ?", id);
        assertThat(row.get("sign_in_count")).isEqualTo(1);
        assertThat(row.get("first_signed_in_at")).isNotNull();
        assertThat(row.get("email_verified")).isEqualTo(true);   // copied from Keycloak (welcome link verified it)
        Object first = row.get("first_signed_in_at");

        me(id, email.toLowerCase(), "sid-b").andExpect(status().isOk());   // signed in again later
        row = jdbc.queryForMap("SELECT * FROM guest_account WHERE keycloak_user_id = ?", id);
        assertThat(row.get("sign_in_count")).isEqualTo(2);
        assertThat(row.get("first_signed_in_at")).isEqualTo(first);
        assertThat(row.get("last_session_id")).isEqualTo("sid-b");
        assertThat(jdbc.queryForList("SELECT action FROM audit_event WHERE entity_id = ? AND action = 'GUEST_SIGNED_IN'", String.class, id))
                .hasSize(2);
        assertThat(jdbc.queryForObject("SELECT actor_label FROM audit_event WHERE entity_id = ? AND action = 'GUEST_SIGNED_IN' LIMIT 1", String.class, id))
                .isEqualTo("guest-web");
    }

    @Test
    void aGuestWhoRegisteredOnTheWebsiteGetsAnAccountRow() throws Exception {
        UUID id = UUID.randomUUID();
        String email = email();
        me(id, email, "sid-1").andExpect(status().isOk()).andExpect(jsonPath("$.source").value("SELF_REGISTERED"));
        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM guest_account WHERE keycloak_user_id = ?", id);
        assertThat(row.get("email")).isEqualTo(email.toLowerCase());
        assertThat(row.get("source")).isEqualTo("SELF_REGISTERED");
        assertThat(row.get("sign_in_count")).isEqualTo(1);
    }

    @Test
    void aDisabledAccountIsRefused() throws Exception {
        UUID id = UUID.randomUUID();
        String email = email();
        me(id, email, "sid-1").andExpect(status().isOk());
        jdbc.update("UPDATE guest_account SET status = 'DISABLED' WHERE keycloak_user_id = ?", id);
        me(id, email, "sid-2").andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCOUNT_DISABLED"));
        assertThat(jdbc.queryForObject("SELECT sign_in_count FROM guest_account WHERE keycloak_user_id = ?", Integer.class, id)).isEqualTo(1);
    }

    @Test
    void everythingElseIsClosedButHealth() throws Exception {
        mvc.perform(get("/internal/nothing").header("Authorization", "Bearer " + PROVISIONER)).andExpect(status().isNotFound());
        mvc.perform(get("/somewhere")).andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
