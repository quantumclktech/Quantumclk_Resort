# guest-service

- **Responsibility:** guest and member accounts in Keycloak realm `gh-guests`. When access-service verifies a Gold Membership, it creates the member's account (no password), sets `membershipId`, and asks Keycloak (extension `gh-member-activation`) to send the welcome email with a one-time set-password link that signs the member in (D-119…D-122). Also serves the signed-in guest's own profile.
- **Owns:** `guest_db`: `guest_account` and an append-only `audit_event`. **Never passwords, never membership data**; memberships live in access-service (D-120).
- **Port (dev):** 8092
- **Design:** MEMBER-LOGIN.md, api.md §3b (dev repo docs)

## Endpoints

| Path | Caller |
|---|---|
| `POST /internal/guests/provision`, `POST /internal/guests/{id}/resend` | access-service only: gh-staff token with `erp-api` permission `guests.provision`. Not routed by the gateway |
| `GET /api/v1/portal/me` | signed-in guest: gh-guests token, aud `guest-api` |

## Run

```bash
set -a; . ERP_DEV/.env; set +a
cd ERP_DEV/services/guest-service && ./mvnw spring-boot:run      # :8092
```

Needs `GUEST_DB_PASSWORD`, `KC_GUEST_SERVICE_CLIENT_SECRET` and `LANDING_PUBLIC_URL`, plus `guest_db` in Postgres (DAY-ONE §5) and realm `gh-guests` in Keycloak (KEYCLOAK-SETUP §13).

## Test

```bash
cd ERP_DEV/services/guest-service && ./mvnw -B -q test
```

`GuestProvisioningTest` (9 tests) runs against a real PostgreSQL (Testcontainers) with a fake Keycloak. The real Keycloak flow (welcome email → set password once → signed in) is tested in `infra/keycloak-extensions/gh-member-activation` (`ActivationFlowIT`).
