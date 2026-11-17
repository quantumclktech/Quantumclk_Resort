package com.quantumclk.erp.lead;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface LeadRepository extends JpaRepository<Lead, UUID> {

    /** All leads created in [from, to), newest first. */
    @Query("SELECT l FROM Lead l WHERE l.createdAt >= :from AND l.createdAt < :to ORDER BY l.createdAt DESC")
    List<Lead> findCreatedBetween(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    /** One executive's leads (claimed or assigned) created in [from, to), newest first. */
    @Query("SELECT l FROM Lead l WHERE (l.claimedBy = :username OR l.assignedTo = :username)"
            + " AND l.createdAt >= :from AND l.createdAt < :to ORDER BY l.createdAt DESC")
    List<Lead> findByExecutive(@Param("username") String username,
                               @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    /**
     * Per executive, for leads created in [from, to): attended, in progress, converted, lost, and the average
     * minutes from the lead arriving to the executive claiming it (D-137). Aggregated in PostgreSQL.
     */
    @Query(nativeQuery = true, value = """
            SELECT claimed_by,
                   COUNT(*),
                   COUNT(*) FILTER (WHERE status = 'IN_PROGRESS'),
                   COUNT(*) FILTER (WHERE status = 'CONVERTED'),
                   COUNT(*) FILTER (WHERE status = 'LOST'),
                   AVG(EXTRACT(EPOCH FROM (claimed_at - created_at)) / 60.0) FILTER (WHERE claimed_at IS NOT NULL)
              FROM lead
             WHERE claimed_by IS NOT NULL AND created_at >= :from AND created_at < :to
             GROUP BY claimed_by""")
    List<Object[]> executiveStats(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    /** New leads nobody has claimed yet, created in [from, to). */
    @Query("SELECT COUNT(l) FROM Lead l WHERE l.claimedBy IS NULL AND l.status = com.quantumclk.erp.lead.LeadStatus.NEW"
            + " AND l.createdAt >= :from AND l.createdAt < :to")
    long countUnclaimed(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);
}
