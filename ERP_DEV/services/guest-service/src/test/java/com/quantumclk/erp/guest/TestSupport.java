package com.quantumclk.erp.guest;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.quantumclk.erp.guest.keycloak.GuestIdentity;
import com.quantumclk.erp.guest.security.SecurityConfig;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Real PostgreSQL (Testcontainers), a fake Keycloak, and tokens signed with local keys but checked with the
 * production rules (issuer, audience, expiry). Each realm has its own key, as in Keycloak.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestSupport {

    public static final String STAFF_ISSUER = "http://test-keycloak/realms/gh-staff";
    public static final String GUEST_ISSUER = "http://test-keycloak/realms/gh-guests";
    static final RSAKey STAFF_KEY = generate();
    static final RSAKey GUEST_KEY = generate();
    public static final FakeGuestIdentity KC = new FakeGuestIdentity();

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgres() {
        return new PostgreSQLContainer("postgres:18.7");
    }

    /** Replaces the JWKS-based decoders: local keys, production validation rules. */
    @Bean
    @Primary
    SecurityConfig.IssuerDecoders testIssuerDecoders() throws JOSEException {
        NimbusJwtDecoder staff = NimbusJwtDecoder.withPublicKey(STAFF_KEY.toRSAPublicKey()).build();
        staff.setJwtValidator(SecurityConfig.validator(STAFF_ISSUER, SecurityConfig.STAFF_AUDIENCE));
        NimbusJwtDecoder guest = NimbusJwtDecoder.withPublicKey(GUEST_KEY.toRSAPublicKey()).build();
        guest.setJwtValidator(SecurityConfig.validator(GUEST_ISSUER, SecurityConfig.GUEST_AUDIENCE));
        return new SecurityConfig.IssuerDecoders(staff, guest);
    }

    @Bean
    @Primary
    GuestIdentity fakeGuestIdentity() {
        return KC;
    }

    /** access-service's client-credentials token from gh-staff. */
    public static String staff(List<String> permissions) {
        Instant now = Instant.now();
        return sign(new JWTClaimsSet.Builder().issuer(STAFF_ISSUER).subject(UUID.randomUUID().toString())
                .audience(List.of("erp-api", "realm-management")).claim("azp", "access-service")
                .issueTime(Date.from(now)).expirationTime(Date.from(now.plusSeconds(300)))
                .claim("resource_access", Map.of("erp-api", Map.of("roles", permissions))).build(), STAFF_KEY);
    }

    /** A signed-in guest from gh-guests (landing page). */
    public static String guest(UUID sub, String email) {
        return guest(sub, email, "session-1");
    }

    /** sid: the Keycloak session the token belongs to (one sign-in). */
    public static String guest(UUID sub, String email, String sid) {
        Instant now = Instant.now();
        return sign(new JWTClaimsSet.Builder().issuer(GUEST_ISSUER).subject(sub.toString()).audience("guest-api")
                .claim("azp", "guest-web").claim("sid", sid).claim("email", email).claim("given_name", "Rohan").claim("family_name", "Sharma")
                .claim("email_verified", true).issueTime(Date.from(now)).expirationTime(Date.from(now.plusSeconds(300))).build(), GUEST_KEY);
    }

    static String sign(JWTClaimsSet claims, RSAKey key) {
        try {
            SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(), claims);
            jwt.sign(new RSASSASigner(key));
            return jwt.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException(e);
        }
    }

    private static RSAKey generate() {
        try {
            return new RSAKeyGenerator(2048).keyID(UUID.randomUUID().toString()).generate();
        } catch (JOSEException e) {
            throw new IllegalStateException(e);
        }
    }
}
