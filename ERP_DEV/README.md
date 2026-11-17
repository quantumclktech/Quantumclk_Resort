# ERP_DEV — Golden Hills Resort ERP (staff side)

Backend services, staff web app and infrastructure for the Golden Hills Resort ERP. The public website is `../landing-page/`.

**Status:** Phase 1 in progress: employee identity and accounts, Gold Membership, member website sign-in, and Sales
Admin lead and membership performance are built. Documentation: `docs/` in the development repository.

| Path | What |
|---|---|
| `services/api-gateway/` | Spring Cloud Gateway (JWT check, routing, rate limits), :8082 |
| `services/access-service/` | Employees, Keycloak account management, audit log, Gold Membership, :8091 |
| `services/guest-service/` | Member (guest) accounts in Keycloak realm gh-guests, :8092 |
| `services/lead-service/` | Leads and Sales Admin performance summary, :8093 (guest enquiries: increment 2) |
| `web/` | Staff ERP, React + TypeScript + Vite, :5173 |
| `infra/` | Local Docker Compose stack, Keycloak realms and extension, DB init, Caddy proxy |
| `docs/` | Setup, architecture, API and module documentation |

Local secrets go in `ERP_DEV/.env`, which is git-ignored and must never be committed.
