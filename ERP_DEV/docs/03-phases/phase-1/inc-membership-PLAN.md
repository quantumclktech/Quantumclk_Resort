# Increment "Gold Membership" — plan (approved 2026-11-16 by Ashish)

SOW: ERP-05 Membership & Loyalty. Decisions D-116…D-125, open questions Q-030…Q-037. Status: approved; S0 done (commits 9a58edb…f22f828); S0b next.


## Context
Sales Executives sign up Gold Members on site and collect payment by Cash, Card or Scan QR (with a screenshot from the camera or gallery). An Admin or Manager verifies the payment. The customer then gets **one welcome email** and sets a password **once**. Right after that they are **signed in automatically** on the landing page and see their Gold Membership folio. No second login, and no password ever sent by email.

The same Keycloak identity (realm `gh-guests`) must later work for the mobile app and the customer web app too.

SOW basis: **ERP-05 Membership & Loyalty** (member registration and enrolment, membership ID generation, validity, benefits, member dashboard, transaction history, membership portal).

### Owner decisions (2026-11-16, logged as D-entries when work starts)
| # | Decision |
|---|---|
| a | Membership IDs come from the client series **GRH-LM-0101 … GRH-LM-5100** (`LM Mem ID.xlsx`, `Loyalty_Voucher_Numbers_5000.xlsx`). The ID is assigned when the registration is saved, with no gaps. |
| b | This increment goes **before** increment 2 (leads). It reverses phase1_plan §7 ("payment-screenshot upload deferred; Sales Exec no payment access"). This is a recorded plan change. ERP-05 is in the SOW, so it is not a CR. |
| c | **ADMIN + MANAGER** verify or reject. Nobody can verify a registration they enrolled themselves. |
| d | Customer login uses **Authorization Code + PKCE** against Keycloak `gh-guests`. This **supersedes Q-003/D-114** (password pass-through). The ERP never sees guest passwords. |
| e | Membership records, payments and APIs live in **access-service / access_db**. A **thin guest-service** owns guest identity provisioning. Membership data is not duplicated in guest_db. |
| f | **Email only**, through the configured SMTP (the owner's Google SMTP via `SMTP_*`). One Golden Hills-themed welcome email that Keycloak sends. |
| g | **Fully automatic login after password setup** (no second login). |
| h | UI: keep every existing feature. The login form keeps its layout, but Sign In sends the user to Keycloak with the email pre-filled. OTP and Booking-ID tabs stay visible as "Coming soon". The fake offline login is removed. The amenities panel is read from config (marked TBC). The ledger uses `membership-data.ts`. The per-voucher redeem QR is deferred. |
| i | **One public ngrok HTTPS domain for everything, split by path** (`weaponless-…ngrok-free.dev`): landing at `/`, staff ERP at `/erp/`, Keycloak at its existing `/realms` + `/resources`, API at `/api`. See "Public URL layout" below. |

## Public URL layout: one ngrok domain, split by path (current setup checked first)

**What exists today (inspected):**
- ngrok → Vite `:5173`. Vite proxies `/realms` and `/resources` → Keycloak `:8081`, and `/api` → gateway `:8082` (`web/vite.config.ts`).
- Keycloak serves at the root (no `/auth`). `KC_HOSTNAME=${KC_PUBLIC_URL}`, `KC_PROXY_HEADERS=xforwarded`. The issuer is `https://<domain>/realms/gh-staff`.
- Realm `erp-web`: redirect URIs `${ERP_WEB_ORIGIN}/*`, web origins `${ERP_WEB_ORIGIN}`, post-logout `${ERP_WEB_ORIGIN}/*`.
- access-service sends the staff invite email with `redirect_uri = erp.web.origin + "/"`.
- `web/src/auth.ts` uses `window.location.origin + "/silent-check-sso.html"` and logout → `origin + "/"`.
- Gateway CORS allows only localhost. Same origin through the proxy, so CORS is not needed.
- Landing page: no `api`, `erp`, `realms` or `resources` routes, so no path clashes. `next.config.ts` is empty.

**Target routing.** A small reverse proxy, **Caddy** (new pinned Docker image `caddy:2.x` in `infra/docker-compose.yml`, port `127.0.0.1:8088`), with config in `infra/proxy/Caddyfile`. ngrok then points at the proxy: `ngrok http 8088 --url=<existing domain>`. The proxy forwards websockets too, so hot reload (Vite and Next) keeps working.

| Public path | Goes to | Notes |
|---|---|---|
| `/realms/*`, `/resources/*` | `keycloak:8081` | unchanged paths, so issuer, tokens, cookies and email links stay the same |
| `/api/*` | gateway `host.docker.internal:8082` | same origin for both apps; no CORS |
| `/erp`, `/erp/*` | Vite `host.docker.internal:5173` | Vite `base: "/erp/"`; `/erp` redirects to `/erp/` |
| everything else (`/`, `/_next/*`, `/login`, `/member/activate`…) | Next `host.docker.internal:3000` | landing page at the root |

I chose Caddy over ngrok's traffic-policy routing because it behaves the same locally and through any tunnel, and it doesn't depend on ngrok plan features.

**Changes needed (nothing removed):**
1. **Staff ERP (`web`)**
   - `vite.config.ts`: `base: "/erp/"`. Keep the existing `/realms`, `/resources` and `/api` proxies, so direct `http://localhost:5173/erp/` still works without Caddy. Add the HMR path under the base.
   - `auth.ts`: silent-check-SSO and logout URLs use `origin + import.meta.env.BASE_URL` (`/erp/`).
   - Check `index.html` and public assets under the base.
   - The hash routes (`#employees`) are unaffected.
   - `.env.example`: public mode sets `VITE_API_URL` and `VITE_KEYCLOAK_URL` to the one public URL.
2. **Keycloak `gh-staff` (no blind change)**
   - The current `erp-web` redirect `${ERP_WEB_ORIGIN}/*` already covers `/erp/*`, and web origins (origin only) are unchanged. **No change is needed for login to keep working.**
   - Before anything else, I'll read the *live* realm (read-only `kcadm get clients`), because the realm already exists and the JSON import doesn't re-apply. I'll show you the result.
   - **Optional hardening (only on your OK):** narrow `erp-web` redirect and post-logout to `${ORIGIN}/erp/*`, in both the live realm (kcadm) and the JSON.
3. **access-service**: new setting `erp.web.url` (`ERP_WEB_URL`, default `http://localhost:5173/erp/`). It's used as the invite `redirect_uri`, so staff land on `/erp/` and not on the landing page. `ERP_WEB_ORIGIN` stays origin-only for web origins.
4. **Landing page**
   - `next.config.ts`: `allowedDevOrigins: [<ngrok host>]` (Next dev blocks cross-origin dev assets otherwise).
   - No `/api` rewrite is needed behind Caddy. A rewrite is kept for plain `localhost:3000` dev.
   - keycloak-js points at the same origin (`NEXT_PUBLIC_KEYCLOAK_URL` = public URL).
5. **Keycloak `gh-guests` (new realm, S3)**
   - `guest-web` redirect URIs are limited to `${PUBLIC_URL}/login*`, `/member/activate*` and `/plan-ahead*`, plus localhost:3000 equivalents. Web origin is `${PUBLIC_URL}`.
   - The activation email link is `${PUBLIC_URL}/member/activate?t=…` (root landing page).
6. **Env**: one `PUBLIC_URL` in `ERP_DEV/.env` drives `KC_PUBLIC_URL`, `KEYCLOAK_URL`, `ERP_WEB_ORIGIN`, `ERP_WEB_URL` (`=PUBLIC_URL/erp/`) and `LANDING_PUBLIC_URL`. Each variable is documented in `.env.example` and KEYCLOAK-SETUP §1.1 (updated for the new layout and the Caddy step).
7. **Cookies and sessions**
   - Keycloak cookies are scoped `/realms/<realm>/`, so staff and guest sessions on the same domain don't collide.
   - Tokens stay in memory in both SPAs.
   - The ngrok "Visit Site" interstitial now appears once per 7 days for the whole domain.

**Verification for the URL layout** (phone on mobile data plus desktop, all through the one ngrok URL):
- `/` loads the landing page; `/erp/` loads the staff ERP.
- Staff sign in, refresh, sign out, and get back to `/erp/`.
- Staff invite email → set password → lands on `/erp/`.
- Employees screen API calls work.
- Customer activation link → set password once → `/login` signed in with the Gold folio.
- Hot reload works for both apps.
- `curl -sI` checks for each path prefix are recorded in DEVLOG.

**Order:** this layout is done **first, as its own slice (S0b)**, right after housekeeping and before membership. The existing staff ERP is proven to still work under `/erp/` before anything else changes.

## How auto-login works (the key design)
Keycloak's built-in "execute-actions" email ends on an "Account updated" page and leaves no session, so it can't meet decision g. We add one small **Keycloak extension (SPI jar)** to the realm, `gh-member-activation`. It has two parts.

1. **Activation email endpoint** (realm REST resource, needs `manage-users`). `POST /realms/gh-guests/gh-activation/users/{id}/send`. It:
   - makes a 256-bit random token;
   - stores only its **SHA-256 hash and expiry (72 h, configurable)** as user attributes;
   - sends the **themed welcome email through Keycloak's own mailer** (realm SMTP = `SMTP_*`). The email shows name, **Member ID GRH-LM-####**, validity, and the link `https://<landing>/member/activate?t=<userId>.<token>`.

   The raw token never leaves Keycloak except inside the email.
2. **Activation authenticator** in a custom browser flow, bound to client `guest-web` only. The landing page `/member/activate` starts a normal **PKCE** login and passes `activation_token`. Keycloak keeps extra request params as `client_request_param_*`. The authenticator:
   - checks the hash in constant time, plus expiry and single use, then deletes it;
   - sets the user and marks the **email as verified** (clicking the link proves the address);
   - leaves the `UPDATE_PASSWORD` required action, so Keycloak shows the set-password page **once**.

   The flow then completes and redirects to the landing page with an auth code, and keycloak-js swaps it for tokens. The member is **signed in and sees the folio**.

   An invalid, used or expired token falls back to the normal Keycloak sign-in page (with the email pre-filled when known). The Verification Queue gets a **Resend welcome** action that issues a new token and invalidates the old one.

**Spike first (S3, about half a day):** prove this works on Keycloak 26.8.2 with Testcontainers before building the screens.

```
SE (ERP) ─POST multipart─► gateway ─► access-service: save proof (SHA-256), member PENDING_VERIFICATION, audit
Mgr (ERP) ─verify─► access-service: ACTIVE, valid 12 m, audit ─internal─► guest-service:
      create gh-guests user (attr membershipId, required action UPDATE_PASSWORD) ─► SPI send ─► SMTP welcome email
Customer: email link ─► landing /member/activate ─PKCE + activation_token─► Keycloak (set password once)
      ─code─► landing (keycloak-js) ─Bearer─► gateway ─► access-service GET /api/v1/portal/membership/me (by JWT sub)
```

## Slices (each one runs end to end and is verified before the next; tests first for logic)

### S0 — Housekeeping (each commit separately approved)
1. Propose grouped commits for the pending work: (1) HTTPS/mobile access, (2) role-card start screen, (3) docs/logs. The **hard-delete employee** feature stays uncommitted until the owner decides.
2. `git fetch origin`. Take only `landing-page/` from the newest `origin/Ritvik-Frontend` (`git checkout origin/Ritvik-Frontend -- landing-page`) and keep the local `view-on-map.tsx` fix. Show the diff, then a separate commit approval.
3. Branch `feature/phase1-membership` from `feature/phase1-fresh-start`.
3b. **S0b, one domain split by path** (see "Public URL layout"): Caddy, ERP under `/erp/`, `ERP_WEB_URL`, read-only check of the live realm, then a phone test. Presented and committed on its own before S1.
4. Write `docs/03-phases/phase-1/inc-membership-PLAN.md` (this plan). Add DEVLOG/DECISIONS entries a–i, RESOURCES_LOG (the two xlsx with sha256), TRACEABILITY (ERP-05 rows), and OPEN_QUESTIONS (new Q list below).

### S1 — Database & membership core (access-service)
- `V2__gold_membership.sql` (Flyway, access_db). Based on the pasted DDL, with these changes:
  - **`membership_number_counter`** (single row, `SELECT … FOR UPDATE`, next = 101, max = 5100). It is gapless and formatted `GRH-LM-%04d`. Running out returns a clear 409.
  - `resort_member`: `mobile` is E.164. **Partial unique** indexes on email and mobile `WHERE status <> 'REJECTED'`, so a rejected person can register again. New columns: `guest_user_id UUID UNIQUE` (Keycloak gh-guests sub) and `account_status` (NOT_PROVISIONED / INVITE_SENT / INVITE_FAILED / ACTIVE), plus `@Version`.
  - `member_payment`: `amount NUMERIC(12,2) CHECK > 0`. `transaction_id` is required for CARD (CHECK). Proof is required for SCAN_QR (service rule + CHECK).
  - **No separate `member_audit_log`.** We reuse the existing append-only `audit_event` table (UPDATE/DELETE blocked by triggers). `AuditLog.record` gains an `entityType` parameter in place of the hard-coded `'EMPLOYEE'`. This is stronger than the pasted plan and is the same pattern.
- Entities and repos: `membership/ResortMember`, `MemberPayment`, `MembershipRepository`, `MembershipService`, `MembershipController`.
- `ProofStorage`:
  - dir `erp.membership.proof-dir` (default `./data/membership-proofs`, gitignored);
  - accepts JPEG/PNG/WebP only, checked by **magic bytes**, max 5 MB;
  - stored file name is a UUID (never the user's file name); records the SHA-256;
  - streams with `nosniff` and `Content-Disposition: inline`.
- Permissions (new `erp-api` client roles in `infra/keycloak/gh-staff-realm.json`):

  | Permission | Roles |
  |---|---|
  | `memberships.register` | SE, MANAGER, ADMIN |
  | `memberships.read_own` | SE |
  | `memberships.read_all` | MANAGER, ADMIN |
  | `memberships.verify` | MANAGER, ADMIN |

  `MeController` adds the `"memberships"` module.
- Endpoints (the existing `/api/v1/admin/**` route already covers the admin ones):
  - `GET /api/v1/sales/memberships/next-number`: provisional preview, labelled as such.
  - `POST /api/v1/sales/memberships`: multipart, honours an `Idempotency-Key` through the existing `idempotency_key` table. Returns 201 with the membershipId.
  - `GET /api/v1/sales/memberships?mine`
  - `GET /api/v1/admin/memberships?status=PENDING_VERIFICATION` (with count for the badge)
  - `GET /api/v1/admin/memberships/{id}`
  - `GET /api/v1/admin/memberships/{id}/proof`: verifiers. An SE can fetch the proof only for their own registration, through `/sales/memberships/{id}/proof`.
  - `POST /api/v1/admin/memberships/{id}/verify`: becomes ACTIVE with `valid_from = now` and `valid_until = now + erp.membership.gold.validity (P12M)`; payment becomes VERIFIED; audit entry; then guest provisioning (S3). Provisioning failure leaves the membership ACTIVE with `account_status = INVITE_FAILED` and a retry, the same pattern as employee `INVITE_EMAIL_FAILED`.
  - `POST …/{id}/reject {reason}` (reason required); `POST …/{id}/resend-welcome`
- Tests first:
  - gapless numbering under concurrency;
  - partial uniqueness;
  - payment conditional rules;
  - file type and size limits and the hash;
  - RBAC: SE → admin = 403; SE cannot read others' records (404); no self-verify;
  - audit entries;
  - verify/reject state machine (only from PENDING_VERIFICATION).

### S2 — Gateway
- Raise `RequestSize` to 6 MB **only** on a `POST /api/v1/sales/memberships` route.
- Add routes: `/api/v1/sales/**` and `/api/v1/portal/membership/**` go to access-service; `/api/v1/portal/me` goes to guest-service.
- `SecurityConfig` becomes **multi-issuer** (`JwtIssuerReactiveAuthenticationManagerResolver`): `gh-staff` for staff paths, `gh-guests` for `/api/v1/portal/**`. A guest token on a staff path → 401, and the reverse too (tests).

### S3 — Keycloak `gh-guests` + activation SPI + thin guest-service (starts with the spike)
- `infra/keycloak/gh-guests-realm.json`:
  - login with email; self-registration on (for the existing Register tab); verify email; brute-force protection; password policy as in Q-026;
  - SMTP from `SMTP_*`;
  - session lengths are placeholders (idle 7 d, max 30 d, remember-me), see Q;
  - client **`guest-web`**: public, standard flow only, **PKCE S256 required**, redirect URIs and web origins for `http://localhost:3000` + `${LANDING_PUBLIC_URL}`, browser-flow override = activation flow;
  - client **`guest-service`**: confidential, service account with `manage-users` / `view-users` in this realm only;
  - user-profile attribute `membershipId` (admin-editable only).
- `infra/keycloak/providers/gh-member-activation/`: Maven module with the realm resource (send) and the authenticator (consume). Login theme `golden-hills`: CSS/logo from the existing landing-page assets. Email template `gh-welcome.ftl`.
- `docker-compose.yml`: mount `providers/target/*.jar` → `/opt/keycloak/providers`, and themes → `/opt/keycloak/themes`. `start-dev` builds providers automatically. `--import-realm` imports the new realm on the next start (staff realm untouched).
- `services/guest-service` (:8092, `guest_db`, Spring Boot, same stack/layout as access-service):
  - `POST /internal/guests/provision {email, names, mobile, membershipId}` → create or find the gh-guests user, then call SPI send, then return `guestUserId`. Auth: gh-staff client-credentials token from access-service with permission `guests.provision`. Not routed by the gateway.
  - `GET /api/v1/portal/me` → the guest's own profile from their token.
  - `guest_db`: `guest_account` (keycloak_user_id, email, status, timestamps), `audit_event`, `idempotency_key`. **No membership data.**
  - `infra/postgres/init` adds `guest_db` and `guest_svc`.
- Tests: SPI unit tests (hash, expiry, single use), plus a Testcontainers Keycloak test with the provider loaded: send → read the token from the captured email → PKCE flow → set password → code issued (proves auto-login); guest-service provisioning with a fake Keycloak.

### S4 — Portal membership API (access-service)
- `GET /api/v1/portal/membership/me`: finds the member by JWT `sub` = `guest_user_id`. There is **no id in the path**, so a customer can't reach another customer's record.
- Returns name, membershipId, tier, status, validity and enrolling executive: name, employee username, and WhatsApp/phone **only if that employee opted in to WhatsApp**, otherwise the resort desk.
- A second `SecurityFilterChain` handles `/api/v1/portal/**` with the gh-guests issuer.
- Tests: a staff token gets 401; a guest without a membership gets 404 `{member:false}`; a guest can't see another guest's membership.

### S5 — Staff ERP: `web/src/Memberships.tsx` (+ test), following the `Employees.tsx` pattern
- `api.ts`: when the body is `FormData`, don't set `Content-Type` (the browser sets the multipart boundary).
- **Register form:**
  - customer fields (first/last name, DOB, mobile +91, email, address);
  - brass Member ID tag labelled "provisional";
  - Gold badge (12 months, 180 privileges);
  - payment pills Cash / Card / Scan QR with conditional fields;
  - **UPI QR from config** (`VITE_UPI_QR_URL`), showing "QR not configured" until the client supplies it;
  - proof: **Choose from gallery** and **Open camera** (`accept="image/*" capture="environment"`), preview with Remove / Replace / Retake, and resizing to at most 2000 px in the browser before upload;
  - read-only executive card from `/me` (name, username, today's date).
- **My Members** table (SE).
- **Verification Queue** tab with a badge count (ADMIN/MANAGER): detail drawer, proof lightbox with zoom, Verify & Activate, Reject (reason required), Resend welcome.
- `App.tsx`: `MODULE_LABELS.memberships`, nav entry and page switch. Nothing existing is removed.

### S6 — Landing page (read `node_modules/next/dist/docs/` first, as landing-page/AGENTS.md requires)
- Add `keycloak-js` (same version as web; approved under Q-023). New `src/app/guest-auth.ts`:
  - `init({onLoad:'check-sso', pkceMethod:'S256', checkLoginIframe:false})`;
  - **tokens kept in memory and refreshed** (no tokens in localStorage);
  - `portal-client.ts` takes the Bearer from it; `ghr_portal_user` keeps only display info.
- `next.config`: `allowedDevOrigins` (done in S0b), plus a rewrite of `/api/:path*` → `GATEWAY_URL` for plain localhost dev (Caddy handles `/api` on the public URL). `NEXT_PUBLIC_LEAD_API_URL` defaults to `/api/v1/portal`. New `NEXT_PUBLIC_KEYCLOAK_URL`, `NEXT_PUBLIC_KEYCLOAK_REALM=gh-guests`, `NEXT_PUBLIC_KEYCLOAK_CLIENT=guest-web`.
- New `/member/activate` page: reads `t`, builds the keycloak-js login URL, appends `activation_token`, redirects. The redirect target is `/login`.
- **`login-portal.tsx` changes** (layout kept):
  - **Password tab:** email field plus "You'll enter your password on the secure Golden Hills sign-in page"; Sign In → `keycloak.login({loginHint: email})`.
  - **Register:** goes to Keycloak registration.
  - **OTP / Booking ID tabs:** visible, disabled, "Coming soon".
  - **Fake offline logins:** removed (a clear error instead).
  - **Forgot password:** goes to the Keycloak reset page.
  - **Quick-demo buttons:** kept; they fill the email only.
- New `member-folio.tsx`, shown after sign-in when `/portal/membership/me` returns a member. Non-members keep today's success card.
  - `MembershipCard`: gets **optional** `name` / `memberId` props (the marketing page call doesn't change).
  - Status panel: Active Gold Member · Verified by Resort Management · validity · Book Stay (→ `/plan-ahead` reserve) · Call Desk (existing desk number).
  - Amenities from the new `member-benefits.ts` config, each marked "to be confirmed".
  - Compact ledger from `membershipCategories` (55 vouchers + 125 coupons = 180; available counts only).
  - Concierge card (executive name and username, WhatsApp/Call only when allowed).
- `plan-stay-portal.tsx` folio block: when the guest is a member, show the real tier, ID and voucher count instead of the hard-coded "Privilege Member" / "180". **Proposed:** non-members see "Guest" rather than a member tier they don't hold. Owner to confirm; until then it stays as it is today.

### S7 — Public URLs, end-to-end, docs
- `.env.example`: `GUEST_SERVICE_*` and `NEXT_PUBLIC_*`. Everything public is derived from `PUBLIC_URL` (see "Public URL layout"). Email goes out through SMTP; ngrok is only for app access.
- Docs updated in the same commits:
  - `docs/04-modules/membership.md`
  - `api.md` + OpenAPI
  - `identity/AUTHENTICATION.md` (guest PKCE + activation flow; supersedes D-114)
  - `KEYCLOAK-SETUP.md` (gh-guests, SPI build, ngrok)
  - `ARCHITECTURE.md`, `DAY-ONE.md`, `GLOSSARY.md` (member, voucher, coupon, activation token)
  - `inc-membership-REPORT.md`

## New open questions (logged, with config placeholders until answered)
- Gold fee amount: the SE enters the amount; config holds an expected fee, blank = no check.
- Client UPI QR image and UPI ID.
- Amenity benefits and the 20%/15% discounts.
- Retention of payment screenshots (DPDP, extends Q-022).
- Guest session lengths.
- Exposing an executive's WhatsApp number to members.
- Non-members' "Privilege Member" label on /plan-ahead.
- Ordering of the membership ID series (0101 upward).

## Verification
- `mvn -B verify` for access-service, api-gateway, guest-service and the SPI module (Testcontainers Postgres + Keycloak with the provider).
- `web`: `npm test`, `npm run lint`, `npm run build`.
- `landing-page`: `npm run typecheck`, `npm run lint` (existing errors noted, Q-004), `npm run build`.
- **Live end to end on the phone through ngrok:**
  1. The SE takes a camera screenshot and submits (`GRH-LM-0101` assigned).
  2. The manager inspects the proof and verifies.
  3. The welcome email arrives through the owner's SMTP.
  4. The customer taps the link and sets a password once.
  5. They land on `/login` already signed in, with the Gold folio showing the right name, ID and validity.
  6. A refresh keeps the session.
  7. A second customer can't see the first customer's data.
  8. Reused or expired links fall back to sign-in.
  9. Reject shows the reason in the audit.
- Evidence goes in DEVLOG and the increment report. **Each slice is presented and committed only after the owner approves.**

## S6 amendment (2026-11-16 15:05, owner, after pulling Ritvik's 2c164d9)
Ritvik's latest landing page has its own member area: `/profile` and a personalised `/membership`, driven by `guest-session.ts` with sample data. **We connect these screens to real data instead of building a separate folio.**
- `guest-session.ts` gains a **"member" session kind**: a keycloak-js PKCE session plus `GET /api/v1/portal/membership/me`.
  - `membership` = real number GRH-LM-####, holder, validTo, `used` = 0 everywhere.
  - Note shown: "Redemptions are recorded at the resort; online tracking comes later".
  - The "sample" kind stays exactly as it is today (labelled).
- After the password is set, the activation redirect lands on **`/membership#your-card`**. `/login` stays and links there.
- `ProfileSignIn`:
  - **Email tab:** same look, email field only. Continue → Keycloak with `loginHint`. The fake code step is skipped for real accounts.
  - **Membership ID tab:** keeps Ritvik's labelled sample preview.
- The sample placeholder and hint change from `GHR-CM-0427` to the `GRH-LM-0000` format.
- `/profile` additions (nothing removed): status and validity, amenities from config (TBC), and the concierge card.
- `MembershipCard`: Ritvik already engraves the name. The member number is added the same way.
