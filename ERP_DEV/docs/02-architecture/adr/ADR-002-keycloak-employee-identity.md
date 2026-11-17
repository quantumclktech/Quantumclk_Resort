# ADR-002 — Keycloak is the only identity provider for employees

- Status: **Proposed** (decision taken by Ashish on 2026-11-15; this ADR records it and waits for his review)
- Sources: Phase 1 Blueprint §2 ADR-006/007, §3, §9, §18 ("Do not implement a custom password/token store"); SOW §25.2; Ashish's instruction of 2026-11-15
- Detail: [identity/AUTHENTICATION.md](../identity/AUTHENTICATION.md), [identity/KEYCLOAK-SETUP.md](../identity/KEYCLOAK-SETUP.md)

## Context
Ashish's first Phase 1 draft (v1.0) proposed a custom email-OTP + BCrypt + self-issued JWT login for sales staff. The audit of that draft found:
- an OTP that could be brute-forced;
- plain-text OTP storage;
- account enumeration;
- a hard-coded JWT fallback secret in the archived code;
- disabling a user did not take effect at once.

The Blueprint requires Keycloak and forbids a custom password or token store. In git history, the archived ERP already moved staff login to Keycloak once (`V3__drop_staff_user.sql`). On 2026-11-15 Ashish decided: Keycloak for employee authentication and account management.

## Decision
- **Keycloak realm `gh-staff`** is the single source of truth for employee login, passwords, email verification, password reset, tokens, sessions and the enabled/disabled state.
- **Onboarding is admin-driven:**
  - `access-service` creates the Keycloak user through the Admin REST API, using a least-privilege confidential client;
  - Keycloak sends the built-in `execute-actions-email` with `VERIFY_EMAIL` + `UPDATE_PASSWORD`;
  - the employee verifies their email and sets their own password on Keycloak's pages.
- **Login:** OIDC Authorization Code + PKCE from the React app (`keycloak-js`), with tokens kept in memory. The gateway and every service check the JWT (JWKS, issuer, expiry, `aud=erp-api`).
- **Authorization:** realm roles `ADMIN`, `MANAGER`, `SALES_EXECUTIVE` are composites of `erp-api` client-role permissions (Blueprint §11 hybrid RBAC), plus record-scope checks in each service.
- **Deactivation:** disable the user in Keycloak, then log out their sessions, then mark them `DISABLED` in the ERP database. Keycloak is the source of truth for account status, and a reconciliation job keeps the ERP in step.
- The ERP stores **no passwords, OTPs or tokens**. It does not create tokens, does not send its own OTP emails, and does not use the password grant.

## Consequences
- Less security code of our own; lockout, password policy, reset and session handling are Keycloak features.
- Keycloak becomes a critical dependency. If it is down, nobody can log in (failure F8). It needs monitoring, backups of the `keycloak` DB, and a runbook.
- Disabling a user is not instant: an access token already issued works for at most 5 minutes (R-004). That is accepted.
- The `manage-users` admin role in Keycloak 24 can assign any realm role, so role assignment is limited in `access-service` code (R-005) until Fine-Grained Admin Permissions v2 is available (Keycloak ≥ 26.2, Q-020).
- An SMTP provider and DNS records (SPF/DKIM/DMARC) are a hard prerequisite for onboarding (Q-024).
- **Supersedes** the custom OTP design in `phase1_plan.md` v1.0.
