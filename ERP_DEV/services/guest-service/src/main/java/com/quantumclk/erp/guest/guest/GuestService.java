package com.quantumclk.erp.guest.guest;

import com.quantumclk.erp.guest.keycloak.GuestIdentity;
import com.quantumclk.erp.guest.keycloak.GuestIdentity.NewGuest;
import com.quantumclk.erp.guest.web.ApiException;
import com.quantumclk.erp.guest.web.CorrelationIdFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Member accounts in Keycloak gh-guests (D-120…D-122). Called by access-service when a Gold Membership is verified:
 * find or create the account (no password), set its membershipId, then let Keycloak send the welcome email with a
 * one-time set-password link that signs the member in on the landing page.
 *
 * <p>Repeatable: calling provision twice for the same email reuses the same account and simply sends a fresh link.
 */
@Service
public class GuestService {

    private static final Logger log = LoggerFactory.getLogger(GuestService.class);

    public record Provision(String email, String firstName, String lastName, String mobile, String membershipId,
                            String validUntil, String requestedBy) { }

    /** welcomeSent=false means the account is ready but the email failed; the caller can resend later. */
    public record Result(UUID guestUserId, boolean welcomeSent, String message) { }

    private final GuestIdentity identity;
    private final JdbcTemplate jdbc;
    private final JsonMapper json;
    private final String activateUrl;

    GuestService(GuestIdentity identity, JdbcTemplate jdbc, JsonMapper json, @Value("${erp.landing.public-url}") String landing) {
        this.identity = identity;
        this.jdbc = jdbc;
        this.json = json;
        this.activateUrl = (landing.endsWith("/") ? landing.substring(0, landing.length() - 1) : landing) + "/member/activate";
    }

    public Result provision(Provision p, String caller) {
        String email = p.email().strip().toLowerCase(Locale.ROOT);
        String id;
        try {
            id = identity.findByEmail(email).orElse(null);
            if (id == null) {
                try {
                    id = identity.create(new NewGuest(email, p.firstName().strip(), p.lastName().strip(), p.membershipId()));
                } catch (GuestIdentity.Conflict e) {
                    id = identity.findByEmail(email).orElseThrow(() -> e);   // created a moment ago by a parallel call
                }
            } else {
                identity.setMembershipId(id, p.membershipId());   // an existing guest account becomes a member
            }
        } catch (GuestIdentity.Unavailable e) {
            audit(caller, p.requestedBy(), "GUEST_PROVISIONING_DEFERRED", null, Map.of("membershipId", p.membershipId()), "keycloak unavailable", false);
            throw unavailable();
        }
        UUID guestId = UUID.fromString(id);
        upsert(guestId, email, p);
        audit(caller, p.requestedBy(), "GUEST_PROVISIONED", guestId, Map.of("membershipId", p.membershipId()), null, true);
        return send(guestId, p.validUntil(), caller, p.requestedBy());
    }

    public Result resend(UUID guestId, String validUntil, String caller, String requestedBy) {
        Integer known = jdbc.queryForObject("SELECT count(*) FROM guest_account WHERE keycloak_user_id = ?", Integer.class, guestId);
        if (known == null || known == 0) throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Unknown guest account.");
        return send(guestId, validUntil, caller, requestedBy);
    }

    private Result send(UUID guestId, String validUntil, String caller, String requestedBy) {
        try {
            identity.sendWelcome(guestId.toString(), activateUrl, validUntil);
        } catch (GuestIdentity.EmailFailed e) {
            log.warn("Welcome email for guest {} failed", guestId);
            audit(caller, requestedBy, "GUEST_WELCOME_FAILED", guestId, null, "email", false);
            return new Result(guestId, false, "The account is ready, but the welcome email could not be sent. Try Resend welcome.");
        } catch (GuestIdentity.Unavailable e) {
            audit(caller, requestedBy, "GUEST_WELCOME_FAILED", guestId, null, "keycloak unavailable", false);
            return new Result(guestId, false, "The account is ready, but the identity system is unavailable. Try Resend welcome.");
        }
        jdbc.update("UPDATE guest_account SET welcome_sent_at = ?, welcome_count = welcome_count + 1, updated_at = ? WHERE keycloak_user_id = ?",
                Timestamp.from(Instant.now()), Timestamp.from(Instant.now()), guestId);
        audit(caller, requestedBy, "GUEST_WELCOME_SENT", guestId, null, null, true);
        return new Result(guestId, true, "Welcome email sent.");
    }

    private void upsert(UUID id, String email, Provision p) {
        Timestamp now = Timestamp.from(Instant.now());
        String mobile = p.mobile() == null || p.mobile().isBlank() ? null : p.mobile().replaceAll("[\\s()-]", "");
        jdbc.update("""
                INSERT INTO guest_account (keycloak_user_id, email, first_name, last_name, mobile_e164, source, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'MEMBERSHIP', ?, ?)
                ON CONFLICT (keycloak_user_id) DO UPDATE SET email = EXCLUDED.email, first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name, mobile_e164 = COALESCE(EXCLUDED.mobile_e164, guest_account.mobile_e164),
                    updated_at = EXCLUDED.updated_at""",
                id, email, p.firstName().strip(), p.lastName().strip(), mobile, now, now);
    }

    /**
     * Profile of the signed-in guest: token claims plus our account record. The landing page calls this after every
     * sign-in or session restore, so it also keeps the account record in guest_db (D-128): a self-registered guest
     * gets a row, email verification is copied from Keycloak, and each Keycloak session (token "sid") is counted once
     * as a sign-in with an audit entry. A DISABLED account is refused.
     */
    public Map<String, Object> me(UUID sub, String sid, String client, String email, String firstName, String lastName, boolean emailVerified) {
        record(sub, email, firstName, lastName, emailVerified);
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT source, mobile_e164, status FROM guest_account WHERE keycloak_user_id = ?", sub);
        Map<String, Object> row = rows.isEmpty() ? Map.of() : rows.getFirst();
        if ("DISABLED".equals(row.get("status"))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "This account is disabled. Please contact the resort.");
        }
        if (sid != null && !sid.isBlank() && !rows.isEmpty()) {
            Timestamp now = Timestamp.from(Instant.now());
            // Exactly once per session, also when two pages ask at the same moment (the row lock re-checks the WHERE).
            int counted = jdbc.update("""
                    UPDATE guest_account SET sign_in_count = sign_in_count + 1, first_signed_in_at = COALESCE(first_signed_in_at, ?),
                        last_signed_in_at = ?, last_session_id = ?, updated_at = ?
                    WHERE keycloak_user_id = ? AND last_session_id IS DISTINCT FROM ?""",
                    now, now, sid.length() > 64 ? sid.substring(0, 64) : sid, now, sub, sid.length() > 64 ? sid.substring(0, 64) : sid);
            if (counted == 1) audit(client == null ? "guest" : client, null, "GUEST_SIGNED_IN", sub, null, null, true);
        }
        var out = new java.util.LinkedHashMap<String, Object>();
        out.put("guestId", sub);
        out.put("email", email);
        out.put("firstName", firstName);
        out.put("lastName", lastName);
        out.put("emailVerified", emailVerified);
        out.put("mobile", row.get("mobile_e164"));
        out.put("source", row.getOrDefault("source", "SELF_REGISTERED"));
        out.put("status", row.getOrDefault("status", "ACTIVE"));
        return out;
    }

    /** Creates the row for a guest who registered on the website; keeps email and verification in step with Keycloak. */
    private void record(UUID sub, String email, String firstName, String lastName, boolean emailVerified) {
        if (email == null || email.isBlank()) return;
        Timestamp now = Timestamp.from(Instant.now());
        try {
            jdbc.update("""
                    INSERT INTO guest_account (keycloak_user_id, email, first_name, last_name, source, email_verified, created_at, updated_at)
                    VALUES (?, ?, ?, ?, 'SELF_REGISTERED', ?, ?, ?)
                    ON CONFLICT (keycloak_user_id) DO UPDATE SET email = EXCLUDED.email, email_verified = EXCLUDED.email_verified,
                        updated_at = EXCLUDED.updated_at
                    WHERE guest_account.email <> EXCLUDED.email OR guest_account.email_verified <> EXCLUDED.email_verified""",
                    sub, email.strip().toLowerCase(Locale.ROOT), firstName == null ? "" : firstName.strip(),
                    lastName == null ? "" : lastName.strip(), emailVerified, now, now);
        } catch (DuplicateKeyException e) {
            // The email belongs to another account row (should not happen: Keycloak forbids duplicate emails). Keep the
            // profile working and leave the records for a person to check.
            log.warn("guest_account email clash for guest {}", sub);
        }
    }

    private void audit(String caller, String requestedBy, String action, UUID entity, Object details, String reason, boolean ok) {
        String actor = requestedBy == null || requestedBy.isBlank() ? caller : caller + "/" + requestedBy;
        jdbc.update("""
                INSERT INTO audit_event (id, occurred_at, actor_label, action, entity_id, details_json, reason, correlation_id, outcome)
                VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?)""",
                UUID.randomUUID(), Timestamp.from(Instant.now()), actor.length() > 100 ? actor.substring(0, 100) : actor, action, entity,
                details == null ? null : json.writeValueAsString(details), reason, CorrelationIdFilter.current(), ok ? "SUCCESS" : "FAILURE");
    }

    private static ApiException unavailable() {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "IDENTITY_UNAVAILABLE", "The identity system is unavailable. Try again shortly.");
    }
}
