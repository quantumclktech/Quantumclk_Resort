package com.quantumclk.erp.access.membership;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Calls guest-service's internal API ({@code /internal/guests/**}, not exposed by the gateway) with access-service's
 * own gh-staff service-account token. That token carries the erp-api permission {@code guests.provision}
 * (KEYCLOAK-SETUP §5.5). Any failure becomes {@link Unavailable}: the membership stays ACTIVE and the account
 * status shows INVITE_FAILED, with "Resend welcome" as the way out.
 */
@Component
public class GuestServiceClient implements GuestAccounts {

    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() { };

    private final RestClient http;
    private final String base;
    private final String tokenUrl;
    private final String clientId;
    private final String clientSecret;
    private String token;
    private Instant tokenExpires = Instant.EPOCH;

    public GuestServiceClient(@Value("${erp.guest-service.url}") String base,
                              @Value("${erp.keycloak.admin-url:${erp.keycloak.url}}") String keycloak,
                              @Value("${erp.keycloak.realm}") String realm,
                              @Value("${erp.keycloak.admin-client-id}") String clientId,
                              @Value("${erp.keycloak.admin-client-secret}") String clientSecret) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(Duration.ofSeconds(3));
        f.setReadTimeout(Duration.ofSeconds(30));   // guest-service waits for Keycloak to send the email
        this.http = RestClient.builder().requestFactory(f).build();
        this.base = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        this.tokenUrl = keycloak + "/realms/" + realm + "/protocol/openid-connect/token";
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    public Result provision(Welcome w) {
        Map<String, Object> body = new HashMap<>();
        body.put("email", w.email());
        body.put("firstName", w.firstName());
        body.put("lastName", w.lastName());
        body.put("mobile", w.mobile());
        body.put("membershipId", w.membershipId());
        body.put("validUntil", w.validUntil());
        body.put("requestedBy", w.requestedBy());
        return post("/internal/guests/provision", body);
    }

    @Override
    public Result resend(UUID guestUserId, String validUntil, String requestedBy) {
        Map<String, Object> body = new HashMap<>();
        body.put("validUntil", validUntil);
        body.put("requestedBy", requestedBy);
        return post("/internal/guests/" + guestUserId + "/resend", body);
    }

    private Result post(String path, Map<String, Object> body) {
        try {
            Map<String, Object> r = http.post().uri(base + path).headers(h -> h.setBearerAuth(token()))
                    .contentType(MediaType.APPLICATION_JSON).body(body).retrieve().body(MAP);
            if (r == null || r.get("guestUserId") == null) throw new Unavailable("guest-service returned no account", null);
            return new Result(UUID.fromString(String.valueOf(r.get("guestUserId"))), Boolean.TRUE.equals(r.get("welcomeSent")));
        } catch (RestClientException e) {
            synchronized (this) { tokenExpires = Instant.EPOCH; }   // a stale token is the cheapest thing to rule out next time
            throw new Unavailable("guest-service call failed: " + e.getMessage(), e);
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
}
