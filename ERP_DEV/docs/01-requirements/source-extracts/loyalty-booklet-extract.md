# Source extract — Gold Member booklet (vouchers + coupons)

- **Source files** (resource folder, read-only):
  - `GHR_Vouchers_Final.pdf`: 55 pages, sha256 `0cb56f6fbad8a8786b28eaa743d7b71db03e40da7374e47e1115e41bada6f9eb`
  - `GHR_Coupons_Final (1).pdf`: 125 pages, sha256 `6c655ed834cb06e27f74fa50d9dcb2df10cc148b5b46c770126c51f613430a3b`
  - `Golden_Hills_Resort_Loyalty_Voucher_Numbers_5000.xlsx` (already logged, D-117): columns *Member No.* (1–5000) and *Voucher Number* (`GRH-LM-0101` … `GRH-LM-5100`)
- **Extracted:** 2026-11-28, by reading the PDF text layer page by page (PyMuPDF). Pages were grouped by identical text, and sample pages were rendered to check the artwork. The PDFs are print artwork, **one page = one leaf**. If this extract and the PDFs ever differ, the PDFs win.
- **Confidentiality:** requirement text only. No artwork is copied into the repository.

## Vouchers: 55 leaves, 14 kinds
Every voucher leaf carries "www.goldenhillsresort.in", **"Loyalty Member No:" (blank)** and **"VALID: January 2027 to December 2027"**.

| # | Printed title | Printed wording | Leaves | Pages |
|---|---|---|---|---|
| V1 | Complimentary Room Night | entitles you to one complimentary night stay | 2 | 1–2 |
| V2 | Book 1 Night and Avail 2nd Night Free | entitles you to complimentary night stay | 5 | 3–7 |
| V3 | Book 1 Night, Avail 2nd Night on 50% Off | entitles you to complimentary night stay | 5 | 8–12 |
| V4 | Complimentary Vouchers | entitles you to complimentary Day Outing | 10 | 13–22 |
| V5 | Complimentary Breakfast | entitles you to complimentary Food & Breakfast | 10 | 23–32 |
| V6 | Complimentary worth 1000/- | entitles you to complimentary Gift Certificate | 5 | 33–37 |
| V7 | 50% Discount on min bill of 4000/- | complimentary Discount on A La Carte | 5 | 38–42 |
| V8 | 30 pax party - 25% discount | complimentary on celebrations | 2 | 43–44 |
| V9 | 100 Pax party - 30% Discount | complimentary on celebrations | 1 | 45 |
| V10 | Kitty Party, 2 Buffet Vouchers | complimentary on celebrations | 5 | 46–50 |
| V11 | Banquet - 100 Pax - 2 Rooms | complimentary on celebrations | 1 | 51 |
| V12 | Banquet - 200 Pax - 4 Rooms | complimentary on celebrations | 1 | 52 |
| V13 | Banquet - 500 Pax - 6 Rooms | complimentary on celebrations | 1 | 53 |
| V14 | Buy one spa package and avail one spa package free | complimentary on spa offers | 2 | 54–55 |

## Coupons: 125 leaves, 13 kinds
Every coupon leaf carries **"Loyalty Member No:" (blank)**. **No validity date is printed.**

| # | Group (printed) | Printed title | Leaves | Pages |
|---|---|---|---|---|
| C1 | Day Outing | One+One | 10 | 1–10 |
| C2 | Day Outing | 50% Discount Vouchers, on max 10 entries | 5 | 11–15 |
| C3 | F&B | Lunch Buffet One+One | 10 | 16–25 |
| C4 | F&B | Weekend Brunch One+One | 10 | 26–35 |
| C5 | A La Carte | Starter / Soup One+One — 5 Lunch \| 5 Dinner | 10 | 36–45 |
| C6 | A La Carte | Main Course One+One — 5 Lunch \| 5 Dinner | 10 | 46–55 |
| C7 | A La Carte | Desert [sic] One+One — 5 Lunch \| 5 Dinner | 10 | 56–65 |
| C8 | Crazy Beverage Offer | Avail 40% discount on all Beverages | 8 | 66–73 |
| C9 | Crazy Beverage Offer | Mocktail One + One | 12 | 74–85 |
| C10 | Crazy Beverage Offer | 30ML \| 60ML One + One | 12 | 86–97 |
| C11 | Crazy Beverage Offer | Beer Two + Two | 12 | 98–109 |
| C12 | Crazy Beverage Offer | Imported Beverage One + One | 12 | 110–121 |
| C13 | Spa offers | Avail 20% Discount On All Therapies | 4 | 122–125 |

**Total per member: 55 + 125 = 180 leaves.** This matches "180 Privilege Club vouchers" on the website and the group totals in `landing-page/src/app/membership-data.ts`, which until now were marked "not confirmed" (Q-032).

## What the documents do NOT say (open → OPEN_QUESTIONS Q-097 … Q-106)
- **Validity:** vouchers say Jan–Dec 2027 (a calendar year), but the ERP gives 12 months from verification (D-118 area). Coupons have no dates.
- **No serial number per leaf.** Only the member number, written on the blank line.
- **No terms of use:** who may use them (member, family, transferable), advance booking, blackout dates, one per bill, combining offers, ID needed.
- **No money value** for complimentary items (needed for liability reports and GST, Q-073).
- The banquet and party vouchers depend on event bookings, which are not in the ERP core scope (scope gap noted in the discovery extract).
