# access-service

- **Responsibility:** employee profiles; Keycloak Admin API provisioning (create user, role, invite email, enable/disable, logout); status sync; `GET /api/v1/me`; account audit. Blueprint "Access Control" service; SOW ERP-08.
- **Owns:** `access_db`: `employee`, `audit_event` (append-only), `idempotency_key`. Never passwords or tokens.
- **Port (dev):** 8091 · **Stack:** Java 21, Spring Boot 4.1.2, Flyway, PostgreSQL 18 (D-115)
- **Design:** `docs/02-architecture/identity/AUTHENTICATION.md`, `KEYCLOAK-SETUP.md`, `api.md` §3.

## Status (increment 1)
| Slice | Done |
|---|---|
| S2 skeleton | ✅ JWT resource server (issuer, expiry ±60 s, `aud=erp-api`, JWKS fetched lazily), role/permission mapping (`ROLE_*`, `PERM_*`), shared JSON error body, correlation IDs, `GET /api/v1/me`, Flyway V1, JSON (ECS) logs, health probes |
| S5 onboarding, S6 account management | not yet |

## Build and test
```bash
cd ERP_DEV/services/access-service
./mvnw verify          # ✅ 11 tests; needs Docker (Testcontainers starts PostgreSQL 18)
```
No Maven install is needed: `./mvnw` downloads Maven 3.10.0 once and checks its sha256.

## Run locally
Start the infrastructure first (DAY-ONE §5), then from this folder:
```bash
set -a; . ../../.env; set +a        # loads ACCESS_DB_PASSWORD etc. from ERP_DEV/.env
./mvnw spring-boot:run
curl -s localhost:8091/actuator/health        # ✅ {"status":"UP",...}
curl -s localhost:8091/api/v1/me              # ✅ 401 {"code":"AUTH_REQUIRED",...}
```
| Variable | Default |
|---|---|
| `ACCESS_DB_URL` | `jdbc:postgresql://localhost:5433/access_db` |
| `ACCESS_DB_USER` / `ACCESS_DB_PASSWORD` | `access_svc` / — (required) |
| `KEYCLOAK_URL` / `KEYCLOAK_REALM` | `http://localhost:8081` / `gh-staff` |
| `PORT` | `8091` |

## S5: employee onboarding (built)
- `POST /api/v1/admin/employees` (`employees.manage`, `Idempotency-Key` required): saves the row, then provisions Keycloak (create or adopt user → map role → setup email). 201 `INVITED`, 202 if still pending, `INVITE_EMAIL_FAILED` if SMTP failed.
- `GET /api/v1/admin/employees[?status&role&q&page&size]`, `GET /{id}` (`employees.read`); `POST /{id}/retry-provisioning` (`employees.manage`).
- `AccountJobs`: every `ACCOUNT_SYNC_INTERVAL` (default 5 min) retries pending provisioning, syncs INVITED/ACTIVE from Keycloak, deletes idempotency keys older than 24 h; on start invites the bootstrap ADMIN while no ADMIN exists.
- Keycloak Admin API via `KeycloakAdminClient` (plain RestClient, client credentials, 3 s connect / 15 s read timeouts). Needs `KC_ACCESS_SERVICE_CLIENT_SECRET`; optional `BOOTSTRAP_ADMIN_*`, `ERP_WEB_ORIGIN`.
- Tests: 18 (`EmployeeOnboardingTest` starts real Keycloak 26.8.2 with `infra/keycloak/gh-staff-realm.json` + Mailpit; about 40 s).

## S6: account management (built)
- `PATCH /{id}/status {active, reason}`, `POST /{id}/resend-invite` (`employees.manage`); `PUT /{id}/role {role, reason}` (`roles.assign`); `GET /api/v1/admin/audit` (`audit.read`).
- Order is Keycloak first (disable + logout / role swap + logout), then the database. Guards: self, last admin (advisory lock), reason required, resend 3/hour.
- Tests: 26 (`AccountManagementTest` shares the real Keycloak/Mailpit stack with `EmployeeOnboardingTest` via `KeycloakStack`).
