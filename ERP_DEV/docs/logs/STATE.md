# Project State
Updated: 2026-11-16T23:55:00+05:30
Phase: 1. Work unit: **Gold Membership increment (SOW ERP-05)** & **Sales Admin: Employees → Sales Performance (D-137, D-138)**.
Branch: `feature/phase1-membership`.

Done:
1. S0 housekeeping: commits 9a58edb (mobile/HTTPS), 4dee064 (role cards + Employees UI), 4772b89 (landing page = Ritvik 2c164d9 + local map fix), f22f828 (logs). Hard delete reverted (D-125).
2. S0b one public origin split by path (D-124): committed 97c5e0c; ngrok now → :8088.
3. S1 membership core + S2 gateway routes/upload limit + live realm permissions: committed 4267d1b (V2 migration applied to dev DB).
4. S5 staff ERP Memberships screen: committed 4da643a.
5. S3 committed (f9be13b, 6044e6b) and LIVE: gh-guests imported with the extension, guests.provision on live gh-staff, guest_db created, guest-service running on :8092.
6. S4 committed (dff8b5c).
7. S6 committed (7b8da30).
8. Stack restart & runner scripts created: `run-access-service.ps1`, `run-api-gateway.ps1`, `run-guest-service.ps1`, `run-lead-service.ps1`, `run-landing-page.ps1`. All backend and frontend services live and verified healthy behind Caddy (:8088) and ngrok tunnel.
9. Returning sign-in fix (D-127…D-130): committed 536ae3e, 3e7d126, c5c5122.
10. Gold Member smart fields (D-131…D-134): committed ebf4952, 059240d, d8e04e8.
11. Sales Executive menu: Memberships as Dashboard (D-135).
12. Sales Admin Dashboard & Attended Leads Drill-Down (D-136):
    - `lead-service` (:8093) on `lead_db` with `V1__init_lead_schema.sql` and realistic seed leads attended by executive `rohan`.
    - API Gateway (:8082) route for `/api/v1/sales/leads/**`.
    - `access-service` (:8091) updated so `ADMIN` excludes the separate Leads nav item.
    - `SalesAdminDashboard.tsx`: KPI cards, executive roster with attended lead counts & status breakdown, and click-to-view attended lead details drill-down with search and filters.
    - 50/50 web unit tests pass; 2/2 lead-service tests pass; 11/11 access-service tests pass; clean Vite production build.

13. Sales Performance inside Employees (D-137) + Sales-Executive-only creation (D-138), uncommitted:
    - access-service: `MeController.modules()` drops `dashboard` for ADMIN; `EmployeeController` allows only `SALES_EXECUTIVE` on create and role change. Tests updated (`MeEndpointTest`, `AccountManagementTest`, `ProvisioningFailureTest`); compile OK, **not run** (needs Docker for Testcontainers; Docker Desktop was off).
    - lead-service: period-aware `summary` (conversion rate, avg first response, unclaimed) and list filters; `/api/v1/sales/leads/**` requires role ADMIN. 8/8 tests pass (run with `-Dsurefire.useManifestOnlyJar=false` on Windows: the space in "Intership wrok" breaks Surefire's manifest jar).
    - web: `SalesAdminDashboard.tsx` replaced by `SalesPerformance.tsx`; Employees tabs; `route.ts` hash routes; Dashboard branch + welcome cards removed. 55/55 tests, lint and build pass.

14. Employee PAN field (D-139), uncommitted: access-service V4 migration (`pan_masked`, `pan_hash`, unique), `IdentityNumbers.PAN`, create requires `pan`; web form PAN field with live check + masked preview, roster shows masked PAN. Docker now running: **access-service 75/75 tests pass** (also covers items 13's D-137/D-138 changes), web 57/57 + build + lint. V4 is applied to the dev DB on the next access-service start.

15. Memberships per executive in Sales Performance (D-140), uncommitted: access-service `MembershipService.summary`, `/admin/memberships/summary`, list filters; web KPIs, leaderboard columns, "Top in memberships", drill-down member list. access-service 76/76, web 59/59 + build + lint.

16. Ritvik's UI merged (D-141) on branch `merge/ritvik-ui` (backup of the pre-merge tip: `backup/phase1-membership-pre-ritvik` = 0f3ab72). Backend/infra/API unchanged versus the backup (checked with git diff). Web 61/61 + build + lint; landing typecheck + `next build` OK.

17. Production readiness (D-142): fake website flows removed, lead seed data dev-only, docs index and READMEs updated. Production repo gets a plain-git copy of shipped files only (orphan `production` branch, tag per release); no release tooling. Hosting stays on ngrok. Landing typecheck + build OK; lead-service 8/8; dev lead_db recreated (V1 + V1.1 dev seed, 5 leads).

18. `main` on origin = current work (fast-forwarded to `feature/phase1-membership`); GitHub default branch to be switched to `main` by Ashish. Production repo push waits on rerunning access-service, guest-service and Keycloak-extension tests (first run broke when Docker stopped).

Next action:
1. Present changes to Ashish and request commit approval (Rule 7).
2. Live check on phone / browser via tunnel.

Running locally: compose postgres (5433), keycloak (8081 with gh-guests + extension), redis, mailpit, proxy (:8088); guest-service :8092; access-service :8091; lead-service :8093; api-gateway :8082; web :5173; landing :3000; ngrok → 127.0.0.1:8088 (`https://weaponless-bertie-hyperorganically.ngrok-free.dev`).
Caveats: `skills-lock.json` is untracked on purpose.
