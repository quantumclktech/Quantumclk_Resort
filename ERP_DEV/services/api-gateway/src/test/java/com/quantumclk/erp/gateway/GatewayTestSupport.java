package com.quantumclk.erp.gateway;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.testcontainers.containers.GenericContainer;
import reactor.netty.DisposableServer;
import reactor.netty.http.server.HttpServer;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

/** Real Redis, a stub downstream service that echoes what it received, and a local signing key. */
@TestConfiguration(proxyBeanMethods = false)
public class GatewayTestSupport {

    static final String ISSUER = "http://test-keycloak/realms/gh-staff";
    static final RSAKey KEY = key();
    static final AtomicInteger DOWNSTREAM_HITS = new AtomicInteger();
    static final DisposableServer DOWNSTREAM = HttpServer.create().port(0)
            .handle((req, res) -> {
                DOWNSTREAM_HITS.incrementAndGet();
                String auth = req.requestHeaders().get("Authorization", "");
                String cid = req.requestHeaders().get("X-Correlation-Id", "");
                return res.header("Content-Type", "application/json")
                        .sendString(req.receive().aggregate().asString().defaultIfEmpty("").map(body ->
                                "{\"path\":\"" + req.uri() + "\",\"auth\":" + auth.startsWith("Bearer ")
                                        + ",\"correlationId\":\"" + cid + "\",\"bodyLength\":" + body.length() + "}"));
            }).bindNow();

    @Bean
    @ServiceConnection(name = "redis")
    GenericContainer<?> redis() {
        return new GenericContainer<>("redis:8.10.3").withExposedPorts(6379);
    }

    @Bean
    @Primary
    ReactiveJwtDecoder testJwtDecoder() throws Exception {
        NimbusReactiveJwtDecoder d = NimbusReactiveJwtDecoder.withPublicKey(KEY.toRSAPublicKey()).build();
        d.setJwtValidator(SecurityConfig.validator(ISSUER));
        return d;
    }

    static String token(String audience) {
        try {
            Instant now = Instant.now();
            JWTClaimsSet c = new JWTClaimsSet.Builder().issuer(ISSUER).subject(UUID.randomUUID().toString())
                    .audience(List.of(audience)).issueTime(Date.from(now)).expirationTime(Date.from(now.plusSeconds(300))).build();
            SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(KEY.getKeyID()).build(), c);
            jwt.sign(new RSASSASigner(KEY));
            return jwt.serialize();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static RSAKey key() {
        try {
            return new RSAKeyGenerator(2048).keyID("test").generate();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
