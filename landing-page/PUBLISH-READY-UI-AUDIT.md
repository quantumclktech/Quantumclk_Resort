cd # Golden Hills Resort — publish-readiness UI audit

> **Scope:** `Design-1` only. `Design-2` was not inspected or modified.  
> **Purpose:** a source-grounded implementation brief for turning the current concept preview into a trustworthy, client-ready resort website without inventing facts or making unapproved renders look like completed-property photography.

## Confirmed implementation decisions

The public website implementation now follows these client directions:

- Canonical public brand name: **Golden Hills Resort**.
- Public accommodation count: Do not display room numbers/counts on the customer-facing website; showcase room and cottage categories instead.
- Do not publish launch/opening language.
- Postal address from the Project Report is public website content.
- Official phone, WhatsApp and email will be added later; no placeholder contact details are used.
- Room categories and dining outlet names follow the supplied ERP/client documents.
- Mystery Experiences and Loyalty offers are public product sections.

## Executive summary

`Design-1` is a strong editorial concept presentation, not yet a publishable resort website. Its strongest decisions are the restrained forest/cream palette, clear artist-impression disclosures, responsive image-led storytelling, reduced-motion fallback, and refusal to fake booking/contact functionality.

The main problem is not that the page lacks more sections. It is that the page currently communicates **“a resort in the making”**, while the supplied ERP/client documents describe a future operating resort with:

- 46 rooms and cottages as directed for the public website; the ERP specification still contains a conflicting 36-unit operational model that must be reconciled in the backend.
- Six dining/bar cost centres and three event venues.
- Real room categories, working tariffs, meal plans, facilities, day-outing logic, and enquiry-driven events.
- A future direct-booking website integrated with room inventory, rate calendars, Razorpay, OTA sync, WhatsApp Business, email, Google Maps, Analytics, and Search Console.

Those details cannot be safely placed into the current UI until the client confirms the public-facing version. The page should first become a **credible pre-opening / coming-soon website** with an honest enquiry or updates conversion path. When the property is operational and the business inputs are approved, it should evolve into a booking-led site rather than merely adding more decorative sections.

## Evidence reviewed

### Current implementation

- [`Design-1/src/app/page.tsx`](./src/app/page.tsx): page hierarchy, section copy, scene selection, CTA routes.
- [`Design-1/src/app/opening.tsx`](./src/app/opening.tsx), [`animated-hero.tsx`](./src/app/animated-hero.tsx), [`opening.css`](./src/app/opening.css): scroll-driven hero, carousel, responsive hero behaviour.
- [`Design-1/src/app/site-header.tsx`](./src/app/site-header.tsx), [`site-footer.tsx`](./src/app/site-footer.tsx): navigation, placeholder plan-ahead routes, disclosure language.
- [`Design-1/src/app/cottage-story.tsx`](./src/app/cottage-story.tsx): desktop sticky story and normal-flow fallback.
- [`Design-1/src/app/globals.css`](./src/app/globals.css), [`tokens.css`](./src/app/tokens.css), [`base.css`](./src/app/base.css): visual system, responsive rules, accessibility and motion rules.
- [`Design-1/src/app/plan-ahead/page.tsx`](./src/app/plan-ahead/page.tsx): current booking/login/enquiry status page.
- [`Design-1/README.md`](./README.md), [`Design-1/DESIGN.md`](./DESIGN.md): existing constraints, review decisions, provenance and render limitations.
- [`Design-1/public/assets/resort/asset-manifest.json`](./public/assets/resort/asset-manifest.json) and [`resort-asset-contact-sheet.jpg`](./public/assets/resort/previews/resort-asset-contact-sheet.jpg): image provenance, dimensions and approval status.

### Client materials

The supplied `golden hills assets and docs` folder was reviewed as source material:

- Design PDFs for rooms/cottages, reception/vegetarian restaurant, non-vegetarian restaurant, bar and conference hall.
- Project Report.
- Golden Hills Resort / mystery-experience catalogue.
- GHR Loyalty Deals.
- Golden Hills catalogue/logo/palette PDF.
- Combined client questionnaire.
- Resort ERP Software Requirements Specification.
- Resort ERP technology stack proposal.
- Loyalty voucher, membership-ID and staff/timesheet spreadsheets.

The design PDFs are primarily visual renders, so their web-ready derivatives and manifest are the reliable image inventory inside `Design-1`. The Project Report and ERP specification contain important textual facts, but they are not automatically approved marketing copy.

## What the current page is doing

### Current journey

1. **Opening:** a long scroll-controlled logo-to-image reveal, followed by a three-slide concept carousel:
   - “A courtyard, imagined.”
   - “A welcome, taking shape.”
   - “A quieter interior.”
2. **Vision:** “Not quite a place. Already a feeling.”
3. **Arrival and interiors:** reception lounge plus a cottage interior study.
4. **Cottage studies:** desktop sticky three-view story; normal flow on mobile, short screens and reduced motion.
5. **Dining:** vegetarian, non-vegetarian and bar concepts.
6. **Gatherings:** conference/banquet concept.
7. **Closing:** dusk pool concept and “Plan ahead”.
8. **Footer:** explore links and pre-launch notices.
9. **Plan ahead route:** honest non-functional states for Book Now, Login and Enquire.

### What already feels trustworthy

- Every displayed property render is labelled as an artist’s impression.
- The copy does not claim an opening date, confirmed inventory, live rates or a working booking engine.
- The provisional logo is identified as provisional in the README and footer.
- The page avoids fake testimonials, fake awards, invented review scores, fake contact details and fabricated social proof.
- The page has a sensible mobile fallback for the desktop sticky sequence.
- The page includes keyboard focus treatment, skip navigation and reduced-motion behaviour.
- The visual system has a coherent point of view: garden gate, pale masonry, water, timber, forest green, warm brass.

### What currently makes it feel like a concept demo rather than a client-ready website

1. **The main CTA is not a real conversion path.** “Explore the vision” is appropriate for a design presentation, but a client website needs a verified action: register interest, call, WhatsApp, request an event quote, or book.
2. **Book Now, Login and Enquire are visible but intentionally non-functional.** This is honest, but it should be framed as a deliberate “pre-opening” status with one useful action instead of three dead-end routes.
3. **The page has no factual location block.** The Project Report supplies Anagawadi Village, Biligi Taluk, Bagalkote District, Karnataka and a road-access narrative, but no approved public contact block or map CTA is currently implemented.
4. **The story is visually rich but operationally thin.** Visitors cannot quickly understand what is actually planned: accommodation types, pool/day-outing distinction, dining offer, events, or who the resort is for.
5. **The hero carousel mixes unrelated priorities.** Pool cottage, reception and bedroom concepts compete for the first message. The hero should lead with one clear proposition, then move supporting concepts below.
6. **The repeated “concept / study / subject to change” language is safe but monotonous.** Disclosure needs to remain visible, but it can be consolidated into a clear media standard and used with shorter, consistent captions.
7. **The visible brand is not resolved.** Documents alternate between “Golden Hills Resort” and “Golden Hills Resorts”; the logo is a provisional raster derivative; a reception render contains conflicting signage and is excluded from the manifest.
8. **The text is evocative but generic in places.** “A quieter interior”, “Good company. Different moods.” and “Better, together.” could belong to many hospitality brands. The copy needs a specific place, audience and experience spine.
9. **The page does not distinguish proposed facilities from confirmed public offerings.** The source materials include proposed pools, spa, gym, activities, event spaces, loyalty offers and mystery experiences, but the current page mostly shows design renders without a clear status taxonomy.
10. **The page is not yet a real booking site technically.** The ERP documents call for inventory, dynamic pricing, meal plans, payment, OTA sync and enquiry workflows; none of those should be implied by the current UI.

## Source-grounded truth to use

### Strong candidates for approved factual content, pending client sign-off

The Project Report describes:

- Project name: **Golden Hills Resort**.
- Location: Survey No. 162/2A, Anagawadi Village, Biligi Taluk, Bagalkote District, Karnataka.
- A family-friendly resort proposition combining relaxation and adventure.
- Nearby attractions named in the report: Almatti Dam, Aihole, Badami Caves/temples and related historic sites.
- Road access between Hubli and Vijayapur, subject to a final map/address review.
- Proposed facilities including vegetarian restaurant, non-vegetarian restaurant, bar, conference hall, gymnasium, spa/massage centre, swimming pool and indoor games.
- A sustainability/infrastructure narrative including sewage treatment, waste management, rainwater harvesting and green areas. These should only be marketed after the client confirms what is built and operational.

The ERP specification describes a future operating model:

- 36 accommodation units across premium rooms, suite, standard wooden cottages, dormitory cottages and private pool cottages.
- Six F&B cost centres: pure vegetarian restaurant, non-vegetarian restaurant, bar lounge, resto-bar cafe, courtyard cafe, and banquet/day-outing dining.
- Three event venues with working capacities of 100, 300 and 500 guests.
- Main pool and kids pool; spa/wellness; gym and indoor games; adventure activities; rain dance; bonfire/outdoor walks; parking, Wi-Fi, EV charging, room service, housekeeping and laundry.
- Day outing concept from 10:00 AM to 5:00 PM with a proposed per-person benchmark, not an approved public rate.
- Future direct booking with EP/CP/MAP/AP meal plans, dynamic pricing, 100% advance payment and Razorpay.
- Event sales should be enquiry-driven rather than fixed self-checkout packages.

The experience catalogue contains a separate, unconfirmed “Mystery Experiences” concept with guest categories, 43 short experiences, stay bundles, add-ons and price tiers from INR 3,000 to INR 3,00,000. It should not be added to the main resort navigation until the client confirms that this concept belongs to the public brand and that the prices are approved.

The loyalty deal sheet lists proposed vouchers across rooms, day outing, F&B, à la carte, celebrations, beverages and spa. It should be treated as campaign/CRM source material, not public website copy, until validity, eligibility, legal terms and redemption inventory are confirmed.

### Conflicts and pending approvals that must block public claims

| Topic | Conflicting or incomplete evidence | Required decision |
|---|---|---|
| Brand name | “Golden Hills Resort” in the Project Report/ERP; “Golden Hills Resorts” in some source materials and signage | Confirm one canonical public name and exact logo lockup |
| Inventory count | Project Report says 46 rooms/bedrooms; ERP says 36 units with a detailed category split | Confirm the commercial inventory and what “room” vs “unit” means |
| Room categories | ERP working names are explicitly not final | Approve names, descriptions, occupancy, amenities and balcony mapping |
| Dining names | ERP calls names working labels and says six outlets; renders are concept studies | Confirm outlet names, cuisines, service windows and which outlets will launch |
| Rates | ERP contains starting tariffs and meal-plan rules; catalogue says prices exclude GST; exact public tariffs and add-ons are pending | Confirm rates, GST display, taxes, inclusions, supplements and date validity |
| Opening | ERP mentions a January target postponed from December, but no confirmed opening date is supplied | Do not publish a date until the owner signs it |
| Contact details | ERP action register asks for phone, WhatsApp, email, address and Maps pin | Supply and verify official channels before enabling CTAs |
| Brand assets | Logo is a provisional raster extraction, not an approved vector master | Supply final SVG/AI, light/dark variants, clear space and usage rules |
| Images | All supplied property visuals are 3D concepts; several are explicitly unapproved candidates | Approve selected images and provide higher-resolution exports or photography |
| Interior palette | Current page uses green/cream/brass; ERP action register mentions revised guidelines aligned with blue/white/red-velvet interiors | Resolve the brand palette before final visual polish |
| Facilities | Project Report and ERP list proposed facilities; operating status is not confirmed | Mark each facility as planned, open, seasonal or unavailable |
| Promotions | Loyalty and mystery-experience materials contain offers and prices without public terms | Approve campaign scope, terms, validity and booking integration |

## Recommended product position

### Current public website position

Position the site as:

> **Golden Hills Resort — a family-friendly stay and gathering destination taking shape near Biligi.**

Use the supplied setting, architecture and concept imagery, but make the primary outcome **clear product discovery and qualified interest**, not a fake booking. The page should help a visitor understand:

- where the resort is;
- what kind of stay or gathering is being planned;
- what imagery is conceptual;
- how to request updates or an event conversation;
- what the resort offers and how to plan a stay.

### Later booking integration

After the reservation system and verified contact channels are connected, add:

- live availability and “Book Now”;
- room comparison with occupancy, bed type, amenities and meal plans;
- direct rates with tax/inclusion clarity;
- event enquiry form with venue capacity and event type;
- dining and facility pages with hours;
- verified phone, WhatsApp, email, address and Google Maps;
- cancellation and payment policies;
- accessibility and pet-policy details;
- membership/loyalty area only after plan and benefit sheets are approved.

## UI direction: improve the current design without making it AI-slop

### Keep

- Warm editorial composition rather than generic card grids.
- Forest, cream, limestone and brass as a provisional system.
- One high-impact hero image, not a collage of stock imagery.
- Asymmetric image rhythm and generous whitespace.
- Real image provenance and a visible artist-impression standard.
- Minimal motion: one hero arrival and one cottage transition, with normal-flow fallbacks.
- Sentence case, restrained labels and no fake badges.

### Change

#### 1. Make the first viewport answer three questions

The first viewport should communicate:

1. **What:** a family-friendly resort for stays, dining and gatherings.
2. **Where:** near Biligi / Bagalkote, Karnataka, only after location wording is approved.
3. **What can I do now:** register interest, request an event conversation, or explore the vision.

Suggested pre-opening hierarchy:

```text
Golden Hills Resort
A family-friendly stay and gathering destination taking shape near Biligi.
Artist's impressions of the resort in development.
[Register interest] [Explore the vision]
```

Do not use “Book Now” as the primary action until availability, inventory, rates and payment are live.

#### 2. Replace the hero carousel with a clear hero plus supporting concept strip

Keep the pool courtyard as the hero because it is the strongest supplied visual. Move reception and interior studies into a later “What is taking shape” section. A three-slide hero makes the visitor work to understand the offer and can read as a template carousel.

If a carousel is retained:

- use a visible pause/play control;
- keep the current slide label and disclosure stable;
- do not rotate automatically;
- ensure focus and screen-reader state are fully managed;
- use the carousel as an optional gallery, not as the primary message.

#### 3. Add a factual “At a glance” band

Use only approved facts, for example:

- Near Biligi, Bagalkote District
- Stays, dining and gatherings
- Pool, wellness and indoor/outdoor experiences
- Concept preview / opening information pending

Avoid publishing “3-star”, 36/46 units, capacities, prices or facility hours until the client signs the correct version.

#### 4. Turn sections into visitor decisions

Recommended section sequence:

1. Hero / pre-opening action.
2. Location and positioning.
3. Stay: rooms, suite, cottages and private-pool cottage concept.
4. Gather: dining, celebrations and event spaces.
5. Experience: pool, wellness, games, adventure and nearby attractions.
6. What is confirmed vs planned.
7. Register interest / event enquiry.
8. Practical information and footer.

This is more useful than leading with every render category equally.

#### 5. Use status labels as a design system

Create a small, consistent vocabulary:

- **Planned** — described in the project/ERP documents but not confirmed open.
- **Concept study** — represented by a 3D render.
- **Opening information pending** — no signed date.
- **Available now** — only for a verified live service.

Do not use “coming soon” everywhere; it becomes visual noise. A single “Pre-opening concept preview” banner plus local status captions is clearer.

#### 6. Make trust visible, not apologetic

Replace repeated defensive copy with a compact “About the images” note:

> The spaces shown here are design concepts for a resort in development. Final layouts, finishes, facilities and opening details may change.

Keep the full disclosure in captions/figcaptions and the footer. This preserves honesty without making every section sound uncertain.

#### 7. Add a real pre-launch conversion surface

The current plan-ahead page is honest but ends in dead ends. After the client supplies an official channel, use:

- a short interest form: name, email/phone, interest type, consent;
- an event enquiry route with event type, date, guest count and callback preference;
- click-to-call and WhatsApp;
- clear privacy and consent copy;
- success and failure states.

Until then, show one explicit message: “Official enquiries will open here once the resort confirms its launch channels.”

#### 8. Improve navigation labels

Current “Stay / Dining / Experiences / Gather / About” is directionally good, but the page does not yet support all of those labels evenly. Use labels tied to real content:

- Stay
- Dine
- Gather
- Experience
- Location
- Plan ahead

On the pre-opening version, “Book Now” should become “Register interest” or “Opening updates” unless the client intentionally wants a status page.

#### 9. Use the actual location story

A concise location block can provide specificity without overselling:

> In Anagawadi Village, Biligi Taluk, Bagalkote District — with road access between Hubli and Vijayapur and nearby routes to Almatti Dam, Aihole and Badami.

This must be checked against the final address and map pin before publication. Do not call it “lakefront” unless the client confirms the site relationship; the Project Report uses lake/cottage language inconsistently with the supplied renders.

## Typography recommendations

### Keep the current pairing, but give each face a job

- **Bodoni Moda:** hero statement, one or two section titles, closing statement. Do not use it for every heading.
- **Manrope:** navigation, body, labels, captions, form fields and utility content.

### Specific adjustments

- Use fewer oversized serif statements; currently the page risks a repeated “luxury landing page” cadence.
- Keep display headings to roughly 2–3 lines on desktop and 3–4 on mobile.
- Use a readable body measure around 55–70 characters.
- Raise body copy contrast slightly on cream and garden surfaces.
- Use sentence case for labels and navigation.
- Avoid all-caps tracking for important factual content.
- Give utility text (hours, capacity, disclosure, status) a stable sans-serif style and consistent line-height.
- Add a numeric style for future rates, capacities and timings; do not mix decorative serif numerals with operational facts.
- Confirm Devanagari/Kannada language requirements before launch; the current font setup is English-first.

### Copy direction

Write like a host, not a generated moodboard:

- Replace generic “A quieter interior” with a concrete promise or status.
- Replace “Good company. Different moods.” with a description of the dining use case.
- Lead with “family-friendly”, “stays”, “gatherings”, “pool”, “wellness” and nearby destinations only when approved.
- Avoid unsupported superlatives such as “best”, “luxury”, “world-class”, “hidden gem” or “unforgettable”.
- Avoid saying “lake” or “private pool” for every room until room inventory and site details are confirmed.

### Candidate copy directions (not approved final copy)

These are starting points for client review, not claims to publish unchanged:

- “A slower stay, taking shape near Biligi.”
- “A place for easy stays, long lunches and occasions worth gathering for.”
- “From the first welcome to the last swim, a resort imagined around time together.”
- “Stay close to the places that make this part of Karnataka worth the journey.”

## Asset and media plan

### Use now, with disclosure and approval workflow

- `hero-pool-day-desktop-p37` — strongest hero candidate.
- `hero-pool-arch-mobile-p35` — mobile crop candidate.
- `cottage-entry-p32`, `cottage-pool-overhead-p33`, `cottage-pool-terrace-p34` — cottage story.
- `arrival-reception-lounge-p11` — arrival concept.
- One approved interior alternative from p. 39–41.
- One approved vegetarian and one non-vegetarian dining candidate.
- One approved bar candidate.
- One approved banquet configuration.

### Do not use until resolved

- The p. 36 rooms/cottages image with the visible mark.
- Reception p. 8 with conflicting plural signage.
- Any dusk/day sequence that implies an approved time-of-day scheme.
- All unapproved interior, dining, bar and event alternatives without selection.
- Logo derivatives as final brand masters.
- Third-party reference photography from mood boards.

### Required media deliverables from the client

- Final vector logo and light/dark variants.
- Approved palette and typography guidance, especially resolving the green/cream/brass vs blue/white/red-velvet conflict.
- Higher-resolution hero and portrait mobile exports.
- Approved final room, pool, dining, bar and event images.
- Real photography once the property exists.
- Alt-text review by the client for culturally and operationally accurate descriptions.
- Rights/approval confirmation for every image and render.

## Recommended information architecture

### Pre-opening route

```text
/
├── Hero: Golden Hills Resort / pre-opening status
├── Location
├── Stay concepts
├── Dining and gatherings
├── Experiences and nearby places
├── About the images / what is planned
├── Register interest / event enquiry
└── Footer: verified contact, privacy, terms, social links
```

### Operating route

```text
/
├── Book now
├── Stay
│   ├── Premium rooms
│   ├── Suite
│   ├── Wooden cottages
│   ├── Dormitory cottages
│   └── Private pool cottages
├── Dine
├── Experiences
├── Weddings & events
├── Location
├── Offers / membership
└── Policies and contact
```

## Prioritized implementation todo list

### P0 — content and trust blockers

- [x] Confirm canonical brand name: Golden Hills Resort.
- [x] Remove public room counts from the customer-facing website (keep room and cottage categories).
- [x] Exclude launch/opening language from the public website.
- [x] Use the postal address from the Project Report.
- [ ] Supply official phone, WhatsApp and email when available.
- [x] Use the supplied room and dining names on the public page.
- [ ] Approve which renders can be published and which remain concept-only.
- [ ] Resolve the current palette conflict before final visual refinement.
- [x] Publish Mystery Experiences and Loyalty offers as public product sections.

### P1 — publish-ready website improvements

- [x] Rework hero around one pool-courtyard image and one clear resort CTA.
- [x] Replace or relabel non-functional “Book Now”, “Login” and “Enquire” actions.
- [x] Add a location / at-a-glance section with approved facts.
- [x] Add “Stay / Dine / Gather / Experience” content blocks with status labels.
- [x] Add a clear no-channel-yet state without collecting unverified contact details.
- [x] Add an event enquiry pathway through the planning route.
- [x] Consolidate image disclosures around the shared artist-impression language.
- [x] Rewrite generic section copy using approved place and audience language.
- [x] Remove carousel interaction from the single-hero state; retain accessible carousel semantics if additional slides return.
- [x] Keep navigation limited to sections and routes that exist publicly.

### P1 — technical and accessibility hardening

- [x] Run lint, typecheck and production build after copy/structure changes.
- [ ] Test at 390×844, 768×1024, 1440×900 and a wide desktop.
- [ ] Test reduced motion, keyboard-only navigation, focus order and screen readers.
- [ ] Check contrast for all muted text, brass outlines and image overlays.
- [ ] Verify image sizes, preload strategy and LCP on mobile.
- [ ] Add meaningful metadata, Open Graph image and favicon once the brand asset is approved.
- [ ] Add privacy/consent handling before collecting personal details.
- [ ] Add a proper 404 and form error/success states.
- [ ] Verify no CTA implies a reservation, payment or account capability that is not connected.

### P2 — operating-site foundation

- [ ] Connect live room inventory and rate calendar.
- [ ] Implement EP/CP/MAP/AP meal-plan display after tariff approval.
- [ ] Implement Razorpay only after payment, cancellation and refund rules are signed.
- [ ] Implement event enquiry fields and owner routing.
- [ ] Add venue capacities only after the 100/300/500-pax configuration is approved.
- [ ] Add dining hours, menus, taxes and outlet labels after menu sign-off.
- [ ] Add Google Maps, Analytics and Search Console with consent-aware measurement.
- [ ] Add WhatsApp Business and email notifications; do not add SMS because the ERP specification explicitly excludes it.
- [ ] Add cancellation, privacy, accessibility, pet-policy and image-disclaimer pages.

### P3 — later brand and conversion work

- [ ] Add approved photography and replace concept renders where appropriate.
- [ ] Add membership/loyalty landing pages with current terms and redemption logic.
- [ ] Add approved experience bundles and destination-sales enquiry flow.
- [ ] Add reviews/testimonials only from real verified guests after opening.
- [ ] Add seasonal campaigns only after rate, inventory and legal approval.

## Definition of publish-worthy

The page is ready for a **pre-opening client handoff** when:

- the name, logo, location and contact route are approved;
- every public claim has an owner-approved source;
- every image is either approved photography or clearly labelled concept artwork;
- visitors have one useful action that actually works;
- no booking, login, rate or opening-date language creates false expectations;
- the page is usable on mobile, keyboard, reduced motion and slow connections;
- the client can explain in one sentence what the resort is, where it is and what a visitor can do next.

The page is ready for an **operating launch** only when the booking, payment, inventory, enquiry, policy and analytics integrations are connected and tested end to end.

## Final recommendation

Do not add more visual effects or more generic resort sections yet. First make the content contract truthful: one name, one inventory model, one status (pre-opening or operating), one approved CTA, one contact route, one approved asset set. Then refine the existing editorial direction around a specific Karnataka location story and a clear stay/dine/gather proposition. That sequence will make `Design-1` feel considered and client-safe rather than like a polished AI-generated template.
