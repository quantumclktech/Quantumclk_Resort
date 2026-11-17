package com.quantumclk.erp.access.membership;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Verhoeff check digit, normalising, masking and the keyed hash of ID proof numbers (D-131). */
class IdentityNumbersTest {

    static final String KEY = "dGVzdC1vbmx5LWlkLWhhc2gta2V5LTMyLWJ5dGVzLWxvbmch";

    @Test
    void verhoeffMatchesThePublishedExample() {
        // Standard worked example: the check digit of 236 is 3, so 2363 is valid and any other last digit is not.
        assertThat(IdentityNumbers.verhoeffCheckDigit("236")).isEqualTo(3);
        assertThat(IdentityNumbers.verhoeffValid("2363")).isTrue();
        for (int d = 0; d <= 9; d++) if (d != 3) assertThat(IdentityNumbers.verhoeffValid("236" + d)).isFalse();
        // It catches swapped neighbours, the typo a person makes most.
        String n = "23456789012";
        String valid = n + IdentityNumbers.verhoeffCheckDigit(n);
        assertThat(IdentityNumbers.verhoeffValid(valid)).isTrue();
        assertThat(IdentityNumbers.verhoeffValid("32456789012" + valid.charAt(11))).isFalse();
    }

    @Test
    void aadhaarRules() {
        String body = "98765432101";
        String ok = body + IdentityNumbers.verhoeffCheckDigit(body);
        String typed = ok.substring(0, 4) + " " + ok.substring(4, 8) + "-" + ok.substring(8);
        assertThat(IdentityNumbers.normalise("AADHAAR", typed)).isEqualTo(ok);
        assertThat(IdentityNumbers.problem("AADHAAR", ok)).isNull();
        assertThat(IdentityNumbers.problem("AADHAAR", "1" + ok.substring(1))).contains("can't start with 0 or 1");
        assertThat(IdentityNumbers.problem("AADHAAR", ok.substring(1))).contains("12 digits");
        assertThat(IdentityNumbers.mask("AADHAAR", ok)).isEqualTo("XXXX-XXXX-" + ok.substring(8));
    }

    @Test
    void licenceRules() {
        assertThat(IdentityNumbers.normalise("DRIVING_LICENCE", "ka-01 2019/0001234")).isEqualTo("KA0120190001234");
        assertThat(IdentityNumbers.problem("DRIVING_LICENCE", "KA0120190001234")).isNull();
        assertThat(IdentityNumbers.problem("DRIVING_LICENCE", "123")).isNotNull();
        assertThat(IdentityNumbers.mask("DRIVING_LICENCE", "KA0120190001234")).isEqualTo("XXXXXXXXXXX1234");
    }

    @Test
    void hashIsKeyedStableAndPerType() {
        IdentityNumbers ids = new IdentityNumbers(KEY);
        String h = ids.hash("AADHAAR", "234567890123");
        assertThat(h).matches("[0-9a-f]{64}").isEqualTo(ids.hash("AADHAAR", "234567890123"));
        assertThat(h).isNotEqualTo(ids.hash("DRIVING_LICENCE", "234567890123"));
        assertThat(h).isNotEqualTo(new IdentityNumbers("b3RoZXIta2V5LW90aGVyLWtleS1vdGhlci1rZXktMzJieXRlcyE=").hash("AADHAAR", "234567890123"));
        assertThatThrownBy(() -> new IdentityNumbers("").hash("AADHAAR", "234567890123")).hasMessageContaining("MEMBERSHIP_ID_HASH_KEY");
        assertThatThrownBy(() -> new IdentityNumbers("c2hvcnQ=")).hasMessageContaining("at least 32 bytes");
    }

    @Test
    void panIsNormalisedCheckedAndMasked() {   // D-139
        String pan = IdentityNumbers.normalise(IdentityNumbers.PAN, " abcpe 1234-f ");
        assertThat(pan).isEqualTo("ABCPE1234F");
        assertThat(IdentityNumbers.problem(IdentityNumbers.PAN, pan)).isNull();
        assertThat(IdentityNumbers.problem(IdentityNumbers.PAN, "ABCP1234F")).contains("10 characters");
        assertThat(IdentityNumbers.problem(IdentityNumbers.PAN, "ABCCE1234F")).contains("4th letter");   // a company PAN
        assertThat(IdentityNumbers.mask(IdentityNumbers.PAN, pan)).isEqualTo("XXXXXX234F");
    }
}
