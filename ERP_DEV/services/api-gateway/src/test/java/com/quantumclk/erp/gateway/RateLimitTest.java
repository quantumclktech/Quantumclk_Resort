package com.quantumclk.erp.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

/** Gateway rate limit (Blueprint §12.1), with a tiny bucket so the test is fast. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "erp.keycloak.issuer=" + GatewayTestSupport.ISSUER,
        "spring.data.redis.password=",
        "RATE_LIMIT_PER_SECOND=1", "RATE_LIMIT_BURST=3"})
@AutoConfigureWebTestClient
@Import(GatewayTestSupport.class)
class RateLimitTest {

    @DynamicPropertySource
    static void downstream(DynamicPropertyRegistry r) {
        r.add("ACCESS_SERVICE_URL", () -> "http://localhost:" + GatewayTestSupport.DOWNSTREAM.port());
    }

    @Autowired WebTestClient web;

    @Test
    void burstAboveTheLimitGets429() {
        String token = GatewayTestSupport.token("erp-api");
        long tooMany = IntStream.range(0, 10)
                .map(i -> web.get().uri("/api/v1/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .exchange().returnResult(String.class).getStatus().value())
                .filter(s -> s == 429).count();
        assertThat(tooMany).isGreaterThanOrEqualTo(5);
    }
}
