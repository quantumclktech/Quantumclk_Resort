# Increment 1 Plan — Platform foundation & employee identity

- Status: **Approved by Ashish on 2026-11-15** (DEVLOG). In progress.
- Parent: [phase1_plan.md §6](phase1_plan.md). Design: [AUTHENTICATION](../../02-architecture/identity/AUTHENTICATION.md), [KEYCLOAK-SETUP](../../02-architecture/identity/KEYCLOAK-SETUP.md), [api.md §3](../../02-architecture/api.md), [ARCHITECTURE](../../02-architecture/ARCHITECTURE.md).
- Requirements covered: REQ-IAM-001…014 ([REQUIREMENTS](../../01-requirements/REQUIREMENTS.md)).
- Sources: Phase 1 Blueprint §2, §3, §11, §13, §14 Sprint 1, §17; SOW §22, §25; SRS §11.1; decisions D-103, D-112, D-113.

## 1. Goal
An ADMIN onboards an employee from the ERP. The employee gets Keycloak's email (seen in Mailpit in dev), verifies it, sets their own password, logs in to the staff ERP and sees a dashboard built from `/me`. The ADMIN can deactivate them, after which their next login or token refresh fails. Every API returns 401/403 correctly.

## 2. Scope
**In:**
- local infrastructure;
- `api-gateway`;
- `access-service` (employees, Keycloak provisioning, status sync, activate/deactivate, resend invite, role change, `/me`, audit, bootstrap admin);
- `web` (sign-in redirect, session handling, dashboard shell, Employees admin, sign-out);
- realm import file;
- CI realm check;
- DAY-ONE run steps.

**Out:**
- guest-service and lead-service (increment 2);
- Kafka (not started until increment 2 has a producer);
- notification-service;
- Prometheus/Grafana/OTel (ops increment);
- MFA (Q-021);
- branded Keycloak theme (Q-018).

## 3. Versions (D-112, D-115)
Fixed on 2026-11-15 from official sources and approved by Ashish: see [ADR-001, update "versions fixed"](../../02-architecture/adr/ADR-001-microservices-and-stack.md). Headlines: **Spring Boot 4.1.2** (every 3.x line is out of open-source support), Spring Cloud 2025.1.4, Keycloak 26.8.2, PostgreSQL 18.7, Redis 8.10.3, React 19.3.1, TypeScript 7.0.2, Vite 8.3.8.

## 4. Dependencies to approve (Q-023)
| Dependency | Where | Why |
|---|---|---|
| Testcontainers (postgresql) | access-service tests | Real PostgreSQL in integration tests (Blueprint §15 "real infrastructure") |
| `com.github.dasniko:testcontainers-keycloak` | access-service tests | Real Keycloak for provisioning and token tests |
| Mailpit (Docker image) | local Compose only | Catches Keycloak emails in dev |
| `keycloak-js` | web | Keycloak's own OIDC adapter (as before) |

No other new libraries. The Keycloak Admin API is called with Spring's `RestClient` plus the OAuth2 client-credentials support already in Spring Security, so **no `keycloak-admin-client` library**. The scheduled sync uses `SELECT … FOR UPDATE SKIP LOCKED`, so **no ShedLock**.

## 5. Slices (each one runs end to end and is shown to you before the next)
| # | Slice | Done when |
|---|---|---|
| S1 | **Infra:** `infra/docker-compose.yml` (PostgreSQL with a database and user each for `keycloak` and `access_db`, Keycloak, Redis, Mailpit), `infra/keycloak/gh-staff-realm.json` with `${ENV}` placeholders, `ERP_DEV/.env.example` (names only; your existing `.env` is not touched) | `docker compose up` is healthy; the KEYCLOAK-SETUP §11 checks that need no code pass; CI job validates the realm file |
| S2 | **access-service skeleton:** resource server (iss + aud + JWKS), role/permission converter, error format, `GET /api/v1/me`, Flyway V1 (`employee`, `audit_event`, `idempotency_key`) | Tests: no token, expired, wrong issuer or wrong audience → 401; `/me` → 200 |
| S3 | **api-gateway:** route `/api/v1/me` and `/api/v1/admin/**` → access-service, JWT check, Redis rate limit, correlation ID, CORS `:3000`/`:5173` | Tests: route works, 401 at the gateway, `X-Correlation-Id` echoed, 429 under burst |
| S4 | **web shell:** keycloak-js code + PKCE, tokens in memory, refresh, 401/403 handling, dashboard from `/me`, Sign out (end-session) | You log in as the bootstrap admin and log out; Vitest tests for the auth wrapper |
| S5 | **Onboarding:** create employee (validation, idempotency, Keycloak user + role + `execute-actions-email`), statuses, `retry-provisioning`, status sync job, bootstrap first ADMIN, Employees list/create screens | End to end: create → email in Mailpit → set password → log in → `ACTIVE`; failure tests F1–F5 |
| S6 | **Account management:** activate/deactivate (Keycloak first, then sessions revoked, then DB), resend invite (3 per hour), role change (`roles.assign`), last-admin and self guards, audit view | Deactivated user's login and refresh fail; guards → 409; audit rows checked |
| S7 | **Docs and close:** DAY-ONE run steps checked from a clean clone, module docs updated, TRACEABILITY test column filled, PHASE/increment report | Fresh-clone run works; every doc command was actually run |

## 6. Tests to write first (logic where mistakes are costly)
- Authorization matrix: every access-service endpoint × {no token, SALES_EXECUTIVE, MANAGER, ADMIN} → expected 401/403/200. **MANAGER cannot create or deactivate employees (D-113).**
- Token validation: expired, wrong issuer (a `gh-guests` token), wrong audience, tampered signature → 401.
- Provisioning saga: Keycloak down → `PENDING_PROVISIONING`, then the retry succeeds; 409 conflict adopts a user only if `erp_employee_id` matches; email failure → `INVITE_EMAIL_FAILED`.
- Idempotency: same key gives one employee; same key with a different body → 422.
- Deactivation ordering and guards; the status sync turns `INVITED` into `ACTIVE`.

## 7. Risks
R-001 setup work (Compose kept small: 4 containers); R-002 is resolved by D-112; R-005 role-assignment allow-list (plus Keycloak fine-grained admin permissions if the upgraded version supports them); R-006 SMTP (dev uses Mailpit; staging waits for Q-024).

## 8. Open questions touching this increment
Q-017 (extra employee fields), Q-019 (session lengths), Q-021 (MFA), Q-022 (retention), Q-023 (§4 above), Q-024 (SMTP for staging), Q-026 (password policy). Their proposed defaults apply until answered.

## 9. Definition of done
- [x] Slices S1–S7 done, with test output shown (inc1-REPORT).
- [x] `./mvnw -B verify` green for access-service (26) and api-gateway (10); web lint/test (18)/build green. - [ ] CI on GitHub: not run (push blocked by token scope).
- [x] No password, OTP, token or secret in code, logs, DB or git (checked; gitleaks runs in CI).
- [x] Docs updated in the same commits; DEVLOG, STATE and TRACEABILITY updated.
- [x] You approve each commit; push and merge are asked for separately.

## 10. Branch
`feature/phase1-inc1-identity`, branched from `feature/phase1-fresh-start`.
