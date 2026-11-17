package com.quantumclk.erp.guest.keycloak;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * Keycloak gh-guests over plain HTTP with guest-service's service account (client credentials; realm-management
 * manage-users only, plus the kc-admin-api audience that Keycloak 26.8 requires for Admin API calls).
 * The client secret stays in this process; it is never logged or returned.
 */
@Component
public class KeycloakGuestIdentity implements GuestIdentity {

    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST = new ParameterizedTypeReference<>() { };
    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() { };

    private final RestClient http;
    private final String admin;
    private final String activation;
    private final String tokenUrl;
    private final String clientId;
    private final String clientSecret;
    private String token;
    private Instant tokenExpires = Instant.EPOCH;

    public KeycloakGuestIdentity(@Value("${erp.keycloak.admin-url}") String url,
                                 @Value("${erp.keycloak.guest-realm}") String realm,
                                 @Value("${erp.keycloak.client-id}") String clientId,
                                 @Value("${erp.keycloak.client-secret}") String clientSecret) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(Duration.ofSeconds(3));
        f.setReadTimeout(Duration.ofSeconds(20));   // sending the email happens inside the call
        this.http = RestClient.builder().requestFactory(f).build();
        this.admin = url + "/admin/realms/" + realm;
        this.activation = url + "/realms/" + realm + "/gh-activation";
        this.tokenUrl = url + "/realms/" + realm + "/protocol/openid-connect/token";
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    public Optional<String> findByEmail(String email) {
        return call(() -> {
            List<Map<String, Object>> users = http.get()
                    .uri(admin + "/users?email={e}&exact=true&briefRepresentation=true", email)
                    .headers(h -> h.setBearerAuth(token())).retrieve().body(LIST);
            return users == null ? Optional.<String>empty() : users.stream()
                    .filter(u -> email.equalsIgnoreCase(String.valueOf(u.get("email"))))
                    .map(u -> String.valueOf(u.get("id"))).findFirst();
        });
    }

    @Override
    public String create(NewGuest g) {
        return call(() -> {
            try {
                URI location = http.post().uri(admin + "/users").headers(h -> h.setBearerAuth(token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("username", g.email(), "email", g.email(), "firstName", g.firstName(),
                                "lastName", g.lastName(), "enabled", true, "emailVerified", false,
                                "requiredActions", List.of("UPDATE_PASSWORD"),
                                "attributes", Map.of("membershipId", List.of(g.membershipId()))))
                        .retrieve().toBodilessEntity().getHeaders().getLocation();
                String path = location == null ? "" : location.getPath();
                return path.substring(path.lastIndexOf('/') + 1);
            } catch (HttpClientErrorException.Conflict e) {
                throw new Conflict("An account with this email already exists.");
            }
        });
    }

    @Override
    public void setMembershipId(String userId, String membershipId) {
        call(() -> {
            // Read-modify-write so the other attributes and fields stay as they are.
            Map<String, Object> user = http.get().uri(admin + "/users/{id}", userId).headers(h -> h.setBearerAuth(token()))
                    .retrieve().body(MAP);
            Map<String, Object> attributes = new HashMap<>();
            if (user != null && user.get("attributes") instanceof Map<?, ?> a) a.forEach((k, v) -> attributes.put(String.valueOf(k), v));
            attributes.put("membershipId", List.of(membershipId));
            http.put().uri(admin + "/users/{id}", userId).headers(h -> h.setBearerAuth(token()))
                    .contentType(MediaType.APPLICATION_JSON).body(Map.of("attributes", attributes))
                    .retrieve().toBodilessEntity();
            return null;
        });
    }

    @Override
    public void sendWelcome(String userId, String activateUrl, String validUntil) {
        try {
            call(() -> http.post().uri(activation + "/users/{id}/send", userId).headers(h -> h.setBearerAuth(token()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("activateUrl", activateUrl, "validUntil", validUntil == null ? "" : validUntil))
                    .retrieve().toBodilessEntity());
        } catch (Unavailable e) {
            // 502 from the extension = the SMTP server refused or failed; anything else stays "unavailable".
            if (e.getCause() instanceof HttpServerErrorException s && s.getStatusCode().isSameCodeAs(HttpStatusCode.valueOf(502))) {
                throw new EmailFailed("Keycloak could not send the welcome email.", e);
            }
            throw e;
        }
    }

    private synchronized String token() {
        if (Instant.now().isBefore(tokenExpires)) return token;
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        Map<String, Object> t = http.post().uri(tokenUrl).contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form)
                .retrieve().body(MAP);
        token = String.valueOf(t.get("access_token"));
        tokenExpires = Instant.now().plusSeconds(((Number) t.get("expires_in")).longValue() - 30);
        return token;
    }

    private <T> T call(Supplier<T> action) {
        try {
            return action.get();
        } catch (ResourceAccessException | HttpServerErrorException e) {
            throw new Unavailable("Identity system unavailable", e);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().isSameCodeAs(HttpStatusCode.valueOf(401))) {
                synchronized (this) { tokenExpires = Instant.EPOCH; }   // stale token; the next call fetches a new one
                throw new Unavailable("Identity system rejected the service token", e);
            }
            throw e;
        }
    }
}
