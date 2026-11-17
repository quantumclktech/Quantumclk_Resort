package com.quantumclk.erp.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Gateway-side token check (AUTHENTICATION §5 step 4). Same rules as access-service's SecurityConfig:
 * shortcut: the 10-line validator is duplicated rather than shared; move it to a shared module when a third copy appears.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    static final String AUDIENCE = "erp-api";

    /**
     * Public website paths (/api/v1/portal/**): the gateway does NOT read bearer tokens here. Guests and members
     * carry tokens from realm gh-guests, which the staff decoder below would reject; the owning service checks them
     * (guest-service, access-service portal chain; MEMBER-LOGIN.md §5). Anonymous inquiries stay possible.
     * Rate limiting falls back to the client IP. Handled before the staff chain.
     */
    @Bean
    @org.springframework.core.annotation.Order(1)
    SecurityWebFilterChain portal(ServerHttpSecurity http) {
        return http
                .securityMatcher(new org.springframework.security.web.server.util.matcher.PathPatternParserServerWebExchangeMatcher("/api/v1/portal/**"))
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(Customizer.withDefaults())
                .authorizeExchange(a -> a.anyExchange().permitAll())
                .build();
    }

    @Bean
    @org.springframework.core.annotation.Order(2)
    SecurityWebFilterChain api(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable) // bearer tokens, no cookies
                .cors(Customizer.withDefaults())
                .authorizeExchange(a -> a
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers("/actuator/health/**", "/actuator/health").permitAll()
                        .anyExchange().authenticated())
                .oauth2ResourceServer(o -> o
                        .jwt(Customizer.withDefaults())
                        .authenticationEntryPoint((ex, e) -> error(ex, HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Sign in again."))
                        .accessDeniedHandler((ex, e) -> error(ex, HttpStatus.FORBIDDEN, "FORBIDDEN", "You do not have permission to do this.")))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((ex, err) -> error(ex, HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Sign in again.")))
                .build();
    }

    /** Lazy JWKS fetch: the gateway starts even while Keycloak is still booting. */
    @Bean
    ReactiveJwtDecoder jwtDecoder(@Value("${erp.keycloak.issuer}") String issuer) {
        NimbusReactiveJwtDecoder d = NimbusReactiveJwtDecoder.withJwkSetUri(issuer + "/protocol/openid-connect/certs").build();
        d.setJwtValidator(validator(issuer));
        return d;
    }

    public static OAuth2TokenValidator<Jwt> validator(String issuer) {
        return new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(Duration.ofSeconds(60)),
                new JwtIssuerValidator(issuer),
                jwt -> jwt.getAudience() != null && jwt.getAudience().contains(AUDIENCE)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "aud must contain " + AUDIENCE, null)));
    }

    /** Only the two browser apps may call the API from a browser (ARCHITECTURE §2). */
    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${erp.cors.allowed-origins}") List<String> origins) {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(origins);
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key", "If-Match", "X-Correlation-Id"));
        c.setExposedHeaders(List.of("X-Correlation-Id", "ETag", "Location"));
        c.setMaxAge(Duration.ofMinutes(30));
        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/api/**", c);
        return s;
    }

    /** Rate-limit bucket: the signed-in employee, else the client IP (proxy headers are not trusted here). */
    @Bean
    KeyResolver callerKeyResolver() {
        return exchange -> exchange.getPrincipal()
                .map(p -> "user:" + p.getName())
                .switchIfEmpty(Mono.fromSupplier(() -> "ip:" + Optional.ofNullable(exchange.getRequest().getRemoteAddress())
                        .map(a -> a.getAddress().getHostAddress()).orElse("unknown")));
    }

    static Mono<Void> error(ServerWebExchange ex, HttpStatus status, String code, String message) {
        var res = ex.getResponse();
        res.setStatusCode(status);
        res.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String id = String.valueOf(ex.getAttributes().getOrDefault(CorrelationIdWebFilter.ATTRIBUTE, ""));
        // Fixed codes/messages only, so building the JSON by hand cannot inject anything.
        String body = "{\"code\":\"" + code + "\",\"message\":\"" + message + "\",\"status\":" + status.value()
                + ",\"correlationId\":\"" + id + "\",\"timestamp\":\"" + Instant.now() + "\",\"fields\":{}}";
        return res.writeWith(Mono.just(res.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8))));
    }
}
