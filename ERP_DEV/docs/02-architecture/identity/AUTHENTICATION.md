# Employee Authentication & Account Management (Keycloak)

- Status: **Proposed. Waiting for Ashish's review** (Milestone 1, 2026-11-15). No code exists yet.
- Decision record: [ADR-002](../adr/ADR-002-keycloak-employee-identity.md). Keycloak settings: [KEYCLOAK-SETUP.md](KEYCLOAK-SETUP.md).
- Sources:
  - Phase 1 Blueprint §2 ADR-006/007, §3, §11, §13, §17, §18 (extract);
  - SOW §22 roles, §25.2 security (extract);
  - Ashish's instruction of 2026-11-15 (DEVLOG).
- Scope: **employees (staff) only.** Guest identity is a separate realm and is still open (Q-003).

> **Guests and members** (customers on the landing page) use a separate realm, `gh-guests`, with Authorization Code + PKCE and a one-time welcome link: see [MEMBER-LOGIN.md](MEMBER-LOGIN.md) (D-119…D-122, which supersede D-114). This document covers staff only.

## 1. Rules (non-negotiable)

1. Keycloak is the **single source of truth for authentication**: login, passwords, email verification, password reset, tokens, sessions and account enabled/disabled.
2. PostgreSQL (`access_db`) stores **employee profiles and ERP data only**, linked to Keycloak by `keycloak_user_id`. **No password, OTP or token is ever stored or logged by the ERP.**
3. No custom JWT generation, password handling or email-OTP flow. Only standard OpenID Connect / OAuth 2.0 (Authorization Code + PKCE).
4. Keycloak admin credentials exist only in `access-service` (as server-side secrets). They never reach the browser, the gateway or any other service.
5. Authorization is enforced on the **backend** for every endpoint. Hiding something in React is only cosmetic.
6. Keycloak API failures must never leave an employee half-created without the admin being able to see it and retry.

## 2. Who does what

| Component | Responsibilities |
|---|---|
| **Keycloak** (realm `gh-staff`) | Login page, credential check, password policy and storage, email verification, password set/reset, brute-force lockout, access and refresh tokens, SSO sessions, logout, account enabled flag |
| **access-service** (Spring Boot) | Employee profiles (first/last name, email, username, mobile, job role, WhatsApp notification preference); Keycloak Admin API calls (create user, assign role, send invite, enable/disable, log out); status sync; the `/me` endpoint; audit of account events |
| **api-gateway** (Spring Cloud Gateway) | Single entry point; checks the JWT (signature, issuer, expiry, audience) before routing; rate limits; correlation IDs. No business logic, no admin credentials |
| **Every business service** (lead, guest, …) | Checks the JWT again on its own (defense in depth); checks the permission, then the record scope, then whether the state transition is allowed; writes audit entries |
| **web** (React) | "Sign in" page that redirects to Keycloak; holds tokens **in memory only**; refreshes tokens; logs out; shows or hides menus based on the token's roles (cosmetic only) |
| **PostgreSQL** | `access_db`: employee profile, `keycloak_user_id`, ERP-side status, audit. `keycloak` DB: Keycloak's own store, which only Keycloak touches |

## 3. Roles and permissions

Job roles are Keycloak **realm roles** in `gh-staff`:

| Realm role | Maps to | Who |
|---|---|---|
| `ADMIN` | SOW §22 / SRS §11.1 "Super Admin" (Owner/MD) | Creates, activates and deactivates employees, assigns roles. Whether the GM or HR may also do this: Q-029 |
| `MANAGER` | SOW §22 / SRS §11.1 "Resort Manager (GM)" + Blueprint §10.7 "Sales Supervisor" permissions | Watches the sales team; cannot manage users |
| `SALES_EXECUTIVE` | Blueprint §10 (**not in SOW §22**, logged as [CR-001](../../01-requirements/CHANGE_REQUESTS.md)) | Works on leads |

Permissions are **client roles** on the `erp-api` client, named as in Blueprint §11. Each realm role is a **composite** of its default permissions. An ADMIN can grant one extra permission to one employee by assigning that client role directly (Blueprint §11 "hybrid RBAC"). Keycloak puts permissions into the access token as `resource_access.erp-api.roles`.

Phase 1 permissions and their default holders:

| Permission | ADMIN | MANAGER | SALES_EXECUTIVE |
|---|:-:|:-:|:-:|
| `employees.read` | ✓ | ✓ | |
| `employees.manage` (create, edit, activate, deactivate, resend invite) | ✓ | | |
| `roles.assign` | ✓ | | |
| `leads.read_queue` | ✓ | ✓ | ✓ |
| `leads.read_assigned` | ✓ | ✓ | ✓ |
| `leads.read_team` | ✓ | ✓ | |
| `leads.claim` | | ✓ | ✓ |
| `leads.assign`, `leads.reassign` | ✓ | ✓ | |
| `audit.read` | ✓ | | |
| `memberships.register` (register a Gold Member, D-116) | ✓ | ✓ | ✓ |
| `memberships.read_own` (own registrations and their screenshots) | ✓ | ✓ | ✓ |
| `memberships.read_all` (verification queue) | ✓ | ✓ | |
| `memberships.verify` (verify or reject; never one's own registration, D-118) | ✓ | ✓ | |

The other Blueprint permissions (`leads.update_status`, `leads.add_activity`, `leads.schedule_followup`, `leads.request_conversion`, `leads.export`) are created when those features are built. Ashish deferred them on 2026-11-15.

**Why Keycloak client roles, not a permissions table in PostgreSQL:** grants then live in one place (Keycloak) and arrive inside the token. Services need no extra lookup per request, and a grant can't drift between two stores.

Authorization order in every service (Blueprint §11):
1. Is the user authenticated? If not → **401**.
2. Does the user hold the permission? If not → **403**.
3. Is the record in their scope (e.g. a Sales Executive sees only the queue and their own leads)? If not → **404**, so the record's existence isn't revealed.
4. Is the state transition allowed? If not → **409**.
5. Write an audit entry.

## 4. Workflow 1 — Employee registration & onboarding (admin-driven, once per employee)

```mermaid
sequenceDiagram
  autonumber
  actor A as Admin (browser)
  participant W as web (React)
  participant G as api-gateway
  participant S as access-service
  participant DB as access_db
  participant K as Keycloak (gh-staff)
  participant M as SMTP server
  actor E as New employee

  A->>W: Employees → "Add employee" (first/last name, email, username, mobile, job role, WhatsApp pref)
  W->>G: POST /api/v1/admin/employees  (Bearer access token, Idempotency-Key)
  G->>S: forward (JWT already checked)
  S->>S: check JWT again + permission employees.manage; validate input
  S->>DB: INSERT employee (status PENDING_PROVISIONING)  — commit
  S->>K: POST /admin/realms/gh-staff/users (enabled, emailVerified=false, requiredActions=[VERIFY_EMAIL, UPDATE_PASSWORD])
  K-->>S: 201 Location: …/users/{kcId}
  S->>K: POST …/users/{kcId}/role-mappings/realm  [SALES_EXECUTIVE]
  S->>K: PUT …/users/{kcId}/execute-actions-email?client_id=erp-web&redirect_uri=…&lifespan=86400  ["VERIFY_EMAIL","UPDATE_PASSWORD"]
  K->>M: send "Set up your account" email
  S->>DB: UPDATE employee SET keycloak_user_id=kcId, status=INVITED; INSERT audit
  S-->>W: 201 {employee, status: INVITED}
  M-->>E: email with one-time action link (valid 24 h)
  E->>K: opens link → email verified → sets own password (policy enforced by Keycloak)
  K-->>E: redirected to the ERP; logs in normally (Workflow 2)
  Note over S,K: Next status check sees emailVerified=true and no required actions → ACTIVE
```

Step by step (this matches Ashish's steps 1–5):

1. **Admin creates the employee.**
   - Fields: first name, last name, email, username, mobile, job role (one of the realm roles above), WhatsApp notification preference (default off). Staff code and joining date are open in Q-017.
   - Validation:
     - email format, stored lowercase;
     - username `^[a-z0-9._-]{3,50}$`;
     - mobile in E.164 format;
     - email, username and mobile must be unique in `access_db`.
   - The request carries an `Idempotency-Key` header, so a double-click returns the first result.
2. **Keycloak creates the account.**
   - `access-service` creates the user through the Admin REST API with the `access-service` confidential client (client-credentials grant; see KEYCLOAK-SETUP §5).
   - It stores the Keycloak user id on the employee row (one-way link). A custom attribute on the Keycloak user was dropped in S5: Keycloak 26's user profile discards unmanaged attributes unless the realm allows them (DEVLOG 2026-11-15).
   - It assigns the realm role.
3. **The verification email is sent by Keycloak.** We use Keycloak's built-in `execute-actions-email` with `VERIFY_EMAIL` + `UPDATE_PASSWORD`. Keycloak's SMTP settings are in KEYCLOAK-SETUP §4. The ERP never sends this email itself.
4. **The employee verifies the email and sets a password on Keycloak's own pages.**
   - Clicking the link proves they own the inbox and marks the email verified. They then choose a password that Keycloak checks against the realm password policy.
   - The ERP never sees the password.
5. **The account becomes ready.**
   - When Keycloak shows `enabled=true`, `emailVerified=true` and no pending required actions, the employee can log in.
   - The admin sees the status in the Employees list (§8).

**Why one email with both actions:** clicking the link proves the employee owns the address, and the password is set in the same visit. That's one email and one link, with nothing for us to build.

## 5. Workflow 2 — Employee login & authentication (every session)

```mermaid
sequenceDiagram
  autonumber
  actor E as Employee
  participant W as web (React, keycloak-js)
  participant K as Keycloak (gh-staff)
  participant G as api-gateway
  participant S as any service

  E->>W: opens https://erp…/  → "Sign in"
  W->>K: redirect: /protocol/openid-connect/auth (client erp-web, code flow, PKCE S256, state, nonce)
  E->>K: enters email/username + password on the Keycloak login page
  alt wrong password
    K-->>E: "Invalid username or password." (counts toward brute-force lockout)
  else account disabled
    K-->>E: "Account is disabled, contact your administrator."
  else email not verified / actions pending
    K-->>E: asks to finish the pending actions first
  end
  K-->>W: redirect back with code
  W->>K: POST /token (code + PKCE verifier)
  K-->>W: access token (5 min), refresh token, id token
  W->>G: GET /api/v1/me  (Authorization: Bearer access token)
  G->>G: check signature (JWKS), iss, exp, aud=erp-api
  G->>S: forward
  S->>S: check JWT again; map roles and permissions; check permission + scope
  S-->>W: 200 profile + permitted modules  → dashboard
```

1. **Login page.** The ERP shows a clean sign-in screen with one "Sign in" button, which redirects to the **Keycloak-hosted login page**. Email/username and password are typed **only on Keycloak's page**, never into a React form. That is what keeps passwords out of the ERP. The Keycloak page can later get a Golden Hills theme (Q-018).
2. **Keycloak authenticates.** The flow is Authorization Code + PKCE (S256). Keycloak shows its own messages for a wrong password, a disabled account or a locked account. Brute-force detection is on (KEYCLOAK-SETUP §3).
3. **Keycloak issues tokens.**
   - Access token: JWT, **5 minutes**.
   - Refresh token: rotated on each use.
   - ID token: used only for logout.
4. **Spring Boot checks the token**, both at the gateway and in every service, using `spring-boot-starter-oauth2-resource-server`:
   - `issuer-uri` = `${KEYCLOAK_URL}/realms/gh-staff`, so signing keys come from the realm's JWKS endpoint and are re-fetched when Keycloak rotates them;
   - checks: signature, `iss`, `exp` and `nbf` (60 s clock skew allowed), and that `aud` contains `erp-api` (custom validator);
   - converter: realm roles → `ROLE_<name>`, `resource_access.erp-api.roles` → `PERM_<name>`;
   - no token or a bad token → **401** `{"code":"AUTH_REQUIRED"}`; valid token without the permission → **403** `{"code":"FORBIDDEN"}`. Same JSON error shape everywhere ([api.md](../api.md)).
5. **RBAC.** `@PreAuthorize("hasAuthority('PERM_leads.claim')")` on each endpoint, plus scope checks in the service layer (§3).
6. **Dashboard.** `GET /api/v1/me` (access-service) returns the employee profile from `access_db`, plus the roles and permissions from the token. React builds the menu from it. Modules the employee can't use are hidden, and the backend refuses them anyway.

### React token and session handling
- Library: `keycloak-js` 26.2.5 (D-115). `init({ pkceMethod: 'S256', checkLoginIframe: false })` with **no forced login**: the ERP shows its own sign-in page (Ashish's step 1) and its button calls `keycloak.login()`. After the redirect back, `init` finishes the code exchange.
- Tokens are kept **in memory only**: no localStorage or sessionStorage, so XSS can't read them. After a page reload the sign-in page shows again; pressing Sign in returns without a password prompt while the Keycloak SSO session is alive.
- Before each API call: `updateToken(30)` refreshes the token if it expires within 30 s. If the refresh fails, the session has ended → `login()`.
- A 401 from the API → one refresh and retry → if still 401, log in again. A 403 → show a "You don't have access to this" page, with no retry.
- Strict Content-Security-Policy on the web app; no third-party scripts on ERP pages.

## 6. Logout

- The "Sign out" menu item calls `keycloak.logout({ redirectUri })`. That calls the OIDC **end-session endpoint** with `id_token_hint`, which **ends the Keycloak SSO session** and revokes its refresh tokens. The browser returns to the ERP sign-in page.
- Tokens in memory are dropped when the page unloads.
- **Expired sessions:** SSO idle timeout 30 min and maximum 10 h (one shift; the client must confirm, Q-019). When the session ends, the next refresh fails and the user is sent to the login page.
- **Invalid tokens** (bad signature, wrong issuer or audience, expired) get a 401 from the gateway and from every service.

## 7. Account activation, deactivation & synchronisation

ERP employee status (`access_db.employee.status`):

| Status | Meaning | How it is set |
|---|---|---|
| `PENDING_PROVISIONING` | Saved in the ERP; the Keycloak user isn't fully set up yet | Step 1; a failure partway through |
| `INVITED` | Keycloak user exists, the invite email was sent, actions are still pending | Workflow 1 complete |
| `INVITE_EMAIL_FAILED` | Keycloak user exists but the invite email failed (SMTP) | `execute-actions-email` returned an error |
| `ACTIVE` | Keycloak user enabled, email verified, no pending actions | Status sync |
| `DISABLED` | Keycloak user disabled by an admin | Deactivate |

**Deactivate** (`PATCH /api/v1/admin/employees/{id}/status {active:false, reason}`; requires `employees.manage` and a reason):
1. Keycloak `PUT /users/{kcId}` `{enabled:false}`. From now on, logins and token refreshes fail.
2. Keycloak `POST /users/{kcId}/logout`, which ends every session and revokes the refresh tokens.
3. Update `access_db` to `DISABLED` and write an audit entry with who, when, reason and IP.
4. Order and failure handling: **Keycloak first, then the DB.**
   - If step 1 fails → 502 to the admin, nothing changes, and the admin retries. It fails closed: we never show "disabled" while the account still works.
   - If step 3 fails after Keycloak succeeded → the next status sync fixes the DB from Keycloak.

Known limit: an access token that was already issued stays valid until it expires (**at most 5 minutes**), because JWTs are checked without a call to Keycloak. Mitigation: the 5-minute access-token lifespan. Calling Keycloak introspection on every request would remove the window but costs a Keycloak call per request, so it isn't planned (R-004).

**Reactivate:** `{active:true}` → Keycloak `enabled=true` → status becomes `ACTIVE`, or `INVITED` if their setup was never finished. If the link has expired, the admin uses "Resend invite".

**Resend invite:** `POST /api/v1/admin/employees/{id}/resend-invite` calls `execute-actions-email` again. Allowed for `INVITED` and `INVITE_EMAIL_FAILED` once the Keycloak user exists. Limited to 3 per hour per employee, counted from the audit trail, so the limit survives restarts → 429. If the email fails, the status becomes `INVITE_EMAIL_FAILED` and the API returns 502; the status change is kept.

**Change role:** `PUT /api/v1/admin/employees/{id}/role {role, reason}` (needs `roles.assign`, i.e. ADMIN). Removes the other job roles in Keycloak, adds the new one, then **always logs the user out**, so the new permissions apply at their next sign-in (verified live in S6). Audited with before/after and the reason.

**Change email:** update it in Keycloak with `emailVerified=false` and add the `VERIFY_EMAIL` required action, then send the actions email.

**Safety guards (409):**
- An admin can't deactivate themself or remove their own ADMIN role.
- The last active ADMIN can't be deactivated or demoted. Checks run under a PostgreSQL advisory lock, so two admins can't remove each other at the same moment.
- Changes need a reason (400 without one). A row that the sync job is working on returns 409 "try again" instead of waiting.
- Employees are never deleted, and the ERP offers no delete action in Phase 1: deactivate instead. This follows the engineering "no hard deletes" rule and SRS §11.1, where delete is reserved for the Owner/MD.

**Status sync (Keycloak → access_db):**
- Keycloak is the source of truth for `enabled`, `emailVerified` and `requiredActions`.
- `access-service` refreshes the status (a) on demand when an admin opens the employee list or detail (one Admin API query per page), and (b) with a reconciliation job every 5 minutes that also retries `PENDING_PROVISIONING` rows.
- The job runs on a schedule with a DB lock (ShedLock pattern, or `SELECT … FOR UPDATE SKIP LOCKED`), so only one instance runs it.

## 8. Admin view of employees

The Employees list shows:
- name, username, email, mobile, job role;
- **account status** (§7);
- email verified ✓/✗, last login (from Keycloak events, if enabled), created by and when.

Actions:
- Add, Edit, Activate/Deactivate (reason required), Resend invite, Retry provisioning (shown only for `PENDING_PROVISIONING` and `INVITE_EMAIL_FAILED`).

## 9. Data model (access_db, written as the Sprint 1 Flyway migration)

```text
employee
  id                 UUID PK
  keycloak_user_id   UUID UNIQUE NULL      -- set once Keycloak user exists
  first_name, last_name  VARCHAR(100) NOT NULL
  email              VARCHAR(254) NOT NULL UNIQUE  -- stored lowercase
  username           VARCHAR(50)  NOT NULL UNIQUE
  mobile_e164        VARCHAR(16)  NOT NULL UNIQUE
  job_role           VARCHAR(30)  NOT NULL  -- ADMIN | MANAGER | SALES_EXECUTIVE (mirror of Keycloak, for display/reporting)
  whatsapp_opt_in    BOOLEAN NOT NULL DEFAULT false
  status             VARCHAR(30)  NOT NULL  -- §7
  status_reason      TEXT NULL
  created_by, updated_by  UUID NOT NULL     -- employee id of the actor (from token sub → employee)
  created_at, updated_at  TIMESTAMPTZ NOT NULL
  version            INT NOT NULL           -- optimistic locking

audit_event (append-only, enforced by a trigger that rejects UPDATE/DELETE/TRUNCATE, because the app user owns the table)
  id, occurred_at, actor_id (null for SYSTEM_* actors), actor_label, actor_ip, action, entity_type, entity_id,
  before_json, after_json, reason, correlation_id, outcome

idempotency_key
  key, actor_id, request_hash, response_json, created_at   -- 24 h retention
```

**Not stored:** passwords, OTPs, tokens, reset links. The job role is kept in the DB as a copy for display only; **authorization always reads the token**, never this column.

## 10. Failure scenarios

| # | Scenario | What happens | Admin sees / action |
|---|---|---|---|
| F1 | Keycloak down when an employee is created | Row stays `PENDING_PROVISIONING`; API returns 202 with that status. The reconciliation job retries with backoff | "Provisioning pending" + Retry button |
| F2 | Keycloak returns 409 (email/username taken) | Adopt the existing Keycloak user **only** if its username **and** email match this employee and no other employee is linked to it (our own earlier, half-finished attempt). Otherwise the row stays `PENDING_PROVISIONING` with the reason, and the API returns 202 | "Email or username already exists in identity system" + Retry after it is resolved |
| F3 | User created, role assignment fails | Keep `keycloak_user_id`; retry role assignment (idempotent) | Retry |
| F4 | SMTP down / invite email fails | `INVITE_EMAIL_FAILED`; the Keycloak user stays created | "Invite email failed" + Resend |
| F5 | Invite link expired (after 24 h) | Keycloak shows "link expired" | Admin → Resend invite |
| F6 | Deactivation: Keycloak call fails | Nothing changes, 502 | Error toast; retry |
| F7 | Deactivated employee holds a valid access token | Works until expiry, ≤ 5 min; refresh fails | Documented limit (R-004) |
| F8 | Keycloak down during login | Login page unreachable; already-issued tokens keep working until expiry; refresh fails → logged out | Health alert (Sprint 1 observability) |
| F9 | Signing key rotated | Resource servers re-fetch JWKS when an unknown `kid` arrives | None |
| F10 | Password brute force | Keycloak lockout (5 failures → 15-min wait, rising) | Visible in Keycloak events |
| F11 | Two admins edit the same employee | Optimistic lock (`version`) → 409 | "Changed by someone else, reload" |
| F12 | Clock skew between servers | 60 s tolerance on `exp` and `nbf` | None |
| F13 | access-service admin client secret leaked | Rotate it in Keycloak; the client only has user-management roles (KEYCLOAK-SETUP §5) | Incident runbook (Phase 7) |

## 11. Security considerations

- **Least-privilege admin client:** the `access-service` service account gets only `realm-management` → `manage-users`, `view-users`, `query-users`.
  - Risk: `manage-users` can also map *any* realm role, including `ADMIN`.
  - Mitigation: access-service only assigns roles from an allow-list, and only callers with `roles.assign` can ask; audited. Keycloak 26.8 (D-115) supports Fine-Grained Admin Permissions v2, which could enforce this inside Keycloak too. Evaluate it in S6 (R-005).
- Separate realms for staff (`gh-staff`) and guests (`gh-guests`, Q-003). A guest token has the wrong issuer, so it gets 401 on every staff endpoint (Blueprint §16 negative test).
- Audience check (`aud=erp-api`) stops a token issued to another client from being replayed against the API.
- Direct Access Grants (password grant) and Implicit flow are **off** on `erp-web`. Exact redirect URIs only, no wildcards.
- MFA: Keycloak's built-in TOTP is recommended as a required action for `ADMIN` (not custom OTP; Keycloak feature). This is Ashish's/the client's decision (Q-021).
- Rate limiting at the gateway for `/api/v1/admin/**`, plus Keycloak brute-force detection for logins.
- Never logged: tokens, Authorization headers, passwords, action links, Keycloak client secrets. Log filters mask `Authorization` and `client_secret`.
- Audit events (Blueprint §17 / engineering rule 6): employee create, edit, activate, deactivate, role change, resend invite, provisioning failure. Logins and failed logins come from Keycloak events (KEYCLOAK-SETUP §6).
- HTTPS everywhere except local dev; Keycloak runs with `KC_HOSTNAME` set and `proxy-headers` behind TLS termination.
- Secrets (`KC_ADMIN_CLIENT_SECRET`, SMTP password, DB passwords) come from environment or a secrets manager, never from git; the gitleaks CI job checks this.
- Personal data (DPDP Act): employee mobile and email are PII. Collect only these fields, mask them in logs, and get the retention policy from the client (Q-022).

## 12. Test list (written before code, Sprint 1)

- No token → 401; expired token → 401; wrong-issuer (guest realm) token → 401; wrong audience → 401.
- SALES_EXECUTIVE calling `/api/v1/admin/employees` → 403. MANAGER creating an employee → 403.
- Create employee → Keycloak user exists with the required actions, the role is mapped, `INVITED`; the email shows up in Mailpit.
- Same Idempotency-Key twice → one employee.
- Keycloak stopped while creating → `PENDING_PROVISIONING`; Keycloak restarted plus the job runs → `INVITED`.
- Deactivate → Keycloak user disabled, sessions gone, refresh fails, DB `DISABLED`, audit row.
- The last ADMIN can't be deactivated; an admin can't deactivate themself.
- Status sync turns `INVITED` into `ACTIVE` after the employee finishes the actions.
- Integration tests run a real Keycloak via Testcontainers (`dasniko/testcontainers-keycloak`). That is a new test dependency and needs approval in Sprint 1 (Q-023).
