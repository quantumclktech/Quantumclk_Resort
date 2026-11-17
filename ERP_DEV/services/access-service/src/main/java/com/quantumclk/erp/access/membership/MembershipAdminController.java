package com.quantumclk.erp.access.membership;

import com.quantumclk.erp.access.employee.EmployeeRepository;
import com.quantumclk.erp.access.membership.MemberView.PageView;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Verification queue for Gold Membership payments (ERP-05; D-118): ADMIN and MANAGER see every registration,
 * inspect the payment screenshot and verify or reject. Nobody verifies a member they enrolled.
 */
@RestController
@RequestMapping("/api/v1/admin/memberships")
public class MembershipAdminController {

    public record RejectRequest(String reason) { }

    private final MembershipService service;
    private final EmployeeRepository employees;

    MembershipAdminController(MembershipService service, EmployeeRepository employees) {
        this.service = service;
        this.employees = employees;
    }

    /** Newest first; pendingCount feeds the queue badge. */
    @GetMapping
    @PreAuthorize("hasAuthority('PERM_memberships.read_all')")
    PageView list(@RequestParam(required = false) String status, @RequestParam(required = false) String q,
                  @RequestParam(required = false) String enrolledBy,
                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
                  @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return service.list(status, q, enrolledBy, from, to, page, size);
    }

    /** Memberships each executive brought in, for Employees → Sales Performance. Sales Admin only (D-137, D-140). */
    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN') and hasAuthority('PERM_memberships.read_all')")
    MemberView.MembershipSummary summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        return service.summary(from, to);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_memberships.read_all')")
    MemberView one(@PathVariable UUID id) {
        return service.get(id);
    }

    @GetMapping("/{id}/proof")
    @PreAuthorize("hasAuthority('PERM_memberships.read_all')")
    ResponseEntity<byte[]> proof(@PathVariable UUID id) {
        return MembershipController.image(service.proof(service.get(id)));
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAuthority('PERM_memberships.verify')")
    MemberView verify(@PathVariable UUID id, JwtAuthenticationToken auth, HttpServletRequest http) {
        return service.verify(id, MembershipController.staff(employees, auth, http));
    }

    /** Customer account + welcome email again (new one-time link); creates the account if that failed at verification. */
    @PostMapping("/{id}/resend-welcome")
    @PreAuthorize("hasAuthority('PERM_memberships.verify')")
    MemberView resendWelcome(@PathVariable UUID id, JwtAuthenticationToken auth, HttpServletRequest http) {
        return service.resendWelcome(id, MembershipController.staff(employees, auth, http));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('PERM_memberships.verify')")
    MemberView reject(@PathVariable UUID id, @RequestBody RejectRequest r, JwtAuthenticationToken auth, HttpServletRequest http) {
        return service.reject(id, r == null ? null : r.reason(), MembershipController.staff(employees, auth, http));
    }
}
