package com.quantumclk.erp.guest.keycloak;

import java.util.Optional;

/**
 * What guest-service needs from Keycloak realm gh-guests. The real implementation is {@link KeycloakGuestIdentity};
 * tests use a fake. Every method may throw {@link Unavailable} when Keycloak can't be reached.
 */
public interface GuestIdentity {

    /** A member to create: no password, Keycloak asks for one on first sign-in (UPDATE_PASSWORD). */
    record NewGuest(String email, String firstName, String lastName, String membershipId) { }

    /** The Keycloak user id of the account with exactly this email, if any. */
    Optional<String> findByEmail(String email);

    /** Creates the account; returns the Keycloak user id. Throws {@link Conflict} if the email is taken. */
    String create(NewGuest guest);

    /** Sets (or replaces) the user attribute membershipId shown on the welcome email and the member pages. */
    void setMembershipId(String userId, String membershipId);

    /**
     * Asks the gh-member-activation extension to issue a new one-time link and send the welcome email.
     * Throws {@link EmailFailed} when Keycloak could not send it.
     */
    void sendWelcome(String userId, String activateUrl, String validUntil);

    class Unavailable extends RuntimeException {
        public Unavailable(String message, Throwable cause) { super(message, cause); }
    }

    class EmailFailed extends RuntimeException {
        public EmailFailed(String message, Throwable cause) { super(message, cause); }
    }

    class Conflict extends RuntimeException {
        public Conflict(String message) { super(message); }
    }
}
