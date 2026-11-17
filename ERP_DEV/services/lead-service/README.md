# lead-service

- **Responsibility:** Inquiry intake (/api/v1/portal/inquiries), leads, activity history, sales queue, atomic claim, transactional outbox → Kafka.
- **Owns:** lead_db: lead, lead_activity, outbox_event, idempotency_key.
- **Port (dev):** 8093 · **Increment:** 2
- **Design:** api.md §2, §4, §5; ARCHITECTURE.md §5

No code yet: this folder is a Milestone 1 skeleton. When implemented it will contain its own `pom.xml` (Java 21, Spring Boot), `Dockerfile`, Flyway migrations (if it owns data), tests, and an OpenAPI spec that matches `docs/02-architecture/api.md`. CI builds it as soon as `pom.xml` exists.
