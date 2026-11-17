package com.quantumclk.erp.keycloak.activation;

import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.events.Details;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.credential.PasswordCredentialModel;

import java.util.Optional;

/**
 * First step of the gh-guests browser flow used by the landing page (client guest-web).
 *
 * <p>When the authorization request carries {@code activation_token} (the welcome-email link), and the token is valid,
 * the member is identified without a password: their email is marked verified (they clicked a link sent to it) and,
 * if they have no password yet, Keycloak's own "Update password" page is shown. When they submit it, the normal flow
 * finishes and Keycloak redirects back to the landing page with an authorization code, so they arrive signed in —
 * one password entry, no second login (D-122). The password is typed on Keycloak's page only.
 *
 * <p>Without a token, or with an invalid / used / expired one, this step does nothing ("attempted") and the usual
 * cookie or username/password steps run.
 */
public class ActivationAuthenticator implements Authenticator {

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        String raw = context.getAuthenticationSession().getClientNote(ActivationTokens.NOTE);
        if (raw == null || raw.isBlank()) {
            context.attempted();
            return;
        }
        // Consumed once, whatever the outcome, so a later step or a retry can't reuse it.
        context.getAuthenticationSession().removeClientNote(ActivationTokens.NOTE);

        Optional<UserModel> found = ActivationTokens.consume(context.getSession(), context.getRealm(), raw, now());
        if (found.isEmpty()) {
            context.getEvent().detail("reason", "invalid_or_expired_activation_token").error("invalid_user_credentials");
            context.attempted();
            return;
        }
        UserModel user = found.get();
        user.setEmailVerified(true);
        user.removeRequiredAction(UserModel.RequiredAction.VERIFY_EMAIL);
        if (!user.credentialManager().isConfiguredFor(PasswordCredentialModel.TYPE)) {
            user.addRequiredAction(UserModel.RequiredAction.UPDATE_PASSWORD);
        }
        context.getEvent().detail("activation", "welcome_link");
        // "Keep me signed in": the session from the welcome link survives closing the browser, so the member is still
        // signed in when they come back (realm remember-me lifetimes apply; D-127).
        context.getAuthenticationSession().setAuthNote(Details.REMEMBER_ME, "true");
        context.setUser(user);
        context.success();
    }

    static long now() {
        return System.currentTimeMillis() / 1000;
    }

    @Override public void action(AuthenticationFlowContext context) { context.attempted(); }
    @Override public boolean requiresUser() { return false; }
    @Override public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) { return true; }
    @Override public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) { }
    @Override public void close() { }
}
