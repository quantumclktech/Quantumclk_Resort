package com.quantumclk.erp.access.keycloak;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * The only Keycloak Admin API calls the ERP makes (KEYCLOAK-SETUP §5.3). Every method is safe to repeat,
 * so a failed provisioning can simply be retried (AUTHENTICATION §10).
 */
public interface KeycloakAdmin {

    record NewUser(String username, String email, String firstName, String lastName) { }

    record UserState(UUID id, String username, String email, boolean enabled, boolean emailVerified, List<String> requiredActions) { }

    /** Creates the user with required actions VERIFY_EMAIL + UPDATE_PASSWORD. @throws Conflict if username/email exist. */
    UUID createUser(NewUser user);

    Optional<UserState> findByUsername(String username);

    Optional<UserState> getUser(UUID id);

    /** Maps one realm role (allow-listed by the caller). Already-mapped is fine. */
    void assignRealmRole(UUID userId, String role);

    /** Keycloak's own "set up your account" email (VERIFY_EMAIL + UPDATE_PASSWORD), link valid 24 h. @throws EmailFailed */
    void sendSetupEmail(UUID userId);

    /** enabled=false blocks login and token refresh at once (AUTHENTICATION §7). */
    void setEnabled(UUID userId, boolean enabled);

    /** Ends all of the user's sessions and revokes their refresh tokens. */
    void logout(UUID userId);

    /** Leaves exactly one of the given job roles mapped: removes the others, adds {@code role}. */
    void replaceJobRole(UUID userId, String role, java.util.Collection<String> jobRoles);

    /** Keycloak can't be reached or answered 5xx: nothing to blame on the request; retry later. */
    class Unavailable extends RuntimeException {
        public Unavailable(String message, Throwable cause) { super(message, cause); }
    }

    /** Username or email already taken in Keycloak. */
    class Conflict extends RuntimeException {
        public Conflict(String message) { super(message); }
    }

    /** The user exists but Keycloak could not send the email (usually SMTP). */
    class EmailFailed extends RuntimeException {
        public EmailFailed(String message, Throwable cause) { super(message, cause); }
    }
}
