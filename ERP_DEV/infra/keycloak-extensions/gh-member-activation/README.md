# Keycloak extension `gh-member-activation`

Lets a new Gold Member, from their welcome email, **set a password once and arrive signed in** on the landing page (Authorization Code + PKCE). There is no second login, and no password is ever in an email (D-121, D-122). Full design: MEMBER-LOGIN.md.

## What is in the jar

| Piece | Id / path | Role |
|---|---|---|
| `ActivationAuthenticator` (+ factory) | authenticator `gh-member-activation` | First step of the realm flow `gh-member-browser`. Accepts the one-time token passed as `activation_token` on the authorization request, marks the email verified, and leaves *Update password*, so Keycloak shows that page once and then completes the code flow |
| `ActivationResource` (+ factory) | `POST /realms/{realm}/gh-activation/users/{id}/send` | Issues a new token (stores only its SHA-256 and expiry) and sends the welcome email. Caller needs realm-management `manage-users`; the link must be on a `guest-web` web origin |
| `ActivationTokens` | — | Token format, hashing, expiry, single use |
| Email theme `golden-hills` | `theme/golden-hills/email` | `gh-welcome.ftl` (HTML + text): name, Member ID, validity, *Set your password* button |
| Login theme `golden-hills` | `theme/golden-hills/login` | Keycloak's standard pages in the Golden Hills colours |

The Keycloak libraries are `provided` (version must equal the Keycloak image, 26.8.2), so the jar contains only these classes and themes.

## Build, load, test

```bash
cd ERP_DEV/infra/keycloak-extensions/gh-member-activation
./mvnw -q package -DskipTests   # → ERP_DEV/infra/keycloak-providers/gh-member-activation.jar (mounted into Keycloak by compose)
./mvnw -B -q test               # ActivationFlowIT: real Keycloak 26.8.2 + Mailpit (Docker), ~100 s
```

After a rebuild, restart Keycloak so it loads the new jar: `docker compose --env-file ERP_DEV/.env -f ERP_DEV/infra/docker-compose.yml restart keycloak`.

`ActivationFlowIT` proves:
- the welcome email (subject, Member ID, validity) → the *Update password* page directly → one submit → redirect with a code → PKCE token for that member (`email_verified`, aud `guest-api`);
- the link works once;
- the password then works for a normal sign-in;
- forged or replaced links are refused;
- the send endpoint's 401 / 400 / 404 cases;
- guest-service can't do more than manage users;
- the realm keeps Keycloak's standard flows.
