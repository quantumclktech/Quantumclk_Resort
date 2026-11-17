package com.quantumclk.erp.guest;

import com.quantumclk.erp.guest.keycloak.GuestIdentity;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/** In-memory gh-guests: users by email, their membershipId, and the welcome emails "sent". */
public class FakeGuestIdentity implements GuestIdentity {

    public record Sent(String userId, String activateUrl, String validUntil) { }

    public final Map<String, String> idsByEmail = new ConcurrentHashMap<>();
    public final Map<String, String> membershipIds = new ConcurrentHashMap<>();
    public final List<Sent> sent = new CopyOnWriteArrayList<>();
    public volatile boolean down;
    public volatile boolean emailBroken;

    public void reset() {
        idsByEmail.clear(); membershipIds.clear(); sent.clear(); down = false; emailBroken = false;
    }

    @Override
    public Optional<String> findByEmail(String email) {
        if (down) throw new Unavailable("down", null);
        return Optional.ofNullable(idsByEmail.get(email));
    }

    @Override
    public String create(NewGuest g) {
        if (down) throw new Unavailable("down", null);
        if (idsByEmail.containsKey(g.email())) throw new Conflict("exists");
        String id = UUID.randomUUID().toString();
        idsByEmail.put(g.email(), id);
        membershipIds.put(id, g.membershipId());
        return id;
    }

    @Override
    public void setMembershipId(String userId, String membershipId) {
        if (down) throw new Unavailable("down", null);
        membershipIds.put(userId, membershipId);
    }

    @Override
    public void sendWelcome(String userId, String activateUrl, String validUntil) {
        if (down) throw new Unavailable("down", null);
        if (emailBroken) throw new EmailFailed("smtp", null);
        sent.add(new Sent(userId, activateUrl, validUntil));
    }
}
