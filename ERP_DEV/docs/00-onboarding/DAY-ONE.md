# Day One — new developer guide

- Last checked: 2026-11-15, end of increment 1: **followed literally from a clean clone** (landing page, infrastructure, both services, web app, first-admin sign-in, and every README test command). Commands marked ✅ were run.

## 1. What you are working on
The Golden Hills Resort ERP, built by QuantumCLK Technologies. Phase 1 connects the public website (guest registers and inquires) to the staff ERP (employees log in with Keycloak; Sales Executives claim leads). Read in this order: `docs/README.md` → `phase1_plan.md` → `ARCHITECTURE.md` → `identity/AUTHENTICATION.md`.

## 2. Prerequisites
| Tool | Version | Why |
|---|---|---|
| Git | any recent | |
| Node.js | ≥ 20.9 (✅ checked with 24.22.0) | landing page; staff web later |
| Java | 21 or newer (✅ built with JDK 25; code targets 21) | backend services |
| Maven | not needed: each service has `./mvnw` (Maven 3.10.0, sha256-checked) | backend builds |
| Docker + Compose v2 | ✅ checked with Docker 29.9 / Compose 5.5 | PostgreSQL, Keycloak, Redis, Mailpit (Kafka in increment 2) |

## 3. Get the code
```bash
git clone https://github.com/AshishBevinakatti/QCl_repo.git
cd QCl_repo
git switch feature/phase1-fresh-start   # until it is merged into main
```

## 4. Landing page (the only runnable app today)
```bash
cd landing-page
npm ci
npm run typecheck     # ✅ exit 0 on 2026-11-15
npm run dev           # http://localhost:3000
```
- `npm run lint` currently reports 4 errors that were already there (Q-004). Don't fix them as a side job, because the landing page is frozen in Phase 1.
- Guest register/login/inquiry calls go to `http://localhost:8082/api/v1/portal` (the gateway, increment 1/2). Until then those forms show a connection error. That is expected.
- If `node_modules` is a symlink to a folder outside the project, `npm run build` fails with *"Symlink … points out of the filesystem root"*. Use a real `npm ci` install instead.

## 5. Local infrastructure (increment 1, slice S1)
1. Copy the variable names from `ERP_DEV/.env.example` into `ERP_DEV/.env` (git-ignored; create it if missing) and give every secret a value:
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"   # run once per secret
   ```
2. Start everything from the repo root:
   ```bash
   docker compose --env-file ERP_DEV/.env -f ERP_DEV/infra/docker-compose.yml up -d --wait
   ```
   Before the first start, build the Keycloak extension (it is mounted into Keycloak): `(cd ERP_DEV/infra/keycloak-extensions/gh-member-activation && ./mvnw -q package -DskipTests)`.
   ✅ Expected: `postgres`, `keycloak`, `redis` and `mailpit` `Healthy`, plus `proxy` (Caddy, one public origin split by path) running. Keycloak takes about a minute on first start. A missing secret stops compose with `required variable … is missing a value`.
3. Look around:
   - Keycloak admin console: http://localhost:8081/admin, log in with `KC_BOOTSTRAP_ADMIN_USERNAME`/`PASSWORD`, then switch to realm **gh-staff** (staff) or **gh-guests** (members and guests).
   - Mailpit (all dev emails land here): http://localhost:8025
   - PostgreSQL: `localhost:5433` (not 5432); databases `access_db` (user `access_svc`) and `guest_db` (user `guest_svc`). A volume created before 2026-11-16 has no `guest_db`; create it once: `docker exec golden-hills-erp-postgres-1 psql -U postgres -c "CREATE ROLE guest_svc LOGIN PASSWORD '<GUEST_DB_PASSWORD>'" -c "CREATE DATABASE guest_db OWNER guest_svc"`.
4. Stop: `docker compose --env-file ERP_DEV/.env -f ERP_DEV/infra/docker-compose.yml down`. Add `-v` to also delete the dev data, which you need after editing the realm file.

## 5b. Run the ERP locally (after §5)
In four terminals, with `set -a; . ERP_DEV/.env; set +a` first in each backend terminal:
```bash
(cd ERP_DEV/services/access-service && ./mvnw spring-boot:run)   # :8091
(cd ERP_DEV/services/guest-service  && ./mvnw spring-boot:run)   # :8092 (member accounts + welcome email)
(cd ERP_DEV/services/api-gateway   && ./mvnw spring-boot:run)    # :8082
(cd ERP_DEV/web && npm ci && npm run dev)                        # http://localhost:5173/erp/
```
On Windows the same, one PowerShell window each: `ERP_DEV\run-access-service.ps1`, `ERP_DEV\run-guest-service.ps1`, `ERP_DEV\run-api-gateway.ps1`, `ERP_DEV\run-lead-service.ps1` (adds dev sample leads), `run-landing-page.ps1` (they load `ERP_DEV/.env`). `ERP_DEV\check-stack.ps1` then prints OK/DOWN for Docker, Postgres, Keycloak, each service and each proxy path; it changes nothing. Phone testing: `ngrok http 127.0.0.1:8088 --url=<host>` (KEYCLOAK-SETUP §1.1).
**First admin (once per fresh database):** set `BOOTSTRAP_ADMIN_EMAIL`, `_USERNAME`, `_FIRST_NAME`, `_LAST_NAME` and `_MOBILE` in `ERP_DEV/.env` before starting access-service. On start it logs `Bootstrap ADMIN <username> is INVITED`. ✅ Open Mailpit (http://localhost:8025), click the "Update Your Account" email's link, and set a password (12+ characters). Then open http://localhost:5173/erp/ → **Sign in** → you're the ADMIN. Under **Employees** you can add people; each one gets the same email.

## 6. Your first change
1. Create a branch: `git switch -c docs/<short-slug>`.
2. Edit a doc, keeping the "why" and the source next to each rule.
3. Add an entry to `docs/logs/DEVLOG.md` (append only) and update `docs/logs/STATE.md`.
4. Commit with Conventional Commits, e.g. `docs(core): clarify lead claim rule`. Every commit, merge and push needs the project owner's approval.

## 7. Rules you must know on day one
- Client documents live only in the resource folder (read-only); `docs/01-requirements/source-extracts/` holds hash-stamped text copies. Never commit raw client files, personal data or secrets.
- Never commit `.env`. Secrets come from environment variables; CI runs a gitleaks secret scan.
- No custom login, password, OTP or token code: Keycloak owns identity (ADR-002).
- Phase 1 has no booking or payment features (phase1_plan.md §1.3).
