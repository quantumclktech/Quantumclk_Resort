package com.quantumclk.erp.keycloak.activation;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.keycloak.email.EmailException;
import org.keycloak.email.EmailTemplateProvider;
import org.keycloak.models.AdminRoles;
import org.keycloak.models.ClientModel;
import org.keycloak.models.Constants;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.representations.AccessToken;
import org.keycloak.services.managers.AppAuthManager;
import org.keycloak.services.managers.AuthenticationManager.AuthResult;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * {@code POST /realms/{realm}/gh-activation/users/{id}/send}: issues a fresh one-time activation token for the member
 * and sends the Golden Hills welcome email (theme "golden-hills", template gh-welcome.ftl) through the realm's SMTP
 * server (D-121). Any earlier token stops working.
 *
 * <p>Caller: guest-service's service account; it needs realm-management {@code manage-users} in this realm.
 * The link must point at an origin registered on the client {@value #LANDING_CLIENT}, so it can't be turned into a
 * phishing link.
 */
public class ActivationResource {

    public static final String LANDING_CLIENT = "guest-web";
    static final int DEFAULT_HOURS = 72;
    static final int MAX_HOURS = 168;
    private static final Logger log = Logger.getLogger(ActivationResource.class);

    /** activateUrl: e.g. https://<public host>/member/activate; validUntil: shown in the email, e.g. "16 Nov 2027". */
    public static class SendRequest {
        public String activateUrl;
        public String validUntil;
        public Integer lifespanHours;
    }

    private final KeycloakSession session;

    public ActivationResource(KeycloakSession session) {
        this.session = session;
    }

    @POST
    @Path("users/{id}/send")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response send(@PathParam("id") String userId, SendRequest body) {
        AuthResult auth = new AppAuthManager.BearerTokenAuthenticator(session).authenticate();
        if (auth == null) return error(Response.Status.UNAUTHORIZED, "not_authenticated");
        AccessToken.Access rm = auth.token().getResourceAccess(Constants.REALM_MANAGEMENT_CLIENT_ID);
        if (rm == null || !rm.isUserInRole(AdminRoles.MANAGE_USERS)) return error(Response.Status.FORBIDDEN, "manage_users_required");

        RealmModel realm = session.getContext().getRealm();
        UserModel user = session.users().getUserById(realm, userId);
        if (user == null) return error(Response.Status.NOT_FOUND, "user_not_found");
        if (user.getEmail() == null || !user.isEnabled()) return error(Response.Status.CONFLICT, "user_not_emailable");
        if (body == null) return error(Response.Status.BAD_REQUEST, "body_required");

        URI base = allowedBase(realm, body.activateUrl);
        if (base == null) return error(Response.Status.BAD_REQUEST, "activate_url_not_allowed");
        int hours = body.lifespanHours == null ? DEFAULT_HOURS : Math.max(1, Math.min(MAX_HOURS, body.lifespanHours));

        long now = ActivationAuthenticator.now();
        String token = ActivationTokens.issue(user, now, hours * 3600L);
        String link = base + "?t=" + URLEncoder.encode(token, StandardCharsets.US_ASCII);

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("link", link);
        attributes.put("linkExpirationHours", hours);
        attributes.put("membershipId", user.getFirstAttribute("membershipId") == null ? "" : user.getFirstAttribute("membershipId"));
        attributes.put("validUntil", body.validUntil == null ? "" : body.validUntil);
        attributes.put("firstName", user.getFirstName() == null ? "" : user.getFirstName());
        try {
            session.getProvider(EmailTemplateProvider.class).setRealm(realm).setUser(user)
                    .send("ghWelcomeSubject", List.of(), "gh-welcome.ftl", attributes);
        } catch (EmailException e) {
            ActivationTokens.clear(user);   // nobody received it; don't leave a live token behind
            log.warnf("Welcome email to user %s could not be sent: %s", user.getId(), e.getMessage());
            return error(Response.Status.BAD_GATEWAY, "email_failed");
        }
        return Response.ok(Map.of("sent", true, "expiresAt", now + hours * 3600L)).build();
    }

    /**
     * The link base without query or fragment, when its scheme is https (or http on localhost) and its origin is one
     * of the landing client's web origins; otherwise null.
     */
    static URI allowedBase(RealmModel realm, String url) {
        if (url == null) return null;
        URI u;
        try {
            u = URI.create(url.strip());
        } catch (IllegalArgumentException e) {
            return null;
        }
        if (u.getHost() == null || u.getScheme() == null) return null;
        boolean local = Set.of("localhost", "127.0.0.1").contains(u.getHost());
        if (!"https".equals(u.getScheme()) && !(local && "http".equals(u.getScheme()))) return null;
        String origin = u.getScheme() + "://" + u.getHost() + (u.getPort() == -1 ? "" : ":" + u.getPort());
        ClientModel landing = realm.getClientByClientId(LANDING_CLIENT);
        if (landing == null || !landing.getWebOrigins().contains(origin)) return null;
        return URI.create(origin + (u.getRawPath() == null || u.getRawPath().isEmpty() ? "/" : u.getRawPath()));
    }

    private static Response error(Response.Status status, String code) {
        return Response.status(status).entity(Map.of("error", code)).type(MediaType.APPLICATION_JSON).build();
    }
}
