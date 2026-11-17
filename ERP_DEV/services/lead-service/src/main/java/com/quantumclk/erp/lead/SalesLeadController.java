package com.quantumclk.erp.lead;

import com.quantumclk.erp.lead.SalesDtos.ExecutiveSummaryDto;
import com.quantumclk.erp.lead.SalesDtos.LeadDetailDto;
import com.quantumclk.erp.lead.SalesDtos.TeamSummaryDto;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

/** Sales Admin's view of executive lead performance (D-137). Sales Admin (ADMIN) only. */
@RestController
@RequestMapping("/api/v1/sales/leads")
@PreAuthorize("hasRole('ADMIN')")
public class SalesLeadController {

    /** Open ends of the period ("all time"). */
    static final OffsetDateTime BEGINNING = OffsetDateTime.of(2000, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
    static final OffsetDateTime END = OffsetDateTime.of(9999, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);

    private final LeadRepository leads;

    public SalesLeadController(LeadRepository leads) {
        this.leads = leads;
    }

    /** Leads created in [from, to), optionally for one executive and one status. */
    @GetMapping
    public List<LeadDetailDto> listLeads(
            @RequestParam(name = "assignedTo", required = false) String assignedTo,
            @RequestParam(name = "status", required = false) LeadStatus status,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        OffsetDateTime f = from != null ? from : BEGINNING;
        OffsetDateTime t = to != null ? to : END;
        List<Lead> found = assignedTo != null && !assignedTo.isBlank()
                ? leads.findByExecutive(assignedTo.trim(), f, t)
                : leads.findCreatedBetween(f, t);
        return found.stream().filter(l -> status == null || l.getStatus() == status).map(LeadDetailDto::of).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadDetailDto> getLead(@PathVariable("id") UUID id) {
        return leads.findById(id).map(l -> ResponseEntity.ok(LeadDetailDto.of(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** Per-executive performance plus the team's unclaimed leads, for leads created in [from, to). */
    @GetMapping("/summary")
    public TeamSummaryDto getExecutiveSummary(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        OffsetDateTime f = from != null ? from : BEGINNING;
        OffsetDateTime t = to != null ? to : END;
        List<ExecutiveSummaryDto> executives = leads.executiveStats(f, t).stream().map(SalesLeadController::toSummary)
                .sorted(Comparator.comparing(ExecutiveSummaryDto::username)).toList();
        return new TeamSummaryDto(executives, leads.countUnclaimed(f, t), from, to);
    }

    static ExecutiveSummaryDto toSummary(Object[] r) {
        long attended = num(r[1]);
        long inProgress = num(r[2]);
        long converted = num(r[3]);
        long lost = num(r[4]);
        Double avgMinutes = r[5] == null ? null : Math.round(((Number) r[5]).doubleValue() * 10) / 10.0;
        double rate = attended == 0 ? 0 : Math.round(converted * 1000.0 / attended) / 1000.0;
        return new ExecutiveSummaryDto((String) r[0], attended, inProgress, converted, lost, rate, avgMinutes);
    }

    private static long num(Object o) {
        return o == null ? 0 : ((Number) o).longValue();
    }
}
