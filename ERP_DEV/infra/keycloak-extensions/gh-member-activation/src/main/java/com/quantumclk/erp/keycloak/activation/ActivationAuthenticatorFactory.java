package com.quantumclk.erp.keycloak.activation;

import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;

import java.util.List;

/** Registers {@link ActivationAuthenticator} as "gh-member-activation" (used in the realm's gh-member-browser flow). */
public class ActivationAuthenticatorFactory implements AuthenticatorFactory {

    public static final String ID = "gh-member-activation";
    private static final ActivationAuthenticator SINGLETON = new ActivationAuthenticator();

    @Override public String getId() { return ID; }
    @Override public String getDisplayType() { return "Golden Hills member activation link"; }
    @Override public String getHelpText() { return "Signs in a new member from the one-time link in their welcome email, then asks for a password once."; }
    @Override public String getReferenceCategory() { return null; }
    @Override public boolean isConfigurable() { return false; }
    @Override public boolean isUserSetupAllowed() { return false; }
    @Override public Requirement[] getRequirementChoices() { return new Requirement[]{Requirement.ALTERNATIVE, Requirement.DISABLED}; }
    @Override public List<ProviderConfigProperty> getConfigProperties() { return List.of(); }
    @Override public Authenticator create(KeycloakSession session) { return SINGLETON; }
    @Override public void init(Config.Scope config) { }
    @Override public void postInit(KeycloakSessionFactory factory) { }
    @Override public void close() { }
}
