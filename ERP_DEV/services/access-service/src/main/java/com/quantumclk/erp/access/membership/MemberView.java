package com.quantumclk.erp.access.membership;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * What the staff ERP sees of a Gold Membership registration (api.md "Memberships"). ID proof only as idType +
 * idNumberMasked (never the full number, D-131); address = street address, with city/state/pincode/country separate.
 * Members registered before V3 (registration form 1) have null ID and structured-address fields.
 */
public record MemberView(UUID id, String membershipId, String firstName, String lastName, LocalDate dob, String mobile,
                         String email, String address, String tier, String status, EnrolledBy enrolledBy,
                         String decidedBy, OffsetDateTime decidedAt, OffsetDateTime validFrom, OffsetDateTime validUntil,
                         String accountStatus, OffsetDateTime createdAt, Payment payment,
                         String idType, String idNumberMasked, String pincode, String city, String state, String country) {

    public record EnrolledBy(UUID employeeId, String name, String username) { }

    /** amount is a string with two decimals ("25000.00"): money never travels as a float (rules §1). */
    public record Payment(String type, String amount, String currency, String transactionId, Proof proof, String status,
                          String rejectionReason, String verifiedBy, OffsetDateTime decidedAt) { }

    public record Proof(String fileName, String contentType, long sizeBytes, String sha256) { }

    public record PageView(List<MemberView> items, int page, int size, long total, Long pendingCount) { }

    public record NextNumber(String membershipId, boolean provisional) { }

    /**
     * Memberships one executive brought in (D-140), for registrations created in the period. verifiedAmount: rupees as
     * a two-decimal string ("75000.00"), only payments an admin or manager verified.
     */
    public record ExecutiveMemberships(UUID employeeId, String username, String name, long enrolledCount, long activeCount,
                                       long pendingCount, long rejectedCount, String verifiedAmount) { }

    public record MembershipSummary(List<ExecutiveMemberships> executives, long enrolledCount, long activeCount,
                                    long pendingCount, String verifiedAmount, OffsetDateTime from, OffsetDateTime to) { }
}
