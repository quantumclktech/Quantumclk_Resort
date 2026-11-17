package com.quantumclk.erp.gateway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.assertj.core.api.Assertions.assertThat;

/** REQ-IAM-007 at the gateway; routing, CORS, correlation ids, size limit (ARCHITECTURE §2–3). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "erp.keycloak.issuer=" + GatewayTestSupport.ISSUER,
        "spring.data.redis.password=",
        "MAX_REQUEST_SIZE=1KB",
        "MAX_UPLOAD_SIZE=8KB"})
@AutoConfigureWebTestClient
@Import(GatewayTestSupport.class)
class GatewayRoutingTest {

    @DynamicPropertySource
    static void downstream(DynamicPropertyRegistry r) {
        r.add("ACCESS_SERVICE_URL", () -> "http://localhost:" + GatewayTestSupport.DOWNSTREAM.port());
        r.add("GUEST_SERVICE_URL", () -> "http://localhost:" + GatewayTestSupport.DOWNSTREAM.port());
    }

    @Autowired WebTestClient web;

    @BeforeEach
    void reset() {
        GatewayTestSupport.DOWNSTREAM_HITS.set(0);
    }

    @Test
    void noTokenIs401AtTheGatewayAndNeverReachesTheService() {
        web.get().uri("/api/v1/me").exchange()
                .expectStatus().isUnauthorized()
                .expectHeader().exists("X-Correlation-Id")
                .expectBody().jsonPath("$.code").isEqualTo("AUTH_REQUIRED");
        assertThat(GatewayTestSupport.DOWNSTREAM_HITS.get()).isZero();
    }

    @Test
    void wrongAudienceIs401() {
        web.get().uri("/api/v1/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + GatewayTestSupport.token("other-client"))
                .exchange().expectStatus().isUnauthorized();
        assertThat(GatewayTestSupport.DOWNSTREAM_HITS.get()).isZero();
    }

    @Test
    void validTokenIsRoutedWithTokenAndCorrelationId() {
        web.get().uri("/api/v1/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + GatewayTestSupport.token("erp-api"))
                .header("X-Correlation-Id", "trace-42").exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals("X-Correlation-Id", "trace-42")
                .expectBody()
                .jsonPath("$.path").isEqualTo("/api/v1/me")
                .jsonPath("$.auth").isEqualTo(true)
                .jsonPath("$.correlationId").isEqualTo("trace-42");
    }

    @Test
    void adminPathsAreRoutedToo() {
        web.get().uri("/api/v1/admin/employees").header(HttpHeaders.AUTHORIZATION, "Bearer " + GatewayTestSupport.token("erp-api"))
                .exchange().expectStatus().isOk().expectBody().jsonPath("$.path").isEqualTo("/api/v1/admin/employees");
    }

    @Test
    void unsafeCorrelationIdIsReplacedBeforeForwarding() {
        web.get().uri("/api/v1/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + GatewayTestSupport.token("erp-api"))
                .header("X-Correlation-Id", "<script>").exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.correlationId").value(id -> assertThat((String) id).matches("[0-9a-f-]{36}"));
    }

    @Test
    void unknownPathIs404() {
        web.get().uri("/api/v1/nothing-here").header(HttpHeaders.AUTHORIZATION, "Bearer " + GatewayTestSupport.token("erp-api"))
                .exchange().expectStatus().isNotFound();
    }

    @Test
    void oversizedBodyIsRejectedBeforeTheService() {
        web.post().uri("/api/v1/admin/employees").header(HttpHeaders.AUTHORIZATION, "Bearer " + GatewayTestSupport.token("erp-api"))
                .header(HttpHeaders.CONTENT_TYPE, "application/json").bodyValue("x".repeat(4096))
                .exchange().expectStatus().isEqualTo(413);
        assertThat(GatewayTestSupport.DOWNSTREAM_HITS.get()).isZero();
    }

    @Test
    void salesMembershipPathsAreRouted() {
        web.get().uri("/api/v1/sales/memberships").header(HttpHeaders.AUTHORIZATION, "Bearer " + GatewayTestSupport.token("erp-api"))
                .exchange().expectStatus().isOk().expectBody().jsonPath("$.path").isEqualTo("/api/v1/sales/memberships");
    }

    /** Gold Membership registration carries a payment screenshot: it alone gets the larger upload limit (S2). */
    @Test
    void membershipRegistrationAllowsTheUploadLimitButNotMore() {
        web.post().uri("/api/v1/sales/memberships").header(HttpHeaders.AUTHORIZATION, "Bearer " + GatewayTestSupport.token("erp-api"))
                .header(HttpHeaders.CONTENT_TYPE, "multipart/form-data; boundary=x").bodyValue("x".repeat(4096))
                .exchange().expectStatus().isOk();
        assertThat(GatewayTestSupport.DOWNSTREAM_HITS.get()).isEqualTo(1);
        web.post().uri("/api/v1/sales/memberships").header(HttpHeaders.AUTHORIZATION, "Bearer " + GatewayTestSupport.token("erp-api"))
                .header(HttpHeaders.CONTENT_TYPE, "multipart/form-data; boundary=x").bodyValue("x".repeat(9000))
                .exchange().expectStatus().isEqualTo(413);
        assertThat(GatewayTestSupport.DOWNSTREAM_HITS.get()).isEqualTo(1);
    }

    @Test
    void otherSalesPathsKeepTheSmallLimit() {
        web.post().uri("/api/v1/sales/memberships/123/anything").header(HttpHeaders.AUTHORIZATION, "Bearer " + GatewayTestSupport.token("erp-api"))
                .header(HttpHeaders.CONTENT_TYPE, "application/json").bodyValue("x".repeat(4096))
                .exchange().expectStatus().isEqualTo(413);
    }

    /**
     * Member pages (S4): the gateway forwards the member's token as is; access-service / guest-service check it
     * against realm gh-guests (the gateway keeps /api/v1/portal/** open for the anonymous inquiry form).
     */
    @Test
    void portalMembershipAndProfileAreRoutedWithTheMembersToken() {
        web.get().uri("/api/v1/portal/membership/me").header(HttpHeaders.AUTHORIZATION, "Bearer member-token").exchange()
                .expectStatus().isOk().expectBody()
                .jsonPath("$.path").isEqualTo("/api/v1/portal/membership/me").jsonPath("$.auth").isEqualTo(true);
        web.get().uri("/api/v1/portal/me").header(HttpHeaders.AUTHORIZATION, "Bearer member-token").exchange()
                .expectStatus().isOk().expectBody().jsonPath("$.path").isEqualTo("/api/v1/portal/me");
    }

    @Test
    void guestServiceInternalPathsAreNotExposed() {
        web.post().uri("/internal/guests/provision").header(HttpHeaders.AUTHORIZATION, "Bearer " + GatewayTestSupport.token("erp-api"))
                .exchange().expectStatus().isNotFound();
        assertThat(GatewayTestSupport.DOWNSTREAM_HITS.get()).isZero();
    }

    @Test
    void corsPreflightAllowsTheStaffAppAndRefusesOtherOrigins() {
        web.options().uri("/api/v1/me").header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET").header("Access-Control-Request-Headers", "Authorization")
                .exchange().expectStatus().isOk()
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://localhost:5173");
        web.options().uri("/api/v1/me").header("Origin", "https://evil.example")
                .header("Access-Control-Request-Method", "GET")
                .exchange().expectStatus().isForbidden();
    }

    @Test
    void healthIsPublic() {
        web.get().uri("/actuator/health").exchange().expectStatus().isOk();
    }
}
