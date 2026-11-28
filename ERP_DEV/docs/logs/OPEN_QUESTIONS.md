# Open Questions (append-only; answers are added below each question)

Earlier questions: `archive/hotel-draft:ERP_DEV/docs/logs/OPEN_QUESTIONS.md`.

| ID | Question | Blocks | Default until answered |
|---|---|---|---|
| Q-001 | The resource folder moved to `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce`. Confirm it is the official one, and update the erp-prp skill path | Rule compliance | Used read-only (D-110) |
| Q-002 | Is this AI coding assistant approved under Engineering Playbook §2.3 for the client documents it has read? | Compliance | Ashish to confirm |
| **Q-003** | **Guest identity:** the unchanged landing page posts the guest password to `/api/v1/portal/auth/register` and `/login` and expects a `token`. The Blueprint forbids an ERP password store. Options: **(A)** guest-service passes these calls through to the Keycloak realm `gh-guests` (Admin API to create the user; password grant to log in). No landing-page change, but it uses the deprecated password grant. **(B)** change the landing page to redirect to Keycloak (PKCE), which breaks "landing page unchanged". **(C)** keep a guest password table, which violates the Blueprint. Recommendation: A now, B later | Increment 2 | — (blocked) |
| Q-004 | The landing page has 4 lint errors (already there). Fix them (this changes the landing page) or leave them? CI runs typecheck + build only | CI lint | Not linted in CI |
| Q-005 | (BP §19.1) Allow anonymous inquiries? | Inc 2 | Allowed (the landing page already allows them), with stricter rate limits |
| Q-006 | (BP §19.2) Email, mobile or both mandatory at guest registration? | Inc 2 | As the landing page form does today |
| Q-007 | (BP §19.3) Guest verification channel? | Inc 2 | Email (Keycloak). SRS §11.2: the client excludes SMS |
| Q-008 | (BP §19.4) Final inquiry categories and fields? | Inc 2 | Room inquiry only (current form). SRS §3.2 also asks for an Event Enquiry Form (banquets/weddings/corporate) |
| Q-009 | (BP §19.5) Five-minute claim SLA confirmed? | Later inc | Configurable |
| Q-010 | (BP §19.6) First escalation recipient? | Later inc | — |
| Q-011 | (BP §19.7) Voice escalation provider approved? | Later inc | Off |
| Q-012 | (BP §19.8) WhatsApp Business API provisioned and approved? | Later inc | Off |
| Q-013 | (BP §19.9) Consent wording and privacy policy? | Inc 2 | — |
| Q-014 | (BP §19.10) Approved public content? | Landing page | As-is |
| Q-015 | (BP §19.11) Is CMS editing in Phase 1, and who publishes? | CMS | Not in Phase 1 |
| Q-016 | (BP §19.12) Hosting budget and availability target? | Deployment | — |
| Q-017 | Other employee fields ("other required information"): staff code, joining date, department? | Inc 1 schema | Only the fields listed in AUTHENTICATION §4 |
| Q-018 | Branded Keycloak login and email theme (client-approved assets only)? | Polish | Keycloak default theme |
| Q-019 | Session lengths: idle 30 min / max 10 h. OK? (SRS §10: 8-hour shift, 8–9 h window) | Inc 1 | As proposed |
| Q-020 | Spring Boot 3.2.5 and Keycloak 24 are past their support windows. Upgrade to the current supported releases (same products) at the start of increment 1? | Inc 1 | Keep as-is (Ashish: "same stack") |
| Q-021 | Keycloak TOTP (built-in MFA) required for ADMIN accounts? | Inc 1 | Off |
| Q-022 | Retention for employee data, audit logs, Keycloak events and guest data (DPDP)? | Inc 1 | Events 90 days; audit kept |
| Q-023 | Approve the new dev/test tools: Testcontainers (+ Keycloak module), Mailpit container, ShedLock (or plain SQL locking) | Inc 1 | Not added |
| Q-024 | SMTP provider, sender address/domain, reply-to, SPF/DKIM/DMARC owner | Inc 1 (staging) | Mailpit in dev |
| Q-025 | Production hostnames (ERP, identity, API) | Deployment | — |
| Q-026 | Password policy: 12+ characters, not username/email, last 3 not reused. OK? | Inc 1 | As proposed |
| Q-027 | Client approval of CR-001 (Sales role not in SOW §22). Which client designations get SALES_EXECUTIVE: Reservation Desk Associates, Marketing Executives (SRS §10)? MANAGER vs a separate SALES_SUPERVISOR? | Scope | MANAGER holds the supervisor permissions |
| Q-028 | Long-term owner of employee records: access-service now, or HR & Workforce later? | Later | access-service |
| Q-029 | Who may onboard and deactivate employees: only ADMIN (= SOW/SRS Super Admin, Owner/MD), or also the GM / HR Manager? SRS §11.1 gives the Resort Manager create/edit/config rights in general | Inc 1 | ADMIN only (least privilege); can be granted to MANAGER per person later via `employees.manage` |

**Answer Q-001 (2026-11-15T11:23:40+05:30, Ashish):** the official resource folder is `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce`. The rules and agent config are updated. D-110 is accepted.

**Answer Q-020 (2026-11-15T11:27:15+05:30, Ashish):** upgrade to the current supported releases of the same products. Exact versions are checked against official release pages at the start of increment 1 (inc1-PLAN §3).
**Answer Q-029 (2026-11-15T11:27:15+05:30, Ashish):** only ADMIN may onboard, activate and deactivate employees. `employees.manage` can be granted to one person later.
**Answer Q-003 (2026-11-15T11:27:15+05:30, Ashish):** option A. guest-service passes `/api/v1/portal/auth/register|login` through to the Keycloak realm `gh-guests` (Admin API to create the user; password grant to log in, on a dedicated guest client only). The landing page stays unchanged; moving it to a Keycloak redirect is a later improvement. The ERP stores no guest passwords.
**Answer Q-023 (2026-11-15T11:30:28+05:30, Ashish):** approved Testcontainers (PostgreSQL), `com.github.dasniko:testcontainers-keycloak`, the Mailpit Docker image and `keycloak-js`. ShedLock and keycloak-admin-client aren't used.

### Added 2026-11-16 (Gold Membership increment, D-116…D-124)
| ID | Question | Affects | Default until answered |
|---|---|---|---|
| Q-030 | Gold membership fee (amount, GST treatment) | Registration form | Sales Executive enters the amount received; no expected-fee check |
| Q-031 | Official resort UPI QR image and UPI ID for the "Scan QR" option | Registration form | "QR not configured" placeholder |
| Q-032 | Member amenity benefits (pools, gym, games lounge, bonfire) and the 20% spa / 15% dining discounts from the draft plan: not in any client document | Member profile | Shown from config, labelled "to be confirmed" |
| Q-033 | Retention period for payment screenshots and member personal data (DPDP; extends Q-022) | access_db, proof files | Kept; no automatic deletion |
| Q-034 | Guest (customer) session lengths in `gh-guests` | Keycloak | Idle 7 days, max 30 days, remember-me on |
| Q-035 | May an enrolling executive's WhatsApp/mobile number be shown to the member? | Member profile | Only when the employee has WhatsApp opt-in; otherwise the resort desk number |
| Q-036 | /plan-ahead shows a hard-coded "Privilege Member" label to every signed-in guest; show "Guest" for non-members? | Landing page | Unchanged |
| Q-037 | Confirm that numbers are issued upward from GRH-LM-0101 and whether any numbers in the series are already used on paper | Membership IDs | Start at 0101 |

### 2026-11-16 update (D-127, D-128)
- **Q-034** placeholder changed: remember-me sessions in `gh-guests` now idle **30 days** (max 30 days); the welcome link and the default-ticked "Keep me signed in" use them. Still to confirm with the client.
- **Q-022 / Q-033** also cover how long Keycloak keeps guest sign-in events (placeholder 90 days) and guest_db sign-in records (kept, no deletion).

### 2026-11-16 (Gold Member smart fields, D-131…D-134)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-038 | Which driving-licence number formats must be accepted (older state formats differ from KA01 20190001234)? | Registration form, `IdentityNumbers` | 2 letters + 2 digits + 9–13 letters/digits |
| Q-039 | Aadhaar/licence: consent wording shown to the customer and how long the masked number and hash are kept (DPDP; extends Q-033) | Registration form, access_db | No consent text; kept with the member |
| Q-040 | **Resource request:** India Post "All India Pincode Directory" CSV (data.gov.in) in the resource folder, for pincode → city/state auto-fill | `web/scripts/build-pincodes.mjs` | Manual city; state dropdown |
- **Q-030** note: quick amount chips read `VITE_GOLD_FEE_CHIPS`; empty (no chips) until the fee is confirmed.

### 2026-11-27 (OTA / channel management, sub-phase 2.1, D-144, D-145) — client requests, SOW §29
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-041 | Which channel manager does the resort use or want (STAAH, eZee Centrix, AxisRooms, SiteMinder, RateGain, none yet)? Subscription is the client's cost (SOW exclusion) | channel-service adapter (2.1-B6) | Mock adapter only |
| Q-042 | **Credentials request:** channel-manager API key/secret, property/hotel ID, webhook signing secret, sandbox access and API documentation link | channel-service config (env/secret store only) | None; mock adapter |
| Q-043 | **Credentials request:** Booking.com extranet access, Hotel ID, and confirmation that connectivity is switched to the chosen channel manager | channel mapping | None |
| Q-044 | **Credentials request:** MakeMyTrip (InGo-MMT) extranet access, Hotel code, and channel-manager connectivity enabled | channel mapping | None |
| Q-045 | Commission % / contract terms per OTA | `commission_rule` | 0%, marked placeholder |
| Q-046 | Payment model per OTA: hotel-collect, prepaid/OTA-collect, or virtual card | `payment_collect_model` | HOTEL_COLLECT |
| Q-047 | Room types and rate plans as sold on each OTA (for mapping); "OTA rates" vs direct; meal plans; taxes | room/rate mapping | Unmapped → NEEDS_REVIEW |
| Q-048 | Cancellation / no-show policy per OTA rate plan (24/48/72 h windows still unsettled) | rate plans | Taken from the OTA booking as sent |
| Q-049 | Overbooking (zero by default? who may override?) and allocation (share all 36 rooms with every channel, or hold back an allotment?) | `inventory_day` | overbook_allowance 0; full shared pool |

### 2026-11-27 (RBAC, sub-phase 2.2, D-146…D-149, CR-002)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-050 | Confirm the role list (incl. CR-002 splits) and the default role → permission matrix in 2.2-rbac-PLAN §5 (Decision Pack §13; see Q-027) | Keycloak realm baseline | §5 proposal |
| Q-051 | Who holds OWNER and ADMIN? Is the GM a MANAGER only? | Role assignment | Owner/MD = ADMIN (as today) |
| Q-052 | Approval thresholds: refund amount, discount %, folio adjustment, cancellation-fee waiver, overbooking override | `approval_policy` | Every refund/adjustment/override needs approval |
| Q-053 | Department list and the supervisor of each | `department` | 2.2-rbac-PLAN §8 list |
| Q-054 | Which roles may see unmasked Aadhaar/licence numbers (DPDP; see Q-039) | `guests.identity_read` | Nobody; masked only |
| Q-055 | May one person hold two roles (e.g. reception + membership on small shifts)? | Role assignment | Yes, multiple realm roles |
| Q-056 | Maximum length of a temporary grant, and who may give one | `temporary_grant` | 7 days; ADMIN only |
| Q-057 | Should OWNER sign in from mobile/remote, or office only? | Session policy | Same as other staff |

### 2026-11-28 (Room Management & Room Status Engine, sub-phase 2.3, D-150…D-153)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-058 | **Resource request:** room list (number, zone/building, floor for all 36), connecting/accessible rooms, features (view, pool, jacuzzi); and the housekeeping status sheet sample asked for on the discovery call | `room`, `room_feature` | Dev seed with made-up numbers 101… |
| Q-059 | Inspection before Ready: confirm ON, and who inspects: HK supervisor or GM/manager only? | `room_setting` | ON; `housekeeping.inspect` = HK supervisor + MANAGER |
| Q-060 | Daily cleaning time, and may guests refuse daily service (DND)? | daily job | 06:00 IST; DND allowed |
| Q-061 | OOO blocks: who may create them, is an end date always required, maximum length? | `room_block` | MANAGER/GM; end date required; no maximum |
| Q-062 | Dormitory (C-14): sold to guests (per bed or as a unit) or staff only? | room master | Not modelled |
| Q-063 | Confirm room mix (Premium Queen 14, Premium Twin 5, Suite 1, Wooden Cottage 12, Private Pool Cottage 4) and max occupancy / extra-bed per type | `room_type` | Website values (2 adults, extra bed ₹600) |
| Q-064 | May a guest be checked in to a room that is not READY with a GM override, or must they always wait in the lounge? | check-in (2.4) | Must wait; GM override allowed and audited |

### 2026-11-28 (Front Office + Housekeeping, sub-phase 2.4, D-154…D-157)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-065 | Check-out 11:00 AM (C-13)? Check-in 12:00? Turnaround time? | `front_desk_setting` | 12:00 in / 11:00 AM out |
| Q-066 | Early check-in / late check-out windows, charges (fixed, % or hourly), who approves a waiver | settings, 2.5 charges | Free if room ready; late check-out needs manager approval; no charge configured |
| Q-067 | **Resource request:** current guest registration form; must an ID scan be kept and for how many days; accepted IDs (voter ID, passport)? | `stay_registration` | Scan optional; 90 days; Aadhaar, DL, voter ID, passport |
| Q-068 | Foreign guests: is Form C submitted today, by whom, which fields? | Form C sheet | Printable sheet, manual FRRO submission |
| Q-069 | No-show rules (paid vs unpaid, one night vs full stay) and night-audit time | night audit | Paid → NO_SHOW, keep charge; unpaid → cancel; 03:00 IST |
| Q-070 | Housekeeping: who assigns (reception/supervisor/both), task types (turndown?), checklist (status sheet), minibar item list + prices, lost & found retention days | `hk_task`, minibar, lost & found | Both assign; types as in plan §4.1; no minibar items; 90 days |
| Q-071 | VIP procedure: who is VIP, amenities, room priority rules | reservation VIP flag | Flag + notes; HIGH HK priority |
| Q-072 | Is bill to company / credit allowed at check-out, for which accounts; who may override an unpaid balance? | check-out | Not allowed except OTA prepaid; GM override only |

### 2026-11-28 (Billing, Payments & Folio, sub-phase 2.5, D-158…D-161)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-073 | GSTIN, legal name, registered address/state; **CA-confirmed GST rates and SAC** per category (room slabs, F&B, spa, facilities, membership fee, cancellation fee); which value decides the room slab; inclusive or exclusive tariffs; does e-invoicing (IRN) apply? Note: hotel GST was restructured in Sept 2025, so the old single-12 % placeholder (C-08) is likely outdated | `tax_rule`, invoices | Sample rates in dev seed only; no live rate |
| Q-074 | **Credentials request:** Razorpay merchant account, API key/secret (test + live), webhook secret, settlement report access | `PaymentGateway` adapter | Mock gateway |
| Q-075 | **Credentials request:** Pine Labs terminal model(s) and count, merchant/store/terminal IDs, cloud integration API docs + credentials, certification contact | `PaymentTerminal` adapter | Mock terminal; manual-record fallback |
| Q-076 | Advance rule per channel/segment (100/50/30 %, C-06) and unpaid online hold length | `advance_policy` | 30 %; hold 30 minutes |
| Q-077 | Cancellation, modification and no-show tiers (C-07; see Q-069) | `cancellation_policy` | Free ≥ 48 h, otherwise one night |
| Q-078 | **Resource request:** invoice sample; invoice prefix/numbering; round-off rule; service charge? | invoice | `GHR/<FY>/000001`; round to rupee; no service charge |
| Q-079 | Cashier shifts per person or per counter; opening float; who approves variances | `cashier_shift` | Per person; float entered at open; MANAGER approves |
| Q-080 | Company accounts: initial list, credit limits, payment terms, who approves new accounts; OTA payout terms | `company_account` | None set up; MANAGER approves; 30 days |
| Q-081 | Refunds to original method only, or cash too? Approval thresholds (see Q-052) | `refund` | Original method; cash only from an open shift with approval; every refund approved |

### 2026-11-28 (Online Booking Engine + Guest CRM, sub-phase 2.6, D-162…D-165)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-082 | Online booking limits (rooms, nights), room types bookable online, child age bands/policy, max guests per room, show "only N left"? | booking engine | 3 rooms, 14 nights, all 5 room types, no dormitory; children under 12; website occupancy values; no "N left" |
| Q-083 | **Resource request:** booking terms, cancellation policy text, privacy policy and consent wording | booking step 6, consent log | Placeholder text marked "to be supplied"; engine stays off in production until supplied |
| Q-084 | Promo codes allowed (C-03)? Which kinds? | promo codes | Off |
| Q-085 | Confirmation email content, branding, sender address/domain (SPF/DKIM), copies to the resort | notification-service | Dev only (Mailpit) |
| Q-086 | May guests change dates online, or desk only? | My bookings | Desk only (change request) |
| Q-087 | CRM preference categories; VIP and "do not accept" flags allowed; marketing consent wording | guest_profile | Categories as in plan §3.1; VIP yes; no "do not accept" flag |
| Q-088 | Retention of guest profiles and communication records; DPDP grievance contact and data-request process | privacy | Kept while active; requests handled by ADMIN |
| Q-089 | **Resource request:** existing guest list to migrate (SOW §29.1), format and fields | migration | None |

### 2026-11-28 (Identity migration Keycloak → Auth0, sub-phase 2.0, D-166…D-169)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-090 | Who owns the Auth0 account (QuantumCLK or resort), which plan, who pays? Not in the SOW budget; check current pricing and plan limits when opening the account | I1 | Dev tenant on the free plan for development only |
| Q-091 | Custom login domain (e.g. `login.<resort-domain>`) and DNS access | Universal Login branding | Default Auth0 domain; basic branding |
| Q-092 | Google Cloud project for "Sign in with Google": owner, consent-screen name/logo, privacy policy URL | Google connection | Auth0 dev keys in the dev tenant only |
| Q-093 | SMTP provider and sender for Auth0's own emails (verify, reset), resort domain with SPF/DKIM | tenant email provider | Auth0 built-in email in dev only |
| Q-094 | Auth0 data region (outside India) and privacy-notice wording for identity data held abroad (DPDP; links to Q-083/Q-088) | tenant region, privacy notice | Region chosen at account opening; no production use before the notice is updated |
| Q-095 | MFA required for ADMIN (and MANAGER)? | staff-db | Required for ADMIN, optional for others |
| Q-096 | Number of real staff and member accounts at switch time; is a "set a new password" email acceptable if hash import fails? | migration (I8) | Yes, reset emails |

### 2026-11-28 (Membership, Loyalty & RFID, sub-phase 2.7, D-170…D-175) — **Q-032 mostly answered** by `GHR_Vouchers_Final.pdf` / `GHR_Coupons_Final (1).pdf` (booklet contents); terms of use still open (Q-098)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-097 | Membership validity: calendar year (as the 2027 vouchers print) or 12 months from joining? Coupons the same period? What about members joining late in the year? | tier, booklet edition | Membership 12 months; 2027 edition Jan–Dec 2027; coupons follow the edition |
| Q-098 | Terms of use per benefit: member only / family / transferable, advance booking for stay vouchers, blackout dates, one per bill, combinable, unused gift-certificate balance, ID/card needed | benefit rules | Member present with card or ID; 48 h for stay vouchers; one per bill per kind; not combinable; no carry-over |
| Q-099 | Is the member no. written/stamped on leaves at issue? Are leaves collected at redemption? | booklet issue, redemption | Written at issue; collected at redemption |
| Q-100 | Value of each complimentary item (liability report) and GST treatment of complimentary items/discounts (CA; see Q-073) | `benefit_kind.value_paise` | No value; liability report shows counts only |
| Q-101 | Points rules (earn, redeem, value per point, expiry, eligible spend), or does the client waive the SOW points lines? | points engine | Off (earn rate 0) |
| Q-102 | Tiers beyond Gold: names, prices, booklets, upgrade rules | tier | Gold only |
| Q-103 | RFID: confirm **NTAG 424 DNA** cards; card artwork/branding, vendor, lead time; replacement fee; card deposit (C-15) | RFID hardware | NTAG 424 DNA; no fee; no deposit |
| Q-104 | Party/banquet vouchers (V8–V13): how are events booked today; is manual redemption against an event reference acceptable (events not in core scope)? | EVENT_BENEFIT | Manual redemption with reference |
| Q-105 | Which facilities need member checks (pool, spa, gym, games)? Member QR on phone acceptable besides the card? | facility verify | Pool, spa, gym; QR accepted |
| Q-106 | Renewal price, new booklet on renewal, grace period after expiry | renewal | Same price as joining (when known); new booklet; no grace period |

### 2026-11-28 (Maintenance, Facilities & Spa, sub-phase 2.8, D-176…D-180)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-107 | **Resource request:** maintenance register/form; categories and trades; in-house technicians per trade | ticket categories | Categories as in plan §2.1 |
| Q-108 | SLA targets per priority (response/resolution), escalation chain, maintenance working hours | SLA settings | P1 15 min/2 h, P2 30 min/4 h, P3 4 h/24 h, P4 24 h/72 h; supervisor → GM; 24×7 clock |
| Q-109 | Vendor list (trade, contact, GSTIN) and quote approval limit | vendors | No vendors; every quote approved by MANAGER |
| Q-110 | Preventive maintenance list and frequencies | PM plans | No plans |
| Q-111 | Guest request types, handling department, wake-up calls needed? | routing | Types in plan §2.1; wake-up calls on |
| Q-112 | Facility list, hours, who may use each, charges, capacity, age/safety rules, which need slots; pool controlled or open to all in-house guests? | facilities | Facilities from the discovery call; in-house guests + members free; no slots except zip line and sky cycling |
| Q-113 | Day-out / day-visitor product (C-05): exists? price, inclusions, capacity | DAY_VISITOR rule | Off |
| Q-114 | **Resource request:** spa menu (services, durations, prices), therapists, treatment rooms, hours, cancellation/no-show rule, health-note wording and retention | spa | Empty catalogue; no-show fee 0; health notes kept 1 year |
| Q-115 | "Mystery Experiences" (Wow Hospitality): anything in the ERP? If yes → change request | scope | Out of scope |
| Q-116 | Damage found by maintenance charged to guest folio? Who approves? | damage charge | Allowed with MANAGER approval |

### 2026-11-28 (Dashboards, Reports, Admin & CMS, sub-phase 2.9, D-181…D-183)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-117 | Priority reports and formats; **samples of reports used today**; KPI definitions (complimentary nights in occupancy?); financial year start | report catalogue, KPIs | All §23 reports; comps excluded from paid occupancy, shown separately; FY April–March |
| Q-118 | **Distribution list**: who gets which scheduled report, when | report schedules | Daily owner/GM summary after night audit; weekly revenue Monday 09:00 |
| Q-119 | What Owner and GM want on their dashboards | dashboards | Tiles as in plan §2.6 |
| Q-120 | CMS: who edits, who approves/publishes (Q-015); blog wanted? | CMS workflow | MARKETING edits, MANAGER publishes; blog on |
| Q-121 | **Resource request:** confirmed website texts and original photos (pending landing-page checklist items) | CMS content | Current site content, "to be confirmed" marks kept |
| Q-122 | Analytics tool, cookie consent wording, Google Search Console access, domain | website analytics | No analytics until chosen |
| Q-123 | Audit log retention and who may export | central audit | Kept; ADMIN exports |
| Q-124 | Event enquiry form fields (banquet/wedding/corporate; see Q-008) | lead form | Name, contact, event type, date, guests, venue preference, notes |

### 2026-11-28 (Non-functional & go-live, sub-phase 2.10, D-184…D-187)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-125 | VPS provider and region (India recommended), specs (min 8 vCPU / 32 GB / 200 GB), who pays (SOW §25.4), root/SSH access for QuantumCLK, separate staging VPS | hosting | Existing VPS for staging only until a sized production VPS exists |
| Q-126 | Production domains/hostnames and DNS access (Q-025); SMTP provider (Q-024) | Caddy, emails | — |
| Q-127 | Off-site backup storage provider and cost; retention beyond 30 days? | backups | 30 days |
| Q-128 | Uptime target and support hours (Q-016); alert recipients and channel | monitoring, support | Business hours + email alerts to QuantumCLK |
| Q-129 | UAT representatives, dates, review period | UAT | — |
| Q-130 | Migration datasets, formats, owners (rooms, rates, staff, members, guests, future bookings, advances) | migration | Templates provided by QuantumCLK |
| Q-131 | Go-live / opening date (C-11) and opening plan | cutover | — |
| Q-132 | Training participants per role, schedule, language | training | English, role sessions in month 1 |
| Q-133 | Post-launch support period and AMC terms | support | Hypercare 2 weeks |
| Q-134 | Documentation format and language | docs | Markdown → PDF, English |
| Q-135 | Security/compliance requirements (third-party pen test?), gateway PCI self-assessment | security | Internal OWASP review + light pen test |

### 2026-11-28 (ADR-004 Part D — for Ashish, not the client)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-136 | Merge reservation + room + stays + housekeeping into one `pms-service` (reopens D-150/D-154/D-155)? | ADR-004 D-1 | Plans as written (separate services) |
| Q-137 | Event transport: outbox + polling feeds first, or Kafka (also 2.1-A1)? | ADR-004 D-2 | Undecided; Claude recommends outbox + polling first |
| Q-138 | Standby Postgres replica on a second VPS, or single VPS + backups (depends on Q-128)? | ADR-004 D-3 | Single VPS + backups |

### 2026-11-28 (staff onboarding & OTP, 2.0 §2A)
| ID | Question | Where | Placeholder until answered |
|---|---|---|---|
| Q-095 | **Answered 2026-11-28 by Ashish (D-190):** OTP for all staff; TOTP for ADMIN/MANAGER, email OTP for others. Q-021 is answered by the same decision | 2.0 §2A | — |
| Q-139 | Approve **Playwright** (dev dependency, web E2E tests) | 2.0 §2B, I9 | Not added until approved |
| Q-140 | Does the chosen Auth0 plan (Q-090) include email OTP + TOTP, per-role MFA from Actions and a 7-day remember-browser? If email OTP is not allowed alone, use TOTP for Sales Executives too? | 2.0-I1 spike | Plan as written; check in I1 |
