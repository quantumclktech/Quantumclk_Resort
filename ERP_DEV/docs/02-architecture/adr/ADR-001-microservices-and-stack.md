# ADR-001 — Microservices per the Phase 1 Blueprint, same tech stack as before

- Status: **Proposed** (Ashish chose "Blueprint microservices" and "same tech stack" on 2026-11-15; this ADR waits for his review of the written form)
- Sources: Phase 1 Blueprint §2 ADR-001…015, §4, §6; tech-stack proposal extract; SOW §25

## Context
The ERP restarts from scratch (ADR-003). Ashish's first draft plan had one `lead-service`. The Blueprint in the resource folder asks for domain microservices behind a Spring Cloud Gateway, with Kafka events, Redis and a database per service. Ashish chose the Blueprint shape and asked to keep the tech stack the project already used.

## Decision
- **Services in Phase 1:** `api-gateway`, `access-service` (employees + Keycloak admin), `guest-service`, `lead-service`, and `notification-service` (with its later increment). Each is an independent Spring Boot project with its own database, Flyway, Dockerfile and CI job. No CMS service until Q-015 is answered.
- **Stack (same as the archived ERP):**

| Layer | Choice | Version (as previously used) |
|---|---|---|
| Language / runtime | Java | 21 (LTS) |
| Backend framework | Spring Boot (web, validation, data-jpa, security, oauth2-resource-server, actuator) | 3.2.5 |
| Gateway | Spring Cloud Gateway | Spring Cloud 2023.0.x (the release train matching Boot 3.2) |
| Migrations | Flyway | managed by Boot |
| API docs | springdoc-openapi | 2.5.0 |
| Database | PostgreSQL | 16 |
| Identity | Keycloak | 24.0 |
| Events | Apache Kafka (KRaft) + spring-kafka | 3.7 |
| Cache / rate limits | Redis | 7 |
| Staff web | React + TypeScript + Vite, tests with Vitest + Testing Library, lint with oxlint, auth with keycloak-js | React 19, TS ~6.0, Vite 8, Vitest 5, keycloak-js matching the Keycloak server |
| Public site | Next.js (`landing-page/`, unchanged) | 16 |
| Build | Maven (backend), npm (web) | |
| Containers | Docker / Docker Compose (dev); Kubernetes for production if hosting allows (Blueprint ADR-013) | |

## Consequences
- More moving parts than one service: local dev needs Compose with 5 infrastructure containers. Mitigation: one `docker compose up` and a checked DAY-ONE guide.
- ⚠ **Version risk (R-002, Q-020):** Spring Boot 3.2.x left open-source support on 2024-12-31 (spring.io support data; this ADR first said "Nov 2024", which was wrong) and Keycloak 24 is also past its support window. Today (Nov 2026) they get no security fixes. Ashish asked for the *same* stack, so this ADR keeps the versions. **Recommendation:** keep the same products but move to the current supported releases at the start of increment 1. That is a version bump, not a stack change, and it needs Ashish's yes (Q-020).
- New libraries beyond those listed (Testcontainers, Keycloak Testcontainers module, Mailpit image, ShedLock) need approval before they are added (Q-023).

## Update — 2026-11-15
Q-020 answered (D-112): keep the same products but use their **current supported releases**. The version column above is the historical baseline. The versions actually used are fixed in `03-phases/phase-1/inc1-PLAN.md` §3 after checking the official release pages.

## Update — 2026-11-15 (versions fixed, D-115)
Checked on 2026-11-15 against official sources (api.spring.io generations, GitHub releases of the official repos, npm registry, Docker Hub official images). Every Spring Boot 3.x line lost open-source support on 2026-06-30, so Ashish chose **Spring Boot 4.1.2**. This departs from the Blueprint's wording "Spring Boot 3" (Blueprint ADR-003) in order to stay on supported software.

| Product | Version | Free support until |
|---|---|---|
| Java | 21 (LTS) | — |
| Spring Boot | 4.1.2 | 2027-07-31 |
| Spring Cloud (Gateway) | 2025.1.4 (built and checked with Boot 4.1 in slice S3; if it fails → report, don't silently downgrade) | 2027-07-31 |
| Keycloak server / keycloak-js | 26.8.2 / 26.2.5 | current |
| PostgreSQL | 18.7 | — |
| Redis | 8.10.3 (AGPLv3/RSALv2/SSPLv1 tri-licence; stock image used unmodified, internally) | — |
| Mailpit | 1.33.1 (dev only) | — |
| Testcontainers / testcontainers-keycloak | 2.0.5 / 4.4.0 | — |
| React / Vite / TypeScript / Vitest / oxlint / Testing Library | 19.3.1 / 8.3.8 / 7.0.2 / 5.1.0 / 1.93.0 / 16.3.3 | — |

Kafka's version is fixed when increment 2 starts.
