package com.quantumclk.erp.access.employee;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

/** ERP-side employee profile (AUTHENTICATION.md §9). Authorization never reads jobRole; it reads the token. */
@Entity
@Table(name = "employee")
public class Employee {
    @Id private UUID id;
    @Column(name = "keycloak_user_id") private UUID keycloakUserId;
    @Column(name = "first_name") private String firstName;
    @Column(name = "last_name") private String lastName;
    private String email;
    private String username;
    @Column(name = "mobile_e164") private String mobileE164;
    @Column(name = "job_role") private String jobRole;
    @Column(name = "whatsapp_opt_in") private boolean whatsappOptIn;
    /** Masked PAN only (XXXXXX234F) plus its keyed hash; the full PAN is never stored (D-139). */
    @Column(name = "pan_masked") private String panMasked;
    @Column(name = "pan_hash") private String panHash;
    private String status;
    @Column(name = "status_reason") private String statusReason;
    @Column(name = "created_by") private UUID createdBy;
    @Column(name = "updated_by") private UUID updatedBy;
    @Column(name = "created_at") private Instant createdAt;
    @Column(name = "updated_at") private Instant updatedAt;
    @Version private int version;

    protected Employee() { }

    public Employee(UUID id, String firstName, String lastName, String email, String username, String mobileE164,
                    String jobRole, boolean whatsappOptIn, String panMasked, String panHash, UUID actor, Instant now) {
        this.panMasked = panMasked; this.panHash = panHash;
        this.id = id; this.firstName = firstName; this.lastName = lastName; this.email = email; this.username = username;
        this.mobileE164 = mobileE164; this.jobRole = jobRole; this.whatsappOptIn = whatsappOptIn;
        this.status = "PENDING_PROVISIONING"; this.createdBy = actor; this.updatedBy = actor; this.createdAt = now; this.updatedAt = now;
    }

    public void linkKeycloak(UUID keycloakUserId) { this.keycloakUserId = keycloakUserId; }

    public void setJobRole(String jobRole, UUID actor, Instant now) {
        this.jobRole = jobRole; this.updatedBy = actor; this.updatedAt = now;
    }

    public void setStatus(String status, String reason, UUID actor, Instant now) {
        this.status = status; this.statusReason = reason; this.updatedBy = actor; this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public UUID getKeycloakUserId() { return keycloakUserId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getUsername() { return username; }
    public String getJobRole() { return jobRole; }
    public String getStatus() { return status; }
    public String getStatusReason() { return statusReason; }
    public String getMobileE164() { return mobileE164; }
    public boolean isWhatsappOptIn() { return whatsappOptIn; }
    public String getPanMasked() { return panMasked; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public int getVersion() { return version; }
}
