package com.quantumclk.erp.access.membership;

import com.quantumclk.erp.access.employee.AuditLog;
import com.quantumclk.erp.access.employee.AuditLog.Actor;
import com.quantumclk.erp.access.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * {@code GET /api/v1/portal/membership/me}: the signed-in member's own Gold Membership, for the landing page's
 * /membership and /profile (SOW ERP-05 "member dashboard"; REQ-MEM-009; D-123).
 *
 * <p>The member is found by the token's {@code sub} (their gh-guests account id = {@code resort_member.guest_user_id});
 * there is no id in the path, so nobody can ask for someone else's membership. Only what a member needs is returned:
 * no payment, no screenshot, no internal ids. The enrolling executive's mobile is shown only if they opted in to
 * WhatsApp (Q-035); otherwise the page shows the resort desk.
 */
@RestController
public class PortalMembershipController {

    public record Executive(String name, String username, String mobile) { }

    public record PortalMembership(String membershipId, String firstName, String lastName, String tier, String status,
                                   OffsetDateTime validFrom, OffsetDateTime validUntil, Executive enrolledBy) { }

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final AuditLog audit;

    PortalMembershipController(JdbcTemplate jdbc, TransactionTemplate tx, AuditLog audit) {
        this.jdbc = jdbc;
        this.tx = tx;
        this.audit = audit;
    }

    @GetMapping("/api/v1/portal/membership/me")
    PortalMembership me(JwtAuthenticationToken auth) {
        UUID guest;
        try {
            guest = UUID.fromString(auth.getToken().getSubject());
        } catch (IllegalArgumentException e) {
            throw noMembership();
        }
        // The newest live membership of this account (a rejected one is not a membership).
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT m.id, m.membership_id, m.first_name, m.last_name, m.tier, m.status, m.valid_from, m.valid_until,
                       m.account_status, m.enrolled_by_name, m.enrolled_by_username, e.whatsapp_opt_in, e.mobile_e164
                FROM resort_member m JOIN employee e ON e.id = m.enrolled_by_id
                WHERE m.guest_user_id = ? AND m.status <> 'REJECTED'
                ORDER BY m.created_at DESC LIMIT 1""", guest);
        if (rows.isEmpty()) throw noMembership();
        Map<String, Object> r = rows.getFirst();
        UUID memberId = (UUID) r.get("id");

        if (!"ACTIVE".equals(r.get("account_status"))) {
            // First visit: the customer has really signed in (welcome link or password). Recorded once.
            tx.executeWithoutResult(s -> {
                int changed = jdbc.update("UPDATE resort_member SET account_status = 'ACTIVE', updated_at = ? WHERE id = ? AND account_status <> 'ACTIVE'",
                        Timestamp.from(Instant.now()), memberId);
                if (changed == 1) {
                    audit.record(new Actor(null, "MEMBER_PORTAL", null), "MEMBER_PORTAL_FIRST_SIGN_IN", MembershipService.ENTITY,
                            memberId, Map.of("accountStatus", String.valueOf(r.get("account_status"))), Map.of("accountStatus", "ACTIVE"), null, true);
                }
            });
        }
        boolean optIn = Boolean.TRUE.equals(r.get("whatsapp_opt_in"));
        return new PortalMembership((String) r.get("membership_id"), (String) r.get("first_name"), (String) r.get("last_name"),
                (String) r.get("tier"), (String) r.get("status"), odt(r.get("valid_from")), odt(r.get("valid_until")),
                new Executive((String) r.get("enrolled_by_name"), (String) r.get("enrolled_by_username"),
                        optIn ? (String) r.get("mobile_e164") : null));
    }

    private static OffsetDateTime odt(Object v) {
        return v instanceof Timestamp t ? t.toInstant().atOffset(ZoneOffset.UTC)
                : v instanceof OffsetDateTime o ? o.withOffsetSameInstant(ZoneOffset.UTC) : null;
    }

    private static ApiException noMembership() {
        return new ApiException(HttpStatus.NOT_FOUND, "NO_MEMBERSHIP", "This account has no Gold Membership yet.");
    }
}
