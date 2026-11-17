package com.quantumclk.erp.access.membership;

import com.quantumclk.erp.access.employee.Employee;
import com.quantumclk.erp.access.employee.EmployeeRepository;
import com.quantumclk.erp.access.membership.MemberView.NextNumber;
import com.quantumclk.erp.access.membership.MemberView.PageView;
import com.quantumclk.erp.access.membership.MembershipService.ProofFile;
import com.quantumclk.erp.access.membership.MembershipService.RegisterForm;
import com.quantumclk.erp.access.membership.MembershipService.Staff;
import com.quantumclk.erp.access.membership.MembershipService.Upload;
import com.quantumclk.erp.access.web.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Field registration of Gold Members by Sales Executives (ERP-05; api.md "Memberships"). An executive sees only the
 * members they enrolled; verification lives in {@link MembershipAdminController}.
 */
@RestController
@RequestMapping("/api/v1/sales/memberships")
public class MembershipController {

    private final MembershipService service;
    private final EmployeeRepository employees;

    MembershipController(MembershipService service, EmployeeRepository employees) {
        this.service = service;
        this.employees = employees;
    }

    @GetMapping("/next-number")
    @PreAuthorize("hasAuthority('PERM_memberships.register')")
    NextNumber nextNumber() {
        return service.nextNumber();
    }

    /** multipart/form-data: the customer and payment fields, plus an optional image part "proof" (required for SCAN_QR). */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('PERM_memberships.register')")
    ResponseEntity<MemberView> register(@RequestParam(required = false) String firstName, @RequestParam(required = false) String lastName,
                                        @RequestParam(required = false) String dob, @RequestParam(required = false) String mobile,
                                        @RequestParam(required = false) String email, @RequestParam(required = false) String address,
                                        @RequestParam(required = false) String paymentType, @RequestParam(required = false) String amount,
                                        @RequestParam(required = false) String transactionId,
                                        @RequestParam(required = false) String idType, @RequestParam(required = false) String idNumber,
                                        @RequestParam(required = false) String pincode, @RequestParam(required = false) String city,
                                        @RequestParam(required = false) String state, @RequestParam(required = false) String country,
                                        @RequestPart(name = "proof", required = false) MultipartFile proof,
                                        @RequestHeader("Idempotency-Key") UUID key, JwtAuthenticationToken auth,
                                        HttpServletRequest http) throws IOException {
        Upload upload = proof == null || proof.isEmpty() ? null : new Upload(proof.getBytes(), proof.getOriginalFilename());
        MemberView m = service.register(new RegisterForm(firstName, lastName, dob, mobile, email, address, paymentType, amount,
                transactionId, idType, idNumber, pincode, city, state, country), upload, staff(employees, auth, http), key);
        return ResponseEntity.status(HttpStatus.CREATED).body(m);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_memberships.read_own')")
    PageView mine(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size,
                  JwtAuthenticationToken auth, HttpServletRequest http) {
        return service.listOwn(staff(employees, auth, http), page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_memberships.read_own')")
    MemberView one(@PathVariable UUID id, JwtAuthenticationToken auth, HttpServletRequest http) {
        return service.getOwn(id, staff(employees, auth, http));
    }

    @GetMapping("/{id}/proof")
    @PreAuthorize("hasAuthority('PERM_memberships.read_own')")
    ResponseEntity<byte[]> proof(@PathVariable UUID id, JwtAuthenticationToken auth, HttpServletRequest http) {
        MembershipService.ProofFile f = service.proof(service.getOwn(id, staff(employees, auth, http)));
        return image(f);
    }

    /** The signed-in employee's ERP record. Without one there is nobody to name as the enrolling executive. */
    static Staff staff(EmployeeRepository employees, JwtAuthenticationToken auth, HttpServletRequest http) {
        UUID sub;
        try {
            sub = UUID.fromString(auth.getToken().getSubject());
        } catch (IllegalArgumentException e) {
            sub = null;
        }
        Employee e = sub == null ? null : employees.findByKeycloakUserId(sub).orElse(null);
        if (e == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NO_EMPLOYEE_RECORD",
                    "Your sign-in has no ERP employee record. Ask an administrator to add you under Employees.");
        }
        return new Staff(e.getId(), (e.getFirstName() + " " + e.getLastName()).strip(), e.getUsername(), http.getRemoteAddr());
    }

    /** Streams a decrypted proof: inline, never cached, never sniffed into something else. */
    static ResponseEntity<byte[]> image(ProofFile f) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(f.contentType()))
                .cacheControl(CacheControl.noStore().cachePrivate())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(f.fileName(), StandardCharsets.UTF_8).build().toString())
                .body(f.bytes());
    }
}
