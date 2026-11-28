# Project State
Updated: 2026-11-28T17:55:59+05:30
Phase: **2 (final phase)** — planning stage: writing all sub-plans before an execution plan. Saved: **2.0 Identity: Keycloak → Auth0** (D-166…D-169; staff onboarding + OTP §2A/§2B added D-189…D-193, awaiting review), **2.1 OTA** (D-144, D-145), **2.2 RBAC** (D-146…D-149), **2.3 Room Management & Room Status Engine** (D-150…D-153), **2.4 Front Office + Housekeeping** (D-154…D-157), **2.5 Billing, Payments & Folio** (D-158…D-161), **2.6 Booking Engine + CRM** (D-162…D-165), **2.7 Membership, Loyalty & RFID** (D-170…D-175), **2.8 Maintenance, Facilities & Spa** (D-176…D-180), **2.9 Reports, Admin & CMS** (D-181…D-183), **2.10 Non-functional & go-live** (D-184…D-187). **All sub-plans written.** Earlier Phase 1 work below.
Branch: `ngrok-fix` (current checkout; 2.1 code work will get its own `feature/` branch from `develop`).

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

19. VPS fix (D-143) on `fix/web-same-origin`, uncommitted: web uses its own origin when VITE_API_URL/VITE_KEYCLOAK_URL are empty; KEYCLOAK-SETUP §1.2 new-host checklist. Web 64/64 + tsc + build.

20. Sub-phase 2.1 OTA plan saved (docs only, uncommitted): `docs/03-phases/phase-2/2.1-ota-PLAN.md`; client requests Q-041…Q-049; decisions D-144, D-145.
21. Sub-phase 2.2 RBAC plan saved (docs only, uncommitted): `docs/03-phases/phase-2/2.2-rbac-PLAN.md`; Q-050…Q-057; D-146…D-149; CR-002.
22. Sub-phase 2.3 room plan saved (docs only, uncommitted): `docs/03-phases/phase-2/2.3-room-status-PLAN.md`; Q-058…Q-064; D-150…D-153.
23. Sub-phase 2.4 Front Office + Housekeeping plan saved (docs only, uncommitted): `docs/03-phases/phase-2/2.4-frontoffice-housekeeping-PLAN.md`; Q-065…Q-072; D-154…D-157.
24. Sub-phase 2.5 billing plan saved (docs only, uncommitted): `docs/03-phases/phase-2/2.5-billing-payments-folio-PLAN.md`; Q-073…Q-081; D-158…D-161.
25. Sub-phase 2.6 booking engine + CRM plan saved (docs only, uncommitted): `docs/03-phases/phase-2/2.6-booking-engine-crm-PLAN.md`; Q-082…Q-089; D-162…D-165.
26. Sub-phase 2.0 identity migration plan saved (docs only, uncommitted): `docs/03-phases/phase-2/2.0-identity-auth0-PLAN.md`; Q-090…Q-096; D-166…D-169; R-AUTH0-1…5.
27. Sub-phase 2.7 loyalty + RFID plan saved (docs only, uncommitted): `docs/03-phases/phase-2/2.7-loyalty-rfid-PLAN.md`; extract `loyalty-booklet-extract.md`; Q-097…Q-106; D-170…D-175.
28. Sub-phase 2.8 maintenance, facilities & spa plan saved (docs only, uncommitted): `docs/03-phases/phase-2/2.8-maintenance-facilities-spa-PLAN.md`; Q-107…Q-116; D-176…D-180.
29. Sub-phase 2.9 reports, admin & CMS plan saved (docs only, uncommitted): `docs/03-phases/phase-2/2.9-reports-admin-cms-PLAN.md`; Q-117…Q-124; D-181…D-183.
30. Sub-phase 2.10 non-functional plan saved (docs only, uncommitted): `docs/03-phases/phase-2/2.10-nonfunctional-golive-PLAN.md`; Q-125…Q-135; D-184…D-187; R-012, R-013.
31. ADR-004 Data & Platform (Proposed; Part D open: Q-136…Q-138) + CMS content rules in 2.9 (D-188), docs only, uncommitted.

Next action:
0a. Ashish to decide ADR-004 Part D (Q-136 pms-service merge, Q-137 event transport, Q-138 standby replica).
00. **All Phase 2 sub-plans saved (2.0–2.10). Next: write the execution plan** (order all units; 2.10-N1…N6 and 2.0 early; 2.0 before 2.2-R1; RBAC R1–R4 before 2.1-A2; 2.3-M1…M3 before 2.1-A4). Execution order: 2.0 before 2.2-R1. After all plans: write the execution plan (RBAC R1–R4 before 2.1-A2). Commit of the plan docs waits for approval.
0. **2.1 OTA plan saved; waiting for Ashish's approval to commit the docs and to start unit 2.1-A1 (ADR).** Send the Q-041…Q-049 credential/commercial requests to the client.
1. Present changes to Ashish and request commit approval (Rule 7).
2. Live check on phone / browser via tunnel.

Running locally: compose postgres (5433), keycloak (8081 with gh-guests + extension), redis, mailpit, proxy (:8088); guest-service :8092; access-service :8091; lead-service :8093; api-gateway :8082; web :5173; landing :3000; ngrok → 127.0.0.1:8088 (`https://weaponless-bertie-hyperorganically.ngrok-free.dev`).
Caveats: `skills-lock.json` is untracked on purpose.
