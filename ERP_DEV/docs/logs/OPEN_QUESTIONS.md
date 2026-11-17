# Open Questions (append-only; answers are added below each question)

Earlier questions: `archive/hotel-draft:ERP_DEV/docs/logs/OPEN_QUESTIONS.md`.

| ID | Question | Blocks | Default until answered |
|---|---|---|---|
| Q-001 | The resource folder moved to `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce`. Confirm it is the official one, and update the erp-prp skill path | Rule compliance | Used read-only (D-110) |
| Q-002 | Is this AI coding assistant approved under Engineering Playbook §2.3 for the client documents it has read? | Compliance | Ashish to confirm |
| **Q-003** | **Guest identity:** the unchanged landing page posts the guest password to `/api/v1/portal/auth/register` and `/login` and expects a `token`. The Blueprint forbids an ERP password store. Options: **(A)** guest-service passes these calls through to the Keycloak realm `gh-guests` (Admin API to create the user; password grant to log in). No landing-page change, but it uses the deprecated password grant. **(B)** change the landing page to redirect to Keycloak (PKCE), which breaks "landing page unchanged". **(C)** keep a guest password table, which violates the Blueprint. Recommendation: A now, B later | Increment 2 | — (blocked) |
| Q-004 | The landing page has 4 lint errors (already there). Fix them (this changes the landing page) or leave them? CI runs typecheck + build only | CI lint | Not linted in CI |
| Q-005 | (BP §19.1) Allow anonymous inquiries? | Inc 2 | Allowed (the landing page already allows them), with stricter rate limits |
| Q-006 | (BP §19.2) Email, mobile or both mandatory at guest registration? | Inc 2 | As the landing page form does today |
| Q-007 | (BP §19.3) Guest verification channel? | Inc 2 | Email (Keycloak). SRS §11.2: the client excludes SMS |
| Q-008 | (BP §19.4) Final inquiry categories and fields? | Inc 2 | Room inquiry only (current form). SRS §3.2 also asks for an Event Enquiry Form (banquets/weddings/corporate) |
| Q-009 | (BP §19.5) Five-minute claim SLA confirmed? | Later inc | Configurable |
| Q-010 | (BP §19.6) First escalation recipient? | Later inc | — |
| Q-011 | (BP §19.7) Voice escalation provider approved? | Later inc | Off |
| Q-012 | (BP §19.8) WhatsApp Business API provisioned and approved? | Later inc | Off |
| Q-013 | (BP §19.9) Consent wording and privacy policy? | Inc 2 | — |
| Q-014 | (BP §19.10) Approved public content? | Landing page | As-is |
| Q-015 | (BP §19.11) Is CMS editing in Phase 1, and who publishes? | CMS | Not in Phase 1 |
| Q-016 | (BP §19.12) Hosting budget and availability target? | Deployment | — |
| Q-017 | Other employee fields ("other required information"): staff code, joining date, department? | Inc 1 schema | Only the fields listed in AUTHENTICATION §4 |
| Q-018 | Branded Keycloak login and email theme (client-approved assets only)? | Polish | Keycloak default theme |
| Q-019 | Session lengths: idle 30 min / max 10 h. OK? (SRS §10: 8-hour shift, 8–9 h window) | Inc 1 | As proposed |
| Q-020 | Spring Boot 3.2.5 and Keycloak 24 are past their support windows. Upgrade to the current supported releases (same products) at the start of increment 1? | Inc 1 | Keep as-is (Ashish: "same stack") |
| Q-021 | Keycloak TOTP (built-in MFA) required for ADMIN accounts? | Inc 1 | Off |
| Q-022 | Retention for employee data, audit logs, Keycloak events and guest data (DPDP)? | Inc 1 | Events 90 days; audit kept |
| Q-023 | Approve the new dev/test tools: Testcontainers (+ Keycloak module), Mailpit container, ShedLock (or plain SQL locking) | Inc 1 | Not added |
| Q-024 | SMTP provider, sender address/domain, reply-to, SPF/DKIM/DMARC owner | Inc 1 (staging) | Mailpit in dev |
| Q-025 | Production hostnames (ERP, identity, API) | Deployment | — |
| Q-026 | Password policy: 12+ characters, not username/email, last 3 not reused. OK? | Inc 1 | As proposed |
| Q-027 | Client approval of CR-001 (Sales role not in SOW §22). Which client designations get SALES_EXECUTIVE: Reservation Desk Associates, Marketing Executives (SRS §10)? MANAGER vs a separate SALES_SUPERVISOR? | Scope | MANAGER holds the supervisor permissions |
| Q-028 | Long-term owner of employee records: access-service now, or HR & Workforce later? | Later | access-service |
| Q-029 | Who may onboard and deactivate employees: only ADMIN (= SOW/SRS Super Admin, Owner/MD), or also the GM / HR Manager? SRS §11.1 gives the Resort Manager create/edit/config rights in general | Inc 1 | ADMIN only (least privilege); can be granted to MANAGER per person later via `employees.manage` |

**Answer Q-001 (2026-11-15T11:23:40+05:30, Ashish):** the official resource folder is `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce`. The rules and agent config are updated. D-110 is accepted.

**Answer Q-020 (2026-11-15T11:27:15+05:30, Ashish):** upgrade to the current supported releases of the same products. Exact versions are checked against official release pages at the start of increment 1 (inc1-PLAN §3).
**Answer Q-029 (2026-11-15T11:27:15+05:30, Ashish):** only ADMIN may onboard, activate and deactivate employees. `employees.manage` can be granted to one person later.
**Answer Q-003 (2026-11-15T11:27:15+05:30, Ashish):** option A. guest-service passes `/api/v1/portal/auth/register|login` through to the Keycloak realm `gh-guests` (Admin API to create the user; password grant to log in, on a dedicated guest client only). The landing page stays unchanged; moving it to a Keycloak redirect is a later improvement. The ERP stores no guest passwords.
**Answer Q-023 (2026-11-15T11:30:28+05:30, Ashish):** approved Testcontainers (PostgreSQL), `com.github.dasniko:testcontainers-keycloak`, the Mailpit Docker image and `keycloak-js`. ShedLock and keycloak-admin-client aren't used.

### Added 2026-11-16 (Gold Membership increment, D-116…D-124)
| ID | Question | Affects | Default until answered |
|---|---|---|---|
| Q-030 | Gold membership fee (amount, GST treatment) | Registration form | Sales Executive enters the amount received; no expected-fee check |
| Q-031 | Official resort UPI QR image and UPI ID for the "Scan QR" option | Registration form | "QR not configured" placeholder |
| Q-032 | Member amenity benefits (pools, gym, games lounge, bonfire) and the 20% spa / 15% dining discounts from the draft plan: not in any client document | Member profile | Shown from config, labelled "to be confirmed" |
| Q-033 | Retention period for payment screenshots and member personal data (DPDP; extends Q-022) | access_db, proof files | Kept; no automatic deletion |
| Q-034 | Guest (customer) session lengths in `gh-guests` | Keycloak | Idle 7 days, max 30 days, remember-me on |
| Q-035 | May an enrolling executive's WhatsApp/mobile number be shown to the member? | Member profile | Only when the employee has WhatsApp opt-in; otherwise the resort desk number |
| Q-036 | /plan-ahead shows a hard-coded "Privilege Member" label to every signed-in guest; show "Guest" for non-members? | Landing page | Unchanged |
| Q-037 | Confirm that numbers are issued upward from GRH-LM-0101 and whether any numbers in the series are already used on paper | Membership IDs | Start at 0101 |

### 2026-11-16 update (D-127, D-128)
- **Q-034** placeholder changed: remember-me sessions in `gh-guests` now idle **30 days** (max 30 days); the welcome link and the default-ticked "Keep me signed in" use them. Still to confirm with the client.
- **Q-022 / Q-033** also cover how long Keycloak keeps guest sign-in events (placeholder 90 days) and guest_db sign-in records (kept, no deletion).

### 2026-11-16 (Gold Member smart fields, D-131…D-134)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-038 | Which driving-licence number formats must be accepted (older state formats differ from KA01 20190001234)? | Registration form, `IdentityNumbers` | 2 letters + 2 digits + 9–13 letters/digits |
| Q-039 | Aadhaar/licence: consent wording shown to the customer and how long the masked number and hash are kept (DPDP; extends Q-033) | Registration form, access_db | No consent text; kept with the member |
| Q-040 | **Resource request:** India Post "All India Pincode Directory" CSV (data.gov.in) in the resource folder, for pincode → city/state auto-fill | `web/scripts/build-pincodes.mjs` | Manual city; state dropdown |
- **Q-030** note: quick amount chips read `VITE_GOLD_FEE_CHIPS`; empty (no chips) until the fee is confirmed.
