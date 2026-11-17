# Phase 1 Requirements Baseline

- Status: **Draft. Waiting for Ashish's review** (2026-11-15). The client hasn't approved these items yet. Anything not taken from a client source is marked `[ASSUMED]` or linked to an open question.
- Source key: **SOW** = `sow-extract.md`; **BP** = `phase1-blueprint-extract.md`; **DC** = `discovery-call-extract.md`; **LP** = `landing-page-extract.md`; **AB** = Ashish's decision of 2026-11-15 (DEVLOG).
- Priority: Must / Should. Inc = delivery increment (phase1_plan.md §6).

## Identity & employee accounts (Increment 1)

| ID | Requirement | Source | Pri | Inc | Acceptance criteria |
|---|---|---|---|---|---|
| REQ-IAM-001 | Keycloak is the only authentication and credential store for employees; the ERP stores no passwords, OTPs or tokens | BP §2 ADR-006, §18; AB | Must | 1 | No password/OTP/token column in any ERP schema; code review + schema test |
| REQ-IAM-002 | An Admin creates an employee (first/last name, email, username, mobile, job role, WhatsApp preference); the profile is stored in `access_db` | AB; BP §13 | Must | 1 | POST creates a row; validation errors return 400 with fields; duplicate email/username/mobile → 409 |
| REQ-IAM-003 | Creating an employee creates and links the Keycloak user and assigns its realm role | AB; BP §13 | Must | 1 | Keycloak user exists with required actions; row has `keycloak_user_id`; role mapped |
| REQ-IAM-004 | Keycloak sends the verify-email + set-password email over the configured SMTP; no custom OTP or password page | AB; BP §9 | Must | 1 | Email arrives in Mailpit; link verifies email and sets password |
| REQ-IAM-005 | Admin sees each employee's account status (`PENDING_PROVISIONING`, `INVITED`, `INVITE_EMAIL_FAILED`, `ACTIVE`, `DISABLED`), kept in sync with Keycloak | AB | Must | 1 | Status becomes ACTIVE after setup without manual steps; job fixes drift within 5 min |
| REQ-IAM-006 | Employees log in with Keycloak OIDC Authorization Code + PKCE; wrong password, disabled or locked accounts are refused | AB; BP §3 | Must | 1 | Password grant disabled; PKCE required; lockout after 5 failures |
| REQ-IAM-007 | Every API checks the JWT (signature, issuer, expiry, audience): 401 without a valid token, 403 without permission | AB; BP §3, §11; SOW §25.2 | Must | 1 | Negative tests for each protected endpoint |
| REQ-IAM-008 | RBAC with realm roles ADMIN / MANAGER / SALES_EXECUTIVE made of permission client roles; record scope is checked separately | AB; BP §11; SOW §22 | Must | 1 | Permission matrix tests; out-of-scope record → 404 |
| REQ-IAM-009 | Logout ends the Keycloak session; expired sessions and invalid tokens send the user back to sign-in | AB | Must | 1 | After logout, the refresh token is rejected |
| REQ-IAM-010 | Admin activates or deactivates an employee (with a reason); deactivation disables the Keycloak user and revokes sessions | AB; BP §13 | Must | 1 | Login and refresh fail after deactivation; audit row written |
| REQ-IAM-011 | Keycloak API failures leave a visible, retryable status; employees are never half-created without the admin knowing | AB | Must | 1 | Failure tests F1–F6 (AUTHENTICATION §10) |
| REQ-IAM-012 | Account actions (create/edit/role/activate/deactivate/invite) are written to an append-only audit; logins come from Keycloak events | BP §17; SOW §25.1 | Must | 1 | Audit rows contain actor, time, IP, before/after, correlation id |
| REQ-IAM-013 | The first Admin is bootstrapped through the same invite flow; no password in env, scripts or realm file | AB (follows REQ-IAM-001) | Must | 1 | Fresh environment → invite email for the bootstrap admin |
| REQ-IAM-014 | Last-admin and self-deactivation guards | `[ASSUMED]` safety rule | Should | 1 | 409 on attempt |

## Guest inquiry & leads (Increment 2)

| ID | Requirement | Source | Pri | Inc | Acceptance criteria |
|---|---|---|---|---|---|
| REQ-LEAD-001 | The unchanged landing page keeps working: frozen `/api/v1/portal/**` contract | AB; LP | Must | 2 | Contract tests on field names; manual run of the landing page |
| REQ-LEAD-002 | A guest can register, log in and view own inquiries; guest credentials are held by Keycloak (`gh-guests`), never by an ERP service | BP §6, §9, §12.2 | Must | 2 | Register/login pass through to Keycloak `gh-guests` (D-114); no password column in guest_db |
| REQ-LEAD-003 | Inquiry submission validates dates/numbers, is rate-limited, and returns a unique public reference without internal IDs | BP §9 Journey D; SOW §4 (inquiry forms) | Must | 2 | Invalid dates → 400; burst → 429; reference format documented |
| REQ-LEAD-004 | Lead and `LeadCreated` outbox event commit in one transaction; a Kafka outage loses nothing | BP §5, §9 Journey E | Must | 2 | Kafka-down test |
| REQ-LEAD-005 | Sales Executive sees the queue and their own leads only | BP §10.1 | Must | 2 | Scope tests |
| REQ-LEAD-006 | Claiming is atomic: with concurrent claims, exactly one succeeds | BP §10.4 | Must | 2 | Parallel-claim test |
| REQ-LEAD-007 | Guests never see staff-only data (notes, SLA, assignee details beyond the frozen contract) | BP §9 Journey C | Must | 2 | Guest A cannot read guest B's inquiry; response fields checked |

## Gold Membership (SOW ERP-05; increment "Gold Membership", D-116…D-125, plan `inc-membership-PLAN.md`)
Source key addition: **OD** = Ashish's decisions of 2026-11-16 (DEVLOG, D-116…D-125); **CS** = client spreadsheets `LM Mem ID.xlsx` / `Golden_Hills_Resort_Loyalty_Voucher_Numbers_5000.xlsx`.

| ID | Requirement | Source | Pri | Inc | Acceptance criteria |
|---|---|---|---|---|---|
| REQ-MEM-001 | A Sales Executive registers a Gold Member on site: first/last name, date of birth, mobile, email, address, and the payment (Cash; Card + transaction ID; Scan QR + screenshot) | SOW ERP-05 "member registration and enrollment"; OD | Must | M | Missing/invalid fields → 400 per field; Card without transaction ID and Scan QR without screenshot → 400 |
| REQ-MEM-002 | The membership ID is the next unused number of the client series GRH-LM-0101 … GRH-LM-5100, gap-free, assigned when the registration is saved | SOW ERP-05 "membership ID generation"; CS; D-117 | Must | M | Consecutive numbers under parallel registrations; a failed registration uses no number; exhausted series → 409 |
| REQ-MEM-003 | Payment screenshots are JPEG/PNG/WebP up to 5 MB, stored encrypted with a SHA-256, and shown only to the enrolling executive and to verifiers | Rules §11; OD | Must | M | Fake image / > 5 MB refused; file on disk is ciphertext; another executive → 404, executive on admin path → 403 |
| REQ-MEM-004 | ADMIN or MANAGER verifies (ACTIVE, valid 12 months) or rejects with a reason; nobody verifies a member they enrolled; only pending registrations can be decided | SOW ERP-05 "validity", "status management"; D-118 | Must | M | Self-verify → 403; second decision → 409; reject without reason → 400; dates checked |
| REQ-MEM-005 | One live membership per email and per mobile; a rejected registration does not block a new one | OD | Must | M | Duplicate while pending/active → 409; after reject → 201 |
| REQ-MEM-006 | Every registration, verification and rejection is in the append-only audit log | Rules §6; SOW §25 | Must | M | Audit rows `MEMBER_REGISTERED/VERIFIED/REJECTED` with actor and reason |
| REQ-MEM-007 | A double-tapped submit creates one member (Idempotency-Key) | Rules §4 | Must | M | Same key twice → same member; same key with other data → 409 |
| REQ-MEM-008 | After verification the customer gets one email (member ID + secure set-password link), sets the password once and is signed in automatically on the landing page (Keycloak `gh-guests`, PKCE) | SOW ERP-05 "membership portal", "member dashboard"; D-119…D-122 | Must | M | S3/S6 tests and live phone test |
| REQ-MEM-009 | A signed-in member sees only their own membership (card, validity, booklet, enrolling executive) | SOW ERP-05 "member dashboard"; D-123 | Must | M | Guest A cannot read guest B; staff token on portal path → 401 |

## Deferred within Phase 1 (AB 2026-11-15: "we will add new features later")
Follow-ups and activity notes (BP §10.5), the status machine (BP §10.3), SLA escalation + notification-service (BP §10.6, §12.4), assign/reassign (BP §10.4), conversion request (BP §7), CMS (BP §12.5, Q-015).

## Out of Phase 1
Booking, room allocation, payment collection (SOW ERP-02/03/07; BP §8). See phase1_plan.md §7. Exception (D-116, 2026-11-16): the Gold Membership fee payment record and screenshot above.
