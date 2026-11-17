# API Contracts — Phase 1

- Status: **Proposed. Waiting for Ashish's review.** Each service will publish an OpenAPI 3 document (springdoc) that must match this file. If code and this file disagree, it is a bug, and the fix updates both.
- Every call goes through `api-gateway` at `http://localhost:8082` (dev).

## 1. Common rules

- JSON, UTF-8. Dates `YYYY-MM-DD`; timestamps ISO-8601 UTC (`2026-11-15T05:30:00Z`); IDs are UUIDs.
- Staff endpoints need `Authorization: Bearer <access token from realm gh-staff>` ([AUTHENTICATION §5](identity/AUTHENTICATION.md)).
- `X-Correlation-Id` is optional on requests; the gateway generates one if it's missing, and it is always echoed back.
- `Idempotency-Key` (UUID) is **required** on create operations marked ⓘ. The same key with the same body returns the first response; the same key with a different body → 422.
- Lists: `?page=0&size=20&sort=createdAt,desc`, with `size` at most 100. The response is `{ "items": [...], "page": 0, "size": 20, "total": 57 }`.
- Error body (every service, every status ≥ 400):

```json
{ "code": "FORBIDDEN", "message": "You do not have permission to do this.", "status": 403,
  "correlationId": "4f3c…", "timestamp": "2026-11-15T05:30:00Z", "fields": { "email": "must be a valid email" } }
```

| Status | `code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Bad input; `fields` lists the problems |
| 401 | `AUTH_REQUIRED` | No, expired, wrong-issuer or wrong-audience token |
| 403 | `FORBIDDEN` | Valid token, missing permission |
| 404 | `NOT_FOUND` | Missing **or out of the caller's scope** (existence not revealed) |
| 409 | `CONFLICT` | Duplicate, optimistic-lock clash, lead already claimed, invalid transition |
| 422 | `IDEMPOTENCY_MISMATCH` | Same Idempotency-Key, different body |
| 429 | `RATE_LIMITED` | Gateway limit |
| 502 | `UPSTREAM_FAILED` | Keycloak or another dependency failed; nothing was changed |

## 2. Public portal contract — FROZEN (used by the unchanged landing page)

Source of truth: `landing-page/src/app/portal-client.ts`, base `NEXT_PUBLIC_LEAD_API_URL`, default `http://localhost:8082/api/v1/portal`. **Field names and shapes must not change.** Contract tests pin them (increment 2). The landing page reads `message` from error bodies.

| Method & path | Auth | Request | Response 2xx |
|---|---|---|---|
| `POST /api/v1/portal/auth/register` | none | `{ name, email, phone, password }` | `{ guestId, name, email, phone, token }` |
| `POST /api/v1/portal/auth/login` | none | `{ email, password }` | `{ guestId, name, email, phone, token }` |
| `POST /api/v1/portal/inquiries` | optional `Bearer <guest token>` | `{ name, email, phone, checkinDate, checkoutDate, roomCategory, guestCount, notes }` | `InquiryResponse` |
| `GET /api/v1/portal/inquiries/me` | `Bearer <guest token>` | — | `InquiryResponse[]` |

`InquiryResponse` = `{ id, publicReference, name, email, phone, checkinDate, checkoutDate, roomCategory, guestCount, notes, status, priority, claimedBy, claimedAt, slaDeadline, slaBreached, createdAt }`.

**Decided (Q-003, D-114, 2026-11-15):** these two endpoints are served by `guest-service`, which passes them through to the Keycloak realm **`gh-guests`**:
- `register` → Admin API creates the user (email verification per Q-007) and the guest profile is linked by `keycloak_sub`;
- `login` → token request with the password grant on a dedicated confidential client `guest-portal` (the only client in either realm with that grant enabled);
- `token` in the response is the Keycloak access token.

The ERP never stores or logs the password. Moving the landing page to a Keycloak redirect (PKCE) is a later improvement. The Blueprint's guest paths (`/api/v1/guests/me`, `/api/v1/leads/me`) can be added beside this contract later; they don't replace it.

Gateway routes: `/api/v1/portal/auth/**` → guest-service, `/api/v1/portal/inquiries/**` → lead-service. Both have rate limits (Blueprint §9: anonymous submissions are rate-limited more strictly).

## 3. Staff — access-service (increment 1)

| Method & path | Permission | Purpose |
|---|---|---|
| `GET /api/v1/me` | any authenticated employee | Own profile + roles + permissions + permitted modules |
| `GET /api/v1/admin/employees?status=&role=&q=` | `employees.read` | List with live account status |
| `GET /api/v1/admin/employees/{id}` | `employees.read` | Detail |
| `POST /api/v1/admin/employees` ⓘ | `employees.manage` | Create + provision in Keycloak + send invite → `201 {…, status:"INVITED"}` or `202 {…, status:"PENDING_PROVISIONING"}`. `jobRole` is optional and may only be `SALES_EXECUTIVE`; anything else → 400 `fields.jobRole` (D-138). `pan` is required: normalised (upper case, no spaces/hyphens), must be an individual's PAN (`[A-Z]{3}P[A-Z][0-9]{4}[A-Z]`) else 400 `fields.pan`; a PAN already used → 409 "An employee with this PAN already exists.". Responses carry only `panMasked` (`XXXXXX234F`) (D-139) |
| `PATCH /api/v1/admin/employees/{id}` | `employees.manage` | Edit name, mobile, WhatsApp preference; email change triggers re-verification. Needs the `If-Match: <version>` header |
| `PUT /api/v1/admin/employees/{id}/role` | `roles.assign` | `{ role, reason }`; only `SALES_EXECUTIVE` is accepted, `MANAGER`/`ADMIN` → 403 `ROLE_NOT_ALLOWED` (D-138) |
| `PATCH /api/v1/admin/employees/{id}/status` | `employees.manage` | `{ active: false|true, reason }` → disable/enable in Keycloak, then revoke sessions |
| `POST /api/v1/admin/employees/{id}/resend-invite` | `employees.manage` | Re-send the Keycloak action email (3 per hour) |
| `POST /api/v1/admin/employees/{id}/retry-provisioning` | `employees.manage` | Retry failed Keycloak steps |
| `GET /api/v1/admin/audit?entityId=&actorId=&from=&to=` | `audit.read` | Account audit trail |

Create request:

```json
{ "firstName": "Rahul", "lastName": "Sharma", "email": "rahul.sharma@example.com",
  "username": "rahul.sharma", "mobile": "+919876543210", "jobRole": "SALES_EXECUTIVE",
  "whatsappOptIn": false }
```

`whatsappOptIn` is optional (default `false`). Response (`EmployeeView`): `{ id, firstName, lastName, email, username, mobile, jobRole, whatsappOptIn, status, statusReason, identityLinked, createdAt, updatedAt, version }`. Email and username are stored lowercase; spaces and dashes are removed from the mobile. Duplicate email/username/mobile → 409 with the field named in `message`.

(Example values are illustrative, not client data. Extra fields such as staff code and joining date: Q-017.)

Account changes return the updated `EmployeeView`. Errors: 400 without a reason; 409 for the guards (self, last admin, not set up yet, row busy); 429 after 3 resends in an hour; 502 `UPSTREAM_FAILED` if Keycloak is down (nothing changed) or the email failed (status kept as `INVITE_EMAIL_FAILED`).

Audit response: page of `{ id, occurredAt, actorId, actor, actorIp, action, entityType, entityId, before, after, reason, correlationId, outcome }`, newest first; `size` at most 200.

## 3a. Staff — Gold Membership in access-service (SOW ERP-05; D-116…D-118)

Module guide: [04-modules/membership.md](../04-modules/membership.md).

| Method & path | Permission | Purpose |
|---|---|---|
| `GET /api/v1/sales/memberships/next-number` | `memberships.register` | `{ membershipId: "GRH-LM-0101", provisional: true }`: preview only; the real number is given on save |
| `POST /api/v1/sales/memberships` ⓘ | `memberships.register` | `multipart/form-data` registration → `201 MemberView` (`status: PENDING_VERIFICATION`). Needs `Idempotency-Key`. Since V3 also `idType` (`AADHAAR`/`DRIVING_LICENCE`), `idNumber`, `pincode`, `city`, `state`, `country` (default India); `mobile` must be an Indian mobile. 400 `fields.*` for: under 18 (`dob`: "Customer must be at least 18 years old"), Aadhaar length/first digit/checksum or licence format (`idNumber`), pincode, city, state, country. 409 `ID_ALREADY_REGISTERED` when a pending/active membership has the same ID. `MemberView` adds `idType`, `idNumberMasked` (never the full number), `pincode`, `city`, `state`, `country` (null for members registered before V3) |
| `GET /api/v1/sales/memberships?page=&size=` | `memberships.read_own` | The caller's own registrations, newest first |
| `GET /api/v1/sales/memberships/{id}` | `memberships.read_own` | Own registration; anyone else's → 404 |
| `GET /api/v1/sales/memberships/{id}/proof` | `memberships.read_own` | Own payment screenshot (image bytes) |
| `GET /api/v1/admin/memberships?status=&q=&page=&size=` | `memberships.read_all` | All registrations; `status` one of `PENDING_VERIFICATION, ACTIVE, REJECTED`; `q` matches ID, name, email or mobile; response adds `pendingCount` |
| `GET /api/v1/admin/memberships/{id}` | `memberships.read_all` | Detail |
| `GET /api/v1/admin/memberships/{id}/proof` | `memberships.read_all` | Payment screenshot |
| `POST /api/v1/admin/memberships/{id}/verify` | `memberships.verify` | → `ACTIVE`, `validFrom` = now, `validUntil` = now + 12 months; payment `VERIFIED` |
| `POST /api/v1/admin/memberships/{id}/reject` | `memberships.verify` | `{ reason }` (required) → `REJECTED`; payment `REJECTED` with the reason |
| `POST /api/v1/admin/memberships/{id}/resend-welcome` | `memberships.verify` | Active members only (else 409 `NOT_ACTIVE`): a new welcome email and one-time link; creates the customer account first if that failed at verification. Returns `MemberView` with the new `accountStatus` |

Permissions per role (Keycloak `erp-api` client roles): SALES_EXECUTIVE `register`, `read_own`; MANAGER and ADMIN all four. `/api/v1/me` lists the `memberships` module when the caller has `register` or `read_all`.

Registration form fields: `firstName`, `lastName`, `dob` (YYYY-MM-DD, in the past), `mobile` (`+91 98765 43210`; a bare 10-digit Indian mobile gets +91), `email`, `address` (≤ 500), `paymentType` (`CASH` | `CARD` | `SCAN_QR`), `amount` (rupees, > 0, at most 2 decimals, e.g. `25000` or `25000.50`), `transactionId` (required for `CARD`; the UPI UTR for `SCAN_QR` is optional), and the file part `proof` (JPEG/PNG/WebP, ≤ 5 MB; required for `SCAN_QR`). Example values are illustrative.

`MemberView`: `{ id, membershipId, firstName, lastName, dob, mobile, email, address, tier: "GOLD", status, enrolledBy: { employeeId, name, username }, decidedBy, decidedAt, validFrom, validUntil, accountStatus, createdAt, payment: { type, amount: "25000.00", currency: "INR", transactionId, proof: { fileName, contentType, sizeBytes, sha256 } | null, status, rejectionReason, verifiedBy, decidedAt } }`. Money is a string with two decimals, never a float.

Errors: 400 `VALIDATION_FAILED` with `fields`; 403 `NO_EMPLOYEE_RECORD` (signed in but no ERP employee row), 403 `SELF_VERIFICATION`; 404 `NOT_FOUND`; 409 `MEMBER_EXISTS` (live membership with that email or mobile), `NOT_PENDING`, `IDEMPOTENCY_KEY_REUSED`, `SERIES_EXHAUSTED`; 413 `PAYLOAD_TOO_LARGE` (screenshot > 5 MB; the gateway allows 6 MB on this route only); 503 `PROOF_STORAGE_NOT_CONFIGURED` (`MEMBERSHIP_PROOF_KEY` missing). Proof downloads are `inline`, `Cache-Control: no-store, private`, `X-Content-Type-Options: nosniff`.

After **verify**, access-service calls guest-service (below) to create the customer's account and send the welcome email. The outcome is in `accountStatus`: `NOT_PROVISIONED` | `INVITE_SENT` | `INVITE_FAILED` | `ACTIVE`. A failure there never undoes the verification ([MEMBER-LOGIN.md](identity/MEMBER-LOGIN.md)).

## 3c. Member portal: own Gold Membership (access-service; S4, REQ-MEM-009)

| Method & path | Token | Purpose |
|---|---|---|
| `GET /api/v1/portal/membership/me` | signed-in member (gh-guests, aud `guest-api`) | `{ membershipId, firstName, lastName, tier: "GOLD", status, validFrom, validUntil, enrolledBy: { name, username, mobile } }` for the member whose gh-guests id is the token's `sub`. `mobile` is null unless the executive opted in to WhatsApp (Q-035). No payment, screenshot or internal ids. 404 `NO_MEMBERSHIP` for a signed-in guest without a membership. The first call sets `accountStatus = ACTIVE` (audited once as `MEMBER_PORTAL_FIRST_SIGN_IN`) |

Staff tokens on `/api/v1/portal/**` → 401; member tokens on staff paths → 401. At the gateway, `/api/v1/portal/**` has its own security chain that does **not** read bearer tokens; the owning service validates them (D-126).

## 3b. guest-service (:8092; D-119…D-122)

| Method & path | Caller / token | Purpose |
|---|---|---|
| `POST /internal/guests/provision` | access-service service account (gh-staff, aud `erp-api`, permission `guests.provision`) | `{ email, firstName, lastName, mobile?, membershipId: "GRH-LM-0101", validUntil?: "16 Nov 2027", requestedBy? }` → find or create the gh-guests account (no password), set `membershipId`, send the welcome email → `{ guestUserId, welcomeSent, message }`. Repeatable for the same email. 503 `IDENTITY_UNAVAILABLE` when Keycloak can't be reached (nothing stored) |
| `POST /internal/guests/{guestUserId}/resend` | same | `{ validUntil?, requestedBy? }` → new one-time link and email → same result shape; 404 for an unknown account |
| `GET /api/v1/portal/me` | signed-in guest (gh-guests, aud `guest-api`) | `{ guestId, email, firstName, lastName, emailVerified, mobile, source: "MEMBERSHIP" or "SELF_REGISTERED", status }`; own profile only. Also keeps guest_db up to date (D-128): creates the row for a self-registered guest, copies email/verification from the token, counts each Keycloak session (`sid`) once as a sign-in with audit `GUEST_SIGNED_IN`. 403 `ACCOUNT_DISABLED` when the account is disabled |

`/internal/**` is not routed by the gateway. A token from the wrong realm gets 401; a staff token without `guests.provision` gets 403. Keycloak extension endpoint used by guest-service: `POST /realms/gh-guests/gh-activation/users/{id}/send` ([MEMBER-LOGIN §5](identity/MEMBER-LOGIN.md)).

## 4. Staff — lead-service (increment 2)

| Method & path | Permission | Scope rule |
|---|---|---|
| `GET /api/v1/sales/leads?view=queue` | `leads.read_queue` | Unclaimed leads |
| `GET /api/v1/sales/leads?view=mine` | `leads.read_assigned` | Claimed by or assigned to the caller |
| `GET /api/v1/sales/leads?view=team` | `leads.read_team` | All |
| `GET /api/v1/sales/leads/{id}` | one of the above | 404 if out of scope |
| `POST /api/v1/sales/leads/{id}/claim` | `leads.claim` | Atomic conditional update; a second claimant gets 409 |
| `GET /api/v1/sales/dashboard/summary` | `leads.read_queue` | Counts for the caller's scope |

**Built now (D-137), Sales Admin (`ADMIN` realm role) only; any other role → 403:**

| Method & path | Result |
|---|---|
| `GET /api/v1/sales/leads/summary?from=&to=` | `{ executives: [{ username, attendedCount, inProgressCount, convertedCount, lostCount, conversionRate (0..1), avgFirstResponseMinutes \| null }], unclaimedCount, from, to }`. Counts leads by `created_at` in `[from, to)` (ISO-8601 with offset; both optional = all time). "Attended" = claimed by that executive; response time = `claimed_at − created_at` |
| `GET /api/v1/sales/leads?assignedTo=&status=&from=&to=` | Lead list (newest first), claimed by or assigned to `assignedTo` when given |
| `GET /api/v1/sales/leads/{id}` | One lead, 404 if unknown |
| access-service `GET /api/v1/admin/memberships/summary?from=&to=` (role `ADMIN` + `memberships.read_all`) | D-140: `{ executives: [{ employeeId, username, name, enrolledCount, activeCount, pendingCount, rejectedCount, verifiedAmount }], enrolledCount, activeCount, pendingCount, verifiedAmount, from, to }` for registrations created in `[from, to)`; amounts are two-decimal strings, verified payments only |
| access-service `GET /api/v1/admin/memberships?enrolledBy=&from=&to=` (`memberships.read_all`) | Existing list, new optional filters: enrolling executive's username and registration period |

The executive's identity always comes from the token's `sub`, **never from the request body** (Blueprint §12.3). Endpoints for assign/reassign, status, activities, follow-ups and conversion requests come with their later increment, using the Blueprint §12.3 paths.

## 5. Events (increment 2)

| Topic | Event | Producer | Payload (beyond the envelope) |
|---|---|---|---|
| `leads.v1` | `LeadCreated` v1 | lead-service | `leadId, publicReference, source, createdAt`. No guest contact data; consumers fetch it if they're allowed |
| `leads.v1` | `LeadClaimed` v1 | lead-service | `leadId, claimedBy (employee id), claimedAt` |

Envelope: `eventId, eventType, eventVersion, occurredAt, producer, correlationId, aggregateId` (Blueprint §5).
