package com.quantumclk.erp.lead;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class SalesDtos {

    public record LeadDetailDto(
        UUID id,
        String publicReference,
        String name,
        String email,
        String phone,
        LocalDate checkinDate,
        LocalDate checkoutDate,
        String roomCategory,
        int guestCount,
        String notes,
        LeadStatus status,
        String priority,
        String assignedTo,
        String claimedBy,
        OffsetDateTime claimedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
    ) {
        public static LeadDetailDto of(Lead l) {
            return new LeadDetailDto(
                l.getId(),
                l.getPublicReference(),
                l.getName(),
                l.getEmail(),
                l.getPhone(),
                l.getCheckinDate(),
                l.getCheckoutDate(),
                l.getRoomCategory(),
                l.getGuestCount(),
                l.getNotes(),
                l.getStatus(),
                l.getPriority(),
                l.getAssignedTo(),
                l.getClaimedBy(),
                l.getClaimedAt(),
                l.getCreatedAt(),
                l.getUpdatedAt()
            );
        }
    }

    /** One executive's lead performance; conversionRate is converted / attended (0..1). */
    public record ExecutiveSummaryDto(
        String username,
        long attendedCount,
        long inProgressCount,
        long convertedCount,
        long lostCount,
        double conversionRate,
        Double avgFirstResponseMinutes
    ) {}

    /** GET /summary: every executive with leads in the period, plus new leads nobody has claimed. */
    public record TeamSummaryDto(
        java.util.List<ExecutiveSummaryDto> executives,
        long unclaimedCount,
        OffsetDateTime from,
        OffsetDateTime to
    ) {}
}
