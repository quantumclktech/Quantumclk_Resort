# Gold Membership increment: handoff for the next session

> **Update 2026-11-16T16:57:** S3 is now code-complete (guest-service, access-service welcome/resend, web resend button, CI checks, docs incl. `identity/MEMBER-LOGIN.md`), all tests green, still **uncommitted and not live**. The .env variables below are now set. The latest status is in `docs/logs/STATE.md` and the last DEVLOG entry; §4 "Remaining S3 work" items 2–4 are done, item 1 (live Keycloak recreate) is pending approval.

Written 2026-11-16 ~16:15 IST at the end of a long session. Read this first, then:
- `docs/03-phases/phase-1/inc-membership-PLAN.md`: the approved plan, with the S6 amendment at the end;
- `docs/logs/STATE.md` and the last entries of `docs/logs/DEVLOG.md`.

**Mandatory:** load the `erp-prp` skill at session start. Its rules apply:
- the resource folder is read-only;
- **ask before every commit**;
- never push;
- update the logs and docs as you go.

**Branch:** `feature/phase1-membership` (from `feature/phase1-fresh-start`). Nothing is pushed.

---

## 1. What the owner (Ashish) asked for

Field sales Gold Membership:
1. A Sales Executive registers a customer on site: name, DOB, mobile, email, address.
2. Payment is Cash, Card (with transaction ID) or Scan QR (with a payment screenshot from the camera or the gallery).
3. A Manager or Admin verifies the payment.
4. The customer gets **one welcome email** with their Member ID and a secure set-password link.
5. They set the password **once** and are **signed in automatically** on the landing page (no second login). There they see their Gold card, validity, booklet (55 vouchers + 125 coupons = 180), amenities and the enrolling executive.
6. The same Keycloak identity must later work for a mobile app and a customer web app.

**Standing instructions from Ashish:**
- Don't remove any existing UI feature, and don't redesign UI without asking.
- Plan every UI difference with him.
- Email only, through his own SMTP (Google). No SMS or WhatsApp.
- Ask about doubts and recommendations first.

## 2. Decisions (all recorded in `docs/logs/DECISIONS.md` and `OPEN_QUESTIONS.md`)

| ID | Decision |
|---|---|
| D-116 | Membership goes **before** increment 2 (leads). This reverses phase1_plan §7's deferral of payment screenshots, for membership only |
| D-117 | Member IDs come from the client series **GRH-LM-0101 … GRH-LM-5100** (`LM Mem ID.xlsx`, `Loyalty_Voucher_Numbers_5000.xlsx`), gap-free, assigned on save |
| D-118 | ADMIN and MANAGER verify or reject; nobody verifies their own registration |
| D-119 | Customer login uses **Authorization Code + PKCE** on Keycloak realm `gh-guests`. Supersedes D-114 (password pass-through) |
| D-120 | Membership data and APIs live in access-service / access_db. A **thin guest-service** handles guest identity provisioning. No membership copy in guest_db |
| D-121 | One Golden Hills-themed welcome email, sent **by Keycloak** through the realm SMTP (`SMTP_*`) |
| D-122 | Fully automatic sign-in after the password is set, through our Keycloak extension (see §4 S3) |
| D-123 | UI rules (below) |
| D-124 | **One public ngrok domain split by path**: landing `/`, staff ERP `/erp/`, Keycloak `/realms` + `/resources`, API `/api`. A Caddy proxy on :8088 does the routing; ngrok → :8088 |
| D-125 | The hard-delete-employee WIP was reverted (employees are only deactivated) |

**D-123, UI rules:**
- Landing `/login` keeps its layout. The password form becomes email only, and Sign In goes to Keycloak with `loginHint`.
- OTP and Booking-ID tabs stay visible, disabled, marked "Coming soon".
- The fake offline logins are removed.
- The amenities panel is read from config, marked "to be confirmed" (Q-032).
- The ledger uses `landing-page/src/app/membership-data.ts`. The per-voucher redeem QR is deferred.
- **S6 amendment:** connect Ritvik's existing `/profile` and `/membership` member screens (`guest-session.ts`, `membership-member-hero.tsx`, `membership-mine.tsx`, `booklet-usage.tsx`, `profile-sign-in.tsx`, `profile-view.tsx`) to real data. Don't build a separate folio.
- After the password is set, the member lands on **`/membership#your-card`**.
- `ProfileSignIn`: the Email tab keeps its look but has only an email field; Continue goes to Keycloak and the fake code step is skipped for real accounts. The Membership-ID tab keeps Ritvik's labelled sample preview.
- A real member shows **0 used** (all 180 available), with the note "Redemptions are recorded at the resort; online tracking comes later".
- The sample placeholder `GHR-CM-0427` becomes the `GRH-LM-0000` format.
- **Still open (owner to confirm):** on `/plan-ahead`, non-members see "Guest" instead of the hard-coded "Privilege Member" (Q-036). Leave it unchanged until he answers.

**Open client questions (placeholders in config until answered):**

| Q | Topic |
|---|---|
| Q-030 | Gold fee (the executive enters the amount) |
| Q-031 | UPI QR image (`VITE_UPI_QR_URL`, placeholder shown) |
| Q-032 | Amenities and the 20% / 15% discounts |
| Q-033 | Retention of screenshots and personal data |
| Q-034 | Guest session lengths (7 days idle / 30 days max) |
| Q-035 | Showing the executive's WhatsApp number (only if they opted in) |
| Q-036 | "Privilege Member" label for non-members |
| Q-037 | Series start 0101 |

## 3. Commits so far (all on `feature/phase1-membership` or before it; NOT pushed)

| Hash | What |
|---|---|
| `9a58edb` | Mobile access over one HTTPS origin (earlier WIP) |
| `4dee064` | Role-card start screen and Employees UI (earlier WIP) |
| `4772b89` | landing-page/ copied from `origin/Ritvik-Frontend` @ `2c164d9`, plus the local view-on-map fix. **Not a merge**: Ritvik's branch carries the archived history. An unfinished merge was dropped with `git merge --quit` |
| `f22f828` | Logs: D-116…D-125, Q-030…Q-037 |
| `97c5e0c` | **S0b**: Caddy proxy (`infra/proxy/Caddyfile`, compose service `proxy`, `caddy:2.11.7`); ERP `base: "/erp/"`; `ERP_WEB_URL`; Next `allowedDevOrigins`; the plan document |
| `4267d1b` | **S1 + S2**: membership backend and gateway routes (details §4) |
| `4da643a` | **S5**: ERP Memberships screen (details §4) |

Live state:
- ngrok now points at :8088.
- The **V2 migration is already applied** to the dev access_db (counter `GRH-LM|101|5100`).
- The **live gh-staff realm** already has the `memberships.*` roles, composites and `erp-web` scope mappings (KEYCLOAK-SETUP §5.4).
- `.env` has `ERP_WEB_URL` and `MEMBERSHIP_PROOF_KEY` (both git-ignored).

## 4. Slice status

### Done
**S0, S0b:** see §3.

**S1 (access-service, package `com.quantumclk.erp.access.membership`):**
- `V2__gold_membership.sql`:
  - `membership_number_counter` (UPDATE … RETURNING inside the registration transaction, so numbering is gap-free);
  - `resort_member`, with partial unique email/mobile indexes `WHERE status <> 'REJECTED'`, and `guest_user_id` / `account_status` columns ready for S3;
  - `member_payment`.
- `MembershipService`, `MembershipController` (`/api/v1/sales/memberships…`), `MembershipAdminController` (`/api/v1/admin/memberships…`), `MemberView`.
- `ProofStorage`: magic-byte check, at most 5 MB, AES-256-GCM with key `MEMBERSHIP_PROOF_KEY`, SHA-256 checked on read.
- Audit goes to the existing `audit_event` with `entity_type = 'MEMBER'`, via an `AuditLog.record` overload.
- `FieldErrorsException`; a 413 handler; `/me` adds the module `memberships`.
- Permissions: `memberships.register|read_own|read_all|verify`.
- Tests: **47/47**, of which `MembershipTest` is 21.
- Docs: api.md §3a, `docs/04-modules/membership.md`, REQ-MEM-001…009, TRACEABILITY.

**S2 (part):**
- The gateway's body limit is now per route: 6 MB only on `POST /api/v1/sales/memberships`, 1 MB elsewhere.
- `/api/v1/sales/**` is routed. Tests 13/13.
- **Still to do:** multi-issuer JWT (gh-guests for `/api/v1/portal/**`) and portal routes. These are part of S4.

**S5 (`web/src/Memberships.tsx` + test):**
- Tabs: Register member / My members / Verification queue.
- Camera and gallery inputs, a review drawer and a lightbox.
- `api.ts`: FormData uploads and Blob image responses.
- CSP: `img-src` gained `blob:`.
- Phone CSS rules.
- Tests: web **32/32**.

### In progress: S3 (UNCOMMITTED; nothing is wired live yet)

**Spike result: PASSED 5/5** (`ActivationFlowIT`, real Keycloak 26.8.2 + Mailpit). It proves:
1. The welcome email arrives with the right subject, GRH-LM-0101 and the validity date.
2. The link opens Keycloak's **Update password page directly**, with no login form.
3. One password submit returns a 302 to the landing page with `code=`.
4. The PKCE code exchange gives an access token with sub = the member, `email_verified` true and aud `guest-api`.
5. The same link a second time shows the normal login (single use).
6. The new password works for a normal login.
7. Forged links and links replaced by a resend are refused.
8. The send endpoint: no token → 401, foreign or `javascript:` URL → 400, unknown user → 404.
9. guest-service gets 403 on anything except users.
10. The realm keeps the standard browser, registration, reset and direct-grant flows, and guest-web is bound to our flow.

**New, uncommitted files:**
- `infra/keycloak-extensions/gh-member-activation/` (Maven module with its own `mvnw`; Keycloak 26.8.2 libraries as `provided`; test versions from the Spring Boot 4.1.2 BOM):
  - `ActivationTokens`: token = `<userId>.<43-char base64url>`. Only the SHA-256 hash and expiry are stored, as the user attributes `gh_activation_hash` / `gh_activation_exp`. A token is single-use and is replaced on resend.
  - `ActivationAuthenticator` and its factory, id `gh-member-activation`. It reads the auth-session note `client_request_param_activation_token`, marks the email verified, adds UPDATE_PASSWORD if the user has no password, and calls `success()`. If there's no valid token it returns "attempted", so the normal login runs.
  - `ActivationResource` and its factory, id `gh-activation`: `POST /realms/gh-guests/gh-activation/users/{id}/send` with `{activateUrl, validUntil, lifespanHours?}`.
    - The caller needs `realm-management manage-users`.
    - `activateUrl`'s origin must be in the `guest-web` web origins.
    - Default lifespan 72 h, maximum 168 h.
    - Sends the email through `EmailTemplateProvider.send("ghWelcomeSubject", …, "gh-welcome.ftl", attrs)`.
  - Themes inside the jar (`META-INF/keycloak-themes.json`):
    - `golden-hills` email theme (parent `keycloak`): `html/gh-welcome.ftl` with HTML auto-escaping, `text/gh-welcome.ftl`, and the subject message.
    - `golden-hills` login theme (parent `keycloak.v2`, `styles=css/styles.css css/golden-hills.css`, recoloured).
  - `pom.xml`: surefire also runs `*IT.java`; the jar plugin writes to `ERP_DEV/infra/keycloak-providers/`, which is git-ignored and **already built**: `gh-member-activation.jar`, 21 KB.
- `infra/keycloak/gh-guests-realm.json`:
  - registration on, email as username, verify email, remember-me;
  - password policy as for staff; brute-force protection;
  - sessions 7 days idle / 30 days max;
  - `loginTheme` / `emailTheme` = `golden-hills`; SMTP from `SMTP_*`;
  - user profile (declarative) with `membershipId` (admin edit, user view) and `unmanagedAttributePolicy: ADMIN_VIEW`;
  - flows `gh-member-browser` (activation → cookie → forms), with fixed flow id `6f0d7b8e-…3a01`;
  - client `guest-web`: public, PKCE S256, redirects to `${LANDING_PUBLIC_URL}/{login,member/activate,membership,profile,plan-ahead}*` plus the localhost:3000 equivalents, browser-flow override, audience mapper `guest-api`;
  - client `guest-service`: confidential, secret `${KC_GUEST_SERVICE_CLIENT_SECRET}`, service account with `manage-users`, `view-users` and `query-users`. Its default scopes **must include `kc-admin-api`**: Keycloak 26.8 Admin API calls get 401 without that audience. This was found in the spike.

**Modified, uncommitted files:**
- `infra/docker-compose.yml`:
  - keycloak env: `KC_GUEST_SERVICE_CLIENT_SECRET` (**required, `:?`**) and `LANDING_PUBLIC_URL` (default `http://localhost:3000`);
  - new volume `./keycloak-providers:/opt/keycloak/providers:ro`.
- `.gitignore`: `infra/keycloak-providers/`.
- `docs/logs/DEVLOG.md`: S5 commit line.

⚠️ **Must do before any `docker compose up`:** add to `ERP_DEV/.env`:
- `KC_GUEST_SERVICE_CLIENT_SECRET=<openssl rand -hex 24>`
- `LANDING_PUBLIC_URL=<same value as ERP_WEB_ORIGIN, i.e. https://weaponless-bertie-hyperorganically.ngrok-free.dev>`

The interrupted command did **not** write these. Also add both to `.env.example` with comments. Otherwise compose refuses to start. Also: `gh-guests-realm.json` sits in the mounted import folder, so Keycloak imports the realm on its next restart. The jar must exist in `infra/keycloak-providers/` first; it does now.

**Remaining S3 work:**
1. Add the env settings above. Recreate Keycloak: `docker compose --env-file ERP_DEV/.env -f ERP_DEV/infra/docker-compose.yml up -d keycloak`. **Ask Ashish first:** this restarts the live Keycloak; staff sessions persist in Postgres. Then check that realm `gh-guests` exists and `gh-staff` is untouched.
2. **guest-service**: `services/guest-service`, port 8092. Today it's only a README. Same stack and layout as access-service: Spring Boot 4.1.2, Java 21, copy `mvnw`, `SecurityConfig`, `CorrelationIdFilter`, `ApiError` / `ErrorHandler`.
   - `POST /internal/guests/provision {email, firstName, lastName, mobile, membershipId, validUntil}`: find or create the gh-guests user (no password, required action UPDATE_PASSWORD, attribute `membershipId`), then call the extension's send endpoint with `activateUrl = ${LANDING_PUBLIC_URL}/member/activate`. Returns `{guestUserId}`.
   - `POST /internal/guests/{id}/resend`.
   - Auth for `/internal/**`: a gh-staff client-credentials token from access-service carrying permission `guests.provision`. Add the `erp-api` client role `guests.provision`; assign it to `service-account-access-service` and add it to the access-service client's scope, in the JSON **and in the live realm via kcadm**. Use the KEYCLOAK-SETUP §5.4 pattern.
   - `GET /api/v1/portal/me` (gh-guests token, aud `guest-api`).
   - `guest_db`: `guest_account(keycloak_user_id, email, names, mobile, source, timestamps)` and `audit_event`. **No membership data.** Add the db and user in `infra/postgres/init/01-service-databases.sh` (runs only on a fresh volume; on the live DB create them by hand).
   - Tests: Testcontainers Postgres plus a fake Keycloak; optionally reuse the extension in a Keycloak container.
3. **access-service**:
   - After verify commits, call guest-service provision (outside the transaction). On success set `guest_user_id` and `account_status = INVITE_SENT`; on failure set `INVITE_FAILED`. Audit `MEMBER_WELCOME_SENT` / `MEMBER_WELCOME_FAILED`.
   - Add `POST /api/v1/admin/memberships/{id}/resend-welcome` (permission `memberships.verify`).
   - Format the validity in the email as e.g. "16 Nov 2027" in IST.
   - Get the gh-staff client-credentials token for calling guest-service the way `KeycloakAdminClient` does.
   - Add a "Resend welcome" button in `Memberships.tsx` (review drawer) and show `accountStatus`.
4. Docs: KEYCLOAK-SETUP (new section for gh-guests, building the extension, `kc-admin-api`), the extension's `README.md`, AUTHENTICATION (guest PKCE + activation, supersedes D-114), DAY-ONE (build jar → compose up), membership.md, api.md, ARCHITECTURE, TRACEABILITY (REQ-MEM-008). Then the DEVLOG/STATE entries, then **ask before committing**.

### Not started
**S4 (portal API):**
- access-service `GET /api/v1/portal/membership/me`: the member found by JWT `sub` = `guest_user_id`, no id in the path. Returns name, membershipId, tier, status, validity and the enrolling executive (WhatsApp/phone only if they opted in, otherwise the resort desk). On first access set `account_status = ACTIVE`.
- A second `SecurityFilterChain` for `/api/v1/portal/**` with the gh-guests issuer and aud `guest-api`.
- Gateway: multi-issuer (`JwtIssuerReactiveAuthenticationManagerResolver`). `/api/v1/portal/**` is currently `permitAll` at the gateway. Route `/api/v1/portal/membership/**` to access-service and `/api/v1/portal/me` to guest-service.
- Tests: a staff token on a portal path → 401; guest A can't read guest B; a guest without a membership → 404.

**S6 (landing page):**
- Read `landing-page/node_modules/next/dist/docs/` first: Next 16 differs from what you know (`landing-page/AGENTS.md`).
- Add `keycloak-js` 26.2.5 (the same version as web), with tokens kept in memory.
- `/member/activate`: build the keycloak-js login URL, append `&activation_token=<t>`, and redirect with `redirectUri = /membership#your-card`.
- Wire `guest-session.ts` with a new session kind "member". Then `login-portal.tsx`, `profile-sign-in.tsx`, `plan-stay-portal.tsx` and `portal-client.ts` as in D-123. `portal-client.ts` currently defaults to `http://localhost:8082`; change it to the same-origin `/api/v1/portal`.
- `next.config.ts` already has `allowedDevOrigins`. Add a `/api` rewrite for plain localhost dev.
- `MembershipCard`: optional `memberId` prop.
- Amenities from a config file; concierge card.

**S7:** end-to-end test on the phone through the single ngrok URL, and the increment report `inc-membership-REPORT.md`.

## 5. Environment and gotchas

**Windows machine, Git Bash.** Repository root `D:\Intership wrok\ERP_Resort`. Resource folder `D:\Intership wrok\ERP_Resouce` (read-only).

**Running services** (started by Ashish; the tool may refuse to kill his processes, so ask him to restart them):

| Service | Where |
|---|---|
| compose | postgres :5433, keycloak :8081, redis, mailpit :8025, proxy :8088 |
| access-service | :8091 |
| api-gateway | :8082 |
| web (Vite) | :5173/erp/ |
| landing page (Next) | :3000 |
| ngrok | `ngrok http 127.0.0.1:8088 --url=weaponless-bertie-hyperorganically.ngrok-free.dev` |

- **access-service and the gateway must be restarted** to run the S1/S2 code. Ashish was going to do this and test S5 live; check with him. Staff must sign out and in again for `memberships.*`.
- **Backend tests:** `cd services/<svc> && env -u KEYCLOAK_ADMIN_URL -u KEYCLOAK_URL -u ERP_WEB_URL ./mvnw -B -q test`, without a sourced `.env`.
- **Web:** `npm test`, `npm run lint`, `npm run build`.
- **Extension:** `cd infra/keycloak-extensions/gh-member-activation && ./mvnw -B -q test` (needs Docker, ~100 s); `./mvnw -q package -DskipTests` writes the jar to `infra/keycloak-providers/`.
- **Keycloak realm JSON:** `${VAR}` is replaced from the environment at import, so never use `${…}` in display names. `--import-realm` only creates missing realms; change existing ones with `kcadm` (KEYCLOAK-SETUP §5.4).
- **Secure cookies over plain HTTP:** Keycloak sets `Secure` cookies even on http. Browsers accept that on localhost and over HTTPS, but Java's CookieManager doesn't (the spike test has its own cookie jar).
- **`skills-lock.json`** at the repository root is untracked on purpose; don't commit it.
- **Push is blocked:** the GitHub token needs the `workflow` scope. Never push without approval anyway.
- **Ritvik's landing-page updates:** take them by copying `landing-page/` from `origin/Ritvik-Frontend`, never by merging.
