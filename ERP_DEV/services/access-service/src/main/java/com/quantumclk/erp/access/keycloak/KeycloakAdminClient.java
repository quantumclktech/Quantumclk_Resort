package com.quantumclk.erp.access.keycloak;

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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * Keycloak Admin REST API over plain HTTP with the access-service service account (client credentials).
 * The client secret stays in this process; it is never logged or returned (AUTHENTICATION §1 rule 4).
 */
@Component
public class KeycloakAdminClient implements KeycloakAdmin {

    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST = new ParameterizedTypeReference<>() { };
    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() { };

    private final RestClient http;
    private final String admin;
    private final String tokenUrl;
    private final String clientId;
    private final String clientSecret;
    private final String webUrl;
    private String token;
    private Instant tokenExpires = Instant.EPOCH;

    public KeycloakAdminClient(@Value("${erp.keycloak.admin-url:${erp.keycloak.url}}") String url,
                               @Value("${erp.keycloak.realm}") String realm,
                               @Value("${erp.keycloak.admin-client-id}") String clientId,
                               @Value("${erp.keycloak.admin-client-secret}") String clientSecret,
                               @Value("${erp.web.url}") String webUrl) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(Duration.ofSeconds(3));
        f.setReadTimeout(Duration.ofSeconds(15));
        this.http = RestClient.builder().requestFactory(f).build();
        this.admin = url + "/admin/realms/" + realm;
        this.tokenUrl = url + "/realms/" + realm + "/protocol/openid-connect/token";
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.webUrl = webUrl;
    }

    @Override
    public UUID createUser(NewUser u) {
        return call(() -> {
            try {
                URI location = http.post().uri(admin + "/users").headers(h -> h.setBearerAuth(token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("username", u.username(), "email", u.email(), "firstName", u.firstName(),
                                "lastName", u.lastName(), "enabled", true, "emailVerified", false,
                                "requiredActions", List.of("VERIFY_EMAIL", "UPDATE_PASSWORD")))
                        .retrieve().toBodilessEntity().getHeaders().getLocation();
                String path = location.getPath();
                return UUID.fromString(path.substring(path.lastIndexOf('/') + 1));
            } catch (HttpClientErrorException.Conflict e) {
                throw new Conflict("Username or email already exists in the identity system.");
            }
        });
    }

    @Override
    public Optional<UserState> findByUsername(String username) {
        return call(() -> {
            List<Map<String, Object>> users = http.get().uri(admin + "/users?exact=true&username={u}", username)
                    .headers(h -> h.setBearerAuth(token())).retrieve().body(LIST);
            return users == null ? Optional.<UserState>empty() : users.stream().findFirst().map(KeycloakAdminClient::state);
        });
    }

    @Override
    public Optional<UserState> getUser(UUID id) {
        return call(() -> {
            try {
                return Optional.of(state(http.get().uri(admin + "/users/{id}", id).headers(h -> h.setBearerAuth(token()))
                        .retrieve().body(MAP)));
            } catch (HttpClientErrorException.NotFound e) {
                return Optional.<UserState>empty();
            }
        });
    }

    @Override
    public void assignRealmRole(UUID userId, String role) {
        call(() -> {
            // "available" works with manage-users alone; GET /roles/{name} would need view-realm (KEYCLOAK-SETUP §5.3).
            List<Map<String, Object>> available = http.get().uri(admin + "/users/{id}/role-mappings/realm/available", userId)
                    .headers(h -> h.setBearerAuth(token())).retrieve().body(LIST);
            Optional<Map<String, Object>> r = available == null ? Optional.empty()
                    : available.stream().filter(x -> role.equals(x.get("name"))).findFirst();
            if (r.isEmpty()) return null; // already mapped (or unknown, which the caller's allow-list prevents)
            http.post().uri(admin + "/users/{id}/role-mappings/realm", userId).headers(h -> h.setBearerAuth(token()))
                    .contentType(MediaType.APPLICATION_JSON).body(List.of(r.get())).retrieve().toBodilessEntity();
            return null;
        });
    }

    @Override
    public void sendSetupEmail(UUID userId) {
        try {
            // redirect_uri is where the employee lands after setting the password. Without it Keycloak has
            // no return address and the last page offers no way back into the app (KEYCLOAK-SETUP §1.1).
            // It is the ERP's full URL (origin + /erp/), not the bare origin: the origin root is the landing page (D-124).
            String redirect = webUrl.endsWith("/") ? webUrl : webUrl + "/";
            call(() -> http.put()
                    .uri(admin + "/users/{id}/execute-actions-email?client_id=erp-web&lifespan=86400&redirect_uri={redirect}",
                            userId, redirect)
                    .headers(h -> h.setBearerAuth(token())).contentType(MediaType.APPLICATION_JSON)
                    .body(List.of("VERIFY_EMAIL", "UPDATE_PASSWORD")).retrieve().toBodilessEntity());
        } catch (Unavailable e) {
            // Keycloak answers 500 when SMTP fails; a connection failure stays "unavailable".
            if (e.getCause() instanceof HttpServerErrorException) throw new EmailFailed("Keycloak could not send the email.", e);
            throw e;
        }
    }

    @Override
    public void setEnabled(UUID userId, boolean enabled) {
        call(() -> http.put().uri(admin + "/users/{id}", userId).headers(h -> h.setBearerAuth(token()))
                .contentType(MediaType.APPLICATION_JSON).body(Map.of("enabled", enabled)).retrieve().toBodilessEntity());
    }

    @Override
    public void logout(UUID userId) {
        call(() -> http.post().uri(admin + "/users/{id}/logout", userId).headers(h -> h.setBearerAuth(token()))
                .retrieve().toBodilessEntity());
    }

    @Override
    public void replaceJobRole(UUID userId, String role, java.util.Collection<String> jobRoles) {
        call(() -> {
            List<Map<String, Object>> mapped = http.get().uri(admin + "/users/{id}/role-mappings/realm", userId)
                    .headers(h -> h.setBearerAuth(token())).retrieve().body(LIST);
            List<Map<String, Object>> remove = mapped == null ? List.of() : mapped.stream()
                    .filter(r -> jobRoles.contains(r.get("name")) && !role.equals(r.get("name"))).toList();
            if (!remove.isEmpty()) {
                http.method(org.springframework.http.HttpMethod.DELETE).uri(admin + "/users/{id}/role-mappings/realm", userId)
                        .headers(h -> h.setBearerAuth(token())).contentType(MediaType.APPLICATION_JSON).body(remove)
                        .retrieve().toBodilessEntity();
            }
            return null;
        });
        assignRealmRole(userId, role);
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
                synchronized (this) { tokenExpires = Instant.EPOCH; } // stale admin token; next call fetches a new one
                throw new Unavailable("Identity system rejected the service token", e);
            }
            throw e;
        }
    }

    @SuppressWarnings("unchecked")
    private static UserState state(Map<String, Object> u) {
        return new UserState(UUID.fromString(String.valueOf(u.get("id"))), (String) u.get("username"), (String) u.get("email"),
                Boolean.TRUE.equals(u.get("enabled")), Boolean.TRUE.equals(u.get("emailVerified")),
                (List<String>) u.getOrDefault("requiredActions", List.of()));
    }
}
