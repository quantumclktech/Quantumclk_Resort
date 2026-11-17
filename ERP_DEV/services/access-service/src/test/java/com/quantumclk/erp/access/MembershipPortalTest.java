package com.quantumclk.erp.access;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GET /api/v1/portal/membership/me (REQ-MEM-009; S4): a signed-in member (gh-guests) reads only their own Gold
 * Membership; staff tokens and other members get nothing.
 */
@SpringBootTest(properties = {"erp.keycloak.issuer=" + TestSupport.ISSUER})
@AutoConfigureMockMvc
@Import(TestSupport.class)
class MembershipPortalTest {

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    /** An ACTIVE member linked to a gh-guests account, enrolled by an executive with or without WhatsApp opt-in. */
    UUID member(boolean execOptIn) {
        UUID exec = UUID.randomUUID(), member = UUID.randomUUID(), guest = UUID.randomUUID();
        String n = UUID.randomUUID().toString().substring(0, 6);
        jdbc.update("""
                INSERT INTO employee (id, keycloak_user_id, first_name, last_name, email, username, mobile_e164, job_role,
                                      whatsapp_opt_in, status, created_by, updated_by, created_at, updated_at)
                VALUES (?, ?, 'Sam', 'One', ?, ?, ?, 'SALES_EXECUTIVE', ?, 'ACTIVE', ?, ?, now(), now())""",
                exec, UUID.randomUUID(), "sam" + n + "@example.test", "sam." + n,
                "+9198" + String.format("%08d", Math.abs(n.hashCode()) % 100_000_000), execOptIn, exec, exec);
        int num = 1000 + Math.abs(n.hashCode()) % 4000;
        jdbc.update("""
                INSERT INTO resort_member (id, membership_id, first_name, last_name, dob, mobile_e164, email, address, status,
                                           enrolled_by_id, enrolled_by_name, enrolled_by_username, decided_by_id, decided_at,
                                           valid_from, valid_until, guest_user_id, account_status, created_at, updated_at)
                VALUES (?, ?, 'Rohan', 'Sharma', DATE '1990-05-17', ?, ?, '12 MG Road', 'ACTIVE', ?, 'Sam One', ?, ?, now(),
                        TIMESTAMPTZ '2026-11-16 10:00:00+00', TIMESTAMPTZ '2027-11-16 10:00:00+00', ?, 'INVITE_SENT', now(), now())""",
                member, String.format("GRH-LM-%04d", num), "+9197" + String.format("%08d", Math.abs((n + "m").hashCode()) % 100_000_000),
                "rohan" + n + "@example.test", exec, "sam." + n, exec, guest);
        jdbc.update("""
                INSERT INTO member_payment (id, member_id, payment_type, amount, status, created_at)
                VALUES (?, ?, 'CASH', 25000.00, 'VERIFIED', now())""", UUID.randomUUID(), member);
        return guest;
    }

    @Test
    void aMemberSeesTheirOwnMembership() throws Exception {
        UUID guest = member(true);
        mvc.perform(get("/api/v1/portal/membership/me").header("Authorization", "Bearer " + TestSupport.guest(guest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.membershipId").isString())
                .andExpect(jsonPath("$.firstName").value("Rohan"))
                .andExpect(jsonPath("$.tier").value("GOLD"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.validFrom").value("2026-11-16T10:00:00Z"))
                .andExpect(jsonPath("$.validUntil").value("2027-11-16T10:00:00Z"))
                .andExpect(jsonPath("$.enrolledBy.name").value("Sam One"))
                .andExpect(jsonPath("$.enrolledBy.mobile").isString())       // opted in to WhatsApp
                // nothing a member doesn't need: no payment, no proof, no internal ids
                .andExpect(jsonPath("$.payment").doesNotExist())
                .andExpect(jsonPath("$.id").doesNotExist());
    }

    @Test
    void theExecutivesNumberIsHiddenWithoutWhatsappOptIn() throws Exception {
        UUID guest = member(false);
        mvc.perform(get("/api/v1/portal/membership/me").header("Authorization", "Bearer " + TestSupport.guest(guest)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.enrolledBy.mobile").value(nullValue()));
    }

    @Test
    void firstVisitMarksTheCustomerAccountAsSignedIn() throws Exception {
        UUID guest = member(true);
        mvc.perform(get("/api/v1/portal/membership/me").header("Authorization", "Bearer " + TestSupport.guest(guest))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/portal/membership/me").header("Authorization", "Bearer " + TestSupport.guest(guest))).andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT account_status FROM resort_member WHERE guest_user_id = ?", String.class, guest)).isEqualTo("ACTIVE");
        assertThat(jdbc.queryForObject("""
                SELECT count(*) FROM audit_event a JOIN resort_member m ON m.id = a.entity_id
                WHERE m.guest_user_id = ? AND a.action = 'MEMBER_PORTAL_FIRST_SIGN_IN'""", Integer.class, guest)).isEqualTo(1);
    }

    @Test
    void aSignedInGuestWithoutMembershipGets404() throws Exception {
        mvc.perform(get("/api/v1/portal/membership/me").header("Authorization", "Bearer " + TestSupport.guest(UUID.randomUUID())))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NO_MEMBERSHIP"));
    }

    @Test
    void anotherMembersTokenNeverSeesThisMembership() throws Exception {
        member(true);
        UUID other = member(true);
        String body = mvc.perform(get("/api/v1/portal/membership/me").header("Authorization", "Bearer " + TestSupport.guest(other)))
                .andReturn().getResponse().getContentAsString();
        String own = jdbc.queryForObject("SELECT membership_id FROM resort_member WHERE guest_user_id = ?", String.class, other);
        assertThat(body).contains(own);
    }

    @Test
    void staffTokensAndMissingTokensAreRefused() throws Exception {
        String staff = TestSupport.sign(TestSupport.claims(UUID.randomUUID(), List.of("ADMIN"), List.of("memberships.read_all")).build());
        mvc.perform(get("/api/v1/portal/membership/me").header("Authorization", "Bearer " + staff)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/portal/membership/me")).andExpect(status().isUnauthorized());
        // and a member token can't reach staff endpoints
        mvc.perform(get("/api/v1/admin/memberships").header("Authorization", "Bearer " + TestSupport.guest(UUID.randomUUID())))
                .andExpect(status().isUnauthorized());
    }
}
