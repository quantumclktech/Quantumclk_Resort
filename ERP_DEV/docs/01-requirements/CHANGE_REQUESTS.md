# Change Requests

Items outside the signed SOW. Each one needs the client's approval before it is treated as contracted scope (SOW: changes to roles, screens or workflows may be treated as Change Requests). Append-only.

## CR-001 — Sales Executive role and lead pipeline in the staff ERP
- Raised: 2026-11-15 · Status: **Proposed. Needs client confirmation** (Q-027)
- What: a `SALES_EXECUTIVE` staff role, the lead queue and claim, and (later) follow-ups and SLA, as described in the Phase 1 Blueprint §10.
- Why: the Blueprint makes it the core of Phase 1, and Ashish adopted it on 2026-11-15.
- SOW reference: §22 lists the roles Super Admin, Resort Manager, Reception, Membership, Accounts, Housekeeping, Dining, Spa/Facilities, HR and Marketing, with **no sales role**. §4 ERP-01 includes "Inquiry and contact forms" and "Gallery and enquiry management", which partly covers inquiry handling.
- Client context (SRS §10): the client's org chart has *Reservation Desk Associates* (Front Office) and *Marketing Executives*. The new role probably maps to one of these (Q-027).
- Impact: one more role and its screens. No effect on core modules. Effort is already in the Phase 1 plan.

## CR-002 — Staff roles beyond SOW §22 (RBAC splits)
- Raised: 2026-11-27 · Status: **Proposed. Needs client confirmation** (Q-050)
- What: extra realm roles that split SOW §22 roles: `OWNER` (read-only split of Super Admin), `RESERVATIONS_MANAGER` (split of Reception: rates, inventory, OTA), `HOUSEKEEPER` (split of Housekeeping: own tasks only), `MAINTENANCE` (SOW §18 maintenance work), `DINING_MANAGER` / `DINING_STAFF` (split of Dining, only if ERP-11 is enabled).
- Why: least privilege and separation of duties (e.g. the owner sees everything but cannot take payments; a housekeeper sees only their own rooms). See `03-phases/phase-2/2.2-rbac-PLAN.md` §3, D-147.
- SOW reference: §22 role table and permission controls; §18 maintenance; §19 housekeeping.
- Impact: more roles and permission tests; no new screens beyond the modules themselves. A role is only created when its module is built.
