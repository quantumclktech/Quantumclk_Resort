package com.quantumclk.erp.access.membership;

import java.util.UUID;

/**
 * The customer's account in Keycloak gh-guests, owned by guest-service (D-120). access-service asks for it when a
 * Gold Membership is verified; guest-service creates the account and Keycloak sends the welcome email with the
 * one-time set-password link (D-121, D-122). Real implementation: {@link GuestServiceClient}; tests use a fake.
 */
public interface GuestAccounts {

    /** validUntil is display text for the email, e.g. "16 Nov 2027"; requestedBy is the verifying employee. */
    record Welcome(String email, String firstName, String lastName, String mobile, String membershipId,
                   String validUntil, String requestedBy) { }

    /** welcomeSent=false: the account exists but the email didn't go out (resend later). */
    record Result(UUID guestUserId, boolean welcomeSent) { }

    Result provision(Welcome welcome);

    Result resend(UUID guestUserId, String validUntil, String requestedBy);

    /** guest-service or the identity system can't be reached; nothing was confirmed. */
    class Unavailable extends RuntimeException {
        public Unavailable(String message, Throwable cause) { super(message, cause); }
    }
}
