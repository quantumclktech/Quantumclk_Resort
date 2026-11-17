package com.quantumclk.erp.access.membership;

import com.quantumclk.erp.access.web.ApiException;
import com.quantumclk.erp.access.web.FieldErrorsException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Payment-proof screenshots for Gold Membership (ERP-05; engineering rules §11: personal/payment files are stored
 * encrypted and access-controlled).
 *
 * <ul>
 *   <li>Only JPEG, PNG and WebP, recognised by their first bytes (the browser's declared type is not trusted).</li>
 *   <li>At most 5 MB.</li>
 *   <li>Saved under an opaque random key, never the uploaded file name (no path tricks, no personal data in names).</li>
 *   <li>File content = 12-byte IV + AES-256-GCM ciphertext and tag; the key name is the associated data, so a file
 *       copied to another name does not decrypt.</li>
 *   <li>The SHA-256 of the original bytes is recorded and checked again on every read.</li>
 * </ul>
 */
@Component
public class ProofStorage {

    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Pattern KEY = Pattern.compile("^[0-9a-f]{32}$");
    private static final Logger log = LoggerFactory.getLogger(ProofStorage.class);

    public record Stored(String key, String fileName, String contentType, long sizeBytes, String sha256) { }

    private final Path dir;
    private final SecretKeySpec key;   // null = not configured
    private final SecureRandom random = new SecureRandom();

    ProofStorage(@Value("${erp.membership.proof-dir}") String dir, @Value("${erp.membership.proof-key:}") String base64Key) {
        this.dir = Path.of(dir).toAbsolutePath().normalize();
        SecretKeySpec k = null;
        if (base64Key != null && !base64Key.isBlank()) {
            byte[] raw = Base64.getDecoder().decode(base64Key.trim());
            if (raw.length != 32) throw new IllegalStateException("erp.membership.proof-key must be 32 bytes (base64), got " + raw.length);
            k = new SecretKeySpec(raw, "AES");
        } else {
            log.warn("MEMBERSHIP_PROOF_KEY is not set: registrations with a payment proof will be refused until it is");
        }
        this.key = k;
    }

    /** The image type from the file's magic bytes, or null when it is not an accepted image. */
    static String sniff(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "image/jpeg";
        if (b.length >= 8 && Arrays.equals(Arrays.copyOf(b, 8), new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})) return "image/png";
        if (b.length >= 12 && new String(b, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                && new String(b, 8, 4, StandardCharsets.US_ASCII).equals("WEBP")) return "image/webp";
        return null;
    }

    public static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    /** Checks the image without saving it (so a bad request never leaves a file behind). */
    public static String checkImage(byte[] bytes) {
        if (bytes.length > MAX_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE", "The payment screenshot is larger than 5 MB.");
        }
        String type = bytes.length == 0 ? null : sniff(bytes);
        if (type == null) throw new FieldErrorsException(Map.of("proof", "Upload a JPEG, PNG or WebP image of the payment."));
        return type;
    }

    public Stored store(byte[] bytes, String originalName) {
        String type = checkImage(bytes);
        if (key == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "PROOF_STORAGE_NOT_CONFIGURED",
                    "Payment screenshots can't be saved yet: the server's storage key is not configured.");
        }
        String name = UUID.randomUUID().toString().replace("-", "");
        try {
            Files.createDirectories(dir);
            byte[] iv = new byte[12];
            random.nextBytes(iv);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
            c.updateAAD(name.getBytes(StandardCharsets.US_ASCII));
            byte[] sealed = c.doFinal(bytes);
            byte[] out = new byte[iv.length + sealed.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(sealed, 0, out, iv.length, sealed.length);
            Path tmp = Files.createTempFile(dir, "upload-", ".tmp");
            Files.write(tmp, out);
            Files.move(tmp, dir.resolve(name), StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException | GeneralSecurityException e) {
            throw new IllegalStateException("Could not store payment proof", e);
        }
        return new Stored(name, displayName(originalName), type, bytes.length, sha256(bytes));
    }

    public byte[] read(String name, String expectedSha256) {
        if (key == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "PROOF_STORAGE_NOT_CONFIGURED", "The server's storage key is not configured.");
        }
        try {
            byte[] all = Files.readAllBytes(path(name));
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, all, 0, 12));
            c.updateAAD(name.getBytes(StandardCharsets.US_ASCII));
            byte[] plain = c.doFinal(all, 12, all.length - 12);
            if (!sha256(plain).equals(expectedSha256)) throw new GeneralSecurityException("hash mismatch");
            return plain;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "PROOF_MISSING", "The payment screenshot file is missing.");
        } catch (GeneralSecurityException e) {
            log.error("Payment proof {} failed the integrity check", name);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PROOF_INTEGRITY", "The payment screenshot failed its integrity check.");
        }
    }

    /** Best effort, used only to undo a save whose database transaction failed. */
    public void delete(String name) {
        try {
            Files.deleteIfExists(path(name));
        } catch (IOException | RuntimeException e) {
            log.warn("Could not delete orphan payment proof {}", name);
        }
    }

    private Path path(String name) {
        if (name == null || !KEY.matcher(name).matches()) throw new IllegalArgumentException("bad proof key");
        return dir.resolve(name);
    }

    /** The uploaded name, for display only: no directories, no control characters, at most 255 characters. */
    static String displayName(String original) {
        if (original == null || original.isBlank()) return "payment-proof";
        String n = original.replace('\\', '/');
        n = n.substring(n.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}\"]", "").strip();
        if (n.isEmpty()) n = "payment-proof";
        return n.length() > 255 ? n.substring(0, 255) : n;
    }
}
