package com.quantumclk.erp.keycloak.activation;

import org.keycloak.Config;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.services.resource.RealmResourceProviderFactory;

/** Mounts {@link ActivationResource} at /realms/{realm}/gh-activation. */
public class ActivationResourceProviderFactory implements RealmResourceProviderFactory {

    public static final String ID = "gh-activation";

    @Override
    public RealmResourceProvider create(KeycloakSession session) {
        return new RealmResourceProvider() {
            @Override public Object getResource() { return new ActivationResource(session); }
            @Override public void close() { }
        };
    }

    @Override public String getId() { return ID; }
    @Override public void init(Config.Scope config) { }
    @Override public void postInit(KeycloakSessionFactory factory) { }
    @Override public void close() { }
}
