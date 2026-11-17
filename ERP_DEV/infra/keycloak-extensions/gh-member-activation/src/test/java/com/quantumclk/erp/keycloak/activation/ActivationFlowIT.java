package com.quantumclk.erp.keycloak.activation;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.MountableFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.jar.JarEntry;
import java.util.jar.JarOutputStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The spike for D-122 (inc-membership-PLAN S3): real Keycloak 26.8.2 with this extension, the real gh-guests realm
 * file and a real SMTP catcher. Proves that a new member, from the welcome email, sets a password ONCE and gets an
 * authorization code right away — i.e. arrives signed in on the landing page with PKCE, no second login.
 */
class ActivationFlowIT {

    static final String LANDING = "http://localhost:3000";
    static final String SECRET = "guest-service-test-secret";
    static final JsonMapper JSON = JsonMapper.builder().build();
    static final Network NET = Network.newNetwork();

    static GenericContainer<?> mailpit;
    static GenericContainer<?> keycloak;
    static String kc;
    static String mail;

    @BeforeAll
    static void start() throws IOException {
        Path jar = providerJar();
        mailpit = new GenericContainer<>("axllent/mailpit:v1.33.1").withNetwork(NET).withNetworkAliases("mailpit").withExposedPorts(8025);
        keycloak = new GenericContainer<>("quay.io/keycloak/keycloak:26.8.2")
                .withNetwork(NET).withCommand("start-dev", "--import-realm")
                .withCopyFileToContainer(MountableFile.forHostPath(Path.of("../../keycloak/gh-guests-realm.json")), "/opt/keycloak/data/import/gh-guests-realm.json")
                .withCopyFileToContainer(MountableFile.forHostPath(jar), "/opt/keycloak/providers/gh-member-activation.jar")
                .withEnv("KC_BOOTSTRAP_ADMIN_USERNAME", "kcadmin").withEnv("KC_BOOTSTRAP_ADMIN_PASSWORD", "kcadmin-test")
                .withEnv("KC_HEALTH_ENABLED", "true")
                .withEnv("KC_GUEST_SERVICE_CLIENT_SECRET", SECRET).withEnv("LANDING_PUBLIC_URL", LANDING)
                .withEnv("SMTP_HOST", "mailpit").withEnv("SMTP_PORT", "1025").withEnv("SMTP_FROM", "no-reply@goldenhills.test")
                .withEnv("SMTP_REPLY_TO", "").withEnv("SMTP_AUTH", "false").withEnv("SMTP_STARTTLS", "false")
                .withEnv("SMTP_USER", "").withEnv("SMTP_PASSWORD", "")
                .withExposedPorts(8080, 9000)
                .waitingFor(Wait.forHttp("/health/ready").forPort(9000).withStartupTimeout(Duration.ofMinutes(4)));
        mailpit.start();
        keycloak.start();
        kc = "http://" + keycloak.getHost() + ":" + keycloak.getMappedPort(8080);
        mail = "http://" + mailpit.getHost() + ":" + mailpit.getMappedPort(8025);
    }

    /** The extension as Keycloak loads it: target/classes zipped into a jar (no packaging plugin needed for tests). */
    static Path providerJar() throws IOException {
        Path classes = Path.of("target/classes");
        Path jar = Files.createTempFile("gh-member-activation", ".jar");
        try (OutputStream os = Files.newOutputStream(jar); JarOutputStream out = new JarOutputStream(os);
             Stream<Path> files = Files.walk(classes)) {
            for (Path p : files.filter(Files::isRegularFile).toList()) {
                out.putNextEntry(new JarEntry(classes.relativize(p).toString().replace('\\', '/')));
                Files.copy(p, out);
                out.closeEntry();
            }
        }
        return jar;
    }

    // --- HTTP helpers ------------------------------------------------------------------------------------------------

    static HttpClient browser() {
        return HttpClient.newBuilder().cookieHandler(new LocalhostCookies()).followRedirects(HttpClient.Redirect.NEVER).build();
    }

    /**
     * Keycloak marks its login cookies Secure. Browsers still send Secure cookies to http://localhost (a secure
     * context); java.net.CookieManager does not. This jar behaves like a browser on localhost: name=value per path.
     */
    static class LocalhostCookies extends java.net.CookieHandler {
        private final Map<String, String[]> jar = new java.util.concurrent.ConcurrentHashMap<>();   // name -> {value, path}

        @Override
        public Map<String, List<String>> get(URI uri, Map<String, List<String>> headers) {
            String path = uri.getPath() == null ? "/" : uri.getPath();
            String cookie = jar.entrySet().stream().filter(e -> path.startsWith(e.getValue()[1]))
                    .map(e -> e.getKey() + "=" + e.getValue()[0]).collect(Collectors.joining("; "));
            return cookie.isEmpty() ? Map.of() : Map.of("Cookie", List.of(cookie));
        }

        @Override
        public void put(URI uri, Map<String, List<String>> headers) {
            headers.entrySet().stream().filter(e -> "Set-Cookie".equalsIgnoreCase(e.getKey())).flatMap(e -> e.getValue().stream()).forEach(h -> {
                String[] parts = h.split(";");
                String[] nv = parts[0].split("=", 2);
                String path = "/";
                boolean expired = false;
                for (String a : parts) {
                    String t = a.strip();
                    if (t.regionMatches(true, 0, "Path=", 0, 5)) path = t.substring(5);
                    if (t.equalsIgnoreCase("Max-Age=0") || t.regionMatches(true, 0, "Expires=Thu, 01-Jan-1970", 0, 25)) expired = true;
                }
                if (expired || nv.length < 2 || nv[1].isEmpty()) jar.remove(nv[0].strip());
                else jar.put(nv[0].strip(), new String[]{nv[1].strip(), path});
            });
        }
    }

    static HttpResponse<String> send(HttpClient c, HttpRequest r) throws Exception {
        return c.send(r, HttpResponse.BodyHandlers.ofString());
    }

    static String form(Map<String, String> m) {
        return m.entrySet().stream().map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
    }

    static JsonNode postForm(String url, Map<String, String> m) throws Exception {
        HttpResponse<String> r = send(HttpClient.newHttpClient(), HttpRequest.newBuilder(URI.create(url))
                .header("Content-Type", "application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(form(m))).build());
        assertThat(r.statusCode()).as(r.body()).isEqualTo(200);
        return JSON.readTree(r.body());
    }

    static String serviceToken() throws Exception {
        return postForm(kc + "/realms/gh-guests/protocol/openid-connect/token",
                Map.of("grant_type", "client_credentials", "client_id", "guest-service", "client_secret", SECRET)).get("access_token").asString();
    }

    static String adminToken() throws Exception {
        return postForm(kc + "/realms/master/protocol/openid-connect/token",
                Map.of("grant_type", "password", "client_id", "admin-cli", "username", "kcadmin", "password", "kcadmin-test")).get("access_token").asString();
    }

    static HttpResponse<String> json(String method, String url, String token, Object body) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(url)).header("Content-Type", "application/json");
        if (token != null) b.header("Authorization", "Bearer " + token);
        b.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
        return send(HttpClient.newHttpClient(), b.build());
    }

    /** What guest-service will do on verification: create the member (no password) with their membership ID. */
    static String createMember(String token, String email) throws Exception {
        HttpResponse<String> r = json("POST", kc + "/admin/realms/gh-guests/users", token, Map.of(
                "username", email, "email", email, "firstName", "Rohan", "lastName", "Sharma", "enabled", true,
                "emailVerified", false, "requiredActions", List.of("UPDATE_PASSWORD"),
                "attributes", Map.of("membershipId", List.of("GRH-LM-0101"))));
        assertThat(r.statusCode()).as(r.body()).isEqualTo(201);
        String loc = r.headers().firstValue("Location").orElseThrow();
        return loc.substring(loc.lastIndexOf('/') + 1);
    }

    static HttpResponse<String> sendWelcome(String token, String userId, String activateUrl) throws Exception {
        return json("POST", kc + "/realms/gh-guests/gh-activation/users/" + userId + "/send", token,
                Map.of("activateUrl", activateUrl, "validUntil", "16 Nov 2027"));
    }

    /** The newest email to this address, as Mailpit stores it. */
    static JsonNode latestMailTo(String email) throws Exception {
        for (int i = 0; i < 50; i++) {
            HttpResponse<String> r = send(HttpClient.newHttpClient(), HttpRequest.newBuilder(
                    URI.create(mail + "/api/v1/search?query=" + URLEncoder.encode("to:" + email, StandardCharsets.UTF_8))).build());
            JsonNode list = JSON.readTree(r.body()).get("messages");
            if (list != null && !list.isEmpty()) {
                String id = list.get(0).get("ID").asString();
                return JSON.readTree(send(HttpClient.newHttpClient(), HttpRequest.newBuilder(URI.create(mail + "/api/v1/message/" + id)).build()).body());
            }
            Thread.sleep(200);
        }
        throw new AssertionError("no email to " + email);
    }

    static String activationTokenFrom(JsonNode message) {
        Matcher m = Pattern.compile(Pattern.quote(LANDING + "/member/activate?t=") + "([A-Za-z0-9._%-]+)").matcher(message.get("Text").asString());
        assertThat(m.find()).as("link in text body").isTrue();
        return URLDecoder.decode(m.group(1), StandardCharsets.US_ASCII);
    }

    record Pkce(String verifier, String challenge) {
        static Pkce create() throws Exception {
            byte[] b = new byte[32];
            new SecureRandom().nextBytes(b);
            String v = Base64.getUrlEncoder().withoutPadding().encodeToString(b);
            String c = Base64.getUrlEncoder().withoutPadding().encodeToString(MessageDigest.getInstance("SHA-256").digest(v.getBytes(StandardCharsets.US_ASCII)));
            return new Pkce(v, c);
        }
    }

    /** The landing page's /member/activate: a normal PKCE authorization request plus activation_token. */
    static HttpResponse<String> authorize(HttpClient browser, Pkce pkce, String activationToken) throws Exception {
        Map<String, String> q = new LinkedHashMap<>();
        q.put("client_id", "guest-web");
        q.put("redirect_uri", LANDING + "/membership");
        q.put("response_type", "code");
        q.put("scope", "openid");
        q.put("state", UUID.randomUUID().toString());
        q.put("code_challenge", pkce.challenge());
        q.put("code_challenge_method", "S256");
        if (activationToken != null) q.put("activation_token", activationToken);
        return follow(browser, send(browser, HttpRequest.newBuilder(URI.create(kc + "/realms/gh-guests/protocol/openid-connect/auth?" + form(q))).GET().build()));
    }

    /** Follows redirects that stay on Keycloak (as a browser would); stops at a page or at the landing page. */
    static HttpResponse<String> follow(HttpClient browser, HttpResponse<String> r) throws Exception {
        for (int i = 0; i < 5 && r.statusCode() == 302; i++) {
            String loc = r.headers().firstValue("Location").orElseThrow();
            if (!loc.startsWith(kc)) return r;
            r = send(browser, HttpRequest.newBuilder(URI.create(loc)).GET().build());
        }
        return r;
    }

    static String formAction(String html, String formId) {
        Matcher m = Pattern.compile("<form[^>]*id=\"" + formId + "\"[^>]*action=\"([^\"]+)\"|<form[^>]*action=\"([^\"]+)\"[^>]*id=\"" + formId + "\"").matcher(html);
        assertThat(m.find()).as("form " + formId).isTrue();
        return (m.group(1) != null ? m.group(1) : m.group(2)).replace("&amp;", "&");
    }

    static Map<String, String> query(String location) {
        return Stream.of(URI.create(location).getRawQuery().split("&")).map(s -> s.split("=", 2))
                .collect(Collectors.toMap(a -> a[0], a -> URLDecoder.decode(a.length > 1 ? a[1] : "", StandardCharsets.UTF_8)));
    }

    static JsonNode claims(String jwt) {
        return JSON.readTree(new String(Base64.getUrlDecoder().decode(jwt.split("\\.")[1]), StandardCharsets.UTF_8));
    }

    /**
     * "Keep me signed in" (D-127): Keycloak's session cookie has a lifetime, so it survives closing the browser.
     * Without remember-me Keycloak sends KEYCLOAK_IDENTITY as a browser-session cookie (no Max-Age).
     */
    static void assertStaysSignedInAfterBrowserCloses(HttpResponse<String> r) {
        String identity = r.headers().allValues("Set-Cookie").stream().filter(h -> h.startsWith("KEYCLOAK_IDENTITY="))
                .findFirst().orElseThrow(() -> new AssertionError("no KEYCLOAK_IDENTITY cookie"));
        Matcher m = Pattern.compile("(?i)Max-Age=(\\d+)").matcher(identity);
        assertThat(m.find()).as("persistent session cookie: " + identity).isTrue();
        assertThat(Long.parseLong(m.group(1))).as("lifetime in seconds").isGreaterThan(7L * 24 * 3600);
    }

    /** Sign-in events Keycloak stored in its database for this user (realm eventsEnabled). */
    static List<String> storedEvents(String userId) throws Exception {
        JsonNode events = JSON.readTree(json("GET", kc + "/admin/realms/gh-guests/events?user=" + userId, adminToken(), null).body());
        return events.valueStream().map(e -> e.get("type").asString()).toList();
    }

    // --- Tests ---------------------------------------------------------------------------------------------------------

    @Test
    void welcomeLinkSetsPasswordOnceAndArrivesSignedIn() throws Exception {
        String svc = serviceToken();
        String email = "rohan." + UUID.randomUUID().toString().substring(0, 8) + "@example.test";
        String userId = createMember(svc, email);

        HttpResponse<String> sent = sendWelcome(svc, userId, LANDING + "/member/activate");
        assertThat(sent.statusCode()).as(sent.body()).isEqualTo(200);

        JsonNode message = latestMailTo(email);
        assertThat(message.get("Subject").asString()).isEqualTo("Welcome to the Golden Hills Privilege Club");
        assertThat(message.get("HTML").asString()).contains("GRH-LM-0101").contains("16 Nov 2027").doesNotContain("assword:");
        String token = activationTokenFrom(message);

        // 1. Link opened: Keycloak goes straight to "set your password" (no username/password form, no second login).
        HttpClient browser = browser();
        Pkce pkce = Pkce.create();
        HttpResponse<String> page = authorize(browser, pkce, token);
        assertThat(page.statusCode()).isEqualTo(200);
        assertThat(page.body()).contains("password-new").doesNotContain("id=\"kc-form-login\"");

        // 2. Password set once -> redirect to the landing page with an authorization code.
        String action = formAction(page.body(), "kc-passwd-update-form");
        HttpResponse<String> done = send(browser, HttpRequest.newBuilder(URI.create(action.startsWith("http") ? action : kc + action))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form(Map.of("password-new", "Golden-Hills-2026!", "password-confirm", "Golden-Hills-2026!")))).build());
        assertThat(done.statusCode()).as(done.body()).isEqualTo(302);
        String location = done.headers().firstValue("Location").orElseThrow();
        assertThat(location).startsWith(LANDING + "/membership");
        String code = query(location).get("code");
        assertThat(code).isNotBlank();
        // ...and stays signed in after closing the browser (remember-me session from the welcome link, D-127).
        assertStaysSignedInAfterBrowserCloses(done);

        // 3. The landing page exchanges the code with its PKCE verifier: signed in as this member.
        JsonNode tokens = postForm(kc + "/realms/gh-guests/protocol/openid-connect/token", Map.of(
                "grant_type", "authorization_code", "client_id", "guest-web", "code", code,
                "redirect_uri", LANDING + "/membership", "code_verifier", pkce.verifier()));
        JsonNode at = claims(tokens.get("access_token").asString());
        assertThat(at.get("sub").asString()).isEqualTo(userId);
        assertThat(at.get("email_verified").asBoolean()).isTrue();
        assertThat(at.get("aud").toString()).contains("guest-api");
        assertThat(tokens.get("refresh_token").asString()).isNotBlank();

        // 4. The same link again: single use, so it is the normal sign-in page now.
        HttpResponse<String> again = authorize(browser(), Pkce.create(), token);
        assertThat(again.statusCode()).isEqualTo(200);
        assertThat(again.body()).contains("kc-form-login").doesNotContain("password-new");

        // 5. And the password works for a normal sign-in later (proves it was really set).
        HttpClient later = browser();
        HttpResponse<String> login = authorize(later, Pkce.create(), null);
        // The Golden Hills page has "Keep me signed in", ticked by default by the theme script.
        assertThat(login.body()).contains("id=\"rememberMe\"").contains("keep-signed-in.js").contains("Keep me signed in");
        String loginAction = formAction(login.body(), "kc-form-login");
        HttpResponse<String> signedIn = send(later, HttpRequest.newBuilder(URI.create(loginAction))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form(Map.of("username", email, "password", "Golden-Hills-2026!", "rememberMe", "on")))).build());
        assertThat(signedIn.statusCode()).isEqualTo(302);
        assertThat(signedIn.headers().firstValue("Location").orElseThrow()).contains("code=");
        assertStaysSignedInAfterBrowserCloses(signedIn);

        // 6. A wrong password is refused, and every sign-in and failure is kept in Keycloak's database.
        HttpClient wrong = browser();
        HttpResponse<String> retry = authorize(wrong, Pkce.create(), null);
        HttpResponse<String> refused = send(wrong, HttpRequest.newBuilder(URI.create(formAction(retry.body(), "kc-form-login")))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form(Map.of("username", email, "password", "not-the-password")))).build());
        assertThat(refused.statusCode()).isEqualTo(200);
        assertThat(refused.body()).contains("kc-form-login");
        assertThat(storedEvents(userId)).contains("LOGIN", "UPDATE_PASSWORD", "LOGIN_ERROR");
    }

    @Test
    void aForgedOrReplacedTokenOnlyShowsTheNormalSignIn() throws Exception {
        String svc = serviceToken();
        String email = "asha." + UUID.randomUUID().toString().substring(0, 8) + "@example.test";
        String userId = createMember(svc, email);
        assertThat(sendWelcome(svc, userId, LANDING + "/member/activate").statusCode()).isEqualTo(200);
        String first = activationTokenFrom(latestMailTo(email));

        // Forged secret for a real user
        HttpResponse<String> forged = authorize(browser(), Pkce.create(), userId + "." + "A".repeat(43));
        assertThat(forged.body()).contains("kc-form-login").doesNotContain("password-new");

        // Resend replaces the old link
        Thread.sleep(1100);
        assertThat(sendWelcome(svc, userId, LANDING + "/member/activate").statusCode()).isEqualTo(200);
        HttpResponse<String> old = authorize(browser(), Pkce.create(), first);
        assertThat(old.body()).contains("kc-form-login").doesNotContain("password-new");
    }

    /**
     * The landing page checks for a Keycloak session on every page load (keycloak-js check-sso in a hidden frame that
     * returns to /silent-check-sso.html). If Keycloak refuses that address, keycloak-js waits forever: members look
     * signed out after leaving the site and "Sign in" never opens the password page (found live, D-130).
     */
    @Test
    void theSilentSessionCheckPageIsAllowedAndNothingNextToIt() throws Exception {
        Map<String, String> q = new LinkedHashMap<>();
        q.put("client_id", "guest-web");
        q.put("redirect_uri", LANDING + "/silent-check-sso.html");
        q.put("response_type", "code");
        q.put("scope", "openid");
        q.put("prompt", "none");
        q.put("state", UUID.randomUUID().toString());
        Pkce pkce = Pkce.create();
        q.put("code_challenge", pkce.challenge());
        q.put("code_challenge_method", "S256");
        String auth = kc + "/realms/gh-guests/protocol/openid-connect/auth?";

        HttpResponse<String> silent = send(browser(), HttpRequest.newBuilder(URI.create(auth + form(q))).GET().build());
        assertThat(silent.statusCode()).as(silent.body()).isEqualTo(302);
        assertThat(silent.headers().firstValue("Location").orElseThrow())
                .startsWith(LANDING + "/silent-check-sso.html").contains("error=login_required");   // no session yet

        q.put("redirect_uri", LANDING + "/silent-check-sso.htmlx");
        assertThat(send(browser(), HttpRequest.newBuilder(URI.create(auth + form(q))).GET().build()).statusCode()).isEqualTo(400);
        q.put("redirect_uri", LANDING + "/anything-else");
        assertThat(send(browser(), HttpRequest.newBuilder(URI.create(auth + form(q))).GET().build()).statusCode()).isEqualTo(400);
    }

    @Test
    void sendIsOnlyForManageUsersAndOnlyToTheLandingOrigin() throws Exception {
        String svc = serviceToken();
        String userId = createMember(svc, "neha." + UUID.randomUUID().toString().substring(0, 8) + "@example.test");
        assertThat(sendWelcome(null, userId, LANDING + "/member/activate").statusCode()).isEqualTo(401);
        assertThat(sendWelcome(svc, userId, "https://evil.example/member/activate").statusCode()).isEqualTo(400);
        assertThat(sendWelcome(svc, userId, "javascript:alert(1)").statusCode()).isEqualTo(400);
        assertThat(sendWelcome(svc, UUID.randomUUID().toString(), LANDING + "/member/activate").statusCode()).isEqualTo(404);
    }

    @Test
    void guestServiceCannotDoMoreThanManageUsers() throws Exception {
        HttpResponse<String> r = json("GET", kc + "/admin/realms/gh-guests/clients", serviceToken(), null);
        assertThat(r.statusCode()).isEqualTo(403);
    }

    /** Declaring our own flow in the realm file must not drop Keycloak's standard flows (registration, reset…). */
    @Test
    void realmKeepsTheStandardFlowsAndBindsOursToTheLandingClientOnly() throws Exception {
        String admin = adminToken();
        JsonNode flows = JSON.readTree(json("GET", kc + "/admin/realms/gh-guests/authentication/flows", admin, null).body());
        List<String> aliases = flows.valueStream().map(f -> f.get("alias").asString()).toList();
        assertThat(aliases).contains("browser", "registration", "reset credentials", "direct grant", "gh-member-browser");
        JsonNode realm = JSON.readTree(json("GET", kc + "/admin/realms/gh-guests", admin, null).body());
        assertThat(realm.get("browserFlow").asString()).isEqualTo("browser");
        JsonNode web = JSON.readTree(json("GET", kc + "/admin/realms/gh-guests/clients?clientId=guest-web", admin, null).body()).get(0);
        assertThat(web.get("authenticationFlowBindingOverrides").get("browser").asString()).isEqualTo("6f0d7b8e-6a43-4f43-9c8e-1d5b0d6b3a01");
        assertThat(web.get("attributes").get("pkce.code.challenge.method").asString()).isEqualTo("S256");
    }
}
