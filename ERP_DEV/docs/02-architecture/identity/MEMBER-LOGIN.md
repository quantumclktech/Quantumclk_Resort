# Member login: welcome email, set the password once, arrive signed in

Customers of the Golden Hills Privilege Club (Gold Members, SOW ERP-05). Decisions D-119…D-122 (2026-11-16, Ashish). This **supersedes D-114** (password pass-through) for guests and members. Staff login is unchanged ([AUTHENTICATION.md](AUTHENTICATION.md), realm `gh-staff`).

## 1. The customer journey

1. A Sales Executive registers the customer in the staff ERP; an Admin or Manager verifies the payment ([membership.md](../../04-modules/membership.md)).
2. On verification, access-service asks **guest-service** for the customer's account. guest-service creates it in the Keycloak realm **`gh-guests`**, with **no password**, required action *Update password*, and attribute `membershipId`.
3. guest-service asks our Keycloak extension to send the **welcome email**. Keycloak sends it through the realm's SMTP server (the configured `SMTP_*`; Ashish's Google SMTP in dev). The email shows the name, **Member ID GRH-LM-####**, the validity date and one button, *Set your password*. **No password is ever in an email.**
4. The button opens `https://<public host>/member/activate?t=<one-time token>` on the landing page. The page starts a normal **Authorization Code + PKCE** sign-in with Keycloak and adds the token as the extra parameter `activation_token`.
5. Keycloak's first sign-in step (`gh-member-activation`) accepts the token. It recognises the member, marks the email verified (they clicked a link sent to it), and shows Keycloak's own **Update password** page.
6. The member types the new password **once**. Keycloak completes the sign-in and redirects to the landing page with an authorization code. keycloak-js exchanges it for tokens, and the member **is signed in** and sees their Gold card. There is no second login.
7. They stay signed in, also after closing the browser, for up to 30 days (§8). After that, or on another device or browser, they sign in with the **email they gave the Sales Executive** and their password on Keycloak's page (from `/login`, `/profile` or `/membership`). The same account works for the future mobile app and customer web app: each gets its own public PKCE client in `gh-guests`.

Proved end to end on Keycloak 26.8.2 by `infra/keycloak-extensions/gh-member-activation/src/test/.../ActivationFlowIT.java` (5 tests, real Keycloak + Mailpit).

## 2. Why a Keycloak extension

Keycloak's built-in "execute actions" email lets someone set a password, but it ends on an *Account updated* page **without** a session, so the member would have to sign in again. That breaks D-122. The extension keeps every credential inside Keycloak:
- the password is typed only on Keycloak's page;
- tokens are issued only by Keycloak's normal code flow;
- our services never see a password or a token secret.

## 3. The one-time token

| Property | Value |
|---|---|
| Format | `<Keycloak user id>.<43 characters base64url>` (32 random bytes) |
| Stored | only `SHA-256(secret)` and the expiry, as user attributes `gh_activation_hash`, `gh_activation_exp` (not editable through the admin API, user profile policy `ADMIN_VIEW`) |
| Lifetime | 72 hours by default (`lifespanHours`, at most 168) |
| Use | single use: deleted the moment it is accepted; an expired one is deleted when tried |
| Resend | issues a new token; the old one stops working |
| Comparison | constant time |
| Invalid / used / expired | the step does nothing, and the member sees the normal sign-in page |

## 4. Pieces and where they live

| Piece | Where | What it does |
|---|---|---|
| Realm `gh-guests` | `infra/keycloak/gh-guests-realm.json` | Registration, email as username, verify email, remember-me, brute-force protection, password policy as for staff, sessions 7 d idle / 30 d max (Q-034), themes `golden-hills`, user profile with `membershipId` |
| Client `guest-web` | same file | Public, **PKCE S256 required**, standard flow only. Redirects only to `/login`, `/member/activate`, `/membership`, `/profile`, `/plan-ahead` and exactly `/silent-check-sso.html` (the silent session check; without it every page load waits forever, D-130) on `LANDING_PUBLIC_URL` and on localhost:3000. Audience `guest-api`. Its browser flow is overridden by `gh-member-browser` |
| Flow `gh-member-browser` | same file | `gh-member-activation` → `auth-cookie` → username/password form (all ALTERNATIVE). Keycloak's standard flows stay as they are |
| Client `guest-service` | same file | Confidential, service account with realm-management `manage-users`, `view-users`, `query-users` only. Default scopes include **`kc-admin-api`**: Keycloak 26.8 refuses Admin API calls (401) without that audience |
| Extension `gh-member-activation` | `infra/keycloak-extensions/gh-member-activation` | Authenticator (accepts the token) + `POST /realms/gh-guests/gh-activation/users/{id}/send` (issues the token, sends the email) + email theme (`gh-welcome.ftl`) + login theme (Golden Hills colours) |
| guest-service | `services/guest-service` (:8092, `guest_db`) | `POST /internal/guests/provision`, `POST /internal/guests/{id}/resend` (called by access-service), `GET /api/v1/portal/me` |
| Landing page | `landing-page/src/app/guest-auth.ts`, `member/activate`, `guest-session.ts` | keycloak-js PKCE sign-in, the activation hand-off, the member session ([membership.md](../../04-modules/membership.md) "Landing page") |
| access-service | `membership` package | After verify: provision + welcome; `POST /api/v1/admin/memberships/{id}/resend-welcome`; stores `guest_user_id`, `account_status` |

## 5. Security rules

- **The send endpoint** needs a gh-guests token with `realm-management manage-users`. The link must point at an origin listed in `guest-web`'s web origins, otherwise 400, so it can't become a phishing link.
- **guest-service `/internal/**`** accepts only a **gh-staff** token with aud `erp-api` and permission `guests.provision`. Only access-service's service account holds it (KEYCLOAK-SETUP §5.5). The gateway doesn't route `/internal`.
- **guest-service `/api/v1/portal/**`** accepts only a **gh-guests** token with aud `guest-api`. A token from the other realm gets 401.
- **No id in the path:** a member can only read their own data.
- **Verification is never undone by an email or identity failure.** The membership stays ACTIVE with `account_status = INVITE_FAILED`, and **Resend welcome email** in the verification queue fixes it.
- **Keycloak marks its cookies `Secure`.** Browsers send them to `http://localhost` and over HTTPS (ngrok), so sign-in works in both. Plain HTTP on a LAN IP does not work (no secure context for PKCE; see KEYCLOAK-SETUP §1.1).

## 6. Account status (access_db `resort_member.account_status`)

| Value | Meaning | Shown in the ERP |
|---|---|---|
| `NOT_PROVISIONED` | Not verified yet, or never attempted | "Not created yet" |
| `INVITE_SENT` | Account created, welcome email sent | "Welcome email sent — waiting for the customer to set a password" |
| `INVITE_FAILED` | guest-service, Keycloak or SMTP failed | "Welcome email failed — resend it" + button |
| `ACTIVE` | The member has used the portal (set by the portal API, S4) | "Customer has signed in" |

## 7. Configuration

| Name | Where | Meaning |
|---|---|---|
| `KC_GUEST_SERVICE_CLIENT_SECRET` | `.env` → Keycloak import + guest-service | guest-service's client secret (random) |
| `LANDING_PUBLIC_URL` | `.env` → Keycloak import + guest-service | Public landing-page origin: redirect URIs, web origins, the email link (`<origin>/member/activate`) |
| `GUEST_SERVICE_URL` | access-service | Default `http://localhost:8092` |
| `GUEST_DB_PASSWORD` | `.env` → Postgres init + guest-service | `guest_svc` login |

## 8. Staying signed in and signing in again (D-127…D-129)

| What | How |
|---|---|
| After the welcome link | The activation step marks the session "remember me", so Keycloak's cookie has a lifetime and survives closing the browser |
| Normal sign-in | The Golden Hills page shows **Keep me signed in**, ticked by default (theme script `keep-signed-in.js`); a member can untick it on a shared device |
| Lifetimes | Remember-me sessions: idle 30 days, max 30 days (realm `ssoSessionIdleTimeoutRememberMe` / `…MaxLifespanRememberMe`; Q-034 placeholder) |
| Back on the site | keycloak-js checks the Keycloak session silently (hidden frame returning to `/silent-check-sso.html`, same origin) and gets new tokens; tokens stay in memory only. If the check hasn't answered after 8 s the visitor is treated as signed out; **Sign in** never waits for it (D-130) |
| Another browser | Gmail and other mail apps open links in their own browser with separate cookies. In Chrome or Safari the member signs in once with email + password |
| Where the password is typed | Only on Keycloak's page (D-129). No password grant |
| Keycloak down | "We could not reach the sign-in service" on our page (the reachability check in `guest-auth.ts`), not an error page |
| Records | Keycloak keeps sign-in events (LOGIN, LOGIN_ERROR, UPDATE_PASSWORD, ...; 90 days) in its database. guest_db `guest_account` keeps status, email_verified and the sign-in record; `audit_event` gets `GUEST_SIGNED_IN` once per Keycloak session (token `sid`). No passwords, tokens or IP addresses in our databases (D-128) |

Building and loading the extension, importing the realm into an existing Keycloak, and the `guests.provision` permission: [KEYCLOAK-SETUP §5.5, §13](KEYCLOAK-SETUP.md).
