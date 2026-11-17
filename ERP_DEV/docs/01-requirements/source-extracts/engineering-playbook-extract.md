# Source extract — Resort ERP Engineering Playbook
- Source file: Resort_ERP_Engineering_Playbook.md
- Source path: /run/media/ash_63/DATA/ERP_Resouce/Resort_ERP_Engineering_Playbook.md
- Extraction date: 2026-10-01T09:41:03+05:30
- sha256: b07c08410cb4063bd8250e953921c291986c7e07974e061b949fe1bd834e8671
- Note: verbatim copy (source is already markdown). Original is source of truth.

---

# Resort ERP — Engineering Playbook & Project Plan
**Version 1.0 · Prepared for QuantumClk Technologies · Resort ERP Implementation**

This document is the single source of truth for how this project is planned, built, documented,
tested, and delivered. It merges two inputs:

1. **`resort_erp_tech_stack_proposal.pdf`** — the approved architecture (Java 21/Spring Boot
   microservices, React/TypeScript, PostgreSQL, Kafka, Redis, Kubernetes, Keycloak).
2. **`QuantumClk_Freelance_Consultancy_Agreement`** — the contractual rules every contractor
   on this Project is bound by (Clauses 3.5, 6.5, 7, 12 and Annexure A). These are not
   suggestions — they are enforceable obligations with financial and legal consequences (see
   §2). Any new developer must read §2 before touching a repository.

A new developer should be able to read this file top-to-bottom and be productive the same day.

---

## Table of Contents
1. Project Summary
2. Non-Negotiable Rules (from the Agreement) — **read first**
3. Repository Strategy
4. Git Workflow
5. Documentation Standards
6. Coding Standards
7. Environments, Secrets & Tooling
8. Testing Strategy
9. CI/CD Pipeline
10. Development Phases (mapped to SOW milestones)
11. Definition of Done (per story / per phase)
12. Onboarding Checklist (Day 1 for a new developer)
13. Security & Data-Handling Checklist
14. Reporting, Reviews & Handover Cadence
15. Risk Register

---

## 1. Project Summary

| Item | Detail |
|---|---|
| System | Multi-property Resort ERP — reservations, front-office, housekeeping, POS/F&B, CRM, inventory, reporting |
| Architecture | Domain-driven microservices behind an API Gateway |
| Backend | Java 21 LTS, Spring Boot 3, Spring Cloud |
| Frontend | React 18 + TypeScript SPA / PWA |
| Data | PostgreSQL (OLTP) + Redis (cache) + Cloud DW (OLAP) |
| Messaging | Apache Kafka |
| Identity | Keycloak (OAuth2/OIDC), RBAC |
| Deployment | Docker + Kubernetes |
| Delivery model | Deliverable/outcome-based, not hour-based (Agreement Cl. 6.1) |
| Reporting cadence | Monthly written completion report by the 2nd working day (Cl. 5.2) |

Per the proposal's own risk section, **Phase 1 should start as a "modular monolith" inside
Spring Boot**, not eight fully independent services on day one. We split into finer-grained
microservices only when a specific module (e.g. Booking during seasonal load) actually needs
independent scaling. This reduces operational risk for a small starting team (2–4 backend, 2
frontend, 1 DevOps, 1 QA per the proposal's indicative team).

---

## 2. Non-Negotiable Rules (from the Agreement) — read first

These come directly from the signed Agreement and its Annexure A (NDA). They override personal
habits or "how I usually work." Violating them is a material breach with real consequences
(forfeiture of retention, liquidated damages, termination for cause).

### 2.1 Where code and data may live
- **Approved Systems only.** Code, configs, docs, and Client Data live *only* in the
  repositories/tools the Company designates. Never on personal GitHub/GitLab accounts, personal
  cloud storage, personal e-mail, USB drives, or messaging apps (Annexure A.5(c)).
- **No unmasked production data** in dev/test environments without written direction (A.5(d)).
- Delete local/temp copies of Client Data promptly once a working session ends (A.5(e)).

### 2.2 Commit cadence
- All code, configuration, and documentation must be **committed at least weekly** to the
  designated repository (Cl. 6.5). In practice: commit daily in small increments (see §4) —
  weekly is the contractual floor, not the target.

### 2.3 Third-party code and AI tools
- **No open-source or third-party component** goes into the Work Product without the Company's
  **prior written approval of the component and its licence** (Cl. 7.1(e)). Add a dependency →
  get sign-off → then `npm install` / add to `pom.xml`. Log approvals (see `docs/dependency-approvals.md` in §5).
- **No Confidential Information (including code, schemas, or data) may be pasted into any
  Generative AI tool** (ChatGPT, Copilot, unapproved Claude usage, etc.) unless that specific
  tool has been approved in writing for that specific use (Annexure A.6). If an AI coding
  assistant is approved, its output must still be reviewed and licence-checked before merge.
- No reverse-engineering, no accessing data/systems beyond what a task requires (A.3.1(f)).

### 2.4 Reporting and deadlines
- Monthly written report of completed tasks by the 2nd working day of the following month (Cl. 5.2).
- **Early warning obligation:** any risk of delay, defect, blocker, or dependency issue must be
  flagged in writing within **1 working day** of becoming aware of it (Cl. 6.2). Don't wait for
  standup — raise it immediately in the designated channel.
- Urgent/production-critical issues must be acknowledged within **4 hours** and worked
  continuously until resolved or the Company redirects (Cl. 6.4).

### 2.5 Security incidents
- Any suspected or actual Security Incident (unauthorized access, credential compromise, data
  loss, malware, phishing, misdirected communication) must be reported **within 2 hours** of
  becoming aware, by phone *and* e-mail (A.11.1). Preserve logs/evidence — do not delete or
  "clean up" anything related to an incident (A.11.2).

### 2.6 Handover discipline (build this in from day one, not at the end)
- Every deliverable needs to be handover-ready at all times: documentation, credentials in the
  approved vault (never in code/chat), and no tribal knowledge that lives only in one person's
  head. A **Handover Certificate** (Annexure B) is required at exit — the practical implication
  is that `docs/`, runbooks, and the onboarding checklist (§12) must always be current, because
  someone may need to hand off with only 24 hours' notice (A.13.1).

### 2.7 Standard of care
- Work must meet "the skill, care and diligence expected of a competent professional in the ERP
  field" (Cl. 3.4) — i.e., the phases, testing, and documentation in this playbook are the floor,
  not optional polish.

---

## 3. Repository Strategy

**Recommendation: monorepo for Phase 1–2, split later only if a service's release cadence or
team ownership genuinely diverges.**

Rationale: with a small team (per §1) and a modular-monolith starting point, a monorepo keeps
cross-service changes (e.g., a shared DTO used by Booking and Payments) atomic and reviewable in
one PR, and keeps the weekly-commit and audit requirements in §2 simple to satisfy — one place to
check, one CODEOWNERS file, one CI pipeline to reason about.

```
resort-erp/
├── services/
│   ├── booking-service/
│   ├── inventory-service/
│   ├── payments-service/
│   ├── guest-crm-service/
│   ├── pos-service/
│   ├── housekeeping-service/
│   ├── notifications-service/
│   └── reporting-service/
├── gateway/                     # API Gateway config
├── web/                         # React + TypeScript SPA
├── shared/
│   ├── event-contracts/         # Kafka topic/schema definitions (Avro/JSON Schema)
│   └── common-lib/               # shared Java utils (error handling, tracing, auth filters)
├── infra/
│   ├── k8s/                     # Helm charts / manifests per environment
│   ├── docker-compose.local.yml # local dev stack (Postgres, Redis, Kafka, Keycloak)
│   └── terraform/               # if/when infra-as-code is introduced
├── docs/
│   ├── architecture/            # ADRs (Architecture Decision Records)
│   ├── api/                     # OpenAPI specs per service
│   ├── runbooks/
│   ├── dependency-approvals.md  # Cl. 7.1(e) approval log
│   └── onboarding.md
├── .github/                     # PR template, CODEOWNERS, workflows
├── CONTRIBUTING.md
└── README.md
```

Each service directory is self-contained: its own `pom.xml`/`package.json`, its own Dockerfile,
its own test suite, its own `README.md` (see §5).

---

## 4. Git Workflow

### 4.1 Branching model — Trunk-based with short-lived feature branches
- `main` is always deployable. Protected: no direct pushes, PR + 1 approval + green CI required.
- `develop` is **not** used — trunk-based keeps integration friction low for a small team and
  satisfies the weekly-commit rule naturally (branches live days, not weeks).
- Feature branches: `feature/<ticket-id>-short-description` (e.g. `feature/RES-102-room-hold-api`)
- Fix branches: `fix/<ticket-id>-short-description`
- Release tags: `v1.<phase>.<increment>` (e.g. `v1.1.0` = Phase 1 first release)

### 4.2 Commit convention — Conventional Commits
```
<type>(<scope>): <short summary>

<optional body>

<optional footer: Refs TICKET-ID>
```
Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `security`.
Example: `feat(booking): add optimistic locking on room-hold creation (Refs RES-102)`

This gives a clean, auditable history — directly useful for the monthly completion report
required under Cl. 5.2 (you can generate it from `git log`).

### 4.3 Pull Requests
- One PR per ticket/task. Small, reviewable diffs (<400 lines where possible).
- PR template must include: what changed, why, how tested, screenshots (if UI), linked ticket,
  and a checkbox confirming no Confidential Information was exposed to an unapproved tool (§2.3).
- Minimum 1 reviewer approval before merge. CODEOWNERS routes service-specific PRs to the
  right owner.
- Squash-merge to `main` to keep history linear.

### 4.4 Compliance mapping
| Rule | How the workflow satisfies it |
|---|---|
| Weekly minimum commit (Cl. 6.5) | Trunk-based short branches → commits happen daily by default |
| No personal repos (A.5(c)) | Org-owned remote is the only configured `origin`; enforced via a pre-commit hook checking `git remote -v` |
| Dependency approval (Cl. 7.1(e)) | PR template requires linking a `docs/dependency-approvals.md` entry for any new dependency |
| Auditability | Conventional commits + PR history = ready-made monthly report source |

---

## 5. Documentation Standards

Every service ships with:
- **`README.md`** — purpose, how to run locally, how to test, key env vars, owning team.
- **OpenAPI spec** (`docs/api/<service>.yaml`) — kept in sync with code; generated where possible
  (springdoc-openapi) rather than hand-maintained.
- **ADRs** for any non-trivial architectural decision (`docs/architecture/ADR-00N-title.md`),
  using the standard "Context / Decision / Consequences" format. This is what lets a new
  developer understand *why*, not just *what*.
- **Runbooks** (`docs/runbooks/<service>.md`) — how to deploy, roll back, read dashboards, and
  respond to the top 3–5 likely incidents for that service.

**Definition of "documented enough":** a developer who has never seen the codebase can clone the
repo, follow the README, get the local stack running, and make a one-line change with a passing
test, in under 30 minutes, without asking a question in chat.

---

## 6. Coding Standards

**Java / Spring Boot**
- Google Java Style (enforced via Spotless/Checkstyle in CI).
- Layered architecture: `controller → service → repository`, DTOs at the boundary, entities never
  leak past the service layer.
- `@Transactional` boundaries defined explicitly at the service layer — this is the whole reason
  the stack was chosen (per the proposal, §2.1: transactional integrity is the core requirement),
  so it is treated as a first-class review criterion, not an afterthought.
- No business logic in controllers. No raw SQL string concatenation — JPA/Hibernate with named
  parameters, or jOOQ for reporting-heavy queries.

**React / TypeScript**
- ESLint + Prettier enforced in CI (fails the build, not just a warning).
- Functional components + hooks only. No class components.
- API access through a typed client layer (generated from OpenAPI specs where possible) — no
  ad-hoc `fetch` calls scattered through components.
- State: local component state by default; shared/server state via React Query (or equivalent);
  avoid a global store unless genuinely cross-cutting.

**General**
- No secrets, credentials, or connection strings in source, ever — see §7.
- Every new dependency requires the approval-log entry described in §2.3/§4.4 before merge.

---

## 7. Environments, Secrets & Tooling

| Environment | Purpose | Data |
|---|---|---|
| **Local** | `docker-compose.local.yml` spins up Postgres, Redis, Kafka, Keycloak | Synthetic/seed data only |
| **Dev** | Shared integration environment, auto-deployed from `main` | Synthetic data only |
| **Staging** | Pre-prod, mirrors prod config | Masked/anonymized data only, per Cl./Annexure A.5(d) — never unmasked production data without written Company direction |
| **Production** | Live | Real Client Data — access restricted per RBAC (§13) |

- **Secrets**: HashiCorp Vault or Kubernetes Secrets, as per the proposal's Security section.
  Never in `.env` files committed to git, never in Slack/e-mail. Use an approved password manager
  for anything that can't go in Vault (A.5(b)).
- **Local device requirements** (if using a personal machine, only with written approval per
  A.5(a)): current OS/security patches, active anti-malware, full-disk encryption, auto screen-lock.

---

## 8. Testing Strategy

Testing is not a phase at the end — it is built into the Definition of Done (§11) for every
ticket. Target shape, per service:

```
        ▲  E2E (Cypress/Playwright) — critical guest journeys only
       ╱ ╲     (booking → payment → confirmation, check-in → checkout)
      ╱   ╲
     ╱     ╲  Integration tests — service + real Postgres/Kafka via Testcontainers
    ╱       ╲
   ╱         ╲ Unit tests — service/domain logic, fast, no I/O
  ▔▔▔▔▔▔▔▔▔▔▔▔▔
```

| Layer | Tool | Target coverage | Runs |
|---|---|---|---|
| Unit | JUnit 5 + Mockito (Java), Vitest/Jest (React) | ≥80% on domain/service layer | Every commit (local + CI) |
| Integration | Spring Boot Test + Testcontainers (real Postgres, Kafka) | All API endpoints, all Kafka producers/consumers | Every PR |
| Contract | Spring Cloud Contract or Pact between services | Every inter-service call | Every PR touching a shared contract |
| E2E | Playwright/Cypress | Booking, payment, check-in/out happy paths + top failure paths | Nightly + before release |
| Load | k6 or Gatling on Booking/Payments | Confirms HPA scaling behavior under seasonal-rush simulation | Before each major release / Phase 5 hardening |
| Security | OWASP Dependency-Check, Snyk (as named in the proposal) | Zero high/critical open | Every PR (CI-gated) |

**Non-negotiable for transactional services (Booking, Inventory, Payments):** every write path
touching room holds, inventory counts, or payment postings needs a concurrency test proving no
double-booking / lost-update under parallel requests — this is the single most important test
class in the whole system, matching the proposal's stated #1 risk (Executive Summary, §2.1).

---

## 9. CI/CD Pipeline

Matches the proposal's DevOps section (§07), made concrete:

```
push/PR → build → unit tests → integration tests (Testcontainers)
        → static analysis (Checkstyle/ESLint) → dependency/security scan (Snyk/OWASP)
        → build & tag Docker image → deploy to Dev (auto, on merge to main)
        → deploy to Staging (manual approval gate)
        → deploy to Production (manual approval gate, Phase-4+ only)
```

- Pipeline: GitHub Actions (fits the monorepo well; swap for GitLab CI/Jenkins if the org
  standardizes differently — the proposal lists all three as acceptable).
  ​
- Every service gets its own pipeline job, triggered by path-based filters (`services/booking-service/**`)
  so a change to one service doesn't rebuild the whole monorepo.
- Observability from day one of Phase 1, not bolted on later: Prometheus + Grafana for metrics,
  Jaeger for tracing, ELK for logs — matching the proposal's stack exactly.

---

## 10. Development Phases (mapped to SOW milestones)

This mirrors the proposal's 5 phases (§09), but each phase now has an explicit **Definition of
Done** and testing gate so a new developer knows exactly what "finished" means. Fill the actual
target dates into the Agreement's Schedule 2 SOW once agreed with the Company.

### Phase 1 — Foundation
- **Deliverables:** Auth/RBAC (Keycloak), API Gateway, Booking + Inventory services (as a modular
  monolith first), PostgreSQL schema + migrations (Flyway/Liquibase), CI/CD pipeline skeleton,
  local dev environment (`docker-compose.local.yml`).
- **Exit criteria:** a new developer can clone, run `docker-compose up`, hit a `/health` endpoint,
  create a booking via API, and see it persist — all covered by passing unit + integration tests
  in CI. ADR written for the monolith-vs-microservices starting decision.

### Phase 2 — Core Operations
- **Deliverables:** Front-desk UI (React), Housekeeping service, Payments integration (tokenized,
  per Cl./Annexure security rules — no raw card data touches our servers), Redis caching for
  availability lookups, WebSocket live updates.
- **Exit criteria:** concurrency tests pass for booking/payment write paths; E2E happy-path
  (search → book → pay → confirm) green in CI.

### Phase 3 — Guest Experience
- **Deliverables:** Guest CRM, POS/F&B, Notifications (SMS/WhatsApp via Twilio, decoupled through
  Kafka), Elasticsearch search.
- **Exit criteria:** Kafka event contracts documented in `shared/event-contracts/` and covered by
  contract tests; notification delivery has a dead-letter/retry path, not silent failure.

### Phase 4 — Scale & Integrate
- **Deliverables:** OTA/channel manager sync (idempotent, with retry logic per the proposal),
  RFID integration, reporting/analytics warehouse (OLAP offload), multi-property support
  (property-scoped data partitioning).
- **Exit criteria:** load test demonstrates HPA scaling Booking/Payments from 2→20 pods under
  simulated seasonal load with no correctness regressions.

### Phase 5 — Hardening
- **Deliverables:** full load testing, security audit (penetration test or equivalent), disaster
  recovery drill, observability tuning, documentation freeze/review.
- **Exit criteria:** DR runbook has been executed at least once in Staging; all `docs/` and
  onboarding materials verified current (this is also what makes a Handover Certificate under
  Annexure B truthful, not just a formality).

---

## 11. Definition of Done (applies to every ticket, every phase)

A task is **not done** until all of the following are true:
1. Code merged to `main` via reviewed PR, CI green (build, lint, unit, integration, security scan).
2. Unit + integration tests written for the change; concurrency test added if it touches a
   booking/inventory/payment write path.
3. OpenAPI spec / README / ADR updated if the change affects an API or an architectural decision.
4. No new dependency without a logged approval (§2.3).
5. No Confidential Information was pasted into an unapproved tool while working on it (§2.3).
6. Deployed and verified in Dev; deployed and verified in Staging before it counts toward a
   milestone/monthly report.

---

## 12. Onboarding Checklist (Day 1 for a new developer)

- [ ] Signed Agreement + Annexure A (NDA) on file **before** any repo access is granted (Cl. 11.2 — no access before signature).
- [ ] Added to Approved Systems: org Git remote, CI, Vault/Secrets, ticketing tool, comms channel.
- [ ] Read §2 of this document (Non-Negotiable Rules) in full.
- [ ] Local dev environment running (`docker-compose.local.yml`) — Postgres, Redis, Kafka, Keycloak up.
- [ ] Cloned repo, ran the full test suite locally, all green.
- [ ] Made one trivial PR (e.g. a README fix) to confirm the git workflow, PR template, and CI
      gate all work end-to-end.
- [ ] Reviewed `docs/architecture/` ADRs for the services they'll touch first.
- [ ] Reviewed `docs/dependency-approvals.md` so they know the process before adding a library.
- [ ] Confirmed reporting cadence with their point of contact (monthly report date, early-warning
      channel, urgent-issue escalation path — Cl. 5.2, 6.2, 6.4).

---

## 13. Security & Data-Handling Checklist

- [ ] MFA enabled on every Approved System account.
- [ ] No Client Data or credentials outside Approved Systems — ever (A.5(c), A.13).
- [ ] Unmasked production data never used in Dev/Staging without written Company direction (A.5(d)).
- [ ] RBAC roles reviewed per environment: front-desk, housekeeping, finance, admin, dev — least
      privilege (proposal §06; Cl./Annexure A).
- [ ] Dependency + secret scanning green before every merge.
- [ ] Security Incident escalation path known to every developer: report within 2 hours, by phone
      *and* e-mail, preserve evidence, do not attempt to "fix and hide" (A.11).
- [ ] Devices used for the Project meet the standard in A.5(a) if personal-device use is approved
      at all.

---

## 14. Reporting, Reviews & Handover Cadence

| Cadence | Activity | Contractual basis |
|---|---|---|
| Daily | Standup / async status in designated tool | Cl. 3.6 (reporting) |
| Weekly | Minimum commit checkpoint; sprint review against SOW milestones | Cl. 6.5 |
| Monthly | Written completion report by 2nd working day | Cl. 5.2 |
| Immediately | Early warning on any risk to a deadline | Cl. 6.2 (within 1 working day) |
| Immediately | Urgent/production issue acknowledgement | Cl. 6.4 (within 4 hours) |
| Immediately | Security Incident report | Annexure A.11 (within 2 hours) |
| End of Primary Term / exit | Handover Certificate (Annexure B) — docs, credentials, WIP handed to nominated person | Cl. 8.2, 9.6, A.13 |

Keeping `docs/`, ADRs, and runbooks current throughout (not just at the end) is what makes this
cadence achievable without a scramble — that's the whole point of §5 and §12.

---

## 15. Risk Register (starting point — review and expand each phase)

| Risk | Impact | Mitigation |
|---|---|---|
| Double-booking / lost-update on room holds | High — financial + reputational | Mandatory concurrency tests (§8); `@Transactional` review discipline (§6) |
| Unapproved dependency introduces a licensing/security issue | Medium | Dependency approval log + Snyk/OWASP gate in CI (§2.3, §9) |
| Confidential Information leaked via an unapproved AI tool | High — breach, liquidated damages (A.16.2) | Team policy + PR checklist item (§4.3); only Company-approved AI tools used, and only within approved scope |
| Knowledge concentrated in one developer | Medium | Documentation standard (§5) + Handover Certificate discipline (§12, §14) |
| Microservices split too early, adds operational overhead the team can't support | Medium | Start as modular monolith in Phase 1 per proposal §10; split only when a module demonstrably needs independent scaling |
| Multi-property partitioning designed too late | Medium | Property-scoped data model decided as an ADR in Phase 1, even though multi-property rollout is Phase 4 |

---

*This playbook should be reviewed and updated at the start of each phase. Treat it as a living
document under the same documentation standard as everything else (§5) — if it goes stale, it
stops doing its job.*
