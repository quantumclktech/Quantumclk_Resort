package com.quantumclk.erp.lead;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.time.Duration;
import java.util.*;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    public static final String STAFF_AUDIENCE = "erp-api";
    static final Duration CLOCK_SKEW = Duration.ofSeconds(60);

    @Bean
    JsonMapper jsonMapper() {
        return JsonMapper.builder().findAndAddModules().build();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JsonMapper json, JwtDecoder decoder) throws Exception {
        http.csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health/**", "/actuator/health").permitAll()
                // Executive lead performance is for the Sales Admin only (D-137); the controller checks it too.
                .requestMatchers("/api/v1/sales/leads/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
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
    JwtDecoder jwtDecoder(@Value("${erp.keycloak.issuer}") String issuer) {
        NimbusJwtDecoder d = NimbusJwtDecoder.withJwkSetUri(issuer + "/protocol/openid-connect/certs").build();
        d.setJwtValidator(validator(issuer, STAFF_AUDIENCE));
        return d;
    }

    public static OAuth2TokenValidator<Jwt> validator(String issuer, String audience) {
        return new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(CLOCK_SKEW),
                new JwtIssuerValidator(issuer),
                jwt -> jwt.getAudience() != null && jwt.getAudience().contains(audience)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "aud must contain " + audience, null)));
    }

    public static JwtAuthenticationConverter authenticationConverter() {
        JwtAuthenticationConverter c = new JwtAuthenticationConverter();
        c.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> out = new ArrayList<>();
            // realm_access.roles → ROLE_x (job roles), resource_access.erp-api.roles → PERM_x, as in access-service.
            Map<String, Object> realm = jwt.getClaimAsMap("realm_access");
            if (realm != null && realm.get("roles") instanceof List<?> rl) {
                rl.forEach(r -> out.add(new SimpleGrantedAuthority("ROLE_" + r)));
            }
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
