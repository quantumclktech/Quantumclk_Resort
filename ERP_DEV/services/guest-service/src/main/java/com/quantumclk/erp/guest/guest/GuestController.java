package com.quantumclk.erp.guest.guest;

import com.quantumclk.erp.guest.guest.GuestService.Provision;
import com.quantumclk.erp.guest.guest.GuestService.Result;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * {@code /internal/guests/**}: called by access-service only (gh-staff service token with {@code guests.provision});
 * {@code /api/v1/portal/me}: the signed-in guest's own profile (gh-guests token). See api.md "guest-service".
 */
@RestController
public class GuestController {

    public record ProvisionRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 100) String firstName,
            @NotBlank @Size(max = 100) String lastName,
            @Size(max = 20) String mobile,
            @NotBlank @Pattern(regexp = "^GRH-LM-[0-9]{4}$", message = "GRH-LM-0000") String membershipId,
            @Size(max = 40) String validUntil,
            @Size(max = 50) String requestedBy) { }

    public record ResendRequest(@Size(max = 40) String validUntil, @Size(max = 50) String requestedBy) { }

    private final GuestService guests;

    GuestController(GuestService guests) {
        this.guests = guests;
    }

    @PostMapping("/internal/guests/provision")
    @PreAuthorize("hasAuthority('PERM_guests.provision')")
    Result provision(@Valid @RequestBody ProvisionRequest r, JwtAuthenticationToken auth) {
        return guests.provision(new Provision(r.email(), r.firstName(), r.lastName(), r.mobile(), r.membershipId(),
                r.validUntil(), r.requestedBy()), caller(auth));
    }

    @PostMapping("/internal/guests/{guestId}/resend")
    @PreAuthorize("hasAuthority('PERM_guests.provision')")
    Result resend(@PathVariable UUID guestId, @Valid @RequestBody(required = false) ResendRequest r, JwtAuthenticationToken auth) {
        return guests.resend(guestId, r == null ? null : r.validUntil(), caller(auth), r == null ? null : r.requestedBy());
    }

    /** No id in the path: a guest can only ever read their own profile. */
    @GetMapping("/api/v1/portal/me")
    Map<String, Object> me(JwtAuthenticationToken auth) {
        var t = auth.getToken();
        return guests.me(UUID.fromString(t.getSubject()), t.getClaimAsString("sid"), t.getClaimAsString("azp"), t.getClaimAsString("email"), t.getClaimAsString("given_name"),
                t.getClaimAsString("family_name"), Boolean.TRUE.equals(t.getClaimAsBoolean("email_verified")));
    }

    private static String caller(JwtAuthenticationToken auth) {
        String azp = auth.getToken().getClaimAsString("azp");
        return azp != null ? azp : auth.getToken().getSubject();
    }
}
