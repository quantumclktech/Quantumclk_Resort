package com.quantumclk.erp.keycloak.activation;

import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * The one-time activation token in a new member's welcome email (D-122).
 *
 * <p>Format sent in the link: {@code <keycloak user id>.<43 chars base64url of 32 random bytes>}. Only the SHA-256 of
 * the secret part and an expiry are stored, as user attributes, so a database read does not reveal a usable link.
 * A new token replaces the previous one (resend). The token is single-use: it is deleted the moment it is accepted.
 */
public final class ActivationTokens {

    public static final String HASH_ATTR = "gh_activation_hash";
    public static final String EXPIRES_ATTR = "gh_activation_exp";
    /** Keycloak keeps extra authorization request parameters on the login session under this prefix. */
    public static final String PARAM = "activation_token";
    public static final String NOTE = "client_request_param_" + PARAM;

    private static final Pattern FORMAT = Pattern.compile("^([0-9a-fA-F-]{36})\\.([A-Za-z0-9_-]{43})$");
    private static final SecureRandom RANDOM = new SecureRandom();

    private ActivationTokens() { }

    /** Creates a token for the user, stores its hash and expiry, and returns the value to put in the link. */
    public static String issue(UserModel user, long nowEpochSeconds, long lifespanSeconds) {
        byte[] secret = new byte[32];
        RANDOM.nextBytes(secret);
        String s = Base64.getUrlEncoder().withoutPadding().encodeToString(secret);
        user.setSingleAttribute(HASH_ATTR, sha256(s));
        user.setSingleAttribute(EXPIRES_ATTR, Long.toString(nowEpochSeconds + lifespanSeconds));
        return user.getId() + "." + s;
    }

    /**
     * Returns the user and deletes the token when it is well-formed, matches, is not expired and the user is enabled.
     * Any other case returns empty (and an expired token is deleted too).
     */
    public static Optional<UserModel> consume(KeycloakSession session, RealmModel realm, String raw, long nowEpochSeconds) {
        if (raw == null) return Optional.empty();
        var m = FORMAT.matcher(raw.strip());
        if (!m.matches()) return Optional.empty();
        UserModel user = session.users().getUserById(realm, m.group(1));
        if (user == null || !user.isEnabled()) return Optional.empty();
        String stored = user.getFirstAttribute(HASH_ATTR);
        String expires = user.getFirstAttribute(EXPIRES_ATTR);
        if (stored == null || expires == null) return Optional.empty();
        long exp;
        try {
            exp = Long.parseLong(expires);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
        if (nowEpochSeconds > exp) {
            clear(user);
            return Optional.empty();
        }
        boolean same = MessageDigest.isEqual(stored.getBytes(StandardCharsets.US_ASCII), sha256(m.group(2)).getBytes(StandardCharsets.US_ASCII));
        if (!same) return Optional.empty();
        clear(user);
        return Optional.of(user);
    }

    public static void clear(UserModel user) {
        user.removeAttribute(HASH_ATTR);
        user.removeAttribute(EXPIRES_ATTR);
    }

    static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.US_ASCII)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
