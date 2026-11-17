package com.quantumclk.erp.lead;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** D-137: executive lead performance is Sales Admin (ADMIN) only, even for roles holding leads.read_team. */
@WebMvcTest(SalesLeadController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "erp.keycloak.issuer=http://localhost/realms/gh-staff")
class SalesLeadSecurityTest {

    @Autowired MockMvc mvc;
    @MockitoBean LeadRepository leads;
    @MockitoBean JwtDecoder decoder;

    private static Jwt token(String role, String... permissions) {
        return Jwt.withTokenValue("t").header("alg", "none").subject("u").issuedAt(Instant.now())
                .claim("realm_access", Map.of("roles", List.of(role)))
                .claim("resource_access", Map.of(SecurityConfig.STAFF_AUDIENCE, Map.of("roles", List.of(permissions))))
                .build();
    }

    private static List<String> authorities(Jwt jwt) {
        return SecurityConfig.authenticationConverter().convert(jwt).getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).toList();
    }

    @Test
    void realmRolesAndPermissionsAreMapped() {
        assertThat(authorities(token("ADMIN", "leads.read_team"))).contains("ROLE_ADMIN", "PERM_leads.read_team");
    }

    @Test
    void salesAdminCanReadTheSummary() throws Exception {
        when(leads.executiveStats(any(), any())).thenReturn(List.of());
        Jwt t = token("ADMIN", "leads.read_team");
        mvc.perform(get("/api/v1/sales/leads/summary").with(jwt().jwt(t).authorities(SecurityConfig.authenticationConverter().convert(t).getAuthorities())))
                .andExpect(status().isOk());
    }

    @Test
    void managerAndSalesExecutiveAreForbidden() throws Exception {
        for (Jwt t : List.of(token("MANAGER", "leads.read_team"), token("SALES_EXECUTIVE", "leads.read_queue"))) {
            mvc.perform(get("/api/v1/sales/leads/summary").with(jwt().jwt(t).authorities(SecurityConfig.authenticationConverter().convert(t).getAuthorities())))
                    .andExpect(status().isForbidden());
            mvc.perform(get("/api/v1/sales/leads").param("assignedTo", "rohan")
                            .with(jwt().jwt(t).authorities(SecurityConfig.authenticationConverter().convert(t).getAuthorities())))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void noTokenIs401() throws Exception {
        mvc.perform(get("/api/v1/sales/leads/summary")).andExpect(status().isUnauthorized());
    }
}
