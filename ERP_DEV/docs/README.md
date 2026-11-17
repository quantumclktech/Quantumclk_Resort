# Golden Hills Resort ERP — Documentation

**Phase 1: Guest Acquisition, Identity & Sales Lead Operations.** Built so far: employee identity and accounts (Keycloak),
Gold Membership registration and verification, the member website sign-in, and Sales Admin lead and membership performance.

Start here:
1. [00-onboarding/DAY-ONE.md](00-onboarding/DAY-ONE.md): get the repo running locally
2. [02-architecture/ARCHITECTURE.md](02-architecture/ARCHITECTURE.md): services, data ownership, layout
3. [02-architecture/api.md](02-architecture/api.md): API contracts
4. [02-architecture/identity/AUTHENTICATION.md](02-architecture/identity/AUTHENTICATION.md): employee onboarding, login, logout, RBAC (Keycloak)
5. [02-architecture/identity/MEMBER-LOGIN.md](02-architecture/identity/MEMBER-LOGIN.md): member website sign-in
6. [04-modules/membership.md](04-modules/membership.md): Gold Membership

| Folder | Contents |
|---|---|
| `00-onboarding/` | DAY-ONE guide, GLOSSARY |
| `01-requirements/` | REQUIREMENTS, TRACEABILITY, CHANGE_REQUESTS |
| `02-architecture/` | ARCHITECTURE, api.md (contracts), `identity/` (AUTHENTICATION, KEYCLOAK-SETUP, MEMBER-LOGIN), `adr/` |
| `04-modules/` | Module behaviour (membership) |

Dev repository only (not part of production releases): `01-requirements/source-extracts/` (text extracts of client documents),
`03-phases/` (phase and increment plans and reports) and `logs/` (STATE, DEVLOG, DECISIONS, OPEN_QUESTIONS, RISKS, RESOURCES_LOG).
Decision numbers such as D-131 refer to `logs/DECISIONS.md` there.
