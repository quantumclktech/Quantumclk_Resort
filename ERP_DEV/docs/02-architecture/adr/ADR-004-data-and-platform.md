# ADR-004 — Data & Platform Architecture (system of record, caches, events, files, content)

- Status: **Proposed** (2026-11-28). Parts A–C were agreed in discussion with Ashish (D-188). **Part D holds three open decisions waiting for Ashish (Q-136 … Q-138).**
- Sources: ADR-001 (stack); engineering rules #1–#7, #16, #17, #23; Blueprint §2 (data ownership), "Redis never the only durable store"; Phase 2 plans [2.1](../../03-phases/phase-2/2.1-ota-PLAN.md)–[2.10](../../03-phases/phase-2/2.10-nonfunctional-golive-PLAN.md).
- Audience: every developer who stores or moves data in this ERP. It handles real guests, staff and payments.

## Context
By the end of the Phase 2 plans the ERP has about 13 services, real money (folios, payments, refunds, invoices), personal data (ID hashes and scans, health notes), website content and files. Ashish asked how the data layer works for a real-world system, and in particular whether MongoDB is needed for unstructured content.

---

## A. Where each kind of data lives

| Data | Store | Source of truth? | Notes |
|---|---|---|---|
| All business records: bookings, rooms, stays, folios, payments, invoices, members, vouchers, tickets, audit | **PostgreSQL 18** (one server; **one database + one least-privilege user per service**) | **Yes, the only one** | ACID transactions, constraints, point-in-time backups (2.10) |
| Semi-structured content: CMS blocks, email templates, raw OTA/webhook payloads, audit before/after | **PostgreSQL JSONB**, in the owning service's DB | Yes | Schema-checked where it matters (§C) |
| Files: website images, PDFs, payment proofs, ID scans | **Object storage** (S3-compatible: MinIO on the VPS or provider storage, decided in 2.10-N1); **metadata row in Postgres** | Yes (files) | Public / private split (§C.4); restic backups |
| Rate limits, small caches | **Redis** (or Valkey) | **No** | Losing it loses nothing; never used for idempotency, sessions, locks or deadlines |
| Events between services | **Outbox table in Postgres**, delivered by polling or Kafka (open: D-2) | The outbox row is the truth | Consumers idempotent |
| Logins, passwords, MFA | **Auth0** (2.0) | For identity | Our DBs keep only `idp_subject` |
| Logs | **Loki** (2.10) | No | Structured, personal data scrubbed |

**Not used:** **MongoDB** and **Elasticsearch**.
- The data is relational and transactional, and the safety rules need Postgres features: row locks, `CHECK` constraints, **exclusion constraints** (`btree_gist`), unique idempotency keys, append-only triggers, WAL point-in-time recovery.
- JSONB covers flexible documents, and `pg_trgm` covers fuzzy search.
- A second database technology would double the backup, security, monitoring and skills cost for no gain.

## B. Rules for real data (all services)
1. **Money:** integer **paise** in `BIGINT`, currency INR, one rounding/tax module. Never floats.
2. **Time:** `timestamptz` in UTC, shown in Asia/Kolkata. The hotel **business date** is a separate column where it matters.
3. **Ownership:** no service reads or writes another service's database. Cross-service data moves by API or event.
4. **Never delete** business, financial or audit records. Use status changes, reversal lines and credit notes. Audit tables are append-only (trigger).
5. **Idempotency:** every create, payment, refund, import and webhook has a unique key in Postgres.
6. **Sensitive data:**
   - ID numbers are stored masked + keyed HMAC hash (shared `IDENTITY_HASH_KEY`, D-164);
   - scans, proofs and health notes are app-encrypted (AES-256-GCM) or permission-gated;
   - **no card data**;
   - events and logs carry ids, not personal data.
7. **Migrations:** Flyway, forward-only, **expand → contract** so images can be rolled back. Backup before every production deploy.
8. **Growth:** append-only logs (audit, access logs, provider events) are **partitioned by month**, with retention jobs.
9. **Connections:** about 13 pools × 10 ≈ 130 connections. `max_connections` is set with headroom; PgBouncer only if measured need.

## C. Semi-structured content and files (agreed with Ashish, 2026-11-28)

### C.1 Pages and content blocks (content-service, 2.9)
- A page has **fixed columns** (slug, locale, status, title, SEO fields, published_at, version) plus a **`blocks` JSONB array**.
- Every save writes a **`page_version`** row (rollback, diff, audit).
- **Each block type has a versioned JSON Schema** (`hero v1`, `richText v1`, `gallery v1`, `roomFacts v1`, `offerCard v1`, `faq v1`, `cta v1`).
  - Content is **validated on save**: an invalid block → 400, never stored.
  - Each block carries its version (`"v": 1`), so old page versions still render.
  - A new schema version comes with a renderer for it and, if needed, a migration of stored blocks.
- `locale` column from day one (Kannada/Hindi later without a schema change).

### C.2 Rich text = structured JSON, never raw HTML
- The editor (e.g. a ProseMirror/Tiptap-style editor; library chosen in 2.9-P1) saves a **JSON document tree** with an **allow-list** of nodes and marks: paragraph, headings h2–h4, lists, bold, italic, link, quote.
- **No HTML is stored.** The website renders the tree into HTML itself, escaping text and allowing only `https:` / `mailto:` / internal links.
- So an editor can't inject `<script>`, inline event handlers or iframes (stops stored XSS).
- Pasted HTML is converted to the allowed nodes on paste; anything else is dropped.

### C.3 Facts are referenced, not copied
Blocks such as `roomFacts`, prices, occupancy and membership benefits **point at the owning service** (room-service, reservation-service, loyalty-service) and are read live when the page is built. The website can never show a fact that disagrees with what the ERP charges or allows.

### C.4 Media pipeline and storage
1. Upload → **real file type checked by magic bytes**, size limit (images ≤ 15 MB, documents ≤ 5 MB).
2. **EXIF/metadata removed** (GPS, camera, author).
3. **sha256 de-duplication:** the same bytes are stored once, and every reference points to the one `media_asset`.
4. Variants are created (WebP/AVIF at 480 / 960 / 1600 px). **Alt text is required before publishing** (accessibility).
5. Stored under a hash-based key, with metadata in `media_asset` (sha256, mime, size, dimensions, alt text, variants, storage key).
6. A file still referenced by a published page **can't be deleted**. Unreferenced files are removed by a cleanup job after a grace period.

| Bucket | Readers | Served how |
|---|---|---|
| **public-media** (website images) | anyone | Caddy/CDN, long cache; hash in the file name, so a change gets a new URL |
| **private** (ID scans, payment proofs, invoices, health-related files) | staff with the specific permission | **app-level AES-256-GCM encryption** before upload; downloaded only through the API after a permission check; **never a public URL** |

Both buckets are backed up nightly (restic, encrypted, off-site, 2.10).

### C.5 Delivery
Publish → content-service commits version + status in one transaction → a signed **revalidate webhook** rebuilds only the changed pages in Next.js → visitors get cached static HTML. If content-service is down, the site keeps serving the last built pages.

### C.6 Other free-form data
- Raw webhook/OTA payloads: JSONB with personal data minimised, a unique dedupe key and a retention period.
- Staff, ticket and spa notes: plain TEXT with length limits, no HTML.
- Email templates: versioned, with placeholders; values are HTML-escaped when sent.

---

## D. Open decisions (waiting for Ashish)

| # | Question | Options | Claude's recommendation |
|---|---|---|---|
| **D-1** (Q-136) | **Service count:** 13 deployables on one VPS (~32 GB RAM) and sagas between tightly coupled modules | (a) keep as planned · (b) merge **reservation + room + stays + housekeeping into one `pms-service`** (module boundaries kept in code) · (c) a wider modular monolith | **(b)**. The 2.3 block saga and the 2.4 occupancy sync become single database transactions, and engineering rule #17 ("modular monolith first") is better respected. This reopens D-150 / D-154 / D-155. Billing and channel stay separate |
| **D-2** (Q-137) | **Event transport** (also 2.1-A1) | (a) **outbox + polling feeds** behind an interface · (b) Kafka single KRaft node | **(a) first**: one less JVM, enough at this size. Switch to Kafka behind the same interface if load or consumer count needs it |
| **D-3** (Q-138) | **Availability:** one VPS is a single point of failure (restore ≤ ~4 h) | (a) single VPS + backups · (b) + **standby Postgres replica** on a second small VPS (streaming replication, documented failover) | **(b) for production** if the client's uptime target (Q-128) is above "business hours"; otherwise (a) with the upgrade path documented |

## Consequences
- One database technology to secure, back up and know. Flexible content still fits through JSONB.
- The website can't drift from ERP facts, and editors can't inject scripts.
- Media is de-duplicated, and private files are protected by encryption and permission checks.
- **Known fix to schedule:** Gold Membership stores `amount NUMERIC(12,2)` in **rupees** (`services/access-service/.../V2__gold_membership.sql`). This is fixed-point and safe, but inconsistent with rule B.1. It is changed to paise when membership moves to loyalty-service (2.7-L2), through a forward migration.
- **Optional:** Redis → **Valkey** (BSD licence, drop-in), to avoid the Redis 8 tri-licence question (ADR-001 note). Secrets → encrypted in the repo (sops/age) or a provider secret manager. Both decided in 2.10-N1.
