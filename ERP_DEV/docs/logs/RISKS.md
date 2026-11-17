# Risks (append-only)

| ID | Risk | Likelihood / impact | Mitigation | Owner |
|---|---|---|---|---|
| R-001 | Microservices + Kafka + Keycloak add setup work before the first feature | High / Medium | One compose file; DAY-ONE guide checked from a clean clone; increment 1 is foundation only | Dev |
| R-002 | Spring Boot 3.2.5 / Keycloak 24 get no security fixes | High / High | Q-020 upgrade recommendation | Ashish |
| R-003 | Guest identity design (Q-003) undecided; landing-page contract forces a compromise | High / Medium | Increment 2 blocked until decided; staff side goes first | Ashish |
| R-004 | A deactivated employee keeps access for at most 5 min (issued JWT) | Certain / Low | 5-min access tokens; sessions revoked at once | Accepted |
| R-005 | Keycloak `manage-users` can assign any realm role, including ADMIN | Low / High | Role allow-list + permission check + audit in access-service; FGAP v2 after an upgrade | Dev |
| R-006 | No SMTP provider yet means no onboarding outside dev | Medium / High | Q-024 early; Mailpit for dev | Ashish |
| R-007 | Sales role not in SOW (CR-001) may be disputed | Medium / Medium | CR-001 raised; client approval requested | Ashish |
| R-008 | Fresh start goes against Blueprint §18 "preserve the current ERP" | Certain / Low | ADR-003; full archive branch + tag | Ashish |
| R-009 | Resource folder moved; rule path stale | Certain / Low | Q-001 | Ashish |
| R-010 | Landing page build only checked in CI, not locally (node_modules symlink) | Medium / Low | First CI run on the branch confirms it | Dev |
| R-009 (update) | Closed on 2026-11-15: rule path updated (Q-001) | — | — | — |
| R-011 | Gateway rate limiter fails open if Redis is unreachable | Low / Medium | Health alert on Redis in the ops increment; services still check tokens | Dev |
| R-010 (update) | Closed 2026-11-15: landing-page build passes on a clean `npm ci` install (fresh-clone test) | — | — | — |
| R-002 (update) | Closed 2026-11-15: stack upgraded to supported releases (D-115) | — | — | — |
