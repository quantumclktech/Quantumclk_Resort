package com.quantumclk.erp.access;

import com.quantumclk.erp.access.keycloak.KeycloakAdmin;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** In-memory Keycloak with switches for the failure cases of AUTHENTICATION §10. */
public class FakeKeycloak implements KeycloakAdmin {
    public final Map<UUID, UserState> users = new ConcurrentHashMap<>();
    public final Map<UUID, List<String>> roles = new ConcurrentHashMap<>();
    public final List<UUID> emailsSent = new ArrayList<>();
    public volatile boolean down;
    public volatile boolean emailBroken;

    public void reset() { users.clear(); roles.clear(); emailsSent.clear(); down = false; emailBroken = false; }

    @Override public UUID createUser(NewUser u) {
        if (down) throw new Unavailable("down", null);
        if (users.values().stream().anyMatch(x -> x.username().equals(u.username()) || x.email().equals(u.email())))
            throw new Conflict("exists");
        UUID id = UUID.randomUUID();
        users.put(id, new UserState(id, u.username(), u.email(), true, false, List.of("VERIFY_EMAIL", "UPDATE_PASSWORD")));
        return id;
    }
    @Override public Optional<UserState> findByUsername(String username) {
        if (down) throw new Unavailable("down", null);
        return users.values().stream().filter(x -> x.username().equals(username)).findFirst();
    }
    @Override public Optional<UserState> getUser(UUID id) {
        if (down) throw new Unavailable("down", null);
        return Optional.ofNullable(users.get(id));
    }
    @Override public void assignRealmRole(UUID userId, String role) {
        if (down) throw new Unavailable("down", null);
        roles.computeIfAbsent(userId, k -> new ArrayList<>()).add(role);
    }
    @Override public void setEnabled(UUID userId, boolean enabled) {
        if (down) throw new Unavailable("down", null);
        UserState u = users.get(userId);
        users.put(userId, new UserState(u.id(), u.username(), u.email(), enabled, u.emailVerified(), u.requiredActions()));
    }
    @Override public void logout(UUID userId) {
        if (down) throw new Unavailable("down", null);
    }
    @Override public void replaceJobRole(UUID userId, String role, java.util.Collection<String> jobRoles) {
        if (down) throw new Unavailable("down", null);
        roles.put(userId, new ArrayList<>(List.of(role)));
    }
    @Override public void sendSetupEmail(UUID userId) {
        if (down) throw new Unavailable("down", null);
        if (emailBroken) throw new EmailFailed("smtp", null);
        emailsSent.add(userId);
    }
}
