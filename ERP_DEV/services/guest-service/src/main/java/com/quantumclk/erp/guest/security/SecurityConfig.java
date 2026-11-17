package com.quantumclk.erp.guest.security;

import com.quantumclk.erp.guest.web.ApiError;
import com.quantumclk.erp.guest.web.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Two kinds of caller from two Keycloak realms, never mixed:
 * <ul>
 *   <li>{@code /internal/**}: access-service's service account. Token from <b>gh-staff</b>, aud {@code erp-api},
 *       permission {@code guests.provision}. The gateway does not expose these paths.</li>
 *   <li>{@code /api/v1/portal/**}: a signed-in guest or member. Token from <b>gh-guests</b>, aud {@code guest-api}
 *       (landing page now; the mobile and customer apps later, D-119).</li>
 * </ul>
 * A token from the other realm fails the issuer check: 401. Everything else is denied.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    public static final String STAFF_AUDIENCE = "erp-api";
    public static final String GUEST_AUDIENCE = "guest-api";
    static final Duration CLOCK_SKEW = Duration.ofSeconds(60);

    /** One decoder per realm. Tests replace this bean (marked @Primary there) with locally-signed keys. */
    public record IssuerDecoders(JwtDecoder staff, JwtDecoder guest) { }

    @Bean
    @Order(1)
    SecurityFilterChain internal(HttpSecurity http, JsonMapper json, IssuerDecoders decoders) throws Exception {
        return bearer(http.securityMatcher("/internal/**"), json, decoders.staff());
    }

    @Bean
    @Order(2)
    SecurityFilterChain portal(HttpSecurity http, JsonMapper json, IssuerDecoders decoders) throws Exception {
        return bearer(http.securityMatcher("/api/v1/portal/**"), json, decoders.guest());
    }

    @Bean
    @Order(3)
    SecurityFilterChain rest(HttpSecurity http, JsonMapper json) throws Exception {
        http.csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a.requestMatchers("/actuator/health/**", "/actuator/health").permitAll().anyRequest().denyAll())
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> write(res, json, 401, "AUTH_REQUIRED", "Sign in again."))
                .accessDeniedHandler((req, res, ex) -> write(res, json, 403, "FORBIDDEN", "You do not have permission to do this.")));
        return http.build();
    }

    private static SecurityFilterChain bearer(HttpSecurity http, JsonMapper json, JwtDecoder decoder) throws Exception {
        http.csrf(c -> c.disable())   // stateless bearer-token API, no cookies
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a.anyRequest().authenticated())
            .oauth2ResourceServer(o -> o
                .jwt(j -> j.decoder(decoder).jwtAuthenticationConverter(authenticationConverter()))
                .authenticationEntryPoint((req, res, e) -> write(res, json, 401, "AUTH_REQUIRED", "Sign in again."))
                .accessDeniedHandler((req, res, e) -> write(res, json, 403, "FORBIDDEN", "You do not have permission to do this.")))
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> write(res, json, 401, "AUTH_REQUIRED", "Sign in again."))
                .accessDeniedHandler((req, res, ex) -> write(res, json, 403, "FORBIDDEN", "You do not have permission to do this.")));
        return http.build();
    }

    @Bean
    IssuerDecoders issuerDecoders(@Value("${erp.keycloak.staff-issuer}") String staffIssuer,
                                  @Value("${erp.keycloak.guest-issuer}") String guestIssuer) {
        return new IssuerDecoders(decoder(staffIssuer, STAFF_AUDIENCE), decoder(guestIssuer, GUEST_AUDIENCE));
    }

    /** Keys are fetched lazily from the realm's JWKS endpoint, so startup doesn't depend on Keycloak being up. */
    private static JwtDecoder decoder(String issuer, String audience) {
        NimbusJwtDecoder d = NimbusJwtDecoder.withJwkSetUri(issuer + "/protocol/openid-connect/certs").build();
        d.setJwtValidator(validator(issuer, audience));
        return d;
    }

    /** Issuer + expiry/not-before (60 s skew) + audience. Shared with the tests so they check the real rules. */
    public static OAuth2TokenValidator<Jwt> validator(String issuer, String audience) {
        return new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(CLOCK_SKEW),
                new JwtIssuerValidator(issuer),
                jwt -> jwt.getAudience() != null && jwt.getAudience().contains(audience)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "aud must contain " + audience, null)));
    }

    /** resource_access.erp-api.roles → PERM_x (only staff tokens carry them). */
    public static JwtAuthenticationConverter authenticationConverter() {
        JwtAuthenticationConverter c = new JwtAuthenticationConverter();
        c.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> out = new ArrayList<>();
            Map<String, Object> resources = jwt.getClaimAsMap("resource_access");
            if (resources != null && resources.get(STAFF_AUDIENCE) instanceof Map<?, ?> api && api.get("roles") instanceof List<?> l) {
                l.forEach(p -> out.add(new SimpleGrantedAuthority("PERM_" + p)));
            }
            return out;
        });
        return c;
    }

    private static void write(HttpServletResponse res, JsonMapper json, int status, String code, String message) throws IOException {
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        json.writeValue(res.getOutputStream(), ApiError.of(code, message, status, CorrelationIdFilter.current()));
    }
}
