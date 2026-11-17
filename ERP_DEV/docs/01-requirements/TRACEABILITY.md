# Traceability — requirement → source → design → test

Design and test columns get filled in as increments are built. "TBD" means not built yet.

| REQ | Source | Design | Test |
|---|---|---|---|
| REQ-IAM-001 | BP §2/§18, AB | ADR-002; AUTHENTICATION §1, §9 | Schema check: no password/OTP/token columns ✅; log scans S5/S6: 0 secrets/JWTs ✅; S4/S5 live: passwords typed only on Keycloak pages ✅ |
| REQ-IAM-002 | AB, BP §13 | AUTHENTICATION §4 step 1; api.md §3 | `EmployeeOnboardingTest` (create 201, normalisation, duplicate 409, validation 400, idempotency) ✅; S5 live check 7–8 ✅ |
| REQ-IAM-003 | AB, BP §13 | AUTHENTICATION §4 step 2; KEYCLOAK-SETUP §5.3 | `EmployeeOnboardingTest` (real Keycloak: user + required actions + role) ✅ |
| REQ-IAM-004 | AB, BP §9 | AUTHENTICATION §4 step 3; KEYCLOAK-SETUP §8 | `EmployeeOnboardingTest` (email in Mailpit) ✅; S5 live checks 1–3 (link → set password) ✅ |
| REQ-IAM-005 | AB | AUTHENTICATION §7, §8 | `EmployeeOnboardingTest` (sync → ACTIVE) ✅; S5 live check 5 ✅ |
| REQ-IAM-006 | AB, BP §3 | AUTHENTICATION §5; KEYCLOAK-SETUP §2–5; web `auth.ts` | S1 live checks 2–3 (password grant refused, PKCE enforced) ✅; S4 scripted code+PKCE login: wrong password refused, code replay refused ✅; S5 live lockout ✅ |
| REQ-IAM-007 | AB, BP §3/§11, SOW §25.2 | AUTHENTICATION §5 step 4; api.md §1; access-service `SecurityConfig` | `MeEndpointTest` (no token, expired, other realm, other audience, unknown key → 401) ✅; `GatewayRoutingTest` (no token / wrong audience → 401 before routing) ✅ |
| REQ-IAM-008 | AB, BP §11, SOW §22 | AUTHENTICATION §3; KEYCLOAK-SETUP §6 | CI realm-check (composites, MANAGER without employees.manage) ✅; `EmployeeOnboardingTest.onlyAdminsManageEmployees`, `AccountManagementTest` (roles.assign) ✅; S6 live 3, 12–14 ✅ |
| REQ-IAM-009 | AB | AUTHENTICATION §6; web `auth.ts`/`api.ts` | `api.test.ts` (401 → refresh → sign-in) ✅; S4 live: refresh rotation, end-session logout, password asked again ✅ |
| REQ-IAM-010 | AB, BP §13 | AUTHENTICATION §7 | `AccountManagementTest` (real Keycloak: disable/enable, reason required, sync keeps DISABLED) ✅; `ProvisioningFailureTest` (Keycloak down → 502, nothing changed) ✅; S6 live 4–9 ✅ |
| REQ-IAM-011 | AB | AUTHENTICATION §10 | `ProvisioningFailureTest` F1 (down → 202 → job), F2 (adopt / refuse), F4 (email failed → retry) ✅ |
| REQ-IAM-012 | BP §17, SOW §25.1 | AUTHENTICATION §9, §11; KEYCLOAK-SETUP §7; Flyway V1 trigger | `AuditAppendOnlyTest` (append-only) ✅; `EmployeeOnboardingTest` audit sequence ✅; S5 live audit trail ✅ |
| REQ-IAM-013 | AB | KEYCLOAK-SETUP §10 | `ProvisioningFailureTest` bootstrap (+ no duplicate on restart) ✅; S5 live bootstrap → email → ACTIVE ✅ |
| REQ-IAM-014 | ASSUMED | AUTHENTICATION §7 | `ProvisioningFailureTest` (last admin, self) ✅; S6 live 15 ✅ |
| REQ-LEAD-001 | AB, LP | api.md §2 | TBD (Inc 2) |
| REQ-LEAD-002 | BP §6/§9/§12.2 | api.md §2 (D-114) | TBD (Inc 2) |
| REQ-LEAD-003 | BP §9, SOW §4 | api.md §2 | TBD |
| REQ-LEAD-004 | BP §5/§9 | ARCHITECTURE §5; api.md §5 | TBD |
| REQ-LEAD-005 | BP §10.1 | api.md §4 | TBD |
| REQ-LEAD-006 | BP §10.4 | api.md §4 | TBD |
| REQ-LEAD-007 | BP §9 | api.md §2 | TBD |
| REQ-MEM-001 | SOW ERP-05; OD | `V2__gold_membership.sql`; `MembershipService.validate`; api.md §3a | `MembershipTest` (cardNeedsTransactionId, scanQrNeedsAProofImage, amountMustBePositive…, missingCustomerFields…) ✅ |
| REQ-MEM-002 | SOW ERP-05; CS; D-117 | `membership_number_counter` (UPDATE … RETURNING in the registration transaction) | `MembershipTest` (numbersAreConsecutive…, parallelRegistrations…, nextNumberPreview…) ✅ |
| REQ-MEM-003 | Rules §11 | `ProofStorage` (magic bytes, 5 MB, AES-256-GCM, SHA-256); gateway route limit 6 MB | `MembershipTest` (proofIsStoredEncrypted…, proofMustReallyBeAnImage, proofOver5MbIsRejected) ✅; `GatewayRoutingTest` (membershipRegistrationAllowsTheUploadLimitButNotMore) ✅ |
| REQ-MEM-004 | SOW ERP-05; D-118 | `MembershipService.verify/reject`; realm roles `memberships.*` | `MembershipTest` (queueShowsPending…, nobodyVerifiesTheirOwnRegistration, rejectNeedsAReason…, unknownMemberIs404) ✅ |
| REQ-MEM-005 | OD | partial unique indexes `resort_member_*_live` | `MembershipTest` (aRejectedPersonCanRegisterAgain…) ✅ |
| REQ-MEM-006 | Rules §6 | `AuditLog.record(…, "MEMBER", …)` | `MembershipTest` (audit rows checked) ✅ |
| REQ-MEM-007 | Rules §4 | `idempotency_key` | `MembershipTest` (sameIdempotencyKey…) ✅ |
| REQ-MEM-008 | SOW ERP-05; D-119…D-122 | MEMBER-LOGIN.md; extension `gh-member-activation`; realm `gh-guests`; guest-service; `MembershipService.welcome` | `ActivationFlowIT` 5/5 (real Keycloak: email → set password once → code → token; single use; forged links) ✅; `GuestProvisioningTest` 9/9 ✅; `MembershipTest` welcome tests (4) ✅; web resend test ✅; landing `/member/activate` (S6) ✅ build; returning sign-in (D-127…D-130; root cause: silent-check redirect refused, fixed live): `ActivationFlowIT` asserts a persistent session after the link and after a normal sign-in, wrong password refused, LOGIN/UPDATE_PASSWORD/LOGIN_ERROR stored (to run when Docker is up); `GuestProvisioningTest` +3 sign-in record tests (to run); live phone test TBD (S7) |
| REQ-MEM-009 | SOW ERP-05; D-123 | `PortalMembershipController` (api.md §3c); access-service portal security chain; gateway portal chain (D-126) | `MembershipPortalTest` 6/6 (own data only, no payment fields, WhatsApp opt-in, first sign-in, staff token 401, member token on staff path 401) ✅; `GatewayRoutingTest` portal routing + /internal not exposed ✅; landing page S6: `/membership`, `/profile` real data via `guest-session.ts`; build + typecheck ✅; live smoke: themed Keycloak page for guest-web, foreign redirect 400, PKCE required ✅; phone end to end TBD (S7) |
| REQ-MEM-010 | SOW ERP-05 (member registration); Discovery Call [22:56]; D-131 | `IdentityNumbers`; `V3__member_smart_fields.sql` (masked + HMAC, `resort_member_id_live`); `web/src/smartFields.ts`; Memberships form ID proof | `IdentityNumbersTest` 4/4; `MembershipTest` (storesOnlyTheMasked…, aadhaarMustHave12Digits…, aDrivingLicence…, oneIdProofHoldsOneLive…) ✅; web Aadhaar format/typo/mask test ✅ |
| REQ-MEM-011 | SOW ERP-05; D-132 | `MembershipService.validate` (IST, 18 years); DB CHECK `resort_member_form2_complete`; form `max` + age pill | `MembershipTest` (customerMustBe18…, theDatabaseRefusesAnUnder18…) ✅; web age pill / disabled Register ✅ |
| REQ-MEM-012 | SOW ERP-05; D-133 | Structured address (pincode, city, state, country), `IndianStates`, pincode lookup (India Post data, Q-040), mobile/name normalisation, config fee chips | `MembershipTest` (addressNeeds…, mobileAccepts…, namesAreTitleCased) ✅; web pincode auto-fill, mobile, chips, drawer tests ✅ |
