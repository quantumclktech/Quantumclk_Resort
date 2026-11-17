# Development Log (append-only)

History before 2026-11-15 is in `archive/hotel-draft:ERP_DEV/docs/logs/DEVLOG.md`.

## 2026-11-15 — Audit of phase1_plan.md v1.0 and fresh start
- Ashish asked for an audit of his `phase1_plan.md`. The findings (custom OTP brute-force risk, plain-text OTP, account enumeration, the hard-coded JWT fallback secret in the archived `JwtTokenService`, double-booking, IDOR on proofs, claim race, plain-text Aadhaar, revenue double count, main-branch cleanup risk) were given in chat and in the session plan file.
- Q: login choice → A (Ashish): keep custom OTP *(later reversed, see below)*. Q: old modules → A: archive on a separate branch and clean main. Q: payment check → A: keep observatory. Q: booking store → A: lead-service + DB guard.
- Ashish then decided to restart: everything archived on a unique branch, a fresh Phase 1 with new docs, the landing page unchanged, the backend rebuilt with the same portal API, the web app rebuilt, merged through a branch. Same tech stack (asked separately).
- Q: push archive? → A: yes. Q: where to commit the WIP? → A: "pull first, then fresh branch only".
- Commands: `git branch archive/hotel-draft 825f3fe`; `git tag -a archive-hotel-draft-2026-11-15`; `git fetch` (origin/main = 825f3fe); `git pull --ff-only` (already up to date); `git push origin archive/hotel-draft archive-hotel-draft-2026-11-15`; checked with `git ls-remote` (825f3fe). `git switch -c feature/phase1-fresh-start`.
- Commit `a40defe` (approved): landing view-on-map icon fix + phase1_plan.md v1.0 + .gitignore for the symlinked node_modules and LibreOffice lock files.
- Q: remove list → A: approved as listed. `git rm` of 322 files; commit `5d220ab` (approved).

## 2026-11-15 — Milestone 1 (docs + skeleton) started
- Ashish's conditions: docs and skeleton only, no app code; review the SOW and requirements first; don't delete local files or `.env`; update CI; show everything before committing or pushing; if the resource drive is missing, say what to mount and wait.
- The resource folder is not at the rule path `/run/media/ash_63/DATA/ERP_Resouce`. It was found at `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce` (same name, 21 files) and used read-only (Q-001).
- Read: Phase 1 Blueprint (all of it), SOW sections §3–§12, §22–§26, discovery call summary, the questionnaire (blank form), and greps of the call transcript. Extracts with matching sha256 were restored from the archive.
- Conflicts between plan v1.0 and the Blueprint were shown to Ashish (staff login, booking/payment, service shape, roles, missing lead features).
- Q: staff login → A: **Keycloak for employee authentication and account management; follow the Blueprint** (detailed onboarding/login/logout/deactivation spec given). Q: booking/payment → A: **follow the Blueprint** (none in Phase 1). Q: backend shape → A: **Blueprint microservices**. Q: extra Blueprint features → A: **"we will add new feature later"**.
- Checks run: `npm run typecheck` in landing-page → exit 0. `npm run lint` → 4 errors / 7 warnings already present (Q-004). `npm run build` → fails locally only because `landing-page/node_modules` is a symlink outside the project root (Turbopack refuses it); not reproducible in CI with `npm ci`.
- SRS reviewed after the first draft. Added: SMS excluded (Q-007), event enquiry form (Q-008), 8 h shift (Q-019), client designations for the sales role (Q-027), who manages employees (new Q-029), delete reserved for Owner/MD (AUTHENTICATION §7).
- Docs written (uncommitted, for review): see STATE.md item 2.

## 2026-11-15T11:23:40+05:30 — Resource path rule updated (answers Q-001)
- Ashish: "/run/media/ash_63/DATA/Intership wrok/ERP_Resouce: update the rule and read the resources from here, and commit it".
- Updated the path in `AGENTS.md`, `opencode.json` (permission allow-list), `.opencode/skills/erp-prp/SKILL.md`, `references/docs-and-records.md`, `references/phases.md`. The source-extract headers still show the old path, because they record where each file was read at the time; the sha256 values are unchanged.
- Ashish approved the commit of Milestone 1 docs + CI + rule update in the same message. Push not approved.
- Commit `e9841f5` docs(core): phase 1 baseline (40 files, approved by Ashish). Not pushed.

## 2026-11-15T11:27:15+05:30 — Push attempt and increment 1 decisions
- Ashish: "go ahead". `git push -u origin feature/phase1-fresh-start` was **rejected** by GitHub: the stored personal access token has no `workflow` scope, which a change to `.github/workflows/ci.yml` needs. Nothing was pushed. Ashish must update the token (classic: `workflow` scope; fine-grained: Workflows read/write).
- Q-020 → upgrade the same products; Q-029 → ADMIN only; Q-003 → Keycloak pass-through (A). See D-112…D-114.
- Increment 1 plan written: `docs/03-phases/phase-1/inc1-PLAN.md` (waiting for approval).

## 2026-11-15T11:30:28+05:30 — Increment 1 approved
- Ashish approved `inc1-PLAN.md` as written; approved checking versions on official release pages (spring.io, keycloak.org, GitHub releases, npm) for this increment; approved Q-023 dependencies (Testcontainers PostgreSQL, testcontainers-keycloak, Mailpit image, keycloak-js); approved committing the doc updates.
- Commit `eb2c8ba` docs(core): record inc 1 decisions and increment 1 plan (approved). Branch `feature/phase1-inc1-identity` created from it.

## 2026-11-15T11:32:44+05:30 — Versions checked (approved web lookups)
- URLs: https://api.spring.io/projects/spring-boot/generations, https://api.spring.io/projects/spring-cloud/generations, https://api.github.com/repos/{spring-projects/spring-boot, spring-cloud/spring-cloud-release, keycloak/keycloak, axllent/mailpit, redis/redis, testcontainers/testcontainers-java, dasniko/testcontainers-keycloak}/releases, https://registry.npmjs.org/{react,vite,typescript,vitest,keycloak-js,oxlint,@testing-library/react}/latest, https://hub.docker.com/v2/repositories/library/postgres/tags. GET requests only; no project data sent.
- Finding: every Spring Boot 3.x line lost open-source support on 2026-06-30 (3.5.x). Q to Ashish: Boot 4.1.2 or 3.5.16 → A: **4.1.2**. Q: accept the rest of the table → A: **accept all** (incl. TypeScript 7, Redis 8 licence noted). D-115.
- Corrected ADR-001: Boot 3.2 open-source support ended 2024-12-31 (it said Nov 2024).

## 2026-11-15T11:44:30+05:30 — Increment 1, slice S1 (infra + realm)
- Added `infra/docker-compose.yml` (PostgreSQL 18.7 on host port 5433, because a system PostgreSQL service already uses 5432 on this machine and was left untouched; Keycloak 26.8.2; Redis 8.10.3; Mailpit 1.33.1; all bound to 127.0.0.1; secrets required through `${VAR:?}`), `infra/postgres/init/01-service-databases.sh` (DB + least-privilege login for keycloak and access_db), `infra/keycloak/gh-staff-realm.json` (generated; placeholders only), `ERP_DEV/.env.example`, CI job `realm-check`.
- Verification ran on a throwaway compose project `erp-s1-check` with random secrets in the session scratchpad (not in git, not in `ERP_DEV/.env`). Removed afterwards with `down -v`.
- Problems found and fixed:
  1. `openssl` isn't installed → secrets generated with Python; `.env.example` hint changed.
  2. Service-account token had no `sub` (missing `basic` scope) → Admin API 401 → `basic` added.
  3. Still 401: Keycloak 26.x needs the `kc-admin-api` scope (Admin API audience) → added to access-service only.
  4. Keycloak warns "Full scope allowed" is deprecated → turned off on all clients, with explicit scope mappings.
  5. Service account can't `GET /roles/{name}` (needs view-realm) → by design; role lookup via `/users/{id}/role-mappings/realm/available` (KEYCLOAK-SETUP §5.3).
- Final live check: 15/15 PASS (discovery; password grant refused; PKCE enforced; client secret placeholder resolved; SA creates a user and maps a role; SA can't create a client or read roles; invite email "Update Your Account" received in Mailpit; token aud=erp-api, SALES_EXECUTIVE + 3 permissions, 300 s lifespan; realm security settings). Also: access_svc refused on the keycloak DB ("User does not have CONNECT privilege"); Redis without a password → NOAUTH. CI realm-check rules 14/14 locally.
- Not yet checked: brute-force lockout behaviour and following the invite link (S5, needs a browser login); CI on GitHub (push still blocked by the token scope).
- Ashish's `ERP_DEV/.env` wasn't edited. It needs the new variable names from `.env.example` before `docker compose` can run.
- Commit `8d5f9bc` feat(infra): local stack and gh-staff Keycloak realm (approved by Ashish).

## 2026-11-15T11:55:38+05:30 — Increment 1, slice S2 (access-service skeleton)
- Q: Maven isn't installed → A (Ashish): **Maven Wrapper**. Downloaded Apache Maven 3.10.0 from Maven Central into `~/.local/share/maven` (user folder, no sudo; sha512 checked), generated the wrapper 3.3.4 (only-script) in access-service, and pinned `distributionSha256Sum` after checking the zip against the official sha512. Starter names read from the official spring-boot-dependencies 4.1.2 BOM.
- Built: `pom.xml` (Boot 4.1.2, Java 21 target; local JDK is 25), `SecurityConfig` (JWKS via the realm certs URL, lazy; validators: timestamp ±60 s, issuer, aud=erp-api; ROLE_/PERM_ mapping; JSON 401/403), `CorrelationIdFilter` (accepts only [A-Za-z0-9-]{1,64}), `ErrorHandler`, `MeController`, `Employee` entity/repository, Flyway V1 (employee with CHECK constraints, append-only audit_event via trigger, idempotency_key), ECS JSON logs.
- Tests: `./mvnw verify` → **11/11 pass** (MeEndpointTest 9, AuditAppendOnlyTest 2) on Testcontainers PostgreSQL 18.7. First run: 7 errors because the test decoder didn't replace the production one (bean override order) → test decoder made `@Primary`.
- Live run against the compose stack (throwaway secrets): health UP; no token → 401 JSON with correlationId; real Keycloak service-account token (aud=realm-management) → 401; flyway_schema_history = "1 employee audit idempotency"; log has 0 lines mentioning password/secret. Not shown: whether that 401 came from the audience or the signature check (proved in S4 with a real employee token); request-time logs with correlationId (no request logging yet).
- Mistakes during the check: (1) the folder path with a space broke an unquoted variable → rerun with an array; (2) `pkill -f` matched its own shell and killed it → used a stricter pgrep + kill. No effect on files.
- CI: the service job now runs `./mvnw -B verify` in the service folder.
- AUTHENTICATION §9 updated: audit_event has `actor_label` and `reason`, and append-only is enforced by a trigger.
- Commit `bd8d799` feat(auth): access-service skeleton (approved by Ashish).

## 2026-11-15T12:04:57+05:30 — Increment 1, slice S3 (api-gateway) + S2 file-mode fix
- Found after committing S2 (`bd8d799`): `mvnw` was committed as 100644. The repo is on an NTFS (fuseblk) drive with `core.fileMode=false`, so git never sees +x and CI would fail. Fixed with `git update-index --chmod=+x` for both mvnw files and `infra/postgres/init/01-service-databases.sh`. `.gitattributes`: `*.cmd` CRLF, `*.sh` and `mvnw` LF. Included in the S3 commit.
- Gateway: Spring Cloud 2025.1.4 BOM read from Maven Central (Gateway 5.0.4; WebFlux and WebMVC server starters). Chose WebFlux for the Redis rate limiter. **Boot 4.1.2 + Spring Cloud 2025.1.4 start fine** (the D-115 open point is closed).
- Built: SecurityConfig (same token rules as access-service; validator duplicated, marked `shortcut:`), CorrelationIdWebFilter (runs before security so 401s carry the id), JSON 401/403, CORS (5173 + 3000 only), KeyResolver (employee `sub`, else peer IP), default filters RequestSize + RequestRateLimiter, route `/api/v1/me` + `/api/v1/admin/**` → access-service.
- Tests: first run 7/10. Three test-side mistakes (stub `path()` drops the leading slash; Spring now names 413 CONTENT_TOO_LARGE). After the fix: **10/10** (GatewayRoutingTest 9, RateLimitTest 1) with real Redis 8.10.3 in Testcontainers.
- Live (compose stack + both jars): gateway health UP; no token → 401 + X-Correlation-Id; real Keycloak token with the wrong audience → 401; CORS preflight 5173 → 200, evil.example → 403; 0 Redis errors with the password-protected Redis.
- Known limit noted: the rate limiter fails open when Redis is down (R-011).
- Commit `88176a5` feat(core): api-gateway + S2 file-mode fix (approved by Ashish).

## 2026-11-15T12:22:28+05:30 — Increment 1, slice S4 (web shell + first real login)
- Versions from the npm registry: @vitejs/plugin-react 6.3.0 (needs Vite ^8), jsdom 31.0.1, @types/react(-dom) 19.3.0; Vitest 5.1 accepts Vite 8. Only packages the archived app also used; Sentry, icons and fonts were left out.
- `npm install` reused the old ignored `ERP_DEV/web/node_modules` from the archive (removed 49 / changed 38 packages in it). Generated content, restorable with `npm ci`. Reported to Ashish.
- Built: `auth.ts` (keycloak-js, PKCE S256, no forced login so the ERP shows its own sign-in page, tokens in memory), `api.ts` (Bearer token; 401 → one refresh + retry → sign-in; 403 → ForbiddenError; server error message surfaced), `App.tsx` (SignIn without a password field, Dashboard from /me, "ERP record not set up", Sign out), CSP meta, `.env.example`. AUTHENTICATION §5 updated: own sign-in page instead of `login-required`.
- Checks: lint 0 problems; **10/10 tests**; build OK after fixing `vite.config.ts` (Vitest's defineConfig is needed for the `test` key with TS 7).
- Live: the Brave DevTools browser was not available (no remote-debugging port), so the browser's OIDC flow was scripted with the same requests. Two script problems fixed: (1) it matched the wrong form action; (2) Python's cookie jar won't send Keycloak's Secure cookies over http://localhost (browsers do), so the script mimics that. A dev-only test user `s4.admin` was created in the throwaway realm via the master admin (password set by the script only; ERP code never sets passwords).
- Result **15/15**: wrong password refused; correct login → code; code + PKCE → tokens; gateway → access-service /me with a real token returns the linked profile, ADMIN role and permissions, modules, CORS header; refresh OK; rotation rejects the old refresh token; end-session logout redirects back; refresh fails after logout; Keycloak asks for the password again; a replayed code is refused **and** Keycloak revokes the session it created (seen first as an unexpected 400; confirmed from Keycloak events).
- Closed from S2: the live 401 for a wrong-audience token came from the audience rule, since real erp-api tokens are now accepted.
- Not checked: keycloak-js running in a real browser (redirect handling inside React). Covered by unit tests with a fake session; needs a manual click-through, or Brave started with remote debugging.
- Cleanup: jars, vite and the throwaway stack stopped (`down -v`); test password file deleted.
- Commit `4a8ef19` feat(web): staff ERP shell (approved by Ashish).

## 2026-11-15T14:36:25+05:30 — Increment 1, slice S5 (employee onboarding)
- Chose a plain Testcontainers GenericContainer for Keycloak instead of testcontainers-keycloak 4.4.0 (approved, but it would add keycloak-admin-client/RESTEasy/Jackson 2 to the test classpath). The test imports the **real** `infra/keycloak/gh-staff-realm.json`.
- Design change: dropped the `erp_employee_id` attribute on Keycloak users (Keycloak 26's user profile drops unmanaged attributes unless the realm allows them). Adoption on a 409 now requires the same username **and** email and no other linked employee. AUTHENTICATION §4/F2 and REQ-IAM-003 updated.
- Built (access-service): KeycloakAdmin interface + KeycloakAdminClient (client-credentials token cache; Unavailable / Conflict / EmailFailed), EmployeeService (idempotency key claimed in the same transaction as the insert; provisioning under a SKIP LOCKED row lock; status derived from Keycloak), EmployeeController (POST/GET/GET id/retry; MANAGER can't manage, D-113), AccountJobs (sync every 5 min, idempotency clean-up, bootstrap ADMIN with a deterministic key), AuditLog. Web: Employees screen (list, add, retry), hash routing.
- Bugs found by tests: (1) Jackson 3 rejects a missing primitive `boolean` → `whatsappOptIn` is now optional (Boolean, default false); (2) a class named `*IT` isn't run by surefire → renamed EmployeeOnboardingTest; (3) a test helper named `status` shadowed MockMvc's.
- Tests: access-service **18/18** (incl. real Keycloak + Mailpit + PostgreSQL); web **14/14**, lint 0, build OK.
- Live (throwaway stack): bootstrap ADMIN invited on start → email in Mailpit → link opens Keycloak's set-password page → short password refused → password set → login → list sync INVITED→ACTIVE → /me ADMIN → owner creates a Sales Executive via the gateway (201; same key returns the same employee; invite email sent) → 5 wrong passwords lock even the right one. **10/10.** Audit trail SYSTEM_BOOTSTRAP/SYSTEM_SYNC/owner recorded; 0 occurrences of the password, client secret or a JWT in either service log.
- Not done (S6): deactivate/reactivate, resend invite, role change, last-admin/self guards.
- Commit `524d862` feat(auth): employee onboarding (approved by Ashish).

## 2026-11-15T14:44:41+05:30 — Increment 1, slice S6 (account management)
- Built (access-service): KeycloakAdmin setEnabled/logout/replaceJobRole; AccountService (setActive, resendInvite, changeRole; Keycloak first, then DB; 502 when Keycloak is down with nothing changed; guards: reason required, self, last admin under `pg_advisory_xact_lock`, row busy → 409; resend limited to 3/hour from the audit trail); endpoints PATCH status, POST resend-invite, PUT role (roles.assign); GET /api/v1/admin/audit (audit.read). Web: row actions with a reason prompt, role selector (roles.assign only), Audit log page.
- Bug caught in review before testing: a failed resend would have rolled back its own INVITE_EMAIL_FAILED status (exception inside the transaction). The transaction now returns the outcome and the error is thrown after commit; a test proves the status is kept.
- Tests: access-service **26/26** (real Keycloak stack shared through the KeycloakStack base class; fake-Keycloak guard/failure tests); web **18/18** (one old expectation changed: a linked invite-failed row now offers "Resend invite", not "Retry"), lint 0, build OK.
- Live (throwaway stack, real sessions): **16/16**. Deactivation rejects the refresh token at once and blocks login ("account disabled"). **R-004 measured:** an access token issued before deactivation still worked until its 5-minute expiry, as documented. Reactivation → ACTIVE; role change → old refresh token rejected, new login carries MANAGER, can list but not deactivate; owner self-deactivation → 409; audit shows the actions with reasons. Logs: 0 occurrences of the client secret or a JWT.
- Commit `73360dc` feat(auth): account management (approved by Ashish).

## 2026-11-15T14:53:16+05:30 — Increment 1, slice S7 (close)
- Fresh-developer test: `git clone --branch feature/phase1-inc1-identity` into the scratchpad (a normal Linux filesystem, so file modes are real): mvnw files executable ✅, no .env ✅. Followed DAY-ONE literally: landing-page npm ci + typecheck + **build** ✅ (closes R-010); `.env` from .env.example with generated secrets + BOOTSTRAP_ADMIN_*; compose up (default project golden-hills-erp; checked beforehand that no such volume existed) → 4 healthy; `./mvnw spring-boot:run` for both services; web npm ci + dev; bootstrap email → set password → sign in → /me ADMIN ✅. In the clone: web lint/18 tests/build ✅, access-service verify 26 ✅, api-gateway verify 10 ✅. No DAY-ONE gaps found; prerequisites text updated (JDK 21+, no Maven install needed).
- Cleanup mistake (again): `pgrep -f` with a pattern that was also in my own command killed the calling shell (same as S2). Servers were then stopped by listening port; stack `down -v` and clone removed. Memory note sharpened.
- Secret checks: no credential columns in the schema; no tracked env files; repo scan found only landing-page skills-lock content hashes. gitleaks is not installed locally (CI only).
- TRACEABILITY: REQ-IAM-001 and -008 evidence filled in, so all 14 IAM requirements now have evidence. inc1-PLAN definition of done ticked (except CI on GitHub). Report: docs/03-phases/phase-1/inc1-REPORT.md.
- 2026-11-15T15:02:04+05:30: The session was interrupted after this entry was written, and the evidence logs were lost with the scratchpad clone. **Re-verified before committing:** new clean clone → DAY-ONE (compose up 4 healthy, both services via `./mvnw spring-boot:run`, bootstrap email → set password → sign in → /me ADMIN) ✅; in the clone access-service `./mvnw -B verify` 26/26 BUILD SUCCESS, api-gateway 10/10 BUILD SUCCESS, web lint 0 / 18 tests / build ✅. Stack `down -v`, clone removed.
- Mistake during the restart: a `cd` into the already-deleted clone failed, and the next commands ran in the real repo. That briefly started access-service (failed) and api-gateway (health DOWN) from the repo with Ashish's `ERP_DEV/.env` sourced into that shell (read only, not modified). Both were stopped by port; `git status` showed no change from it. From now on every scripted `cd` uses `|| exit 1`.
- 2026-11-15T15:06:17+05:30: Ashish approved the S7 commit and a local `--no-ff` merge of feature/phase1-inc1-identity into feature/phase1-fresh-start.
- 2026-11-15T15:06:30+05:30: Commit `17e9d9d` (S7, approved). Merged locally with `--no-ff` into feature/phase1-fresh-start → `adf4417` (approved). The merged tree is identical to 17e9d9d, whose code equals 73360dc, which was tested in the clean clone (26/10/18). Not pushed.

## 2026-11-15T18:55:08+05:30 — Login failure diagnosed and fixed: realm `frontendUrl` pointed at a tunnel
- Ashish reported the Keycloak page **"We are sorry… Restart login cookie not found"** at `https://nebraska-cole-signal-rotation.trycloudflare.com/realms/gh-staff/login-actions/authenticate`. Investigation only; no source code changed.
- **Root cause:** the `gh-staff` realm had the persisted attribute `frontendUrl = https://nebraska-cole-signal-rotation.trycloudflare.com` (Keycloak DB, `realm_attribute`; it is **not** in `infra/keycloak/gh-staff-realm.json`). A realm `frontendUrl` overrides the request host for every generated URL, including the login form's `action`. The login page was therefore served from `http://localhost:8081` but posted to the tunnel, so the `KC_RESTART`/`AUTH_SESSION_ID` cookies (host-only, set for localhost) were not sent → Keycloak answers "Restart login cookie not found". Keycloak events confirm it: `LOGIN_ERROR … error="cookie_not_found"`, client `erp-web`, 12:51 (×4) and 13:12 UTC.
- **Evidence:** (1) `psql` on the Keycloak DB showed the attribute; (2) a `curl` to `http://localhost:8081/.../auth` returned a form whose action was the tunnel URL, reproducible; (3) a tunnel-origin probe (form + POST on the same origin) returned "Invalid username or password", proving the cookies themselves worked; (4) reloading the stale tab dropped `session_code` and restarted the auth session, as expected for an expired session. Keycloak had also been restarted at 12:36 UTC, which invalidates in-memory auth sessions; the older failures at 12:51 were that second cause.
- **Fix (runtime config only):**
  1. Removed `attributes.frontendUrl` from realm `gh-staff` through the Admin API (`PUT /admin/realms/gh-staff`, 204). Verified: the auth page now generates `action="http://localhost:8081/realms/gh-staff/login-actions/authenticate"`.
  2. `ERP_DEV/.env` `KEYCLOAK_URL` and `ERP_DEV/web/.env` `VITE_KEYCLOAK_URL`: tunnel → `http://localhost:8081` (both files are git-ignored). Reason: the tunnel host is ephemeral and mixes origins with the `http://localhost:5173` redirect URI and the local API; the issuer must match what the browser uses.
  3. Restarted `api-gateway` and `access-service` with the corrected env, and started the web dev server (only the gateway was running; 8091 and 5173 were down).
- **Verified:** gateway `/actuator/health` 200, access-service 200, web 200; `/api/v1/me` without a token → 401 JSON with `X-Correlation-Id`; in Brave, "Sign in" from `http://localhost:5173` now redirects to `http://localhost:8081` and the form posts to the **same** origin; a deliberate wrong password shows **"Invalid username or password."**, not the cookie error. A real login still needs Ashish's password (the ERP stores none).
- **Not verified:** a successful end-to-end login with a real employee password (needs Ashish), and the API call that follows it (`/me` token issuer must be `http://localhost:8081/realms/gh-staff`).
- **Left alone, needs a decision:** the uncommitted `docker-compose.yml` change (`KC_HOSTNAME` removed, `KC_HOSTNAME_STRICT=false`, `KC_PROXY_HEADERS=xforwarded`) was not the cause and was not reverted; with a dynamic hostname any host works, but each host produces its own issuer, so config must stay on one origin. Also uncommitted and undecided: the employee hard-delete feature (see STATE).
- Doc added: KEYCLOAK-SETUP §1 now states that `frontendUrl` must stay unset locally, with the two curl checks.

## 2026-11-15T19:19:46+05:30 — Invite link on a phone: HTTPS via a stable ngrok hostname (single origin)
- **Goal (Ashish):** the emailed Keycloak invite link must open on a phone, and the ERP must be usable from any mobile. The link showed `ERR_CONNECTION_REFUSED` because it pointed at `localhost:8081`.
- **Wrong first hypothesis, disproved:** the firewall. `firewall-cmd --get-active-zones` shows `wlo1` in zone **FedoraWorkstation**, which already opens **1025-65535/tcp**. No sudo rule was needed; nothing was changed there.
- **Real blocker:** browsers expose `crypto.subtle` only in a **secure context**. `keycloak-js` needs it for PKCE `S256`. At `http://192.168.29.131:5173`, Brave reported `isSecureContext=false`, `crypto.subtle=undefined`, console *"Web Crypto API is not available"*, and the Sign in button did nothing. Plain HTTP on a LAN IP can **never** work for this app; disabling PKCE was rejected (AUTHENTICATION §5).
- **Decision (Ashish, asked with the question tool):** public HTTPS on the **ngrok free dev domain** — stable, free, one hostname. Cloudflare quick tunnel (ephemeral), own domain, and LAN HTTPS with a self-signed cert were offered and not chosen.
- **ngrok:** installed `~/.local/bin/ngrok` 3.39.13 from the official tarball; authtoken written to `~/.config/ngrok/ngrok.yml` (outside git, never in a log). The agent does **not** auto-use the free dev domain — two restarts produced `9dba-…` then `9cec-…`, so the assigned domain was taken from the dashboard and passed explicitly: `ngrok http 5173 --url=https://weaponless-bertie-hyperorganically.ngrok-free.dev`. That hostname is stable across restarts.
- **One origin for app + Keycloak + API** (no CORS, no cross-site cookies): `web/vite.config.ts` now proxies `/realms` and `/resources` → `:8081`, `/api` → `:8082`, adds `allowedHosts: [".ngrok-free.dev"]` (Vite otherwise answers `403 Blocked request. This host … is not allowed`) and `hmr.clientPort: 443`.
- **Config changed (git-ignored `.env` unless stated):** `KC_PUBLIC_URL`/`KEYCLOAK_URL` = the ngrok origin; new `KEYCLOAK_ADMIN_URL=http://localhost:8081` so provisioning calls stay internal; `KEYCLOAK_BIND=0.0.0.0` (LAN access kept, harmless); `CORS_ALLOWED_ORIGINS` = the ngrok origin + localhost; `web/.env` `VITE_API_URL`/`VITE_KEYCLOAK_URL` = the ngrok origin. `infra/docker-compose.yml` pins `KC_HOSTNAME=${KC_PUBLIC_URL}` (uncommitted, together with Ashish's earlier `KC_HOSTNAME_STRICT`/`KC_PROXY_HEADERS` change).
- **Code (uncommitted):** `application.yml` gained `erp.keycloak.admin-url` (defaults to `url`); `KeycloakAdminClient` injects it for Admin API calls while the issuer stays public. `web/vite.config.ts` as above. `erp-web` client redirect/web/post-logout URIs: `https://weaponless-…ngrok-free.dev/*` added, the dead tunnel and the unusable LAN origins removed.
- **Verified (commands run just now):** `issuer = https://weaponless-bertie-hyperorganically.ngrok-free.dev/realms/gh-staff`; SPA through the tunnel `200 text/html`; `/api/v1/me` through the tunnel `401` (gateway reached); theme files `/resources/...` all `200`; in Brave, the tunnel URL → "Visit Site" → app → **Sign in** → Keycloak on the **same** HTTPS origin (PKCE challenge present, `isSecureContext=true`) → wrong password shows **"Invalid username or password."** (no cookie error). ngrok's interstitial sets a cookie and calls `location.reload()`, so an invite link keeps its `?key=…` query.
- **Not verified:** a successful login and the `/me` call behind it (needs Ashish's password), and the actual invite email after a resend (rate limit: 3/hour; the old slots had expired by 13:49 UTC).
- **Operational notes:** the tunnel lives only while `ngrok http 5173 --url=… ` runs; if that process dies the URL stops working but the hostname stays the same. Free plan: 20k requests/1 GB per month, one browser interstitial per domain per 7 days. The ERP is now reachable from the public internet with dev credentials — acceptable for testing, must not be treated as staging.

## 2026-11-15T19:40:09+05:30 — Follow-up: the invite email now returns to the app; test proves it
- **Gap found while wiring the phone flow:** the setup email's last page ("Continue") had no return address, because `execute-actions-email` was called without `redirect_uri` — Keycloak then falls back to nothing useful and the employee is stranded after setting the password. `erp.web.origin` was already injected into `KeycloakAdminClient` for exactly this but never used.
- **Change:** `sendSetupEmail` now passes `redirect_uri=<erp.web.origin>/` (trailing slash added). `ERP_WEB_ORIGIN` in the git-ignored `.env` is now the public HTTPS origin, so the last page leads back into the ERP. The value must stay inside the `erp-web` client's registered redirect URIs (`<origin>/*`).
- **Bug found by the test harness and fixed:** `erp.keycloak.admin-url` defaulted to `${KEYCLOAK_URL:http://localhost:8081}`, not to `erp.keycloak.url`. In tests, `erp.keycloak.url` is overridden by Testcontainers, but a stray `KEYCLOAK_URL`/`KEYCLOAK_ADMIN_URL` from a sourced `.env` won, so the app provisioned into the **live** Keycloak (employee stayed `PENDING_PROVISIONING`, HTTP 202, and the assertion on the container's Keycloak returned null). Default is now `${erp.keycloak.url}`. Test commands from now on run **without** a sourced `.env` (the test resources supply `KC_ACCESS_SERVICE_CLIENT_SECRET`).
  - Side effect cleaned up: the bad run created user `ravi.kumar` (`ravi.kumar@example.test`) in the **live** `gh-staff` realm. Deleted via the Admin API (204); the live realm has no `ravi*` user.
- **Verified:** `./mvnw -q -Dtest=EmployeeOnboardingTest test` → surefire `Tests run: 3, Failures: 0, Errors: 0` (57 s). That test drives the real Keycloak 26.8.2 + Mailpit and asserts the setup mail is delivered, so Keycloak **accepts** the new `redirect_uri` and still sends the email. `npm run build` (tsc + vite) passes with the new proxy config.
- **Still not verified:** a real login with an employee password on a phone, and the invite link from a real Gmail message (next steps in STATE).

## 2026-11-15T19:53:43+05:30 — Start screen: two role cards (Sales Admin / Sales Executive)
- **Request (Ashish):** after opening the ERP, show role cards to pick before signing in. Exactly **two**: **Sales Admin** and **Sales Executive**. If the account's real role is not the tapped card, the **account role wins with no error** (his choice from the two options offered).
- **What changed:** `web/src/App.tsx` — `SignIn` renders `WORKSPACES` (ADMIN → "Sales Admin", SALES_EXECUTIVE → "Sales Executive") as two buttons, each calling the same `session.login()`. A hint line says "Your account decides what opens — the card only starts the sign-in." `ROLE_LABELS` maps the realm roles to those words and is now also used in the dashboard header, so the header and the cards speak the same language. `styles.css` gained `.role-picker`, `.role-choice` (hover/focus border) and `.signin .hint`; the existing `.role-cards`/`.role-card` are the **Add-employee** form's radio cards and were left alone.
- **Why a card cannot grant anything:** it is a UI entry point only. The token's roles drive `/api/v1/me` (`modules`, `permissions`) and the gateway/access-service check every request (AUTHENTICATION §5). Tapping "Sales Admin" and signing in as a Sales Executive simply opens the Sales Executive workspace. No role is sent through the redirect, so there is nothing to spoof.
- **Only two cards although the realm has three roles:** MANAGER exists in Keycloak (REQ-IAM-008) but is not offered on the start screen. Nothing breaks: a Manager signing in from either card gets whatever `/me` allows; they can be added to `WORKSPACES` later.
- **Test fixes:** `App.test.tsx` asserted a single "Sign in" button — rewritten to assert exactly the two card titles and that a card triggers one sign-in; the dashboard test now also checks the friendly role label. `api.test.ts` hard-coded `http://localhost:8082/api/v1/me`, which broke once `web/.env` (git-ignored) pointed `VITE_API_URL` at the tunnel — it now asserts against `config.apiUrl`, so it no longer depends on a local env file.
- **Verified:** `npm test` 20/20, `npm run build` (tsc + vite) ok, `npm run lint` (oxlint) clean. In Brave through the tunnel: the start screen shows both cards, and clicking **Sales Admin** navigates to `https://weaponless-…/realms/gh-staff/protocol/openid-connect/auth?...` with the PKCE challenge and `redirect_uri=https://weaponless-…/` — same origin, no interstitial on the second visit.

## 2026-11-16T07:27:30+05:30 — Analysis only: landing-page guest login vs D-114
- **Session start:** `erp-prp` copied to `.claude/skills/erp-prp/` so Claude Code can load it (resource path given for both Linux and Windows `D:\Intership wrok\ERP_Resouce`; the question tool name changed). The `.opencode/` copy is unchanged. Not committed.
- **Question to Ashish:** the pasted guest-login description (lead-service :8093, BCrypt in `lead_db`, own JWT) conflicts with D-114 (guest-service :8092 → Keycloak `gh-guests`). Options: keep D-114 / replace / just document. **Answer: "just analyze".** No decision taken; D-114 stays as recorded.
- **Read (no edits):** `landing-page/src/app/portal-client.ts`, `plan-ahead/login-portal.tsx`, `plan-ahead/plan-stay-portal.tsx`, `plan-ahead/portal-forms.tsx`, `booking-card.tsx`, `login/page.tsx`, `plan-ahead/page.tsx`; `ERP_DEV/docs/02-architecture/api.md` §2.
- **Findings:** the request/response shapes match the frozen contract in api.md §2. Only email+password register/login call the backend; Mobile OTP, booking-reference lookup, Google, Apple and forgot-password are `setTimeout` simulations that create a local session with a fake token. When the network fails, login and register in `login-portal.tsx`/`plan-stay-portal.tsx` create a fake session, and `plan-stay-portal.tsx` shows a fake inquiry reference on **any** error (not only network errors). The token and profile are in `localStorage` (`ghr_portal_user`). The 6-character minimum is only checked in the browser. "Quick Demo Fill" buttons fill in hard-coded credentials. Neither guest-service nor lead-service has code yet (READMEs only), so in the current stack every guest login is the offline simulation. Full list in the session reply; no open-question entry added yet (awaiting Ashish).

## 2026-11-16T13:37:00+05:30 — Full ERP stack started and verified
- **Request (Ashish):** "run the server".
- **Stack started:**
  1. Docker Desktop engine started; compose infra containers (`golden-hills-erp-postgres-1`, `golden-hills-erp-keycloak-1`, `golden-hills-erp-redis-1`, `golden-hills-erp-mailpit-1`) up and healthy.
  2. `access-service` (:8091) compiled and started via Spring Boot.
  3. `api-gateway` (:8082) compiled and started via Spring Boot.
  4. `ERP_DEV/web` (:5173, `--host 0.0.0.0`) Vite React dev server running.
  5. `landing-page` (:3000) Next.js Turbopack dev server running.
  6. `ngrok http 5173 --url=weaponless-bertie-hyperorganically.ngrok-free.dev` running for mobile/HTTPS access.
- **Verification:** All endpoints probed over HTTP and returned HTTP 200 OK:
  - Landing Page (`http://localhost:3000`) → 200
  - Staff ERP Web (`http://localhost:5173`) → 200
  - Keycloak Realm `gh-staff` (`http://localhost:8081/realms/gh-staff`) → 200
  - Gateway Health (`http://localhost:8082/actuator/health`) → 200
  - Access Service Health (`http://localhost:8091/actuator/health`) → 200
  - Mailpit UI (`http://localhost:8025`) → 200
  - Public ngrok Tunnel (`https://weaponless-bertie-hyperorganically.ngrok-free.dev`) → 200

## 2026-11-16T15:08:00+05:30 — Gold Membership plan approved; landing page synced; hard delete reverted
- **Session start:** `erp-prp` loaded; STATE/DEVLOG/OPEN_QUESTIONS read; `git status` checked.
- **Request (Ashish):** understand and execute the pasted "Field Sales Gold Membership Registration" master plan, pull the latest landing page first, remove no UI feature without asking, email only.
- **Resources read (read-only):** `LM Mem ID.xlsx`, `Golden_Hills_Resort_Loyalty_Voucher_Numbers_5000.xlsx` (client ID series GRH-LM-####), pricing PDF (no membership fee). Logged in RESOURCES_LOG.
- **Questions and answers (all via the question tool):** member ID format → client series; schedule → "go with the plan" (before leads); member login → Keycloak `gh-guests`, later refined to Authorization Code + PKCE with automatic sign-in after password setup ("customers must not enter their password twice"); verifiers → ADMIN + MANAGER; amenities → config (TBC); ledger → `membership-data.ts`, QR deferred; mock OTP/Booking tabs → "Coming soon", fake offline login removed; emails → one Keycloak-sent welcome email with member ID and set-password link, through Ashish's SMTP; public URLs → one ngrok domain split by path (landing `/`, ERP `/erp/`); member screens → connect Ritvik's new /profile and /membership screens to real data; Membership-ID tab stays preview; real members show 0 used; sample ID placeholder → `GRH-LM-0000`. Recorded as D-116…D-124; new open questions Q-030…Q-037.
- **Plan approved** (plan mode, ExitPlanMode). It is copied into `docs/03-phases/phase-1/inc-membership-PLAN.md` in the next docs step.
- **Landing page sync:** `git fetch origin` brought `origin/Ritvik-Frontend` from `b7aada9` to `2c164d9` (6 commits: guest profile portal, membership booklet usage, stay showcase, fixes). `git checkout origin/Ritvik-Frontend -- landing-page` (no merge: that branch is based on the archived history). The local `view-on-map.tsx` icon fix (lucide `Map` instead of `react-icons`) was kept. Now staged = `2c164d9` + that one file. `skills-lock.json` (agent skill list from that branch) was unstaged and left untracked.
- **Hard delete reverted (D-125):** removed `DELETE /api/v1/admin/employees/{id}`, `AccountService.deleteEmployee`, `KeycloakAdmin(.Client).deleteUser`, the FakeKeycloak stub and the Employees "Delete" button. Those four backend files now equal `HEAD`.
- **Verified:** web `npm test` 20/20, `npm run lint` clean, `npm run build` ok; access-service `mvn test` 26/26 (AccountManagement 4, AuditAppendOnly 2, EmployeeOnboarding 3, MeEndpoint 9, ProvisioningFailure 8), run without a sourced `.env`; landing-page `npm run typecheck` ok, `npm run build` ok.
- **Next:** four commits proposed and approved by Ashish (mobile/HTTPS access; role cards + Employees UI; landing sync; logs), then branch `feature/phase1-membership` and slice S0b (one domain by path).

## 2026-11-16T15:09:38+05:30 — Commits (approved by Ashish: "Yes, 4 commits as listed")
- An unfinished `git merge origin/Ritvik-Frontend` (MERGE_HEAD b7aada9, started 2026-11-16 00:04) blocked path commits. Asked Ashish; answer: "i want the change of ritvik but he has updated the landing page". Re-fetched: newest is still 2c164d9 and landing-page/ equals it except view-on-map.tsx. Ran `git merge --quit` (index and files unchanged), then committed by explicit paths:
  - `9a58edb` feat(auth,infra): mobile access over one HTTPS origin
  - `4dee064` feat(web): role-card start screen and refreshed Employees screen
  - `4772b89` chore(landing-page): sync Ritvik's landing page up to 2c164d9
  - `f22f828` docs(logs): decisions D-116..D-125, Q-030..Q-037
- Not pushed (push still needs the token `workflow` scope). `skills-lock.json` left untracked.
- Branch `feature/phase1-membership` created from `feature/phase1-fresh-start` (f22f828).

## 2026-11-16T15:16:43+05:30 — S0b: one public origin split by path (D-124) — built, verified locally, awaiting tunnel switch
- **Plan copy:** `docs/03-phases/phase-1/inc-membership-PLAN.md` (approved plan + S6 amendment).
- **Live realm read-only check** (`kcadm get clients -r gh-staff -q clientId=erp-web`): redirectUris `https://weaponless-…ngrok-free.dev/*`, webOrigins the same origin, public client, standard flow. `/*` already covers `/erp/*` → **no Keycloak change made.** Realms present: master, gh-staff.
- **Changes:** `infra/proxy/Caddyfile` + compose service `proxy` (`caddy:2.11.7`, newest release ≥ 2 weeks old; 2.11.8/2.11.9 too new), `127.0.0.1:8088`; routes `/realms`,`/resources` → keycloak:8081, `/api` → host :8082, `/erp/` → host :5173, rest → host :3000. `web/vite.config.ts` `base: "/erp/"`; `web/src/auth.ts` silent-SSO and logout use `BASE_URL`. access-service `erp.web.url` (`ERP_WEB_URL`, default `http://localhost:5173/erp/`) is the staff setup-email `redirect_uri`. `landing-page/next.config.ts` `allowedDevOrigins: ["*.ngrok-free.dev", …DEV_PUBLIC_HOSTS]` (read Next 16 doc `allowedDevOrigins.md` first). `.env.example` documents `ERP_WEB_URL`; local `.env` got `ERP_WEB_URL=<public origin>/erp/` (one appended line). Docs: KEYCLOAK-SETUP §1.1 + env table, DAY-ONE, web/infra READMEs.
- **Verified:** `caddy validate` → Valid configuration. web `npm test` 20/20, lint clean, build (assets under `/erp/assets/`). access-service `mvn test` 26/26. Proxy probes on `http://localhost:8088` with the public Host header: `/` 200, `/login` 200, `/membership` 200, `/erp` 308 → `/erp/`, `/erp/` 200 (`/erp/@vite/client`, `/erp/src/main.tsx`), `/erp/silent-check-sso.html` 200, `/realms/gh-staff` 200, issuer `https://weaponless-…/realms/gh-staff`, `/api/v1/me` 401 (gateway reached).
- **Not done (blocked):** stopping the running access-service (PID tree 12880) to load `ERP_WEB_URL` and switching the running ngrok agent from :5173 to :8088 were refused by the tool's safety check; a second access-service start failed on the busy port, as expected. Ashish to restart both. Phone test pending.

## 2026-11-16T15:40:40+05:30 — S0b committed; S1 membership core + S2 gateway routes built and verified
- **S0b commit** (Ashish: "commit it and continue"): `97c5e0c` feat(infra,web): one public origin split by path. Before it, ngrok was confirmed on :8088 and access-service restarted at 15:19 (by Ashish); public `/` 200, `/erp/` 200, `/api/v1/me` 401.
- **S1 (tests first):** `MembershipTest` (21 tests) written before the code. Then: `V2__gold_membership.sql` (counter row GRH-LM 101..5100, `resort_member` with partial unique email/mobile indexes and validity/decision checks, `member_payment` with card/QR/proof/rejection checks, no cascade deletes); package `membership` (`MembershipService`, `MembershipController` /api/v1/sales/memberships, `MembershipAdminController` /api/v1/admin/memberships, `ProofStorage` AES-256-GCM + magic bytes + 5 MB + SHA-256, `MemberView`); `AuditLog.record` overload with entity type (`MEMBER`); `FieldErrorsException` + 413 handler; `/me` adds module `memberships`; multipart limits 5 MB / 6 MB; config `erp.membership.*`.
- **Deviation from the pasted plan (recorded):** no separate `member_audit_log` table; the existing append-only `audit_event` is used (UPDATE/DELETE blocked by trigger). Plain JDBC instead of JPA entities for the membership tables (explicit SQL for the counter and locks).
- **Rules §11 applied:** payment screenshots are encrypted at rest; key `MEMBERSHIP_PROOF_KEY` generated with `openssl rand -base64 32` into the local `.env` (git-ignored); files under `data/` (git-ignored).
- **S2 (part):** gateway body limit moved from a default filter to per-route filters: `membership-registration` (POST /api/v1/sales/memberships, `MAX_UPLOAD_SIZE` 6 MB) and `access-service` (1 MB, now also `/api/v1/sales/**`). Multi-issuer and portal routes wait for S3/S4.
- **Keycloak:** realm JSON + **live realm** (kcadm, additive only): client roles `memberships.register|read_own|read_all|verify`, composites (SE: register, read_own; MANAGER/ADMIN: all four), and `erp-web` scope mappings (fullScopeAllowed=false — without them the roles never reach the token; first attempt at the scope step failed on a script error of mine, redone and verified). Documented in KEYCLOAK-SETUP §5.4.
- **Verified:** access-service `mvn test` 47/47 (MembershipTest 21, MeEndpoint 9, ProvisioningFailure 8, AccountManagement 4, EmployeeOnboarding 3, AuditAppendOnly 2). api-gateway `mvn test` 13/13 (3 new). A second access-service copy on :8191 against the real dev DB: Flyway "Successfully applied 1 migration" (V2 gold membership), counter row `GRH-LM|101|5100`, health UP, new endpoints 401 without a token, proof key loaded; copy stopped afterwards. Live calls with real staff tokens not done yet (needs restarts and a fresh sign-in).
- **Docs:** REQUIREMENTS (REQ-MEM-001…009), TRACEABILITY, api.md §3a, AUTHENTICATION §3 table, KEYCLOAK-SETUP §5.4, new `docs/04-modules/membership.md`, `.env.example` (`MEMBERSHIP_PROOF_KEY`, `MEMBERSHIP_PROOF_DIR`).

- **Commit** (approved: "Yes, commit as proposed"): `4267d1b` feat(membership): Gold Membership registration, encrypted payment proofs, verification (S1+S2).

## 2026-11-16T15:46:23+05:30 — S5: staff ERP Memberships screen built (tests first)
- `web/src/Memberships.test.tsx` (10 tests) written first, then `web/src/Memberships.tsx`: tabs Register member / My members / Verification queue (by permission), provisional brass ID tag, Gold badge, Cash/Card/Scan QR pills with conditional fields, UPI QR from `VITE_UPI_QR_URL` (placeholder until Q-031), gallery + camera (`capture="environment"`) inputs with preview and Replace/Retake/Remove, in-browser shrink to ≤ 2000 px for photos > 1.5 MB, read-only executive card from `/me`, review drawer with zoomable screenshot, Verify & activate, Reject with required reason, self-enrolled note. `App.tsx`: module label + page (nothing removed). `api.ts`: FormData keeps the browser's multipart Content-Type; `image/*` responses return a Blob (2 new tests). `config.ts`: `upiQrUrl`. `styles.css`: membership styles + phone rules (≤ 640 px) for header, menu and main padding.
- **Bug caught before testing live:** `index.html` CSP had `img-src 'self' data:`, which blocks the `blob:` preview and screenshot viewer → added `blob:`.
- **Verified:** `npm test` 32/32 (was 20; +10 Memberships, +2 api), `tsc -b` clean, `npm run lint` clean (one oxlint warning fixed), `npm run build` ok. Not yet verified live: needs access-service and api-gateway restarted with the S1 code and a fresh staff sign-in.

- **Commit** (approved: "Yes, commit; I'll test live next"): `4da643a` feat(web): Memberships screen (S5). Ashish will restart the services and test live; S3 starts now.

## 2026-11-16T16:18:27+05:30 — S3 spike passed; session paused with a handoff
- Keycloak extension `infra/keycloak-extensions/gh-member-activation` (activation authenticator, send-welcome realm resource, golden-hills email + login themes) and realm `infra/keycloak/gh-guests-realm.json`. `ActivationFlowIT` on real Keycloak 26.8.2 + Mailpit: **5/5 pass** — welcome email → Update password page directly → one submit → 302 to the landing page with a code → PKCE token (sub = member, email_verified, aud guest-api); link single-use; forged/replaced links refused; send endpoint 401/400/404 checks; guest-service limited to users; standard flows kept.
- Found during the spike: (1) Keycloak 26.8 Admin API needs the `kc-admin-api` client scope (audience) → added to guest-service; without it 401. (2) Keycloak's Secure cookies over http are fine for browsers on localhost but not for java.net.CookieManager → test has its own jar. (3) A redirect to the required-action page comes before the Update-password page.
- Compose: keycloak env `KC_GUEST_SERVICE_CLIENT_SECRET` (required) and `LANDING_PUBLIC_URL`; volume `./keycloak-providers` → `/opt/keycloak/providers`; jar built there (git-ignored). Path differs from the plan (`infra/keycloak/providers`) because `infra/keycloak` is the realm-import mount.
- An interrupted command left `.env`/`.env.example` WITHOUT the two new variables — must be added before the next `compose up`.
- Ashish asked for a full context handoff: `docs/03-phases/phase-1/inc-membership-HANDOFF.md`. S3 files are uncommitted (not approved yet).

## 2026-11-16T16:57:51+05:30 — S3 code complete (not yet live, not committed)
- **Resumed** ("continue the work"). Added the missing `KC_GUEST_SERVICE_CLIENT_SECRET`, `LANDING_PUBLIC_URL` and `GUEST_DB_PASSWORD` to the local `.env` (random secrets, one appended line each) and documented them in `.env.example`.
- **guest-service** (new, `services/guest-service`, :8092, `guest_db`): `/internal/guests/provision`, `/internal/guests/{id}/resend` (gh-staff token + `guests.provision`), `/api/v1/portal/me` (gh-guests token, aud guest-api); two security chains by issuer (`IssuerDecoders`); `KeycloakGuestIdentity` (client credentials in gh-guests, find/create user without password, set membershipId, call the extension's send endpoint); V1 `guest_account` + append-only `audit_event`. Tests `GuestProvisioningTest` 9/9 (first run failed: bean overriding of the decoders didn't take — replaced by one `IssuerDecoders` bean the test overrides with @Primary).
- **access-service**: `GuestAccounts` + `GuestServiceClient` (gh-staff client-credentials token); `verify` now calls `welcome` after the commit → `guest_user_id`, `account_status` INVITE_SENT/INVITE_FAILED, audit MEMBER_WELCOME_SENT/FAILED (never throws); `POST /api/v1/admin/memberships/{id}/resend-welcome` (409 NOT_ACTIVE); `displayDate` "16 Nov 2027" in IST; config `erp.guest-service.url`. MembershipTest 25 (+4). Full suite 51/51 (one earlier run had the two Keycloak-container suites time out at startup under Docker load; the realm imports fine in 40 s and the re-run passed).
- **gh-staff realm JSON**: erp-api role `guests.provision` on the access-service service account + access-service client scope. Not yet in the live realm (KEYCLOAK-SETUP §5.5 has the command).
- **web**: review drawer shows the customer account status and **Resend welcome email** (33/33, lint/tsc clean).
- **infra**: `guest_db`/`guest_svc` in `infra/postgres/init`, `GUEST_DB_PASSWORD` in compose. **CI**: new gh-guests realm check (15 rules) + `keycloak-extension` job; both realm checks run locally: 14/14 and 15/15 ok.
- **Docs**: new `identity/MEMBER-LOGIN.md`; KEYCLOAK-SETUP §5.5 + §13; api.md §3a resend + §3b guest-service; AUTHENTICATION pointer; DAY-ONE (extension build, guest_db, guest-service); ARCHITECTURE; membership.md; TRACEABILITY REQ-MEM-008; READMEs (guest-service, extension).
- **Live steps pending Ashish's OK**: (1) kcadm `guests.provision` on live gh-staff; (2) create `guest_db`/`guest_svc` on the live Postgres volume; (3) recreate the Keycloak container to load the extension and import gh-guests; (4) start guest-service; (5) restart access-service.

## 2026-11-16T17:09:15+05:30 — S3 committed and live (approved by Ashish)
- **Commits** (approved "Yes, commit (2 commits)"): `f9be13b` feat(identity): gh-guests realm + gh-member-activation extension + CI; `6044e6b` feat(membership): guest-service + welcome email on verification + resend. Not pushed.
- **Live steps** (approved: all four):
  1. kcadm on live gh-staff: role `guests.provision` created, assigned to `service-account-access-service`, added to the access-service client scope. Verified: access-service's client-credentials token carries `erp-api: [guests.provision]` and aud `erp-api`.
  2. Live Postgres: `CREATE ROLE guest_svc`, `CREATE DATABASE guest_db OWNER guest_svc`, `REVOKE ALL … FROM PUBLIC` (first attempt with a psql `\gset` guard created nothing; re-run plainly).
  3. Extension jar rebuilt; `docker compose … up -d --no-deps keycloak` (no-deps so Postgres wasn't recreated). Keycloak healthy; log: provider gh-member-activation loaded (KC-SERVICES0047 internal-SPI warning, expected), "Realm 'gh-guests' imported", "Realm 'gh-staff' already exists. Import skipped". guest-web redirect URIs resolved to the public host + localhost:3000; gh-guests issuer = public host.
  4. guest-service started (:8092, background, log `ERP_DEV/logs/guest-service.out`): health UP, Flyway V1 applied on guest_db; its client secret works (Admin API users 200); `/internal/guests/provision` without token 401, with access-service's real token → 400 validation (auth passed).
- **Not done:** no real welcome email sent (it would go to a real address through Ashish's SMTP); access-service and api-gateway still need Ashish's restart to run the S1–S3 code; the landing page has no `/member/activate` yet (S6).

## 2026-11-16T17:20:49+05:30 — S4 portal API built (tests first), not committed
- access-service: `MembershipPortalTest` (6) written first; then `PortalMembershipController` (`GET /api/v1/portal/membership/me`, member by token `sub` = `guest_user_id`, no payment/proof/ids, executive mobile only with WhatsApp opt-in, first call sets `account_status = ACTIVE` + audit `MEMBER_PORTAL_FIRST_SIGN_IN` once) and a second security chain `portal` (@Order 1, gh-guests issuer, aud guest-api; `PortalDecoder` wrapper so tests can replace it). Config `erp.keycloak.guest-issuer`. Full suite **57/57**.
- api-gateway: routes `/api/v1/portal/membership/**` → access-service and `/api/v1/portal/me` → guest-service (`GUEST_SERVICE_URL`); `/internal/**` not routed (test). **Bug found by the new routing test:** the gateway's staff JWT check also ran on the public `/api/v1/portal/**` paths whenever a bearer token was present, so real member tokens (and the landing page's existing "my inquiries" token) would get 401. Fixed with a separate portal security chain that doesn't read tokens (D-126); services validate. Gateway **15/15**.
- Docs: api.md §3c, membership.md, TRACEABILITY REQ-MEM-009, ARCHITECTURE note, DECISIONS D-126.

- **Commit** (approved "Yes, commit and start S6"): `dff8b5c` S4 member portal API + gateway portal chain.

## 2026-11-16T17:38:18+05:30 — S6 landing page built (not committed)
- Read Next 16 docs first (useSearchParams + Suspense, rewrites, env). Added `keycloak-js@26.2.5` (exact, same as web; Q-023).
- New: `guest-auth.ts` (PKCE S256, memory tokens, silent SSO, Keycloak URL fallback rules), `public/silent-check-sso.html`, `/member/activate` (page + client component: token → `createLoginUrl` + `&activation_token=` → Keycloak; returns to `/membership?welcome=1`), `member-benefits.ts` (amenities, all "to be confirmed", Q-032), `member-extras.tsx` (/profile status, amenities, concierge; executive number only with WhatsApp opt-in).
- Changed (nothing removed): `guest-session.ts` real session (member/guest) beside the sample one; `portal-client.ts` same-origin default `/api/v1/portal` + `getMyMembership`; `profile-sign-in.tsx` Email tab → Keycloak (ID tab unchanged preview); `profile-view.tsx`, `booklet-usage.tsx`, `membership-member-hero.tsx` real-member wording; sample IDs → `GRH-LM-0000`; `login-portal.tsx` and `plan-stay-portal.tsx` per D-123 (email-only → Keycloak, register → Keycloak registration, OTP/Booking tabs disabled "Coming soon", fake offline sign-ins removed, quick demo email only, forgot → Keycloak page; plan-ahead folio shows a real Gold Member's number, non-members unchanged Q-036); `next.config.ts` /api rewrite for localhost; styles; `.env.example`, README.
- Not changed: the reservation form's "Offline Preview" fake reference (enquiries are increment 2) — to raise with Ashish.
- **Verified:** `npm run typecheck` ok; eslint on changed files: no new findings (login-portal 4→3, plan-stay-portal 17→16 pre-existing problems; Q-004); `npm run build` ok (19 pages incl. /member/activate). Live smoke via proxy :8088 with the public Host: /member/activate, /silent-check-sso.html, /membership, /login, /plan-ahead 200; Keycloak gh-guests auth page for guest-web renders the golden-hills theme with login_hint; foreign redirect_uri 400; missing PKCE → redirect with `error=invalid_request … code_challenge_method`.
- **Found:** Ritvik's local `landing-page/.env.local` sets `NEXT_PUBLIC_LEAD_API_URL=http://localhost:8082/api/v1/portal`, which phones on the public URL can't reach — Ashish to delete that line (not edited: local file).

## 2026-11-16T17:44:28+05:30 — S6 committed; .env.local fixed; increment report drafted
- **Commit** (approved "Yes, commit"): `7b8da30` feat(landing-page): member sign-in with Keycloak PKCE, welcome link, real Gold card (S6).
- Ashish approved removing `NEXT_PUBLIC_LEAD_API_URL` from `landing-page/.env.local` (its only line; file now empty, git-ignored). The site now uses same-origin `/api/v1/portal`.
- Ashish: leave the reservation form's "Offline Preview" fake reference for increment 2.
- Drafted `docs/03-phases/phase-1/inc-membership-REPORT.md` (deliverables, test evidence, live S7 checklist, deviations, open items). S7 live test needs Ashish (service restarts, a real inbox, phone).

## 2026-11-16T18:52:00+05:30 — Stack restarted, runner scripts added, push to GitHub approved
- Cleanly restarted `access-service` (:8091), `api-gateway` (:8082), and `landing-page` (:3000) with fresh environment variables to run S1–S6 code. Added runner scripts `ERP_DEV/run-access-service.ps1`, `ERP_DEV/run-api-gateway.ps1`, and `run-landing-page.ps1`.
- Restarted ngrok tunnel on :8088 (`https://weaponless-bertie-hyperorganically.ngrok-free.dev`). All endpoints verified 200 through proxy.
- Ashish approved committing the increment report, runner scripts, and state logs, and pushing branch `feature/phase1-membership` to `origin`.

## 2026-11-16T19:50+05:30 — Returning members sign in again (D-127…D-129)
- **Report (Ashish):** after the welcome email the member was signed in, but after leaving the website could not sign in again. He pasted an analysis (in-page password box, 30-day sessions, ngrok IPv4) and asked to analyse and plan.
- **Analysis (read-only):** sign-in with email + password already existed on the Golden Hills Keycloak page and is proven by `ActivationFlowIT` step 5. Confirmed causes: (1) at 19:26 Docker Desktop was stopped (Postgres, Keycloak, Caddy down; nothing listening) and ngrok `8088` can dial IPv6 `[::1]` while the proxy binds 127.0.0.1 (502); (2) the welcome-link session was not remember-me, so its cookie died with the browser, and Gmail opens links in its own browser. Not confirmed: "mobile blocks the silent-SSO iframe" (one origin, first-party cookies). The single-use link is by design.
- **Question → answer:** password on our page (password grant) or on Keycloak's page, fixed? → "go with recommended and i want user data to be stored in thd db as well for more security". Plan approved (ExitPlanMode).
- **Built:** activation step sets remember-me; login theme `keep-signed-in.js` + "Keep me signed in" label; realm remember-me idle 7 d → 30 d (JSON; live realm change pending approval); guest-service `V2__guest_sign_in.sql` + `/portal/me` records each sign-in once per Keycloak `sid` (audit `GUEST_SIGNED_IN`), creates rows for self-registered guests, refuses DISABLED (403); landing: "Sign in" wording + "enter the password you set from your welcome email", reachability check before the Keycloak redirect, keycloak-js re-initialises after an outage, "couldn't load your membership — Try again" on /membership and /profile, `getMe` call; `check-stack.ps1` (read-only OK/DOWN) and `run-guest-service.ps1`; CI realm checks +2.
- **Verified:** extension + guest-service compile (tests need Docker, which is stopped: NOT run yet); landing typecheck, eslint (changed files) and build ✅; CI gh-guests checks 17/17 ✅ locally; `check-stack.ps1` runs (all DOWN, as the stack is stopped).
- **Docs:** MEMBER-LOGIN §1 step 7 + new §8, api.md (`/portal/me`), membership.md, KEYCLOAK-SETUP §1.1 (ngrok IPv4, check-stack), REPORT §3 steps 10–12, HANDOFF, DAY-ONE §5b, TRACEABILITY, DECISIONS D-127…D-129, OPEN_QUESTIONS (Q-034 30 d; event retention).
- **Pending:** Docker up → run `ActivationFlowIT` and guest-service tests; apply the remember-me idle change to the live realm with kcadm (ask) and rebuild the extension jar + restart Keycloak; restart guest-service (V2 migration); live checklist; ask before commit.

## 2026-11-16T20:20+05:30 — Root cause: members couldn't sign in again (D-130)
- **Report (Ashish, screenshot of /profile):** after signing out he can't sign in with his email and password; there is no password field.
- **Evidence (read-only, Keycloak admin events for gh-guests):** ~30 `LOGIN_ERROR invalid_redirect_uri` for guest-web since 17:59, all with `redirect_uri = https://weaponless-…/silent-check-sso.html`; the only successful logins were welcome-link activations (18:10, 18:36, 20:02). No sign-in attempt ever reached the password form after a sign-out.
- **Cause:** the guest-web redirect list I wrote in S3 omitted `/silent-check-sso.html` (and the CI check enforced that). keycloak-js `#checkSsoSilently` (lib/keycloak.js:1061) waits for the frame's message with no timeout, so `initAuth()` never resolved: the card never showed after a reload, and `signIn()` (which awaited `initAuth()`) never called `login()` — the button stayed on "Opening…". The welcome link only worked because keycloak-js reads the returned code from the URL without the frame. The 19:50 entry's explanation (cookies, Gmail in-app browser) was secondary; **this was the main cause.** My 19:50 change (`kc = null` after a failed init) would also have broken `login()`; reverted.
- **Fix:** realm JSON + **live** guest-web (admin API PUT 204): two exact silent-check URIs; live realm `ssoSessionIdleTimeoutRememberMe` = 2592000 (D-127, PUT 204). `guest-auth.ts`: `initAuth` = race(init, 8 s → signed out); `signIn`/`register` wait at most 1.5 s for the start of init, then open Keycloak. CI check now requires the two silent-check URIs. New `ActivationFlowIT` test: prompt=none to `/silent-check-sso.html` → 302 `error=login_required`; `…htmlx` and other paths → 400.
- **Live check:** public URL prompt=none → 302 to `/silent-check-sso.html?error=login_required` (was 400).

## 2026-11-16T21:10+05:30 — Commits for D-127…D-130; Gold Member smart fields (D-131…D-134)
- **Commits (approved "Yes, commit as proposed"):** 536ae3e fix(identity) silent-check redirect + remember-me; 3e7d126 feat(guest-service) sign-in record; c5c5122 chore(dev) scripts/docs. Not pushed.
- **Request:** Ashish pasted a prompt for smart registration fields (Aadhaar + Verhoeff + masking, 18+ guard, structured address with pincode auto-fill, +91 mobile, title case, amount chips) "according to your project fields". Plan approved after 3 questions → answers: ID proof **Aadhaar or DL** (client's words, Discovery Call [22:56]); chips **from config**; pincode data **from India Post's CSV** in the resource folder.
- **Departures from the prompt (recorded D-131…D-134):** generic `id_*` columns (Aadhaar or DL); **HMAC** instead of plain SHA-256 (an unkeyed hash of ~10^12 Aadhaar numbers is reversible); age CHECK on `created_at` (IST) instead of CURRENT_DATE; `registration_form` 1/2 so existing dev members survive the migration; no invented prices or pincode dictionary.
- **Built:** `V3__member_smart_fields.sql`; `IdentityNumbers` (Verhoeff, normalise, mask, HMAC), `IndianStates`; `MembershipService` validation (18+ IST, ID, pincode/city/state/country, Indian mobile, title case), insert, duplicate check + 409 `ID_ALREADY_REGISTERED`, audit with masked ID only, `Clean.toString` without the full number (idempotency hash); `MemberView` + controller params; config `erp.membership.id-hash-key`. Web: `smartFields.ts`, form (age pill, +91 prefix + tick, ID pills + Aadhaar formatting/checksum/masked preview, street/pincode/city/state/country, chips, Register disabled until valid), drawer (masked ID, full address, "not recorded" for older members), CSS, `config.goldFeeChips`; `scripts/build-pincodes.mjs` (tested on a synthetic CSV only; no data file yet).
- **Tests:** access-service **70/70** (was 57; +9 MembershipTest, +4 IdentityNumbersTest); web **44/44** (was 33), lint clean, build ok. Fixed on the way: SMALLINT read as Integer in a test; audit column is `after_json`; labels containing live pills needed `aria-label`s.
- **Pending:** `MEMBERSHIP_ID_HASH_KEY` in the local `.env` (ask) and restart access-service (V3 migration); India Post CSV (Q-040); live phone check; ask before commit.

## 2026-11-16T21:40+05:30 — Sales Executive menu = Memberships as "Dashboard" (D-135)
- **Commits (approved):** ebf4952 feat(membership) smart fields backend; 059240d feat(web) smart form; d8e04e8 docs. Live: MEMBERSHIP_ID_HASH_KEY added to local .env (approved), access-service restarted, V3 applied (4 existing members = form 1).
- **Request (screenshot of /erp/#memberships):** remove Dashboard and Leads for the Sales Executive; only Memberships, renamed Dashboard.
- **Done:** `MeController.modules(roles, permissions)`: SALES_EXECUTIVE-only with `memberships.register` → `["memberships"]`. `App.tsx`: without a `dashboard` module the first module is home, called "Dashboard", and is shown for an empty or unknown hash. Tests: `MeEndpointTest` 10/10 (+1), web 45/45 (+1).

## 2026-11-16T21:55:00+05:30 — Sales Admin Dashboard & Attended Leads Drill-down (D-136)
- **Request (Ashish):** "in sale admin ,remove the dashboard and lead section and i want to see that data of each sales executive data like how many lead he has attended and data of the lead is should display after click the employee name in the dashboard"
- **Plan:** written and approved (`sales_admin_lead_dashboard_plan.md`).
- **Done:**
  1. **lead-service (:8093) + lead_db:** Spring Boot 4.1.2 microservice with Flyway migration `V1__init_lead_schema.sql` creating `lead` table in `lead_db` and seeding 5 realistic leads attended by executive `rohan`. Implemented `Lead`, `LeadRepository`, `SalesDtos`, `SalesLeadController` (`GET /api/v1/sales/leads`, `GET /api/v1/sales/leads/summary`, `GET /api/v1/sales/leads/{id}`), `SecurityConfig` (Keycloak gh-staff token validation with erp-api audience). Test suite: 2/2 tests pass.
  2. **API Gateway (:8082):** added route for `lead-service` (`/api/v1/sales/leads/**`, `/api/v1/portal/inquiries/**` -> `:8093`).
  3. **access-service (:8091):** updated `MeController.modules` so `ADMIN` role excludes `leads` from top nav; updated `MeEndpointTest` (11/11 tests pass).
  4. **web (:5173):** created `SalesAdminDashboard.tsx` featuring:
     - Top KPI cards: Total Sales Executives, Total Leads Attended, In Progress, Converted.
     - Sales Executives Roster Table: lists each executive, avatar, username, email, attended leads count, status breakdown (In Progress, Converted, Lost), and "View Leads →" action.
     - Attended Leads Drill-Down: clicking any executive name displays their full attended leads list with reference ID, guest details, stay specs, status pills, attended timestamps, and interaction notes.
     - Filters & Search: search by guest name/phone/reference, status filter pills (All, In Progress, Converted, Lost), and "← Back to All Executives" button.
     - Updated `App.tsx` navigation and rendered `SalesAdminDashboard` on the home/dashboard view for Sales Admin.
  5. **Infrastructure & Scripts:** updated `infra/postgres/init/01-service-databases.sh`, added `run-lead-service.ps1`, updated `check-stack.ps1`.
- **Tests & Verification:**
  - `web`: 50/50 vitest tests pass (+5 new tests in `SalesAdminDashboard.test.tsx` and `App.test.tsx`); `tsc -b && vite build` clean.
  - `lead-service`: 2/2 tests pass; service started and healthy on `:8093`.
  - `access-service`: 11/11 tests pass.
  - `check-stack.ps1`: all 13 services OK and healthy behind proxy `:8088`.

## 2026-11-16T23:45:00+05:30 — Sales Performance moved into Employees (D-137, D-138)
- Ashish: remove the Sales Admin Dashboard and Leads completely; track each Sales Executive's attended / converted leads with analysis of who is doing better, reached from Employees. Plan approved. Q: placement → A: "Tab in Employees". Q: Manager too? → A: "yes admin" (Sales Admin only) + new rule: Sales Admin can only create Sales Executives (D-138).
- Found during planning: lead-service `/api/v1/sales/leads/**` was `authenticated()` only, so a Sales Executive token could read every lead. Now `hasRole('ADMIN')` (filter chain + `@PreAuthorize`); lead-service maps `realm_access.roles` → `ROLE_x` like access-service.
- Checks: `web` → `npx vitest run` 55/55, `npm run build` OK, `npm run lint` clean. `lead-service` → `./mvnw -o test -Dsurefire.useManifestOnlyJar=false` 8/8. `access-service` → `./mvnw -o test-compile` OK; tests not run (Docker Desktop off).
- `erp-prp` skill named in AGENTS.md is not installed in this Windows session; told Ashish.
- Not committed (ask first, Rule 7).

## 2026-11-16T23:56:00+05:30 — Full stack & ngrok tunnel started
- Ashish requested to run all servers.
- Bootstrapped Docker Desktop backend, brought up Docker Compose infrastructure (PostgreSQL 18 :5433, Keycloak 26 :8081, Redis 8 :6379, Mailpit :1025/:8025, Caddy :8088).
- Started Spring Boot microservices: `access-service` (:8091), `api-gateway` (:8082), `guest-service` (:8092), `lead-service` (:8093).
- Started frontend applications: `landing-page` Next.js (:3000), `web` Staff ERP Vite (:5173 with `--host 0.0.0.0`).
- Started ngrok tunnel pointing to `127.0.0.1:8088` (`https://weaponless-bertie-hyperorganically.ngrok-free.dev`).
- Verified all 13 health checks via `check-stack.ps1` (all OK). Verified public ngrok URL endpoint returns HTTP 200.

## 2026-11-17T00:15:00+05:30 — Employee PAN field (D-139)
- Ashish: "add pan card field in employee create form of the sales admin".
- Stored the D-131 way (masked + keyed hash, never the full PAN); required for new employees; individual PANs only (4th letter P); unique per employee.
- First test run failed: Hibernate schema validation expected VARCHAR for `pan_hash` but V4 used CHAR(64). Changed to VARCHAR(64) (the CHECK still forces 64 hex characters).
- Checks: access-service `./mvnw -o test` 75/75 (Docker up; includes D-137/D-138 tests not run before); web `npx vitest run` 57/57, `npm run build` OK, `npm run lint` clean.
- Not committed (ask first, Rule 7).

## 2026-11-17T00:45:00+05:30 — Memberships per executive (D-140)
- Ashish: "and even want to see how many membership executives brought in the admin".
- Added to Employees → Sales Performance rather than a new screen, same period filter. "Sold" = ACTIVE (verified); revenue = VERIFIED payments only, summed in PostgreSQL, sent as strings.
- Checks: access-service `./mvnw -o test` (new `adminSeesMembershipsEachExecutiveBroughtIn`); web `npx vitest run` 59/59, `npm run build`, `npm run lint`.
- Not committed (ask first, Rule 7).

## 2026-11-16 — Sales Admin web UI redesign (UI only, uncommitted)
- Request: redesign the Sales Admin dashboard and pages to match the landing-page palette, with no backend, API or behaviour change. Keycloak sign-in is bypassed for UI work through the existing `VITE_UI_BYPASS_AUTH` / `preview.ts`, which was already in place and not touched.
- Changed: `web/src/App.tsx` (sign-in, shell and dashboard markup), `Employees.tsx` and `Memberships.tsx` (markup and class names only), and `styles.css` (rewritten; forest #104028, brass #b88828, paper #f7f2ec, General Sans + Inter, self-hosted to satisfy the CSP).
- Added: `web/src/assets/fonts/*.woff2` and `web/public/brand/logo-{light,color}.png`, copied from landing-page.
- Not changed: api.ts, auth.ts, config.ts, main.tsx, preview.ts, vite.config.ts, index.html, tests, services. All API paths, handlers and permission checks are unchanged.
- Removed from the dashboard: the fake estate selector and the "Operational Clearance" and "WhatsApp notifications active" chips.
- Mobile first: on phones a forest top bar and a fixed bottom tab bar; from 960px up a 264px sidebar. Tables become card rows under 760px. The review drawer is a bottom sheet on phones and a right drawer from 760px up.
- Fix during the work: the card entrance animation (transform, fill `both`) trapped the fixed review drawer. It is now opacity-only with fill `backwards`.
- Checks: `npx vitest run` 33/33, `npx tsc -b` clean, `npx oxlint src` clean, `npx vite build` OK. Checked by screenshot at 1440×900 and 390×844, in light and dark, with no horizontal scroll.
- Notes: the preview audit data uses outcome `ALLOWED`, but the backend writes `SUCCESS`/`FAILURE`, so preview rows show red. The dev console CSP error for `ws://localhost:443` (HMR `clientPort: 443`) was already there and is dev-only.

## 2026-11-16 — Landing page: mobile pass (desktop unchanged, uncommitted)
- Request: the landing page felt crowded and broken on phone browsers; make it mobile first without changing desktop.
- New `landing-page/src/app/mobile.css`, imported last in `layout.tsx`. Every rule sits inside a `max-width` query (980/900/760/380px); a PostCSS check found 0 unscoped rules.
- Fixed overflow: the membership enquiry grid and the plan-ahead shell used a bare `1fr` column, so long content pushed them past the screen; both now use `minmax(0, 1fr)`. Hero booking date fields, the home status label on the membership teaser, and the login method tabs no longer spill out.
- Less crowded: amenities two to a row, "why choose us" one tile per row with the icon beside the text, gallery filters in one swipe row, map header on two rows, more space above the dining CTA, 44px tap targets on small links and tabs.
- Hover: wrapped 125 `:hover` rules in 11 stylesheets in `@media (hover: hover) and (pointer: fine)`, in place (PostCSS script), so taps no longer leave a hover state stuck. This changes nothing for a mouse.
- Bug found: `.plan-mode-tab span { position: relative }` collapses the active-tab pill to 0×0, so the active label is invisible. Fixed on phones only; desktop has the same bug and was left as requested.
- Checks: 1440px pixel diff on all 9 routes with and without the new rules gave 0 changed pixels (plan-ahead compared on the form half because of its slideshow). No horizontal scroll at 360/390/768. `npm run typecheck` clean, eslint clean on layout.tsx. Pre-change CSS backed up in the session scratchpad.

## 2026-11-16 — Landing page: mobile functional check (Chromium phone emulation over CDP)
- No Chrome DevTools connector in the session; Playwright drove Chromium over the DevTools protocol with phone emulation (390×844 and 360×844, touch, isMobile). Script: tap through every interactive feature, check for overlapping text and covered controls, record console errors.
- 55 checks per width, 54 pass at both. The one flagged overlap (Gatherings) is stacked venue cards covering earlier ones as designed; confirmed by screenshots.
- Tested and working: nav menu open and navigate; hero booking → /plan-ahead with dates and guests; room-row swipe; gallery filters; map Satellite toggle and directions link; Stay zone filter and View room; room photo viewer open/close, guest stepper, booking request; dining menu sheet and photo enlarge open/close; Experiences and Gatherings "What is included"; membership sign-in tab switch, FAQ, enquiry form validation; plan-ahead tabs, demo fill, disabled "coming soon" tabs; login Register pill and demo fill; profile sign-in tabs. No sideways scroll on any page.
- Fixed, phone-only in mobile.css:
  - Gatherings: the open list scrolled inside the scrolling text column (nested scroll, last item sliced). Now one scroll area with a bottom fade.
  - Room guest stepper buttons 32 → 40px.
  - The translucent sticky header let bold headings show through the logo; solid #fcfaf6 at 760px and below (desktop keeps 0.94).
- Every rule in mobile.css is still inside a max-width query.
- Not changed: each page logs a CSP `frame-ancestors` block plus a 400 from the Keycloak check-sso iframe (localhost:8081). This happens at every screen size.

## 2026-11-17 — Membership page: hide sales sections once a member signs in (uncommitted)
- Request: after signing in with membership credentials, stop showing "Reserve your membership", the FAQ and the other pre-enrolment content.
- `membership-member-hero.tsx`: new `ProspectOnly` (renders children only when the session has no membership) and `LedgerHeading` ("What is inside" for visitors; "Your privileges in full / Every voucher and coupon in your booklet" for members).
- `membership/page.tsx`: the welcome keepsake box, the "Before you enrol" FAQ and the "Reserve your membership" enquiry are wrapped in `ProspectOnly`. The voucher ledger stays for members: it is the only place listing what each voucher is (the booklet shows counts only).
- A guest signed in without a membership still sees the sales sections.
- Checked in Chromium at 390 and 1440: signed out shows everything; signed in (Membership ID + OTP) hides the three sections and swaps the ledger heading, still hidden after reload; signing out brings them back; no page errors. Typecheck and eslint clean.

## 2026-11-17 — Landing first screen lighter on phones; coordinates removed from plan-ahead (uncommitted)
- Request: the start of the home page felt text-heavy and crowded on mobile; remove the resort coordinates from the plan-your-stay slideshow card.
- `plan-ahead/plan-stay-portal.tsx`: removed the "16.3475° N, 75.6259° E · Biligi Ridge" badge; the slideshow counter stays. (The same badge is in `stay-editorial.tsx`, which is not imported anywhere; left alone.)
- `home-opening.tsx`: the slide name in the hero note is now its own span (`hop-impression-label`); desktop text is unchanged.
- `mobile.css` (760px and below):
  - Hero: hide the location kicker, which repeats the headline and the statement kicker. Hide the slide name in the note, leaving "Artist's impression. Design subject to change." Guests and Check availability share a row, so the booking card is two rows.
  - Statement: 16px lead, tighter gap, smaller credit.
- Checks: screenshots at 390/360; plan-ahead page text has no coordinates; typecheck clean; mobile.css still fully max-width scoped. The eslint errors in home-opening.tsx:226 and plan-stay-portal.tsx were already there.

## 2026-11-17 — Membership ledger on phones: slim tally, calmer motion (uncommitted)
- Request: on mobile the privileges scroll and its animation overlapped and made the section unpleasant; keep a minimal effect.
- Cause: at 760px and below the sticky tally stacked step, sketch, name, three rows and the bar: 404px tall, half the screen. Entries scrolled under it while their photos clip-revealed and zoomed and their lines slid up.
- `mobile.css` (760px and below):
  - The tally is a one-row strip (step · part name · "N / 180") underlined by the progress bar: 66px, opaque, soft shadow.
  - Entries no longer clip-reveal or zoom their photos, and their lines no longer slide; lines fade in once (opacity, 0.4s).
  - The progress bar filling as you scroll is kept.
  - The per-part voucher/coupon counts stay in each entry's heading.
- Checked by screenshots at 390 and 360 at three scroll depths. Desktop and tablet ledger unchanged; mobile.css still fully max-width scoped.

## 2026-11-17T02:00:00+05:30 — Ritvik's UI/UX merged without touching our work (D-141)
- Ashish: take Ritvik's UI and UX changes (incl. booking date validation and responsive layouts) without harming our backend or the new admin sections. Plan approved.
- `git fetch`: `origin/Ritvik-Frontend` 2c164d9..0db0ede. Shared base 1d7885c. His work: merge ca6b085 (+ skills-lock.json) and 0db0ede (web + landing-page + DEVLOG only; no backend).
- Safety: branch `backup/phase1-membership-pre-ritvik` (0f3ab72); work on `merge/ritvik-ui`; `git merge --no-ff --no-commit origin/Ritvik-Frontend`.
- Conflicts and resolution: DEVLOG (kept both entries); styles.css (his file + an alias-token block and our D-131…D-140 classes; `#fff` on primary → `--primary-ink` for dark mode); App.tsx (his shell/theme/sign-in + our routing and menu rules; his dashboard only for roles with `dashboard`); Employees.tsx and Memberships.tsx (ours + his icons, headers, phone-card tables). Auto-merged: guest-auth.ts (our 8 s timeout kept), plan-stay-portal.tsx. Sales Performance tables also made phone cards.
- Pins: `lucide-react` 1.73.0 (his lock's version), landing `keycloak-js` back to 26.2.5. `skills-lock.json` untracked again (`git rm --cached`; local copy restored).
- Checks: `git diff --cached backup/phase1-membership-pre-ritvik -- ERP_DEV/services ERP_DEV/infra ERP_DEV/docs/02-architecture ...` empty. Web `npx vitest run` 61/61 (2 new: theme toggle; Manager keeps dashboard, admin doesn't), `npm run build`, `npm run lint` clean. Landing `npm run typecheck`, `npm run build` OK.
- Not committed yet (ask first, Rule 7).

## 2026-11-17T03:30:00+05:30 — Production release preparation (D-142)
- Ashish: production repo https://github.com/quantumclktech/Quantumclk_Resort; push only production-ready work; plan first. Plan approved: clean snapshot history, hide fake flows, setup + architecture docs.
- Read-only review: production repo reachable and empty (`git ls-remote` exit 0, no refs). Tracked files hold no secrets (realm secrets and SMTP are placeholders; only `.env.example` tracked). Dev history does (archived JwtTokenService secret), so production gets no history.
- Found and removed fake flows: `/login` (OTP, booking ID, Google/Apple, demo fill, forgot-password modal, free Privilege Club box), `/profile` membership-ID "sample" sign-in and sample linking, stored fake sessions in `guest-session.ts`, `/plan-ahead` fake reservation confirmation and made-up phone, booking-card stored user. Unused CSS for the removed UI left in place on purpose (harmless; one selector is shared).
- lead-service: V1 schema only; sample leads in `db/dev-seed/V1_1__dev_seed_leads.sql`, `spring.flyway.locations: ${LEAD_FLYWAY_LOCATIONS:classpath:db/migration}`. Dev lead_db held only the 5 seed leads (checked), tables dropped and re-migrated (first drop attempt failed on PowerShell quoting; service hit the checksum mismatch as expected; redone from bash).
- Release tooling: root `.gitattributes` (export-ignore), `release/export.sh`, `RELEASING.md`, root `README.md`; docs index rewritten; 8 links to internal docs turned into plain text; ERP README status updated; DAY-ONE lists `run-lead-service.ps1`.
- Checks: landing `npm run typecheck`, `npm run build` OK; lead-service `./mvnw -o test` 8/8; dry-run `git archive --worktree-attributes` 519 files, none excluded.
- Not committed yet (ask first, Rule 7).

## 2026-11-17T04:00:00+05:30 — Production repo: shipped files only, no tooling; hosting stays on ngrok (D-142 revised)
- Ashish: no Vercel (keeps ngrok); push to the normal repo and to the production repo; the production repo holds only shipped things; no `.sh` or release tooling; undo what was added for that.
- Q: undo scope -> A: only the release tooling (website fixes and lead dev seed kept). Q: production contents -> A: runtime + tests (no docs).
- Removed (were untracked): root `.gitattributes`, `release/export.sh`, `RELEASING.md`, root `README.md`.
- `ERP_DEV/README.md` no longer links to `docs/` (absent in production). `run-lead-service.ps1` adds the dev-seed location only if that folder exists.
- Production copy is made with plain git commands (orphan `production` branch from `git archive` of the released commit), checked (file list, gitleaks, greps, builds and tests), then pushed.

## 2026-11-17T09:45:00+05:30 — main is the current work
- Ashish: remove what is in main, merge the working branch into main and make it the main branch. Plan approved.
- `main` was 825f3fe (archived pre-restart code, same as `archive/hotel-draft`); `feature/phase1-membership` was 47 commits ahead, 0 behind. `git branch -f main feature/phase1-membership`; `git push origin main` fast-forwarded 825f3fe..61b1ea5 (no force). The old draft files are gone from main because the fresh-start commit 5d220ab removed them; the old code stays on `archive/hotel-draft` and tag `archive-hotel-draft-2026-11-15`.
- GitHub default branch is still `ashish/backend_phase_1`; Ashish switches it to `main` in the repo settings (no gh CLI or token here).
- Same session: Docker Desktop had stopped overnight (with Postgres, Keycloak, Redis, proxy, gateway, guest-service, both dev servers and ngrok). Restarted all; the staff ERP dev server had bound to ::1 only (502 on /erp/), restarted with `npm run dev -- --host 0.0.0.0`.

## 2026-11-17 — Signed-in views on phones (plan-ahead folio, profile) + undrawn sketches (uncommitted)
- Report (user screenshot, real phone): after a member signs in, the "Welcome, <name>" folio on /plan-ahead is broken on mobile. Earlier phone passes had only covered signed-out pages.
- Test harness: Keycloak and the portal API are faked at the network layer in the test browser (Playwright routes). The pages open with an auth-code callback, as after a real sign-in, and keycloak-js runs its real code path. No app code or backdoor added. Covered /plan-ahead, /profile and /membership signed in at 390 and 360, with a real name and with the email standing in for the name.
- `mobile.css` (760px and below):
  - Folio: avatar no longer shrinks; name and email take the rest of the row and break if long; the "Gold Member · GRH-LM-…" pill moves under them and wraps if needed; stat labels in sentence case; both buttons full width, 48px.
  - Long names break in `.plan-main-title` and `.prof-head h1`.
- `plan-ahead/plan-stay-portal.tsx`: email and phone joined only when present (Keycloak sessions have no phone, which left a trailing " · ").
- `sketch-observer.tsx`: now also observes sketches mounted after page load (MutationObserver). Signed-in views mount after the session loads, so their drawings stayed undrawn, e.g. an empty 170px band in the profile "Your stays" card. This bug affected every screen size.
- Checks: no overflow on any signed-in page at 390 or 360; the signed-out phone suite passes 52/53 (the one flag is the known Gatherings stacked-card false positive); typecheck clean; eslint clean on sketch-observer.tsx.
- Test updates for the separate D-142 change: the Membership ID sign-in tab, plan-ahead's coming-soon sub-tabs and the login demo chips are gone; those checks now skip when the control is absent.

## 2026-11-17 — ERP web: intro text removed from Sales Admin and Sales Executive screens

- Removed the explanatory paragraph under each heading, which staff using the console every day don't need: Sales Performance ("Leads each Sales Executive attended…"), Employees (both tabs), the Add employee card, Audit log, Gold Membership, and the New Gold Member form.
- Kept: field hints, validation messages, payment-method hints, status notes (for example "You enrolled this member, so another Admin or Manager must verify the payment").
- UI text only; no API, logic or backend change. Typecheck clean, vitest 61/61.
