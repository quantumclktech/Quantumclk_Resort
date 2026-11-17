package com.quantumclk.erp.lead;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Controller logic (no security; see SalesLeadSecurityTest). */
@ExtendWith(MockitoExtension.class)
class SalesLeadControllerTest {

    private MockMvc mvc;

    @Mock
    private LeadRepository leadRepository;

    @InjectMocks
    private SalesLeadController controller;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    static Lead lead(String ref, LeadStatus status, String claimedBy) {
        Lead lead = new Lead();
        lead.setId(UUID.randomUUID());
        lead.setPublicReference(ref);
        lead.setName("Test Guest");
        lead.setEmail("guest@example.com");
        lead.setPhone("+919876543210");
        lead.setCheckinDate(LocalDate.now());
        lead.setCheckoutDate(LocalDate.now().plusDays(2));
        lead.setRoomCategory("Poolside Villa");
        lead.setStatus(status);
        lead.setClaimedBy(claimedBy);
        lead.setCreatedAt(OffsetDateTime.now());
        lead.setUpdatedAt(OffsetDateTime.now());
        return lead;
    }

    @Test
    void listWithoutFiltersReturnsAllTime() throws Exception {
        when(leadRepository.findCreatedBetween(SalesLeadController.BEGINNING, SalesLeadController.END))
                .thenReturn(List.of(lead("GH-INQ-2026-0099", LeadStatus.IN_PROGRESS, "rohan")));

        mvc.perform(get("/api/v1/sales/leads"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].publicReference").value("GH-INQ-2026-0099"))
                .andExpect(jsonPath("$[0].claimedBy").value("rohan"));
    }

    @Test
    void listForOneExecutiveFiltersByPeriodAndStatus() throws Exception {
        OffsetDateTime from = OffsetDateTime.parse("2026-11-01T00:00:00+05:30");
        OffsetDateTime to = OffsetDateTime.parse("2026-12-01T00:00:00+05:30");
        when(leadRepository.findByExecutive(eq("rohan"), eq(from), eq(to))).thenReturn(List.of(
                lead("A", LeadStatus.CONVERTED, "rohan"), lead("B", LeadStatus.LOST, "rohan")));

        mvc.perform(get("/api/v1/sales/leads").param("assignedTo", " rohan ").param("status", "CONVERTED")
                        .param("from", "2026-11-01T00:00:00+05:30").param("to", "2026-12-01T00:00:00+05:30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].publicReference").value("A"));
    }

    @Test
    void summaryReturnsRatesResponseTimesAndUnclaimed() throws Exception {
        when(leadRepository.executiveStats(any(), any())).thenReturn(List.of(
                new Object[]{"rohan", 5L, 2L, 2L, 1L, new BigDecimal("42.36")},
                new Object[]{"anita", 3L, 0L, 3L, 0L, null},
                new Object[]{"zero", 0L, 0L, 0L, 0L, null}));
        when(leadRepository.countUnclaimed(any(), any())).thenReturn(4L);

        mvc.perform(get("/api/v1/sales/leads/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unclaimedCount").value(4))
                .andExpect(jsonPath("$.executives[0].username").value("anita"))   // sorted by username
                .andExpect(jsonPath("$.executives[0].conversionRate").value(1.0))
                .andExpect(jsonPath("$.executives[0].avgFirstResponseMinutes").doesNotExist())
                .andExpect(jsonPath("$.executives[1].username").value("rohan"))
                .andExpect(jsonPath("$.executives[1].attendedCount").value(5))
                .andExpect(jsonPath("$.executives[1].inProgressCount").value(2))
                .andExpect(jsonPath("$.executives[1].convertedCount").value(2))
                .andExpect(jsonPath("$.executives[1].lostCount").value(1))
                .andExpect(jsonPath("$.executives[1].conversionRate").value(0.4))
                .andExpect(jsonPath("$.executives[1].avgFirstResponseMinutes").value(42.4))
                .andExpect(jsonPath("$.executives[2].conversionRate").value(0.0));
    }

    @Test
    void summaryPassesThePeriodToTheQueries() throws Exception {
        OffsetDateTime from = OffsetDateTime.parse("2026-11-10T00:00:00+05:30");
        when(leadRepository.executiveStats(from, SalesLeadController.END)).thenReturn(List.of());

        mvc.perform(get("/api/v1/sales/leads/summary").param("from", "2026-11-10T00:00:00+05:30"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.executives", hasSize(0)));
        verify(leadRepository).countUnclaimed(from, SalesLeadController.END);
    }
}
