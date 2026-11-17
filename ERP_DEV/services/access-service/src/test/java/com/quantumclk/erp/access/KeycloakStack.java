package com.quantumclk.erp.access;

import com.quantumclk.erp.access.employee.AccountJobs;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.MountableFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Real Keycloak 26.8.2 (importing infra/keycloak/gh-staff-realm.json), Mailpit and PostgreSQL, shared by the IT-style tests. */
@SpringBootTest(properties = "erp.keycloak.issuer=" + TestSupport.ISSUER)
@AutoConfigureMockMvc
@Import(TestSupport.class)
abstract class KeycloakStack {

    static final Network NET = Network.newNetwork();
    static final GenericContainer<?> MAILPIT = new GenericContainer<>("axllent/mailpit:v1.33.1")
            .withNetwork(NET).withNetworkAliases("mailpit").withExposedPorts(8025);
    static final GenericContainer<?> KEYCLOAK = new GenericContainer<>("quay.io/keycloak/keycloak:26.8.2")
            .withNetwork(NET).withCommand("start-dev", "--import-realm")
            .withCopyFileToContainer(MountableFile.forHostPath(Path.of("../../infra/keycloak/gh-staff-realm.json")),
                    "/opt/keycloak/data/import/gh-staff-realm.json")
            .withEnv("KC_BOOTSTRAP_ADMIN_USERNAME", "kcadmin").withEnv("KC_BOOTSTRAP_ADMIN_PASSWORD", "kcadmin-test")
            .withEnv("KC_HEALTH_ENABLED", "true").withEnv("KC_ACCESS_SERVICE_CLIENT_SECRET", "test-secret")
            .withEnv("ERP_WEB_ORIGIN", "http://localhost:5173")
            .withEnv("SMTP_HOST", "mailpit").withEnv("SMTP_PORT", "1025").withEnv("SMTP_FROM", "no-reply@goldenhills.test")
            .withEnv("SMTP_REPLY_TO", "").withEnv("SMTP_AUTH", "false").withEnv("SMTP_STARTTLS", "false")
            .withEnv("SMTP_USER", "").withEnv("SMTP_PASSWORD", "")
            .withExposedPorts(8080, 9000)
            .waitingFor(Wait.forHttp("/health/ready").forPort(9000).withStartupTimeout(Duration.ofMinutes(3)));

    static {
        MAILPIT.start();
        KEYCLOAK.start();
    }

    @DynamicPropertySource
    static void keycloak(DynamicPropertyRegistry r) {
        r.add("erp.keycloak.url", () -> "http://" + KEYCLOAK.getHost() + ":" + KEYCLOAK.getMappedPort(8080));
    }

    static final UUID ADMIN = UUID.randomUUID();
    static final JsonMapper JSON = JsonMapper.builder().build();
    static final HttpClient HTTP = HttpClient.newHttpClient();

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired AccountJobs jobs;

    static String token(List<String> roles, List<String> perms) {
        return "Bearer " + TestSupport.sign(TestSupport.claims(ADMIN, roles, perms).build());
    }

    static final String ADMIN_TOKEN = token(List.of("ADMIN"), List.of("employees.read", "employees.manage", "roles.assign", "audit.read"));

    static String mailpit() {
        return "http://" + MAILPIT.getHost() + ":" + MAILPIT.getMappedPort(8025);
    }

    static JsonNode admin(String method, String path, String body) throws Exception {
        String base = "http://" + KEYCLOAK.getHost() + ":" + KEYCLOAK.getMappedPort(8080);
        String t = JSON.readTree(send(HttpRequest.newBuilder(URI.create(base + "/realms/master/protocol/openid-connect/token"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString("grant_type=password&client_id=admin-cli&username=kcadmin&password=kcadmin-test")).build()))
                .get("access_token").asString();
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(base + "/admin/realms/gh-staff" + path)).header("Authorization", "Bearer " + t)
                .header("Content-Type", "application/json");
        String out = send(body == null ? b.GET().build() : b.method(method, HttpRequest.BodyPublishers.ofString(body)).build());
        return out.isBlank() ? null : JSON.readTree(out);
    }

    static String send(HttpRequest r) throws Exception {
        return HTTP.send(r, HttpResponse.BodyHandlers.ofString()).body();
    }
}
