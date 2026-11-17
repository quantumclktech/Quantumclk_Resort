package com.quantumclk.erp.access.membership;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * ID proof numbers of Gold Members (D-131): Aadhaar or driving licence (client, Discovery Call 2026-10-28 [22:56]),
 * and the PAN of employees (D-139).
 *
 * <p>Checks and normalises a number, and turns it into the only two things we store: a masked form for people and a
 * keyed hash (HMAC-SHA256) that lets the database refuse a second live membership for the same ID. The full number
 * is never stored, logged or returned. The hash is keyed because Aadhaar has only ~10^12 possible numbers: a plain
 * SHA-256 could be reversed by trying them all.
 */
@Component
public class IdentityNumbers {

    public static final String AADHAAR = "AADHAAR";
    public static final String DRIVING_LICENCE = "DRIVING_LICENCE";
    public static final String PAN = "PAN";

    // Verhoeff tables (dihedral group D5), as used by UIDAI for the Aadhaar check digit.
    private static final int[][] D = {
            {0, 1, 2, 3, 4, 5, 6, 7, 8, 9}, {1, 2, 3, 4, 0, 6, 7, 8, 9, 5}, {2, 3, 4, 0, 1, 7, 8, 9, 5, 6},
            {3, 4, 0, 1, 2, 8, 9, 5, 6, 7}, {4, 0, 1, 2, 3, 9, 5, 6, 7, 8}, {5, 9, 8, 7, 6, 0, 4, 3, 2, 1},
            {6, 5, 9, 8, 7, 1, 0, 4, 3, 2}, {7, 6, 5, 9, 8, 2, 1, 0, 4, 3}, {8, 7, 6, 5, 9, 3, 2, 1, 0, 4},
            {9, 8, 7, 6, 5, 4, 3, 2, 1, 0}};
    private static final int[][] P = {
            {0, 1, 2, 3, 4, 5, 6, 7, 8, 9}, {1, 5, 7, 6, 2, 8, 3, 0, 9, 4}, {5, 8, 0, 3, 7, 9, 6, 1, 4, 2},
            {8, 9, 1, 6, 0, 4, 3, 5, 2, 7}, {9, 4, 5, 3, 1, 2, 6, 8, 7, 0}, {4, 2, 8, 6, 5, 7, 3, 9, 0, 1},
            {2, 7, 9, 3, 8, 0, 6, 4, 1, 5}, {7, 0, 4, 6, 9, 1, 3, 2, 5, 8}};
    private static final int[] INV = {0, 4, 3, 2, 1, 5, 6, 7, 8, 9};

    private static final Pattern AADHAAR_SHAPE = Pattern.compile("^[2-9][0-9]{11}$");
    /** State code + RTO number + the rest (e.g. KA01 20190001234). Older licences vary in length (Q-038). */
    private static final Pattern LICENCE_SHAPE = Pattern.compile("^[A-Z]{2}[0-9]{2}[0-9A-Z]{9,13}$");

    /** 5 letters, 4 digits, 1 letter; the 4th letter is the holder type, P = individual (Income Tax Dept.). */
    private static final Pattern PAN_SHAPE = Pattern.compile("^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$");
    private static final Pattern PAN_ANY_HOLDER = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]$");

    private final byte[] key;

    IdentityNumbers(@Value("${erp.membership.id-hash-key:}") String base64Key) {
        if (base64Key == null || base64Key.isBlank()) {
            this.key = null;   // registrations fail with a clear message until it is set (see hash)
        } else {
            byte[] raw = Base64.getDecoder().decode(base64Key.trim());
            if (raw.length < 32) throw new IllegalStateException("erp.membership.id-hash-key must be at least 32 bytes (base64), got " + raw.length);
            this.key = raw;
        }
    }

    /** True when the digits pass the Verhoeff check (the last digit is the check digit). */
    public static boolean verhoeffValid(String digits) {
        int c = 0;
        for (int i = 0; i < digits.length(); i++) {
            int d = digits.charAt(digits.length() - 1 - i) - '0';
            if (d < 0 || d > 9) return false;
            c = D[c][P[i % 8][d]];
        }
        return !digits.isEmpty() && c == 0;
    }

    /** The Verhoeff check digit to append to these digits (used by tests to build valid numbers). */
    public static int verhoeffCheckDigit(String digits) {
        int c = 0;
        for (int i = 0; i < digits.length(); i++) {
            c = D[c][P[(i + 1) % 8][digits.charAt(digits.length() - 1 - i) - '0']];
        }
        return INV[c];
    }

    /** Why a number is not acceptable, or null when it is. */
    public static String problem(String type, String normalised) {
        if (PAN.equals(type)) {
            if (!PAN_ANY_HOLDER.matcher(normalised).matches()) return "PAN has 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCPE1234F).";
            return PAN_SHAPE.matcher(normalised).matches() ? null
                    : "The 4th letter of a person's PAN is P. Check it on the card.";
        }
        if (AADHAAR.equals(type)) {
            if (normalised.length() != 12) return "Aadhaar has 12 digits.";
            if (!AADHAAR_SHAPE.matcher(normalised).matches()) return "An Aadhaar number can't start with 0 or 1.";
            if (!verhoeffValid(normalised)) return "This Aadhaar number has a typo (the check digit doesn't match). Check it on the card.";
            return null;
        }
        if (DRIVING_LICENCE.equals(type)) {
            return LICENCE_SHAPE.matcher(normalised).matches() ? null
                    : "Enter the licence number as printed, e.g. KA01 20190001234 (state code, RTO number, then the rest).";
        }
        return "Choose Aadhaar or driving licence.";
    }

    /** Aadhaar: digits only. Licence: upper case without spaces, hyphens or slashes. */
    public static String normalise(String type, String raw) {
        if (raw == null) return "";
        return AADHAAR.equals(type) ? raw.replaceAll("[^0-9]", "")
                : raw.toUpperCase(Locale.ROOT).replaceAll("[\\s/-]", "");
    }

    /** Aadhaar → XXXX-XXXX-0123; licence and PAN → X…X + last 4 (PAN: XXXXXX234F). */
    public static String mask(String type, String normalised) {
        String last4 = normalised.substring(normalised.length() - 4);
        return AADHAAR.equals(type) ? "XXXX-XXXX-" + last4 : "X".repeat(normalised.length() - 4) + last4;
    }

    /** Hex HMAC-SHA256 of "type:number" under the configured key. */
    public String hash(String type, String normalised) {
        if (key == null) {
            throw new IllegalStateException("erp.membership.id-hash-key (MEMBERSHIP_ID_HASH_KEY) is not set; Gold Member registration and employee PAN need it");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((type + ":" + normalised).getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
