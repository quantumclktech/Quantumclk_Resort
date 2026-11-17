# Source extract — Discovery call — 28 October 2026

- **Source files:**
  - `WhatsApp Audio 2026-10-28 at 6.17.06 PM - transcript.txt` — sha256 `34c653a0e3faa092c0d3bbc9e827980526bacba43a52bddd432877198e864481`
  - `transcript_segments.jsonl` — sha256 `9472ec4e4ef23533c230a5bfc1974672f3e20bb110bc57918aa99b3a28069efe`
  - `WhatsApp Audio 2026-10-28 at 6.17.06 PM.mp4` — sha256 `cfee57ede596d6cc3926dd85d9ff3d6312680cef6219f8ff5b10764af2e57068`
  - `transcribe_progress.log` — sha256 `e2b979cd50f72077e08856b141db13de76c56a45e00fa9e2977dc6935e35652d`
  - `Golden_Hills_Discovery_Call_Summary_2026-10-28.md` — sha256 `733068bcd2dc90d0daeab57e48d91a50b34613c00e9f108266142d97366b49a9` (secondary)
  - `Resort_ERP_Software_Requirements_Specification.pdf` — sha256 `a5600e41e84b3165008d1f9116809a1ab026056fe25680141f6c87d3161015d3` (derived, not client-signed)
- **Extraction date:** 2026-10-29T18:50:00+05:30
- **Method:** reviewed the full timestamped transcript and segments JSONL; cross-checked the summary and the derived SRS. Short quotes are verbatim from the auto-transcript, with `[sic]` where the text is clearly garbled.
- **Note:** this is a derived requirements extract for developers without drive access. The original transcript is the source of truth. If they differ, the original wins and this extract must be refreshed.

## How to read this extract

- **High** = stated clearly, repeated, or consistent across the transcript and summary.
- **Medium** = stated once or partly garbled, but usable as a working assumption after confirmation.
- **Low / conflicting** = the transcript contradicts itself or the summary overstates it. Do not build a business rule on it.
- The call is **input only**, not an approved baseline. The SOW and approved Change Requests rank above it.
- The derived SRS is a **separate interpretation** of the same audio. It is not a client signature and is not used here to upgrade a low-confidence fact.

---

## A. Property, inventory and guests

| Topic | What the call says | Confidence | Transcript anchor |
|---|---|---|---|
| Property | Golden Hills Resort; nearby attractions include Vijapura, Badami, Aihole/Koodalasangama and Almatti; about 15 km from the railway station and near Hubbali airport (distances to confirm) | High | [00:04]–[00:30]; summary |
| Total rooms | 36 rooms | High | [00:41] |
| Categories | Premium 19, Suite 1, Wooden Cottages 12, Private Pool Cottages 4 | High | [00:45]–[01:06] |
| Premium mix | 14 queen-bed and 5 twin-bed rooms (from the summary/SRS; the transcript gives the 19 total) | Medium | summary; SRS p.2 |
| Dormitory | 10–12 bunk beds; described as part of the wooden-cottage zone; purpose (guest vs staff) not clearly confirmed | Medium | [11:36]–[14:38] |
| Staff | About 90 employees | High | [00:31]–[00:39] |
| ID proof | Aadhaar or driving licence (also voter ID in the derived SRS) | High | [22:56]–[22:58] |
| Guest fields | Name, email, phone, purpose of visit, ID document | High | [22:56]–[23:00] |
| Privacy | No live webcam capture at reception (derived SRS; the transcript is garbled around this point) | Medium | SRS §5.2; transcript not clear |
| Overbooking | Not allowed; GM approval for an override | High | [23:19]–[23:45] |
| Waitlist | “Waitlist needed” is said, then the conversation moves on; not confirmed as a requirement | Low | [24:02]–[24:13] |

## B. Check-in, check-out and stay rules

| Topic | What the call says | Confidence | Transcript anchor |
|---|---|---|---|
| Check-in | 12:00 noon | High | [29:31]–[29:40] |
| Check-out | “11 pm” in the auto-transcript; almost certainly 11:00 AM, but the AM/PM is not clear | Medium | [29:40] |
| Turnaround | About one hour between check-out and check-in (derived SRS) | Medium | SRS §5.3 |
| Early check-in / late check-out | Dynamic, subject to availability and occupancy; management can adjust charges | Medium | [26:03]–[26:26]; [29:57] |
| Room not ready | Guest waits in the lounge; room transfer is supported | Medium | SRS §5.3; transcript fragmentary |
| No-show | Paid bookings are non-refundable; unpaid tentative enquiries are cancelled (derived SRS) | Medium | SRS §5.3; transcript [24:16]–[24:23] is garbled |
| Override authority | GM for room/overbooking exceptions; GM and MD for special discounts | High | [23:43]–[23:58] |

## C. Commercial rules

| Topic | What the call says | Confidence | Transcript anchor |
|---|---|---|---|
| Indicative tariffs | Premium ~Rs 5,000; Suite ~Rs 7,000; Wooden ~Rs 6,000; Private Pool ~Rs 12,000 | Medium | summary; SRS p.2 gives Rs 4,999 / 7,999 / 5,999 / 11,999 excl. GST |
| Extra bed/person | Rs 500–600 | Medium | summary; SRS p.2 |
| Occupancy | 2 adults; some rooms 2+1 | Medium | summary; SRS p.2 |
| Meal plans | Room-only / +breakfast / +breakfast+lunch; the SRS expands to EP/CP/MAP/AP | Medium | [27:50]–[28:00]; SRS §2.1 |
| Dynamic pricing | Weekday/weekend and occupancy-based; seasonal/peak windows in the SRS | Medium | [27:27]–[27:41]; SRS §2.1 |
| Advance | “Advance means 100% advance” is stated; 50% is also mentioned elsewhere and is not resolved | Low | [32:19]; [27:23] |
| Deposit | “No deposit” for regular guests; RFID/membership deposit is contradictory | Low | [23:10]–[23:12]; [41:48]–[42:04] |
| Cancellation | 24/48/72-hour fragments; 0–100% mentioned; exact tiers are not clear | Low | [27:00]–[27:23]; [28:xx] |
| GST | 5%, 12% and 18% are all mentioned; the mapping is garbled | Low | [28:28]–[28:57] |
| Promos / agents | “Promotion codes are not allowed” and “OTA corporate agent rates are applicable” appear in the same passage; agents “not allowed” is also said | Low | [28:06]–[28:20] |
| Membership points | Examples only; earn/redeem rules, tiers, fees and validity are not settled | Low | [42:37]–[42:56] |
| Opening date | December, April, May and January all appear; no single date is confirmed | Low | [03:19]–[03:27] |

## D. Operations

| Topic | What the call says | Confidence | Transcript anchor |
|---|---|---|---|
| Housekeeping statuses | Vacant/ready, occupied, dirty/cleaning, out-of-order/maintenance | High | [34:43]–[35:17] |
| Inspection | “Inspection, no need” is said first; later “must every room be inspected before ready?” → “Yes”, inspector is a manager/GM | Low / conflicting | [34:53]–[34:55]; [35:52]–[36:03] |
| Task assignment | Front desk/reception assigns cleaning tasks and priorities | High | [35:42]–[35:48] |
| Maintenance | Requests, priority, assignment, SLA and history are discussed; depth is not settled | Medium | [35:37]–[35:39]; summary |
| Lost & found / minibar / VIP | Raised as operational needs; no detailed rules | Medium | summary; SRS §7 |
| Facilities | Spa, gym, pool/kids pool, rain dance, indoor games, zip line, sky cycling, river walk, kids garden, sightseeing | High | [00:xx]–[15:xx]; summary |
| Pool access | Whether pool access is controlled or open to all guests is not resolved | Low | [15:37]–[16:53] |
| Day-out | “We don't have a day out package” is followed by Rs 1,000 inclusions (pool, rain dance, indoor games, zip line, sky cycling, lunch/snacks) | Low / conflicting | [44:15]–[44:41] |
| Event spaces | Party/banquet hall, conference hall, open lawn; capacities 100 / 300 / 500 | High | summary; SRS p.1 |
| Dining outlets | Restaurant, resto-bar, courtyard café, room service; the SRS lists six cost centres | Medium | [00:52]–[03:00]; SRS p.1 |

## E. Membership and RFID

| Topic | What the call says | Confidence | Transcript anchor |
|---|---|---|---|
| RFID scope | One RFID terminal/enrolment environment and 100 cards | High | [42:58]–[43:12] |
| RFID use | Doors are explicitly mentioned; membership/facility access is also discussed | Medium | [40:53]–[41:02]; SOW §17 |
| Card issue/renewal | Cards can be issued, renewed and points redeemed at one terminal | High | [43:12]–[43:22] |
| Card deposit | “Security deposit is not allowed” and “I have to submit a normal security deposit” both appear | Low / conflicting | [41:48]–[42:04] |
| Hardware brand | Ozone is named in the derived SRS, not clearly in the transcript | Medium | SRS §8; transcript unclear |
| Membership plans | Plan names, fees, validity, benefits, renewal and family/gifting rules are not settled | Low | [42:37]–[42:56] |

## F. Website, booking, OTA, WhatsApp and accounting

| Topic | What the call says | Confidence | Transcript anchor |
|---|---|---|---|
| Website | “Next, we will design a website content”; the call treats the website as to-be-built | Medium | [03:27]–[03:32] |
| Booking sources | Direct website, walk-in, phone/WhatsApp enquiry, OTA | Medium | [03:32]–[03:45]; SRS §5.1 |
| OTA | MakeMyTrip, Booking.com and similar channels are named in the SRS; credentials and commission are not settled | Medium | SRS §11.3 |
| WhatsApp | Direct WhatsApp enquiry is discussed; automated conversational booking is declined in the SRS | Medium | [03:45]; SRS §4 |
| Payment gateway | Razorpay is named in the SRS; merchant credentials are not supplied | Medium | SRS §6; Q-009 |
| Accounting | “Existing accountings” is raised, then “No, no”; the SRS explicitly excludes Tally/Zoho | Low / conflicting | [59:08]–[59:23]; SRS §11.3 |
| SMS | The SRS excludes SMS (DLT complexity); the transcript does not clearly settle it | Medium | SRS §11.2 |
| Reports | Parking, dining, HR, management KPIs, revenue/payments/refunds/GST split, occupancy and source mix are discussed | Medium | [58:55]–[59:08]; SRS §11.3 |
| Roles | GM, front-office manager, finance manager, HR manager, F&B manager, maintenance and membership owners are named | Medium | [61:04]–[61:44] |

## G. Contradiction register

| # | Contradiction | Evidence | Handling |
|---|---|---|---|
| C-01 | Website is CORE in the SOW, separate in the landing checklist, “ready” per Q-008, and to-be-built in the call | SOW §5; landing checklist; Q-008; [03:27] | Ask; do not assume integration or build |
| C-02 | Scope is CORE-only in the baseline but ERP-01…14 plus events/day-out in the call | REQUIREMENTS.md; SOW; call | Re-baseline; CRs for new scope |
| C-03 | Promo codes/agents allowed vs not allowed | [28:06]–[28:20] | Ask; keep promo config off by default |
| C-04 | Inspection “no need” vs “yes, GM” | [34:53]–[34:55]; [35:52]–[36:03] | Ask; keep inspection configurable |
| C-05 | Day-out “we don't have” vs Rs 1,000 inclusions | [44:15]–[44:41] | Ask; do not build a day-out product |
| C-06 | Advance 100% vs 50% vs baseline 30% | [32:19]; [27:23]; baseline | Ask; keep 30% placeholder |
| C-07 | Cancellation tiers 24/48/72h and 0–100% | [27:00]–[27:23] | Ask; keep free ≥48h/one-night placeholder |
| C-08 | GST 5/12/18, mapping unclear | [28:28]–[28:57] | Ask; keep single 12% placeholder |
| C-09 | RFID doors vs membership/facility access | [40:53]–[41:02]; SOW §17 | Ask; hardware/vendor/API unknown |
| C-10 | Accounting “existing” vs “no”; SOW excludes it | [59:08]–[59:23]; SOW exclusions | Ask; keep export-only |
| C-11 | Opening Dec–Jan vs Apr–May vs SRS January | [03:19]–[03:27]; SRS p.1 | Ask; do not commit a date |
| C-12 | Waitlist “needed” then conversation moves on | [24:02]–[24:13] | Ask; not in baseline |
| C-13 | Check-out “11 pm” [sic] vs expected 11 AM | [29:40] | Confirm AM |
| C-14 | Dormitory purpose guest vs staff; 10–12 bunks within 12 wooden cottages | [11:36]–[14:38]; SRS p.2 | Ask; do not model as a separate 37th key |
| C-15 | RFID/security deposit allowed vs not allowed | [41:48]–[42:04] | Ask; no deposit rule yet |
| C-16 | SRS says January (from December), GST 12/5/0, exact cancellation slabs; transcript is garbled | SRS §1, §5.3, §6 | Treat SRS as draft; confirm in writing |

## H. What the client still needs to confirm

These are the P0 items from the gap report; they are repeated here so the extract is usable on its own.

1. MVP scope and fixed go-live/UAT date.
2. Website: build, integrate or exclude; URL/code/hosting/domain/booking handoff.
3. Rate card: category, season, weekday/weekend, occupancy, extra bed, meal plans, child policy, tax inclusive/exclusive.
4. GST mapping, GSTIN, invoice format, place of supply, service charge, e-invoice.
5. Advance/payment: 100% or 50%, by channel/segment; gateway/merchant; deposit rules.
6. Cancellation/refund tiers, no-show, modification, early/late charges.
7. Promo/agent/OTA policy, credentials and commission.
8. Membership plans, fees, validity, benefits, points, tiers, family/gifting, card deposit.
9. RFID: doors or membership/facility only; vendor/model/API, zones, card allocation, deposit, offline behaviour.
10. Events/banquet: venues, capacities, packages, pricing, enquiry/booking, catering, cancellation.
11. Day-out: existence, price, inclusions, timing, capacity, booking and cancellation.
12. Accounting: required or not; software and export format.
13. Opening date and brand assets/guidelines.

## I. Source map

| Source | Role | Use in this extract |
|---|---|---|
| Transcript (1,060 segments) | Primary text evidence | Facts and short quotes, with timestamps |
| Summary | Secondary agenda/index | Cross-check; overstatements flagged |
| Derived SRS (13 pp) | Third-party interpretation of the same audio | Used only for clearly labelled “derived” details; never upgrades a low-confidence fact |
| SOW | Contract baseline | Module map, exclusions, phase context |
| Current requirements/build | As-built state | Used by the gap report, not by this extract |

> The audio was not listened to during this extraction. The transcript is auto-generated, has no diarization, and contains Indian-English code-switching and ASR errors. A commercial rule must not be treated as settled until the client confirms it in writing.
