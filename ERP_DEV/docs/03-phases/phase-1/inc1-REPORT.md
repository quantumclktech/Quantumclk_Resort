# Increment 1 Report — Platform foundation & employee identity

- Date: 2026-11-15 · Branch: `feature/phase1-inc1-identity` (from `feature/phase1-fresh-start`) · **Not pushed** (GitHub token lacks the `workflow` scope)
- Plan: [inc1-PLAN.md](inc1-PLAN.md) (approved 2026-11-15) · Design: [AUTHENTICATION](../../02-architecture/identity/AUTHENTICATION.md), [KEYCLOAK-SETUP](../../02-architecture/identity/KEYCLOAK-SETUP.md)

## Summary
Employees now go through Ashish's whole workflow on Keycloak:
1. An ADMIN adds them in the ERP.
2. Keycloak creates the account and sends its own setup email.
3. They verify the email and set a password on Keycloak's pages.
4. They sign in to the ERP (code + PKCE).
5. The gateway and access-service check every request (401/403), and the dashboard shows only what their permissions allow.

The ADMIN can deactivate (immediate sign-out), reactivate, resend the invite and change roles. Every account action is audited with who, when and why. The ERP never stores a password, OTP or token.

## Delivered (slices)
| Slice | Commit | Content |
|---|---|---|
| S1 infra + realm | `8d5f9bc` | Compose: PostgreSQL 18.7 (:5433), Keycloak 26.8.2, Redis 8.10.3, Mailpit 1.33.1; gh-staff realm; DB-per-owner init; CI realm-check |
| S2 access-service skeleton | `bd8d799` | Spring Boot 4.1.2, JWT rules, /me, Flyway V1 (append-only audit), Maven Wrapper |
| S3 api-gateway | `88176a5` | Spring Cloud 2025.1.4, JWT before routing, rate limits, CORS, correlation ids; mvnw +x fix |
| S4 web shell | `4a8ef19` | React 19.3 / TS 7 / Vite 8, keycloak-js login, tokens in memory, /me dashboard, sign-out |
| S5 onboarding | `524d862` | Create → Keycloak user + role + setup email; failure states and retry; 5-min status sync; bootstrap first ADMIN; Employees screen |
| S6 account management | `73360dc` | Deactivate/reactivate, resend (3/h), role change, guards (self, last admin), audit view |
| S7 close | this commit | Fresh-developer test, this report, traceability, logs |

## Exit checklist with evidence
- [x] **Onboarding end to end:** S5 live 10/10: bootstrap → email → link → password policy → set password → login → INVITED→ACTIVE → ADMIN creates a Sales Executive → invite email.
- [x] **Login works; deactivation blocks the next login and refresh:** S4 live 15/15; S6 live 16/16 (refresh rejected at once, "account disabled").
- [x] **401/403 tests:** MeEndpointTest (5 kinds of bad token), GatewayRoutingTest, permission tests in EmployeeOnboardingTest and AccountManagementTest, S6 live checks 3 and 14.
- [x] **DAY-ONE from a clean clone (2026-11-15):** clone → landing-page `npm ci`, typecheck, **build** → `.env` from `.env.example` → compose up (4 healthy) → both services via `./mvnw spring-boot:run` → web `npm ci && npm run dev` → bootstrap email → password → sign in as ADMIN. All README test commands pass in the clone: web lint/18 tests/build, access-service 26, api-gateway 10.
- [x] **No secrets:** no password/OTP/token column (schema checked); 0 occurrences of the client secret, test passwords or JWTs in the service logs (S5, S6); no env file tracked; the repo scan found only landing-page lockfile content hashes.
- [ ] **CI green on GitHub:** not run, because the push is blocked by the token scope. Every CI step was run locally (realm-check rules 14/14, both `./mvnw -B verify`, web lint/test/build, landing typecheck + build). gitleaks runs only in CI.

## Test totals
access-service **26**, api-gateway **10**, web **18**: all passing. Live scripted checks: S1 15, S4 15, S5 10, S6 16 (all pass).

## Deviations from the plan (all approved or recorded)
- **Spring Boot 4.1.2** instead of the Blueprint's wording "Spring Boot 3" (3.x has no open-source support) — D-115, Ashish.
- **Keycloak user attribute `erp_employee_id` dropped:** Keycloak 26's user profile discards it. Adoption on 409 now needs username + email to match. AUTHENTICATION F2 updated.
- **testcontainers-keycloak not used:** a plain Testcontainers container imports the real realm file with fewer dependencies.
- **Keycloak 26 needs two client scopes** (`basic` for `sub`, `kc-admin-api` for the Admin API audience). Full-scope clients turned off. KEYCLOAK-SETUP §5 updated.
- **Browser login was scripted** (same OIDC requests) because no debuggable browser was available. keycloak-js inside a real browser hasn't been clicked through yet (unit-tested only).
- **Jackson 3** rejects missing primitives → `whatsappOptIn` made optional (found by a test).
- PostgreSQL on host port **5433**, because a system PostgreSQL uses 5432 on the dev machine.

## Risks and open items carried forward
- R-004 (≤5 min access after deactivation; measured, accepted).
- R-005 (manage-users can map any role; mitigated by an allow-list; FGAP v2 is now available in 26.8 and could be evaluated).
- R-006 / Q-024 (no SMTP provider for staging/production).
- R-011 (rate limiter fails open if Redis is down).
- R-007 / Q-027 (CR-001 sales role needs client approval).
- Q-017 (extra employee fields), Q-019 (session lengths), Q-021 (MFA for admins), Q-022 (retention).
- Edit-profile endpoint (`PATCH /employees/{id}` with If-Match, api.md §3) **not built** in increment 1; listed for the next identity touch.
- Push blocked until the GitHub token has the `workflow` scope; CI hasn't run.

## Next
Increment 2: guest-service (Keycloak `gh-guests` pass-through, D-114) + lead-service (frozen portal contract, outbox → Kafka, lead queue, atomic claim) + lead screens. It starts with its own plan for approval.
