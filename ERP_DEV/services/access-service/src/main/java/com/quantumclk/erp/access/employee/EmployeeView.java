package com.quantumclk.erp.access.employee;

import java.time.Instant;
import java.util.UUID;

/** What the API returns about an employee. No Keycloak internals beyond the link flag. */
public record EmployeeView(UUID id, String firstName, String lastName, String email, String username, String mobile,
                           String jobRole, boolean whatsappOptIn, String status, String statusReason,
                           boolean identityLinked, Instant createdAt, Instant updatedAt, int version, String panMasked) {
    public static EmployeeView of(Employee e) {
        return new EmployeeView(e.getId(), e.getFirstName(), e.getLastName(), e.getEmail(), e.getUsername(), e.getMobileE164(),
                e.getJobRole(), e.isWhatsappOptIn(), e.getStatus(), e.getStatusReason(), e.getKeycloakUserId() != null,
                e.getCreatedAt(), e.getUpdatedAt(), e.getVersion(), e.getPanMasked());
    }
}
