# Glossary

| Term | Meaning here |
|---|---|
| **Access token** | Short-lived (5 min) signed JWT that Keycloak issues; sent as `Authorization: Bearer …` on API calls |
| **Admin / ADMIN** | Staff role that manages employee accounts (SOW/SRS "Super Admin", Owner/MD) |
| **ADR** | Architecture Decision Record (`docs/02-architecture/adr/`) |
| **Audience (`aud`)** | Token claim naming who the token is for; our APIs accept only `erp-api` |
| **Claim (a lead)** | A Sales Executive takes ownership of an unclaimed lead; atomic, so only one can win |
| **Composite role** | Keycloak role that contains other roles; our job roles contain permission roles |
| **Conversion** | Turning a lead into a reservation. Phase 1 only *requests* it; a reservation is confirmed by the Reservation module later |
| **Correlation ID** | ID that follows one request across services and logs (`X-Correlation-Id`) |
| **Execute-actions email** | Keycloak's built-in email asking a user to do required actions (verify email, set password) |
| **Gateway** | `api-gateway`, the single entry for API calls (Spring Cloud Gateway) |
| **Idempotency key** | Client-chosen ID that makes a retried request safe (no duplicates) |
| **Inquiry / enquiry** | A guest's request for information sent from the website; stored as a lead |
| **JWKS** | Keycloak's published public keys; services use them to check token signatures |
| **Lead** | A sales opportunity created from an inquiry; it is not a booking |
| **Outbox** | Table where an event is saved in the same DB transaction as the business change, then published to Kafka |
| **PKCE** | Proof Key for Code Exchange; protects the browser login code flow |
| **Realm** | An isolated Keycloak user space: `gh-staff` (employees), `gh-guests` (guests) |
| **Refresh token** | Longer-lived token used to get new access tokens; rotated on every use |
| **Required action** | Something Keycloak makes a user do before login completes (e.g. `VERIFY_EMAIL`, `UPDATE_PASSWORD`) |
| **Sales Executive / SALES_EXECUTIVE** | Staff role that works leads (CR-001) |
| **Scope (record scope)** | Which records a user may see even when they hold a permission (e.g. own leads only) |
| **SLA (claim SLA)** | Deadline for claiming a new lead (proposed 5 min, later increment) |
| **SSO session** | The Keycloak login session behind the tokens; ends on logout, idle timeout or max lifespan |
