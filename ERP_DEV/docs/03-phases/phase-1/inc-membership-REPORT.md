# Increment "Gold Membership" (SOW ERP-05): report

Status: **built and committed (S0–S6); live end-to-end test (S7) pending Ashish.** Branch `feature/phase1-membership`, not pushed.
Plan: [inc-membership-PLAN.md](inc-membership-PLAN.md). Decisions D-116…D-126. Open questions Q-030…Q-037.

## 1. What was delivered

| Slice | What | Commit |
|---|---|---|
| S0 | Pending WIP committed in groups; Ritvik's landing page copied from `origin/Ritvik-Frontend` 2c164d9 (not merged); hard-delete reverted (D-125) | 9a58edb, 4dee064, 4772b89, f22f828 |
| S0b | One public origin split by path: Caddy proxy, landing `/`, ERP `/erp/`, Keycloak `/realms`, API `/api` (D-124) | 97c5e0c |
| S1+S2 | Membership backend: GRH-LM numbering, registration with encrypted payment proof, verification by ADMIN/MANAGER, audit; gateway upload limit | 4267d1b |
| S5 | Staff ERP **Memberships** screen: register (camera/gallery proof), my members, verification queue | 4da643a |
| S3 | Realm `gh-guests` + Keycloak extension `gh-member-activation` (welcome link → set password once → signed in); guest-service; welcome email on verification + resend | f9be13b, 6044e6b |
| S4 | Member portal API `GET /api/v1/portal/membership/me`; gateway passes guest tokens to services (D-126) | dff8b5c |
| S6 | Landing page: Keycloak PKCE sign-in, `/member/activate`, real Gold card on `/membership` + `/profile`, `/login` + `/plan-ahead` per D-123 | 7b8da30 |

## 2. Test evidence (all run on 2026-11-16)

| Component | Result |
|---|---|
| access-service `mvn test` | **57/57** (MembershipTest 25, MembershipPortalTest 6, MeEndpoint 9, ProvisioningFailure 8, AccountManagement 4, EmployeeOnboarding 3, AuditAppendOnly 2) |
| api-gateway `mvn test` | **15/15** |
| guest-service `mvn test` | **9/9** |
| Keycloak extension `mvn test` (`ActivationFlowIT`, real Keycloak 26.8.2 + Mailpit) | **5/5**: email → Update password page directly → one submit → code → PKCE token; single use; forged/replaced links refused; send endpoint 401/400/404; least privilege; standard flows kept |
| web `npm test` / lint / build | **33/33**, clean |
| landing-page typecheck / build | ok (19 pages); eslint: no new findings |
| CI realm checks (run locally) | gh-staff 14/14, gh-guests 15/15 |
| Live (dev stack) | V2 migration applied (counter GRH-LM 101); guest_db created; Keycloak recreated: gh-guests imported, gh-staff untouched, extension loaded; guest-service up; access-service token carries `guests.provision`; landing pages 200 through the proxy; guest-web sign-in page themed with login_hint; foreign redirect 400; PKCE required |

## 3. Live end-to-end test (S7): steps for Ashish

Before: restart **access-service** and **api-gateway** (they still run pre-S1 code), keep guest-service running (:8092), restart `next dev` if it was started before the `.env.local` change, and keep `ngrok http 127.0.0.1:8088 --url=…` running (IPv4, see KEYCLOAK-SETUP §1.1). Run `ERP_DEV/check-stack.ps1` first: every line must say OK. Sign out and back in on the ERP.

1. Phone → `https://<public host>/erp/` → sign in as a **Sales Executive** → **Memberships → Register member**. Fill in a test customer whose **email is an inbox you own**. Choose **Scan QR**, tap **Open camera**, photograph any payment screen, then **Register member**. ✅ "GRH-LM-0101 is registered…".
2. Sign in as a **Manager or Admin** (another person) → **Verification queue** (badge 1) → **Review** → check the screenshot (tap to zoom) → **Verify & activate**. ✅ Status Active; customer account "Welcome email sent".
3. The inbox receives **"Welcome to the Golden Hills Privilege Club"** (through your SMTP) with GRH-LM-0101, the validity date and **Set your password**.
4. Tap the button on the phone. ✅ It opens the Golden Hills page "Update password" directly (no sign-in form).
5. Set a password (12+ characters) once. ✅ You land on `/membership`, signed in, scrolled to the card: your name and GRH-LM-0101, "180 of 180 privileges still yours", validity.
6. Open `/profile`: ✅ status, amenities (marked "to be confirmed"), concierge (the Sales Executive).
7. Refresh: ✅ still signed in. In the ERP the account now shows **"Customer has signed in"**.
8. Tap the email link again: ✅ normal sign-in page (the link worked once).
9. Sign out, then sign in from `/login` with email → Keycloak → password: ✅ back on your card.
10. **Close the browser completely** (swipe it away), open the site again: ✅ still signed in, card shown ("Keep me signed in", D-127).
11. **Another browser** on the phone (or the site in Chrome after opening the email in Gmail): `/membership` → email → **Sign in** → Golden Hills page → the password → ✅ the card. A wrong password: ✅ an error on that page.
12. guest_db: ✅ `guest_account` shows `first_signed_in_at`, `last_signed_in_at`, `sign_in_count`; `audit_event` has `GUEST_SIGNED_IN` (D-128).
13. Reject path: register a second test customer, **Reject** with a reason: ✅ status Rejected with the reason; the same email/mobile can be registered again.

Record the results in DEVLOG and tick REQ-MEM-008/009 in TRACEABILITY.

## 4. Deviations from the plan (all recorded)

- **Audit table:** the existing append-only `audit_event` is used instead of a new `member_audit_log`; plain JDBC instead of JPA entities (S1).
- **Gateway tokens:** the gateway does not validate member tokens; services do, and portal paths have their own gateway chain (D-126, found by a test).
- **Extension location:** `infra/keycloak-extensions/…`, built into `infra/keycloak-providers/` (the plan said `infra/keycloak/providers`, which is the realm-import mount).
- **guest-service decoders:** one `IssuerDecoders` bean (test-replaceable).
- **Member pages:** Ritvik's `/membership` and `/profile` are connected to real data instead of building a separate folio (S6 amendment, owner decision).

## 5. Open items

- **Client answers (Q-030…Q-037):** Gold fee, UPI QR image, amenities/discounts, retention, guest session lengths, executive number sharing, "Privilege Member" label for non-members, series start.
- **Fake reservation reference:** the reservation form's "Offline Preview" made-up reference stays until lead-service (increment 2, owner decision).
- **Voucher tracking:** per-voucher redemption and QR are deferred (later ERP-05 work).
- **Push:** blocked (GitHub token needs the `workflow` scope); nothing is pushed.
