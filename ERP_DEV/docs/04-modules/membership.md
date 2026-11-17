# Module: Gold Membership (SOW ERP-05 Membership & Loyalty)

Status: **S1, S5 built; S3 built and tested** (customer account + welcome email + automatic sign-in: guest-service, Keycloak realm `gh-guests`, extension `gh-member-activation`; see [MEMBER-LOGIN.md](../02-architecture/identity/MEMBER-LOGIN.md)). **S4 built:** `GET /api/v1/portal/membership/me` (api.md §3c). **S6 built:** the landing page signs members in with Keycloak and shows their real card (below).
Decisions: D-116…D-125 (DECISIONS.md). Open questions: Q-030…Q-037. API: [api.md §3a](../02-architecture/api.md).

## What it does

1. A **Sales Executive** pitches Gold Membership on site and fills in the customer's details and the payment in the staff ERP: Cash, Card (with the transaction ID), or Scan QR (with a screenshot of the payment, from the gallery or the phone camera).
2. The registration is saved at once as **PENDING_VERIFICATION** and gets the next number of the client's series, e.g. `GRH-LM-0101`.
3. An **Admin or Manager** opens the verification queue, looks at the details and the screenshot, and either **verifies** it (the membership becomes **ACTIVE** for 12 months) or **rejects** it with a reason.
4. On verification access-service asks guest-service for the customer's account (Keycloak `gh-guests`). Keycloak sends **one welcome email** with the Member ID and a one-time *Set your password* link. The customer sets the password once and arrives signed in on the landing page (S6 shows their card and booklet). If anything in that step fails, the membership stays ACTIVE and the queue shows **Resend welcome email**.

## Rules and why they exist

| Rule | Why | Source |
|---|---|---|
| Membership IDs come from the series `GRH-LM-0101 … GRH-LM-5100`, without gaps | The client already numbers members and voucher booklets this way. A gap would look like a lost booklet | `LM Mem ID.xlsx`, `Golden_Hills_Resort_Loyalty_Voucher_Numbers_5000.xlsx`; D-117 |
| The number is taken inside the registration's database transaction | If the save fails, the number goes back. Parallel registrations queue on one counter row instead of colliding | REQ-MEM-002 |
| The form shows a *provisional* number | Two executives may see the same preview; only the save decides | REQ-MEM-002 |
| Verify/reject only by ADMIN or MANAGER, never by the person who enrolled the member | Separation of duties: the person who took the money does not confirm it | D-118 |
| Only a pending registration can be decided | Stops a second click (or a second manager) from changing a decision | REQ-MEM-004 |
| One live membership per email and per mobile; rejected ones don't count | The same person can't hold two Gold memberships, but a failed payment can be redone | REQ-MEM-005 |
| Screenshots: JPEG/PNG/WebP ≤ 5 MB, checked by their first bytes, stored AES-256-GCM encrypted under a random name, SHA-256 kept and re-checked | Payment screenshots are personal/payment data (engineering rules §11). A renamed script must not pass as an image | REQ-MEM-003 |
| Money is `NUMERIC(12,2)` rupees and travels as a string `"25000.00"` | No floating point for money (rules §1) | — |
| The fee is entered by the executive; nothing checks it against a price | The client has not given the Gold fee yet | Q-030 |
| Quick amount chips only from `VITE_GOLD_FEE_CHIPS` (none by default) | No guessed prices | Q-030; D-133 |
| ID proof: Aadhaar or driving licence. Aadhaar = 12 digits, first 2–9, Verhoeff check digit | What the client asked for; the checksum catches typos before saving | Discovery Call [22:56]; D-131 |
| Only the masked ID (XXXX-XXXX-0123) and a **keyed** hash are stored; one live membership per ID | Aadhaar must not be kept in full; an unkeyed hash of ~10^12 numbers could be reversed. The hash still lets the DB refuse duplicates | D-131 |
| 18 or older on the registration date (IST); checked in the form, the API and the DB | Members sign a contract; the DB rule uses the registration date, so it never shifts | D-132 |
| Address = street + pincode + city + state + country (India). Pincode auto-fill from India Post data only | Clean, searchable addresses without invented data | D-133; Q-040 |
| Mobile = Indian 10 digits starting 6–9 (pasted +91/91/0 removed); names and city title-cased; email lower-cased | Fewer typos and duplicates from formatting | D-133 |
| Members registered before these rules keep `registration_form = 1` and show "ID proof: not recorded" | Members are never deleted or back-filled with guesses | D-134 |
| Every change is in `audit_event` (`entity_type = 'MEMBER'`) | Append-only history of who registered, verified or rejected, with the reason | Rules §6 |
| Members are never deleted | A rejected registration is part of the payment history | — |

## Staff ERP screen (`web/src/Memberships.tsx`, menu **Memberships**; for a Sales Executive it is their only menu item, called **Dashboard**, D-135)

| Tab | Who | What |
|---|---|---|
| Register member | anyone with `memberships.register` | Customer details; the brass **provisional** member number (confirmed on submit); the Gold badge; payment pills **Cash / Card / Scan QR** with only the fields each one needs; for Scan QR the resort UPI QR (`VITE_UPI_QR_URL`, "not configured" until the client supplies it, Q-031) and the screenshot: **Choose from gallery** or **Open camera** (`capture="environment"` opens the rear camera on phones), preview with Replace / Retake / Remove. Photos over 1.5 MB are shrunk in the browser to at most 2000 px (JPEG) before upload. The executive card (name, username, today's date) is read-only, taken from the signed-in account |
| My members | `memberships.read_own` | The executive's own registrations and their status |
| Verification queue | `memberships.read_all` | Badge with the pending count; filter Pending / Active / Rejected / All; **Review** opens a drawer with all details and the screenshot (tap to zoom to read the UTR); **Verify & activate**, or **Reject** with a required reason. On a registration the viewer enrolled, the buttons are replaced by a note (the server refuses it anyway) |

The screen only hides what the person can't use; every rule is enforced by the server. The CSP allows `blob:` images for the preview and the screenshot viewer. Phone layout: tabs, menu and payment pills stack below 640 px.

## Landing page (S6; D-123)

| Where | What changed (nothing removed) |
|---|---|
| `guest-auth.ts` (new) | keycloak-js 26.2.5: realm `gh-guests`, client `guest-web`, PKCE S256, tokens in memory, silent session check (`public/silent-check-sso.html`). Keycloak address: `NEXT_PUBLIC_KEYCLOAK_URL`, else the site's own origin (shared tunnel), else `http://localhost:8081` when the site runs on `localhost:3000` |
| `/member/activate` (new) | The welcome-email link. Reads `t`, starts a PKCE sign-in with `activation_token`, returns to `/membership?welcome=1` |
| `guest-session.ts` | A real session next to Ritvik's sample one: kind `member` (verified Gold Membership from `GET /api/v1/portal/membership/me`) or `guest` (signed in, no membership). Real usage is 0 (redemptions are recorded at the resort). `?welcome=1` scrolls to the card. Also calls guest-service `/portal/me` (sign-in record, D-128). If the membership service can't be reached the page says so with **Try again**, instead of the non-member view. Members stay signed in up to 30 days (D-127; MEMBER-LOGIN §8) |
| `/membership`, `/profile` | The card, hero and booklet show the real number, holder and validity. `/profile` adds status, amenities (`member-benefits.ts`, each "to be confirmed", Q-032) and the concierge (executive; WhatsApp/call only if they share a number, else the resort desk) |
| `profile-sign-in.tsx` | Email tab: email only, then Keycloak. Membership-ID tab: unchanged labelled sample preview. Sample IDs use `GRH-LM-0000` |
| `/login`, `/plan-ahead` | Email tab: email only, then Keycloak ("Forgot password?" opens Keycloak's page, which has the reset link). Register: name/email/phone, then Keycloak registration. OTP and Booking-ID tabs visible but disabled, "Coming soon". Fake offline sign-ins removed. Quick-demo buttons fill the email only. A real Gold Member's folio card on `/plan-ahead` shows "Gold Member · GRH-LM-####" and privileges left; non-members unchanged (Q-036) |
| `portal-client.ts`, `next.config.ts` | API calls are same-origin (`/api/v1/portal`); on `localhost:3000` Next rewrites `/api` to the gateway (`GATEWAY_URL`, default `http://localhost:8082`) |

Not changed (increment 2): the reservation-request form still shows an "Offline Preview" reference when the enquiry service is unreachable (lead-service doesn't exist yet).

## Data (access_db, migration `V2__gold_membership.sql`)

- `membership_number_counter`: one row per series (`GRH-LM`, next 101, last 5100).
- `resort_member`: the customer, status (`PENDING_VERIFICATION` → `ACTIVE` | `REJECTED`), who enrolled them (id + name + username snapshot), who decided and when, validity, and (S3) the customer's Keycloak id `guest_user_id` with `account_status`.
- V3 (`V3__member_smart_fields.sql`): `registration_form`, `id_type`, `id_number_masked`, `id_number_hash` (HMAC, partial unique `resort_member_id_live`), `pincode`, `city`, `state`, `country`; CHECK `resort_member_form2_complete` (all present and 18+ for form 2).
- `member_payment`: type, amount, currency, transaction ID, proof file metadata (opaque key, original name for display, type, size, SHA-256), status and rejection reason.

## Code map (`services/access-service`, package `com.quantumclk.erp.access.membership`)

| Class | Responsibility |
|---|---|
| `MembershipController` | `/api/v1/sales/memberships…`: register (multipart), own list/detail/proof, number preview. Resolves the signed-in employee (`NO_EMPLOYEE_RECORD` if there is no ERP row) |
| `MembershipAdminController` | `/api/v1/admin/memberships…`: queue with `pendingCount`, detail, proof, verify, reject |
| `MembershipService` | All rules: validation and normalisation, numbering, idempotency, state changes, audit, reading views |
| `ProofStorage` | Image checks, encryption at rest, integrity check on read |
| `IdentityNumbers` | Aadhaar/licence rules (Verhoeff), normalising, masking, keyed hash |
| `IndianStates` | The 28 states + 8 UTs for the address |
| `MemberView` | The JSON shape returned to the ERP |

## Configuration

| Name | Meaning | Default |
|---|---|---|
| `MEMBERSHIP_PROOF_KEY` | AES-256 key, base64 of 32 random bytes (`openssl rand -base64 32`). Without it Scan-QR registrations get 503 | none |
| `MEMBERSHIP_PROOF_DIR` | Folder for the encrypted files; back it up together with the database | `./data/membership-proofs` (git-ignored) |
| `MEMBERSHIP_VALIDITY` | Validity from verification (ISO period) | `P12M` |
| `MEMBERSHIP_ID_HASH_KEY` | HMAC key for the ID-proof hash, base64 of ≥ 32 random bytes. Required to register; don't change it later | none |
| web `VITE_GOLD_FEE_CHIPS` | Quick amounts on the form, e.g. `25000,30000,50000` | empty (no chips) |
| gateway `MAX_UPLOAD_SIZE` | Body limit on `POST /api/v1/sales/memberships` only | `6MB` |

Keycloak (`gh-staff`, client `erp-api`): roles `memberships.register`, `memberships.read_own`, `memberships.read_all`, `memberships.verify`, mapped into the realm roles and into the `erp-web` token scope. A realm created before 2026-11-16 needs them added once; see [KEYCLOAK-SETUP §5.4](../02-architecture/identity/KEYCLOAK-SETUP.md).

## Tests

**Smart fields (D-131…D-134):** backend `MembershipTest` +9 (masked + keyed hash only, nothing of the full number in response/DB/audit; 18 exactly → 201, a day short → 400; Aadhaar checksum / 0–1 start / length; licence; pincode/city/state/country; pasted mobiles; title case; one live membership per ID, re-register after rejection → 201; DB refuses an under-18 form-2 row) and `IdentityNumbersTest` (4). Web `smartFields.test.ts` (6) and `Memberships.test.tsx` +5 (age pill and disabled Register, Aadhaar format/typo/mask, pincode auto-fill, mobile clean + tick + title case, amount chips, masked ID + full address in the drawer, "not recorded" for older members).

Web: `Memberships.test.tsx` (10 tests: provisional ID and locked executive card, multipart submit with Idempotency-Key, card/QR fields, camera and gallery inputs, preview/remove, no submit without a screenshot, server field errors, my members, queue badge, review + verify, reject needs a reason, no Verify on one's own registration) and `api.test.ts` (FormData, image Blob). Backend: `MembershipTest` (21 tests, real PostgreSQL via Testcontainers): validation per field, payment rules, gap-free numbering (sequential and 6 in parallel), idempotency, encryption on disk, who may download a proof, uniqueness after rejection, RBAC, self-verification, the verify/reject state machine and the audit rows. Gateway: `GatewayRoutingTest` checks the per-route upload limit.

## Not built yet

Live end-to-end test on a phone (S7). Voucher redemption tracking, renewals, points and RFID cards are later ERP-05/ERP-06 work.
