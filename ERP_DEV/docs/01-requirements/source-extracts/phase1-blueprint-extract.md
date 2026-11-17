# Source extract — QuantumCLK Resort ERP: Target Microservices Architecture & Phase 1 Implementation Blueprint

- Source file: `QuantumCLK_Resort_ERP_Architecture_and_Phase_1_Blueprint.md` (an identical copy, `… (1).md`, has the same sha256)
- Source path: `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce/` (see `docs/logs/RESOURCES_LOG.md` for the path change)
- sha256: `314f7c8e93a25b64a123ae399f1a49420e90f732ab9c51ea87bdf053ca02c6ca`
- Document date / status: 12 Nov 2026, v1.0, "Proposed engineering baseline — confirm client approvals and commercial scope before production use"
- Extracted: 2026-11-15 by the development agent. **The original wins if this extract and the source differ.**
- Rank in the source-of-truth order: 5 ("anything else"). It ranks below the SOW and the client answers, and the document says it "does not override the signed SOW". Ashish adopted it as the Phase 1 baseline on 2026-11-15 (DEVLOG).

Only the requirement text this project uses is extracted. Section numbers match the source.

## §2 Architecture decisions
| ID | Decision | Baseline |
|---|---|---|
| ADR-001 | Architecture style | Domain-driven microservices |
| ADR-002 | Deployment model | Single-resort deployment for Golden Hills Resort (not multi-tenant) |
| ADR-003 | Backend | Java 21 LTS, Spring Boot 3 |
| ADR-004 | Frontend | React + TypeScript; Next.js may be used for the public site |
| ADR-005 | API entry | Spring Cloud Gateway |
| ADR-006 | Identity | Keycloak using OAuth2/OIDC |
| ADR-007 | Authorization | RBAC plus permission and record-scope checks |
| ADR-008 | Service communication | REST (sync), Kafka (async domain events) |
| ADR-009 | Data ownership | Each microservice owns its data and schema/database |
| ADR-010 | Database | PostgreSQL |
| ADR-011 | Cache / temporary state | Redis; never the only durable store for deadlines or transactions |
| ADR-012/013 | Containers / orchestration | Docker; Kubernetes for production subject to hosting readiness |
| ADR-014 | Observability | Structured logs, metrics, traces; Prometheus, Grafana, OpenTelemetry |
| ADR-015 | Repository | Monorepo, with independent service builds, tests and deployments |

Interpretation rules:
- Services are business capabilities, not one per screen.
- No service reads or writes another service's database.
- A shared PostgreSQL cluster is fine if credentials and ownership are isolated.
- No distributed transactions; use events, idempotency and Sagas.
- Kafka consumers must be idempotent.

## §3 Access separation
- Staff authenticate through the staff identity client/realm; guests through the guest client/realm.
- Guest and staff populations must not share roles or authorization policies. The same Keycloak deployment is allowed, with separate clients, role namespaces, flows and policies.
- Public pages need no login.
- "Every protected backend endpoint must enforce authorization. Hiding a frontend button is not security."

## §4 Phase 1 services
- **Phase 1:** API Gateway, Identity Platform (Keycloak), Access Control, Guest & CRM (minimum profile), Lead Management, Notification (approved channels only), Website/CMS (landing page scope).
- **Later phases:** Reservation, Front Office, Room & Inventory, Housekeeping, POS, Membership & RFID, Billing & Payments, HR & Workforce, Maintenance, Spa, External Integration, Reporting.
- "Do not create empty placeholder services solely to match this list."

## §5 Events and reliability
- Phase 1 events: `GuestRegistered`, `LeadCreated`, `LeadAssigned`, `LeadClaimed`, `LeadFollowUpScheduled`, `LeadSlaBreached`, `LeadStatusChanged`, `LeadConversionRequested`, `LeadConverted`.
- Every event carries: `eventId, eventType, eventVersion, occurredAt (UTC), producer, correlationId, aggregateId`, plus minimal data. No passwords, tokens, card data or unnecessary PII.
- Transactional Outbox; idempotent consumers; retry with backoff plus a dead-letter topic; Redis is never the only store for an SLA deadline.

## §6 Data ownership
- Guest identity credentials → **Keycloak**. Guest profile → Guest & CRM ("Do not store guest passwords"). Lead pipeline → Lead Management. Notification attempts → Notification. Employee records → HR & Workforce (a later phase).
- Phase 1 needs separate databases (or isolated schema plus separate credentials) for Guest/CRM, Lead, CMS and Notification.
- Flyway or Liquibase migrations only.

## §7 Cross-service consistency
- "An inquiry is not a confirmed reservation."
- "A sales executive must not mark a lead as booked merely because the guest expressed interest."
- Conversion completes only after the Reservation service confirms it.

## §8 Phase 1 scope boundary
- **Included:**
  - landing page integration with guest registration/login;
  - guest profile basics;
  - inquiry forms and lead management;
  - Sales Executive ERP role and dashboard;
  - assignment, claim, follow-up, notes, status and SLA workflow;
  - basic email notifications (WhatsApp/SMS/voice only after approvals);
  - audit, observability, tests and deployment foundations.
- **Not included unless separately approved:**
  - room availability engine and confirmed online booking;
  - **payment collection or card storage**;
  - OTA;
  - folio, check-in/out or **room allocation**;
  - marketing automation;
  - unapproved voice calls;
  - membership/RFID, POS, housekeeping and HR.

## §9 Journeys B/C (guest identity)
- Keycloak creates and authenticates the guest; the Guest/CRM profile is linked by the Keycloak subject ID.
- "Never send or store raw password in Guest Service."
- Don't reveal whether an account exists; rate limiting and bot protection; password reset through Keycloak; never log passwords, OTPs, reset links, tokens or secrets.

## §10 Sales Executive
- A standard staff role inside the existing staff ERP, not a separate Sales application.
- Sales Executive: view payment records **No**; manage staff accounts **No**; convert = request only.
- Claims must be atomic: when two executives claim at once, only one succeeds.
- Lead lifecycle: NEW → QUEUED → ASSIGNED → CLAIMED/IN_PROGRESS → FOLLOW_UP_REQUIRED / CONVERSION_REQUESTED → CONVERTED / CONVERSION_FAILED / LOST / CLOSED. Transitions are validated on the backend and every change is kept in history.
- SLA: a configurable five-minute claim deadline stored in PostgreSQL; escalation to a supervisor or manager.
- Sales Supervisor / Manager: team queue, assign/reassign with a reason, SLA monitoring. Least privilege.

## §11 Permission model (hybrid RBAC)
- Permissions: `leads.read_assigned, leads.read_queue, leads.claim, leads.update_status, leads.add_activity, leads.schedule_followup, leads.request_conversion, leads.assign, leads.reassign, leads.read_team, leads.export, guest.read_sales_minimum, guest.update_own_profile, guest.read_own_inquiries, guest.create_inquiry`.
- The backend checks, in order: authenticated → permission → record scope → valid transition → audited. "A role name alone is not enough to authorize a record."

## §12 API outline (proposed)
- **Gateway:** routes, token validation, rate limits, correlation IDs, no business logic.
- **Guest:** `GET/PATCH /api/v1/guests/me`, `GET /api/v1/guests/me/inquiries`, `GET /api/v1/guests/{id}` (staff only). "Never create a second password store."
- **Lead:** `POST /api/v1/leads`, `GET /api/v1/leads/me[/{id}]`, staff `/api/v1/sales/leads…` (claim, assign, reassign, status, activities, follow-ups, conversion-requests, dashboard/summary). Never trust a client-supplied `guestId/assignedTo/createdBy`.

## §13 Staff ERP — Administration screens
- Create/activate/deactivate employee accounts; assign Sales Executive / Sales Supervisor roles; grant approved permissions; configure the SLA and templates; view security and audit history.

## §17 Operational and security
- HTTPS outside local dev; secrets in a secrets manager; a least-privilege DB user per service; encrypted backups.
- Log actor, action, entity, timestamp, outcome and correlation ID for sensitive operations; never log OTPs, tokens or passwords.
- Rate limiting and anti-bot measures on public endpoints. Confirm approval before using an external AI coding tool with client material.

## §18 Coding-agent instructions (selected)
- "Do not implement a custom password/token store."
- "Do not mark an inquiry as a confirmed reservation."
- "Do not build fake integrations or claim a provider message was sent when it was not."
- "Do not hardcode secrets, role IDs, provider credentials or production URLs."
- "Preserve the current ERP … Do not create a separate Sales frontend." Ashish has overridden this with the fresh start; see ADR-003.

## §19 Open decisions (copied to OPEN_QUESTIONS as Q-005…Q-016)
1. Anonymous inquiries allowed?
2. Email, mobile or both at registration?
3. Verification channel?
4. Inquiry categories and fields?
5. Five-minute SLA confirmed?
6. First escalation recipient?
7. Voice escalation provider?
8. WhatsApp Business API provisioned?
9. Consent language and privacy policy?
10. Approved public content?
11. CMS editing in Phase 1 and who publishes?
12. Hosting budget and availability target?
