# web — Staff ERP (React + TypeScript + Vite)

- **Responsibility:** employee sign-in (ERP sign-in page → Keycloak hosted login, code flow + PKCE via `keycloak-js`), session handling (tokens in memory, refresh before expiry, one retry after a 401, sign-in again on a second 401, 403 → "no access"), dashboard built from `GET /api/v1/me`, sign-out (ends the Keycloak session). Menus are visibility only; the backend enforces access.
- **Port (dev):** 5173 (fixed; it's the only origin the Keycloak client accepts in dev).
- **Stack:** React 19.3.1, TypeScript 7.0.2, Vite 8.3.8, Vitest 5.1.0 + Testing Library + jsdom, oxlint, keycloak-js 26.2.5 (D-115).
- **Design:** `docs/02-architecture/identity/AUTHENTICATION.md` §5–6.

## Status (increment 1)
| Slice | Done |
|---|---|
| S4 shell | ✅ sign-in page (no password field in the ERP), Keycloak redirect, `/me` dashboard + module menu, "ERP record not set up" message, sign-out |
| S5 Employees screen | ✅ list with readable account status, Add employee (Idempotency-Key per submission, server field errors inline), Retry for stuck invites; add/retry hidden without `employees.manage` |
| S6 account actions | ✅ Deactivate/Activate and role change ask for a reason (stored in the audit); Resend invite; role selector only with `roles.assign`; Audit log page (`#audit`, ADMIN) |

## Commands
```bash
cd ERP_DEV/web
npm ci
npm run lint     # ✅ 0 problems
npm test         # ✅ 18 tests
npm run build    # ✅ tsc -b + vite build
npm run dev      # http://localhost:5173/erp/ (needs the infra stack, access-service and api-gateway running)
```
Settings (not secrets; copy `.env.example` to `.env.local` only to change them): `VITE_API_URL` (gateway, default `http://localhost:8082`), `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID`.

`index.html` sets a Content-Security-Policy that only allows the app itself, the gateway and Keycloak. Update it together with the URLs for staging/production.
