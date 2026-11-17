package com.quantumclk.erp.access;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import com.quantumclk.erp.access.membership.IdentityNumbers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Gold Membership core (SOW ERP-05; inc-membership-PLAN S1; D-116…D-118): field registration with payment proof,
 * gap-free client numbering (GRH-LM-####), encrypted proof storage, verification by ADMIN/MANAGER only.
 */
@SpringBootTest(properties = {"erp.keycloak.issuer=" + TestSupport.ISSUER})
@AutoConfigureMockMvc
@Import({TestSupport.class, MembershipTest.Guests.class})
class MembershipTest {

    /** guest-service stand-in: records provision/resend calls; can fail like the real one. */
    @org.springframework.boot.test.context.TestConfiguration(proxyBeanMethods = false)
    static class Guests {
        static final FakeGuests FAKE = new FakeGuests();
        @org.springframework.context.annotation.Bean @org.springframework.context.annotation.Primary
        com.quantumclk.erp.access.membership.GuestAccounts fakeGuests() { return FAKE; }
    }

    static class FakeGuests implements com.quantumclk.erp.access.membership.GuestAccounts {
        final List<Welcome> provisioned = new java.util.concurrent.CopyOnWriteArrayList<>();
        final List<UUID> resent = new java.util.concurrent.CopyOnWriteArrayList<>();
        volatile boolean down;
        volatile boolean emailBroken;
        @Override public Result provision(Welcome w) {
            if (down) throw new Unavailable("guest-service down", null);
            provisioned.add(w);
            return new Result(UUID.nameUUIDFromBytes(w.email().getBytes()), !emailBroken);
        }
        @Override public Result resend(UUID guestUserId, String validUntil, String requestedBy) {
            if (down) throw new Unavailable("guest-service down", null);
            resent.add(guestUserId);
            return new Result(guestUserId, !emailBroken);
        }
    }

    static final UUID SE1 = UUID.randomUUID(), SE2 = UUID.randomUUID(), MGR = UUID.randomUUID(), ADMIN = UUID.randomUUID();
    static final AtomicInteger SEQ = new AtomicInteger();

    static final List<String> SE_PERMS = List.of("memberships.register", "memberships.read_own");
    static final List<String> MGR_PERMS = List.of("memberships.register", "memberships.read_own", "memberships.read_all", "memberships.verify");

    /** Smallest valid-looking PNG header + payload (the magic bytes are what the server checks). */
    static final byte[] PNG = concat(new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}, "UTR 123456789012 paid".getBytes());

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired JsonMapper json;
    @Value("${erp.membership.proof-dir}") String proofDir;

    @BeforeEach
    void staff() {
        employee(SE1, "sam.one", "SALES_EXECUTIVE", "+919811100001");
        employee(SE2, "sara.two", "SALES_EXECUTIVE", "+919811100002");
        employee(MGR, "mohan.mgr", "MANAGER", "+919811100003");
        employee(ADMIN, "anu.admin", "ADMIN", "+919811100004");
    }

    private void employee(UUID kc, String username, String role, String mobile) {
        jdbc.update("""
                INSERT INTO employee (id, keycloak_user_id, first_name, last_name, email, username, mobile_e164,
                                      job_role, status, created_by, updated_by, created_at, updated_at)
                VALUES (?, ?, initcap(split_part(?, '.', 1)), 'Test', ? || '@example.test', ?, ?, ?, 'ACTIVE', ?, ?, now(), now())
                ON CONFLICT (keycloak_user_id) DO NOTHING""",
                UUID.randomUUID(), kc, username, username, username, mobile, role, kc, kc);
    }

    static String token(UUID sub, String role, List<String> perms) {
        return TestSupport.sign(TestSupport.claims(sub, List.of(role), perms).claim("preferred_username", "u-" + sub).build());
    }
    static String se1() { return token(SE1, "SALES_EXECUTIVE", SE_PERMS); }
    static String se2() { return token(SE2, "SALES_EXECUTIVE", SE_PERMS); }
    static String mgr() { return token(MGR, "MANAGER", MGR_PERMS); }
    static String admin() { return token(ADMIN, "ADMIN", MGR_PERMS); }

    /** A unique customer per call so tests don't collide on the live-uniqueness indexes. */
    static Map<String, String> customer() {
        int n = SEQ.incrementAndGet();
        String r = UUID.randomUUID().toString().substring(0, 6);
        Map<String, String> c = new java.util.LinkedHashMap<>(Map.of(
                "firstName", "Rohan", "lastName", "Sharma" + n, "dob", "1990-05-17",
                "mobile", "+91 9" + String.format("%09d", Math.abs((r + n).hashCode()) % 1_000_000_000),
                "email", "Rohan." + r + n + "@Example.test", "address", "12 MG Road, Tilakwadi",
                "paymentType", "CASH", "amount", "25000.00"));
        c.put("idType", "AADHAAR");
        c.put("idNumber", aadhaar());
        c.put("pincode", "590006");
        c.put("city", "belagavi");
        c.put("state", "Karnataka");
        c.put("country", "India");
        return c;
    }

    /** A different Aadhaar number with a valid Verhoeff check digit on every call, formatted as on the card. */
    static String aadhaar() {
        String body = "2" + String.format("%010d", Math.abs(UUID.randomUUID().getMostSignificantBits()) % 10_000_000_000L);
        String n = body + IdentityNumbers.verhoeffCheckDigit(body);
        return n.substring(0, 4) + " " + n.substring(4, 8) + " " + n.substring(8);
    }

    /** The same digits with a wrong last digit (fails the checksum). */
    static String typo(String aadhaar) {
        String d = aadhaar.replace(" ", "");
        return d.substring(0, 11) + ((d.charAt(11) - '0' + 1) % 10);
    }

    private MockMultipartHttpServletRequestBuilder form(Map<String, String> fields, MockMultipartFile proof) {
        MockMultipartHttpServletRequestBuilder b = multipart("/api/v1/sales/memberships");
        fields.forEach(b::param);
        if (proof != null) b.file(proof);
        return b;
    }

    private ResultActions register(String token, Map<String, String> fields, MockMultipartFile proof, UUID key) throws Exception {
        return mvc.perform(form(fields, proof).header("Authorization", "Bearer " + token).header("Idempotency-Key", key.toString()));
    }

    private JsonNode registerOk(String token, Map<String, String> fields, MockMultipartFile proof) throws Exception {
        MvcResult r = register(token, fields, proof, UUID.randomUUID()).andExpect(status().isCreated()).andReturn();
        return json.readTree(r.getResponse().getContentAsString());
    }

    static MockMultipartFile png() { return new MockMultipartFile("proof", "upi-screenshot.png", "image/png", PNG); }

    static int number(JsonNode member) { return Integer.parseInt(member.get("membershipId").asString().substring("GRH-LM-".length())); }

    // --- Registration ----------------------------------------------------------------------------------------------

    @Test
    void executiveRegistersCashMemberPendingVerificationWithClientNumberAndAudit() throws Exception {
        JsonNode m = registerOk(se1(), customer(), null);
        assertThat(m.get("membershipId").asString()).matches("GRH-LM-\\d{4}");
        assertThat(number(m)).isBetween(101, 5100);
        assertThat(m.get("status").asString()).isEqualTo("PENDING_VERIFICATION");
        assertThat(m.get("tier").asString()).isEqualTo("GOLD");
        assertThat(m.get("email").asString()).isEqualTo(m.get("email").asString().toLowerCase());
        assertThat(m.get("mobile").asString()).matches("\\+91\\d{10}");
        assertThat(m.get("enrolledBy").get("username").asString()).isEqualTo("sam.one");
        assertThat(m.get("payment").get("type").asString()).isEqualTo("CASH");
        assertThat(m.get("payment").get("amount").asString()).isEqualTo("25000.00");
        assertThat(m.get("payment").get("status").asString()).isEqualTo("PENDING");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_event WHERE entity_type = 'MEMBER' AND entity_id = ? AND action = 'MEMBER_REGISTERED'",
                Integer.class, UUID.fromString(m.get("id").asString()))).isEqualTo(1);
    }

    @Test
    void numbersAreConsecutiveAndAFailedRegistrationDoesNotUseOne() throws Exception {
        JsonNode a = registerOk(se1(), customer(), null);
        Map<String, String> dup = customer();
        dup.put("email", a.get("email").asString());   // same live email -> 409, must not consume a number
        register(se1(), dup, null, UUID.randomUUID()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MEMBER_EXISTS"));
        JsonNode b = registerOk(se1(), customer(), null);
        assertThat(number(b)).isEqualTo(number(a) + 1);
    }

    @Test
    void parallelRegistrationsGetDistinctGapFreeNumbers() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(6);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < 6; i++) {
                Map<String, String> c = customer();
                futures.add(pool.submit((Callable<Integer>) () -> number(registerOk(se1(), c, null))));
            }
            List<Integer> numbers = new ArrayList<>();
            for (Future<Integer> f : futures) numbers.add(f.get());
            numbers.sort(Integer::compare);
            for (int i = 1; i < numbers.size(); i++) assertThat(numbers.get(i)).isEqualTo(numbers.get(0) + i);
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void nextNumberPreviewIsProvisional() throws Exception {
        mvc.perform(get("/api/v1/sales/memberships/next-number").header("Authorization", "Bearer " + se1()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.membershipId", matchesPattern("GRH-LM-\\d{4}")))
                .andExpect(jsonPath("$.provisional").value(true));
    }

    @Test
    void sameIdempotencyKeyReturnsTheSameMemberOnce() throws Exception {
        Map<String, String> c = customer();
        UUID key = UUID.randomUUID();
        String first = register(se1(), c, null, key).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String again = register(se1(), c, null, key).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(again).get("membershipId")).isEqualTo(json.readTree(first).get("membershipId"));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM resort_member WHERE email = ?", Integer.class,
                c.get("email").toLowerCase())).isEqualTo(1);
        Map<String, String> changed = new java.util.LinkedHashMap<>(c);
        changed.put("amount", "1.00");
        register(se1(), changed, null, key).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("IDEMPOTENCY_KEY_REUSED"));
    }

    // --- Payment rules ----------------------------------------------------------------------------------------------

    @Test
    void cardNeedsTransactionId() throws Exception {
        Map<String, String> c = customer();
        c.put("paymentType", "CARD");
        register(se1(), c, null, UUID.randomUUID()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.transactionId").exists());
        c.put("transactionId", "TXN-778899");
        JsonNode m = registerOk(se1(), c, null);
        assertThat(m.get("payment").get("transactionId").asString()).isEqualTo("TXN-778899");
    }

    @Test
    void scanQrNeedsAProofImage() throws Exception {
        Map<String, String> c = customer();
        c.put("paymentType", "SCAN_QR");
        register(se1(), c, null, UUID.randomUUID()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.proof").exists());
    }

    @Test
    void amountMustBePositiveWithAtMostTwoDecimals() throws Exception {
        for (String bad : List.of("0", "-5", "12.345", "abc")) {
            Map<String, String> c = customer();
            c.put("amount", bad);
            register(se1(), c, null, UUID.randomUUID()).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fields.amount").exists());
        }
    }

    @Test
    void missingCustomerFieldsAreReportedPerField() throws Exception {
        Map<String, String> c = customer();
        c.remove("address");
        c.put("email", "not-an-email");
        c.put("dob", "2999-01-01");
        register(se1(), c, null, UUID.randomUUID()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.address").exists())
                .andExpect(jsonPath("$.fields.email").exists())
                .andExpect(jsonPath("$.fields.dob").exists());
    }

    // --- Smart fields: ID proof, 18+, structured address (D-131…D-134) -----------------------------------------------

    @Test
    void storesOnlyTheMaskedAadhaarAndAKeyedHashNeverTheNumber() throws Exception {
        Map<String, String> c = customer();
        String digits = c.get("idNumber").replace(" ", "");
        JsonNode m = registerOk(se1(), c, null);
        assertThat(m.get("idType").asString()).isEqualTo("AADHAAR");
        assertThat(m.get("idNumberMasked").asString()).isEqualTo("XXXX-XXXX-" + digits.substring(8));
        assertThat(m.get("pincode").asString()).isEqualTo("590006");
        assertThat(m.get("city").asString()).isEqualTo("Belagavi");   // title-cased
        assertThat(m.get("state").asString()).isEqualTo("Karnataka");
        assertThat(m.get("country").asString()).isEqualTo("India");
        assertThat(m.toString()).doesNotContain(digits);
        UUID id = UUID.fromString(m.get("id").asString());
        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM resort_member WHERE id = ?", id);
        assertThat(((Number) row.get("registration_form")).intValue()).isEqualTo(2);
        assertThat(row.values().stream().map(String::valueOf)).noneMatch(v -> v.contains(digits));
        assertThat(String.valueOf(row.get("id_number_hash")).trim()).matches("[0-9a-f]{64}").isNotEqualTo(sha256Hex("AADHAAR:" + digits));
        String audit = jdbc.queryForObject("SELECT after_json::text FROM audit_event WHERE entity_id = ? AND action = 'MEMBER_REGISTERED'", String.class, id);
        assertThat(audit).contains("XXXX-XXXX-" + digits.substring(8)).doesNotContain(digits);
    }

    static String sha256Hex(String s) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }

    @Test
    void customerMustBe18OnTheRegistrationDate() throws Exception {
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        Map<String, String> exactly18 = customer();
        exactly18.put("dob", today.minusYears(18).toString());
        registerOk(se1(), exactly18, null);

        Map<String, String> almost = customer();
        almost.put("dob", today.minusYears(18).plusDays(1).toString());
        register(se1(), almost, null, UUID.randomUUID()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.dob").value("Customer must be at least 18 years old"));
    }

    @Test
    void aadhaarMustHave12DigitsStart2To9AndPassTheChecksum() throws Exception {
        for (String bad : List.of(typo(aadhaar()), "1234 5678 9012", "2345 6789 01")) {
            Map<String, String> c = customer();
            c.put("idNumber", bad);
            register(se1(), c, null, UUID.randomUUID()).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fields.idNumber").exists());
        }
        Map<String, String> noType = customer();
        noType.put("idType", "PAN");
        register(se1(), noType, null, UUID.randomUUID()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.idType").exists());
    }

    @Test
    void aDrivingLicenceIsAcceptedAndMasked() throws Exception {
        Map<String, String> c = customer();
        c.put("idType", "DRIVING_LICENCE");
        String dl = "KA01 2019" + String.format("%07d", SEQ.incrementAndGet() * 7919 % 10_000_000);
        c.put("idNumber", dl.toLowerCase());
        JsonNode m = registerOk(se1(), c, null);
        String normalised = dl.replace(" ", "");
        assertThat(m.get("idType").asString()).isEqualTo("DRIVING_LICENCE");
        assertThat(m.get("idNumberMasked").asString()).isEqualTo("X".repeat(normalised.length() - 4) + normalised.substring(normalised.length() - 4));

        Map<String, String> bad = customer();
        bad.put("idType", "DRIVING_LICENCE");
        bad.put("idNumber", "12345");
        register(se1(), bad, null, UUID.randomUUID()).andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.idNumber").exists());
    }

    @Test
    void addressNeedsAValidPincodeCityAndState() throws Exception {
        for (String pin : List.of("012345", "5900", "59000A")) {
            Map<String, String> c = customer();
            c.put("pincode", pin);
            register(se1(), c, null, UUID.randomUUID()).andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.pincode").exists());
        }
        Map<String, String> c = customer();
        c.put("state", "Atlantis");
        c.remove("city");
        c.put("country", "Nepal");
        register(se1(), c, null, UUID.randomUUID()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.state").exists()).andExpect(jsonPath("$.fields.city").exists())
                .andExpect(jsonPath("$.fields.country").exists());
    }

    @Test
    void mobileAcceptsPastedFormsButOnlyIndianMobiles() throws Exception {
        for (String typed : List.of("09876543210", "919876543211", "+91 98765-43212")) {
            Map<String, String> c = customer();
            c.put("mobile", typed);
            String expected = "+91" + typed.replaceAll("[^0-9]", "").replaceFirst("^(91|0)(?=\\d{10}$)", "");
            assertThat(registerOk(se1(), c, null).get("mobile").asString()).isEqualTo(expected);
        }
        Map<String, String> landline = customer();
        landline.put("mobile", "5876543210");
        register(se1(), landline, null, UUID.randomUUID()).andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.mobile").exists());
    }

    @Test
    void namesAreTitleCased() throws Exception {
        Map<String, String> c = customer();
        c.put("firstName", "anoop kumar");
        c.put("lastName", "D'Souza");
        JsonNode m = registerOk(se1(), c, null);
        assertThat(m.get("firstName").asString()).isEqualTo("Anoop Kumar");
        assertThat(m.get("lastName").asString()).isEqualTo("D'Souza");
    }

    @Test
    void oneIdProofHoldsOneLiveMembershipButARejectedOneCanRegisterAgain() throws Exception {
        Map<String, String> c = customer();
        JsonNode first = registerOk(se1(), c, null);
        Map<String, String> sameId = customer();
        sameId.put("idNumber", c.get("idNumber").replace(" ", ""));   // same number, typed differently
        register(se1(), sameId, null, UUID.randomUUID()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ID_ALREADY_REGISTERED"));

        reject(mgr(), first.get("id").asString(), "Wrong ID").andExpect(status().isOk());
        registerOk(se1(), sameId, null);
    }

    @Test
    void theDatabaseRefusesAnUnder18Form2RowEvenWithoutTheService() {
        UUID enrolled = jdbc.queryForObject("SELECT id FROM employee WHERE username = 'sam.one'", UUID.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO resort_member (id, membership_id, first_name, last_name, dob, mobile_e164, email, address, status,
                    enrolled_by_id, enrolled_by_name, enrolled_by_username, created_at, updated_at, registration_form,
                    id_type, id_number_masked, id_number_hash, pincode, city, state, country)
                VALUES (gen_random_uuid(), 'GRH-LM-9999', 'Kid', 'Test', CURRENT_DATE - INTERVAL '10 years', '+919000000001',
                    'kid@example.test', 'x', 'PENDING_VERIFICATION', ?, 'Sam', 'sam.one', now(), now(), 2,
                    'AADHAAR', 'XXXX-XXXX-0000', repeat('a', 64), '590006', 'Belagavi', 'Karnataka', 'India')""", enrolled))
                .hasMessageContaining("resort_member_form2_complete");
    }

    // --- Proof files ------------------------------------------------------------------------------------------------

    @Test
    void proofIsStoredEncryptedHashedAndStreamedBackOnlyToAllowedPeople() throws Exception {
        Map<String, String> c = customer();
        c.put("paymentType", "SCAN_QR");
        c.put("transactionId", "UTR123456789012");
        JsonNode m = registerOk(se1(), c, png());
        String id = m.get("id").asString();
        String expectedHash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(PNG));
        assertThat(m.get("payment").get("proof").get("sha256").asString()).isEqualTo(expectedHash);
        assertThat(m.get("payment").get("proof").get("contentType").asString()).isEqualTo("image/png");

        // On disk: one file named by an opaque key, and the plaintext is not in it.
        String key = jdbc.queryForObject("SELECT proof_file_key FROM member_payment WHERE member_id = ?", String.class, UUID.fromString(id));
        byte[] stored = Files.readAllBytes(Path.of(proofDir, key));
        assertThat(key).doesNotContain("upi-screenshot");
        assertThat(new String(stored, java.nio.charset.StandardCharsets.ISO_8859_1)).doesNotContain("UTR 123456789012");

        // The enrolling executive and verifiers get the original bytes; another executive gets 404.
        for (String path : List.of("/api/v1/sales/memberships/" + id + "/proof")) {
            mvc.perform(get(path).header("Authorization", "Bearer " + se1())).andExpect(status().isOk())
                    .andExpect(content().bytes(PNG)).andExpect(content().contentType("image/png"))
                    .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                    .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")));
            mvc.perform(get(path).header("Authorization", "Bearer " + se2())).andExpect(status().isNotFound());
        }
        mvc.perform(get("/api/v1/admin/memberships/" + id + "/proof").header("Authorization", "Bearer " + mgr()))
                .andExpect(status().isOk()).andExpect(content().bytes(PNG));
        mvc.perform(get("/api/v1/admin/memberships/" + id + "/proof").header("Authorization", "Bearer " + se1()))
                .andExpect(status().isForbidden());
    }

    @Test
    void proofMustReallyBeAnImage() throws Exception {
        Map<String, String> c = customer();
        c.put("paymentType", "SCAN_QR");
        MockMultipartFile fake = new MockMultipartFile("proof", "x.png", "image/png", "<script>alert(1)</script>".getBytes());
        register(se1(), c, fake, UUID.randomUUID()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.proof").exists());
    }

    @Test
    void proofOver5MbIsRejected() throws Exception {
        Map<String, String> c = customer();
        c.put("paymentType", "SCAN_QR");
        byte[] big = new byte[5 * 1024 * 1024 + 1];
        System.arraycopy(PNG, 0, big, 0, PNG.length);
        register(se1(), c, new MockMultipartFile("proof", "big.png", "image/png", big), UUID.randomUUID())
                .andExpect(status().isPayloadTooLarge());
    }

    // --- Uniqueness ---------------------------------------------------------------------------------------------------

    @Test
    void aRejectedPersonCanRegisterAgainButALiveOneCannot() throws Exception {
        Map<String, String> c = customer();
        JsonNode first = registerOk(se1(), c, null);
        Map<String, String> sameMobile = customer();
        sameMobile.put("mobile", c.get("mobile"));
        register(se1(), sameMobile, null, UUID.randomUUID()).andExpect(status().isConflict());

        reject(mgr(), first.get("id").asString(), "Payment not received").andExpect(status().isOk());
        JsonNode second = registerOk(se1(), c, null);
        assertThat(second.get("id").asString()).isNotEqualTo(first.get("id").asString());
    }

    // --- Access ---------------------------------------------------------------------------------------------------------

    @Test
    void executivesSeeOnlyTheirOwnMembers() throws Exception {
        JsonNode mine = registerOk(se1(), customer(), null);
        String id = mine.get("id").asString();
        mvc.perform(get("/api/v1/sales/memberships").header("Authorization", "Bearer " + se1()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[*].id", hasItem(id)));
        mvc.perform(get("/api/v1/sales/memberships").header("Authorization", "Bearer " + se2()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[?(@.id == '" + id + "')]").isEmpty());
        mvc.perform(get("/api/v1/sales/memberships/" + id).header("Authorization", "Bearer " + se2())).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/admin/memberships").header("Authorization", "Bearer " + se1())).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/memberships/" + id + "/verify").header("Authorization", "Bearer " + se1())).andExpect(status().isForbidden());
    }

    @Test
    void employeeWithoutErpRecordCannotRegister() throws Exception {
        String stranger = token(UUID.randomUUID(), "SALES_EXECUTIVE", SE_PERMS);
        register(stranger, customer(), null, UUID.randomUUID()).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NO_EMPLOYEE_RECORD"));
    }

    @Test
    void noTokenIs401() throws Exception {
        mvc.perform(form(customer(), null).header("Idempotency-Key", UUID.randomUUID().toString())).andExpect(status().isUnauthorized());
    }

    // --- Sales Performance: memberships per executive (D-140) ----------------------------------------------------

    @Test
    void adminSeesMembershipsEachExecutiveBroughtIn() throws Exception {
        UUID se3 = UUID.randomUUID();
        employee(se3, "sita.three", "SALES_EXECUTIVE", "+919811100005");
        String sita = token(se3, "SALES_EXECUTIVE", SE_PERMS);
        String[] ids = new String[4];
        for (int i = 0; i < 4; i++) ids[i] = registerOk(sita, customer(), null).get("id").asString();
        verify(mgr(), ids[0]).andExpect(status().isOk());
        verify(mgr(), ids[1]).andExpect(status().isOk());
        reject(mgr(), ids[2], "Payment not received").andExpect(status().isOk());   // ids[3] stays pending

        String me = "$.executives[?(@.username == 'sita.three')]";
        mvc.perform(get("/api/v1/admin/memberships/summary").header("Authorization", "Bearer " + admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath(me + ".name", hasItem("Sita Test")))
                .andExpect(jsonPath(me + ".enrolledCount", hasItem(4)))
                .andExpect(jsonPath(me + ".activeCount", hasItem(2)))
                .andExpect(jsonPath(me + ".pendingCount", hasItem(1)))
                .andExpect(jsonPath(me + ".rejectedCount", hasItem(1)))
                .andExpect(jsonPath(me + ".verifiedAmount", hasItem("50000.00")));   // only verified payments count

        mvc.perform(get("/api/v1/admin/memberships/summary").param("from", "2999-01-01T00:00:00+05:30")
                        .header("Authorization", "Bearer " + admin()))
                .andExpect(status().isOk()).andExpect(jsonPath(me).isEmpty());

        mvc.perform(get("/api/v1/admin/memberships").param("enrolledBy", "sita.three").header("Authorization", "Bearer " + admin()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(4));

        // Sales Admin only: a manager (who can verify) and an executive are refused.
        mvc.perform(get("/api/v1/admin/memberships/summary").header("Authorization", "Bearer " + mgr())).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/memberships/summary").header("Authorization", "Bearer " + sita)).andExpect(status().isForbidden());
    }

    // --- Verification ------------------------------------------------------------------------------------------------

    private ResultActions verify(String token, String id) throws Exception {
        return mvc.perform(post("/api/v1/admin/memberships/" + id + "/verify").header("Authorization", "Bearer " + token));
    }

    private ResultActions reject(String token, String id, String reason) throws Exception {
        return mvc.perform(post("/api/v1/admin/memberships/" + id + "/reject").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("reason", reason))));
    }

    @Test
    void queueShowsPendingWithCountAndManagerVerifiesForTwelveMonths() throws Exception {
        JsonNode m = registerOk(se1(), customer(), null);
        String id = m.get("id").asString();
        mvc.perform(get("/api/v1/admin/memberships?status=PENDING_VERIFICATION&size=200").header("Authorization", "Bearer " + mgr()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", hasItem(id)))
                .andExpect(jsonPath("$.pendingCount").isNumber());

        JsonNode v = json.readTree(verify(mgr(), id).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(v.get("status").asString()).isEqualTo("ACTIVE");
        assertThat(v.get("payment").get("status").asString()).isEqualTo("VERIFIED");
        assertThat(v.get("payment").get("verifiedBy").asString()).isEqualTo("mohan.mgr");
        OffsetDateTime from = OffsetDateTime.parse(v.get("validFrom").asString());
        OffsetDateTime until = OffsetDateTime.parse(v.get("validUntil").asString());
        assertThat(until).isEqualTo(from.plusMonths(12));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_event WHERE entity_type = 'MEMBER' AND entity_id = ? AND action = 'MEMBER_VERIFIED'",
                Integer.class, UUID.fromString(id))).isEqualTo(1);

        verify(admin(), id).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("NOT_PENDING"));
        reject(admin(), id, "late").andExpect(status().isConflict());
    }

    @Test
    void nobodyVerifiesTheirOwnRegistration() throws Exception {
        JsonNode m = registerOk(mgr(), customer(), null);
        verify(mgr(), m.get("id").asString()).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("SELF_VERIFICATION"));
        verify(admin(), m.get("id").asString()).andExpect(status().isOk());
    }

    @Test
    void rejectNeedsAReasonAndIsAudited() throws Exception {
        JsonNode m = registerOk(se1(), customer(), null);
        String id = m.get("id").asString();
        reject(mgr(), id, " ").andExpect(status().isBadRequest());
        JsonNode r = json.readTree(reject(mgr(), id, "Screenshot does not show the resort UPI ID").andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertThat(r.get("status").asString()).isEqualTo("REJECTED");
        assertThat(r.get("payment").get("status").asString()).isEqualTo("REJECTED");
        assertThat(r.get("payment").get("rejectionReason").asString()).isEqualTo("Screenshot does not show the resort UPI ID");
        assertThat(jdbc.queryForObject("SELECT reason FROM audit_event WHERE entity_type = 'MEMBER' AND entity_id = ? AND action = 'MEMBER_REJECTED'",
                String.class, UUID.fromString(id))).isEqualTo("Screenshot does not show the resort UPI ID");
    }

    @Test
    void unknownMemberIs404() throws Exception {
        verify(mgr(), UUID.randomUUID().toString()).andExpect(status().isNotFound());
    }

    // --- Welcome email / customer account (S3; D-120…D-122) -----------------------------------------------------------

    @Test
    void verifyingCreatesTheCustomerAccountAndSendsTheWelcomeEmail() throws Exception {
        Guests.FAKE.down = false; Guests.FAKE.emailBroken = false;
        JsonNode m = registerOk(se1(), customer(), null);
        JsonNode v = json.readTree(verify(mgr(), m.get("id").asString()).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(v.get("accountStatus").asString()).isEqualTo("INVITE_SENT");
        var call = Guests.FAKE.provisioned.stream().filter(w -> w.email().equals(m.get("email").asString())).findFirst().orElseThrow();
        assertThat(call.membershipId()).isEqualTo(m.get("membershipId").asString());
        assertThat(call.firstName()).isEqualTo("Rohan");
        assertThat(call.requestedBy()).isEqualTo("mohan.mgr");
        // "16 Nov 2027": the validity end in IST, as the customer reads it
        assertThat(call.validUntil()).matches("[0-9]{1,2} [A-Z][a-z]{2} [0-9]{4}");
        assertThat(jdbc.queryForObject("SELECT guest_user_id FROM resort_member WHERE id = ?", UUID.class, UUID.fromString(m.get("id").asString())))
                .isEqualTo(UUID.nameUUIDFromBytes(call.email().getBytes()));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_event WHERE entity_type = 'MEMBER' AND entity_id = ? AND action = 'MEMBER_WELCOME_SENT'",
                Integer.class, UUID.fromString(m.get("id").asString()))).isEqualTo(1);
    }

    @Test
    void ifTheWelcomeFailsTheMembershipStaysActiveAndCanBeResent() throws Exception {
        Guests.FAKE.down = true;
        JsonNode m = registerOk(se1(), customer(), null);
        String id = m.get("id").asString();
        JsonNode v = json.readTree(verify(mgr(), id).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(v.get("status").asString()).isEqualTo("ACTIVE");
        assertThat(v.get("accountStatus").asString()).isEqualTo("INVITE_FAILED");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_event WHERE entity_type = 'MEMBER' AND entity_id = ? AND action = 'MEMBER_WELCOME_FAILED'",
                Integer.class, UUID.fromString(id))).isEqualTo(1);

        Guests.FAKE.down = false;   // never provisioned -> resend provisions now
        mvc.perform(post("/api/v1/admin/memberships/" + id + "/resend-welcome").header("Authorization", "Bearer " + admin()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.accountStatus").value("INVITE_SENT"));

        int before = Guests.FAKE.resent.size();   // provisioned now -> resend just sends a fresh link
        mvc.perform(post("/api/v1/admin/memberships/" + id + "/resend-welcome").header("Authorization", "Bearer " + admin()))
                .andExpect(status().isOk());
        assertThat(Guests.FAKE.resent).hasSize(before + 1);
    }

    @Test
    void anEmailThatCouldNotBeSentIsShownAsFailed() throws Exception {
        Guests.FAKE.down = false; Guests.FAKE.emailBroken = true;
        try {
            JsonNode m = registerOk(se1(), customer(), null);
            JsonNode v = json.readTree(verify(mgr(), m.get("id").asString()).andReturn().getResponse().getContentAsString());
            assertThat(v.get("accountStatus").asString()).isEqualTo("INVITE_FAILED");
            assertThat(jdbc.queryForObject("SELECT guest_user_id FROM resort_member WHERE id = ?", UUID.class, UUID.fromString(m.get("id").asString()))).isNotNull();
        } finally {
            Guests.FAKE.emailBroken = false;
        }
    }

    @Test
    void resendWelcomeOnlyForActiveMembersAndOnlyByVerifiers() throws Exception {
        JsonNode m = registerOk(se1(), customer(), null);
        mvc.perform(post("/api/v1/admin/memberships/" + m.get("id").asString() + "/resend-welcome").header("Authorization", "Bearer " + mgr()))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("NOT_ACTIVE"));
        mvc.perform(post("/api/v1/admin/memberships/" + m.get("id").asString() + "/resend-welcome").header("Authorization", "Bearer " + se1()))
                .andExpect(status().isForbidden());
    }

    @Test
    void meListsTheMembershipsModule() throws Exception {
        mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + se1()))
                .andExpect(jsonPath("$.modules", hasItem("memberships")));
    }

    static byte[] concat(byte[] a, byte[] b) {
        byte[] r = Arrays.copyOf(a, a.length + b.length);
        System.arraycopy(b, 0, r, a.length, b.length);
        return r;
    }
}
