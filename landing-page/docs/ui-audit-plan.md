# Golden Hills Resort — UI audit & improvement roadmap

> **Scope:** the public landing page, `http://localhost:3000/` (Design-1).
> **Method:** live browser inspection via a headless Chromium session at Desktop (1440×900), Tablet (834×1112) and Mobile (390×844). Every section was scrolled through, then measured in the DOM — computed padding, heading sizes, container widths, rendered image boxes, word counts, card counts, tap-target sizes and motion usage. Source was read only to confirm what the rendered page showed.
> **Date:** 14 November 2026
> **Status:** analysis only. No component, style, asset or config file was modified.
> **Related:** complements `UI-IMPROVEMENT-PLAN.md` (content/factual accuracy) and `PUBLISH-READY-UI-AUDIT.md` (publish readiness). This document is about *composition, rhythm and emotion*, not facts.

---

## 1. Executive summary

The craft on this page is genuinely good. Typography is well-chosen, the palette is disciplined, the copy is honest about the property being a concept, and individual sections — the dining block in particular — are better composed than most regional resort sites.

The problem is not quality. **It is that the page has one idea and repeats it eleven times.**

The measurements make this concrete rather than subjective:

| Measurement | Finding |
|---|---|
| Container width | **1325px on 13 of 14** `.wrap` elements — one width for the entire page |
| Section heading size | **44px on 9 of 11** sections |
| Vertical padding | Every section sits in a **76–86px** band (84px on five of them) |
| Four sections | `#stay`, `#dining`, `#experiences`, `#gatherings` are **all exactly 822px tall**, all 84px/84px padding, all one 672×420 image, all 5 cards |
| Backgrounds | Only **2 of 12** sections have their own background (`#story` cream, `#contact` forest). Everything else is the same cream |
| Full-bleed imagery | **Exactly one** instance on the whole page (the closing band). The largest in-content image is 672×420 — 47% of viewport width |
| Scroll motion | **Zero.** `Reveal` is imported in `page.tsx` and never used |

Two of these deserve emphasis because they contradict the working assumption in the brief:

1. **The animation problem is absence, not repetition.** The brief anticipated "the same animation appearing everywhere." In fact the only motion on the page is the hero opening and its slideshow. Below the fold, nothing moves, fades or arrives. The page is static from `#story` to the footer.
2. **The repetition is structural, not stylistic.** `#experiences` literally reuses the `dining-section` class and `#gatherings` reuses `stay-section`. These are not four sections that happen to look alike — they are two templates rendered twice each.

A luxury resort site sells a feeling before it sells a room. This page currently briefs the reader very competently. It does not move them.

**The single highest-leverage change:** break the 1325px container. Everything else on this list is secondary to letting imagery touch the edge of the screen.

---

## 2. The guest journey

| Question | Answer |
|---|---|
| Does the first impression feel luxurious? | **Partly.** The hero is strong — full-bleed photography, restrained type, a working slideshow. But it is 812px tall in a 900px viewport, so it never quite owns the screen, and the cream section below is visible underneath it from the first frame. The spell breaks before the first scroll. |
| Does the page create curiosity? | **No.** Every section answers its question completely and immediately. Nothing is withheld, teased or revealed. There is no reason to keep scrolling except diligence. |
| Does it tell a story? | **No — it files a report.** The order (story → stay → amenities → dining → experiences → gatherings → gallery → location → highlights → offers → contact) is an inventory, not a narrative. It could be reordered almost arbitrarily without loss. |
| Does every section have a reason to exist? | **No.** `#highlights` ("Hospitality, recreation and celebration in one destination") restates `#amenities`, `#stay` and `#gatherings` in card form. `#gallery` shows the same category of imagery already shown four times above. |
| Does the experience feel premium? | **Below the hero, no.** Premium reads as confidence: fewer words, bigger pictures, more silence. This page is dense, even and explanatory. |
| Is the user emotionally connected? | **No.** There is no human presence anywhere — no people, no hands, no faces, no detail shots. Every image is an empty architectural render of a space. The viewer is shown property, never experience. |
| Does it build desire to visit? | **It builds understanding, not desire.** A reader finishes well-informed and unmoved. |

---

## 3. Section-by-section audit

### 3.1 Hero / Opening

**Purpose** — establish the property and the mood in one frame; set expectation for everything below.

**Current experience** — the strongest part of the page. Full-bleed photography at 1498×844, a four-slide rotation with real taglines, restrained type, a working status line and controls. It behaves correctly: auto-advance pauses on hover, stops on manual control, respects reduced motion.

**Problems**

- *Design.* Measured at **812px tall in a 900px viewport**. It stops ~90px short of filling the screen, so a strip of the next section shows immediately. This is the difference between "a photograph" and "a place you are standing in." Full-bleed heroes must be `100svh`.
- *Design.* The headline, status line, two buttons, disclosure caption and slideshow controls are **five stacked layers** in the lower-left quadrant. That corner is doing too much work.
- *Content.* `Stay · Dine · Gather` is a category list, not a promise. It tells the reader what the website contains, not what the stay feels like.
- *Visuals.* Strong, but the slide change is a crossfade only. A slow scale drift (Ken Burns) during the 7s hold would make the hero feel alive rather than like a slideshow widget.
- *Interaction.* No scroll cue beyond the "Explore stays & experiences" button, which reads as navigation rather than invitation.

**Score**

```
Visual Impact:   8/10
Luxury Feel:     7/10
Storytelling:    6/10
Originality:     6/10
User Experience: 8/10

Overall Score:   7/10
```

**Recommended direction** — take it to `100svh` and strip the lower-left to **one** headline plus **one** primary action. Move the slideshow controls to the right edge, vertically centred, as minimal numerals (`01 — 04`). Add a slow 1.06× scale drift across each slide's hold. Let the image run under a scroll cue so the page invites rather than instructs.

---

### 3.2 Story (`#story`)

**Purpose** — introduce the property, location and the fact that it is a concept in development.

**Current experience** — measured 661px, 137 words, a single 601×412 image. Reads as an "About us" paragraph with a picture beside it.

**Problems**

- *Design.* The first section after the hero should be the emotional hook. Instead it is the densest text block on the page at 137 words.
- *Content.* The heading — "A family-friendly retreat taking shape in northern Karnataka" — is accurate and completely unevocative. It describes a market position, not a place.
- *Visuals.* A 601×412 image for the page's opening statement is far too small to carry feeling. It is an illustration beside text, not a view.
- *Interaction.* None.

**Score**

```
Visual Impact:   4/10
Luxury Feel:     5/10
Storytelling:    4/10
Originality:     3/10
User Experience: 7/10

Overall Score:   4.5/10
```

**Recommended direction** — this should not be a text section at all. Make it a **full-bleed landscape plate with 15–20 words set over it** — one sentence about the place, large, with air around it. Move the factual paragraph (location, taluk, district, access) down to `#location`, where a reader is actually asking that question. The job of the section after the hero is to deepen the mood, not to brief.

---

### 3.3 Stay (`#stay`) · Dining (`#dining`) · Experiences (`#experiences`) · Gatherings (`#gatherings`)

**Audited as one block, because they are one block.** `#experiences` renders with the `dining-section` class; `#gatherings` renders with `stay-section`. Measured identically:

| | `#stay` | `#dining` | `#experiences` | `#gatherings` |
|---|---|---|---|---|
| Height | 822px | 822px | 822px | 822px |
| Padding | 84 / 84 | 84 / 84 | 84 / 84 | 84 / 84 |
| Heading | 44px | 44px | 44px | 44px |
| Image | 672×420 | 672×420 | 672×420 | 672×420 |
| Cards | 5 | 5 | 5 | 5 |
| Words | 60 | 68 | 66 | 81 |

**Purpose** — present the four commercial pillars: rooms, food, activities, events.

**Current experience** — left column: eyebrow, 44px heading, ~65-word paragraph, pill button. Right column: image with a floating green badge, then a white card with a kicker, bold line and a link. Individually, well-made. The dining instance is genuinely handsome.

**Problems**

- *Design.* **This is the core failure of the page.** The reader passes through the identical composition four times in a row across 3,288px of scroll. By the third, the eye stops reading and starts skipping. Predictability is the opposite of luxury — a premium property surprises you in each room.
- *Design.* The text/image split never inverts. Text is always left, image always right, for all four.
- *Design.* The 672×420 image is 47% of the viewport width. The resort's most persuasive asset — its architecture — is shown at half scale, four times.
- *Content.* Four paragraphs of near-identical length (60–81 words), each in the same register: a feature summary ending in a capability claim.
- *Visuals.* The green pill badge over each image ("6 Dining Destinations · Separate Kitchens") is a UI label sitting on top of photography. It reads as e-commerce, not hospitality.
- *Interaction.* No motion, no hover state on the image, no parallax. Static.

**Score**

```
Visual Impact:   5/10
Luxury Feel:     5/10
Storytelling:    3/10
Originality:     2/10
User Experience: 7/10

Overall Score:   4/10
```

**Recommended direction** — **give each of the four its own format.** They are different kinds of thing and should not share a template:

| Section | Proposed treatment |
|---|---|
| `#stay` | **Full-bleed sticky sequence.** Image pinned at 100vh while 3 short captions scroll over it — one per room type. The accommodation is the product; give it the most screen. |
| `#dining` | **Editorial split, image left, text right**, image bleeding off the left edge of the viewport. Inverts the rhythm and uses the strongest render on the page at scale. |
| `#experiences` | **Horizontal scroll strip** of tall 3:4 activity frames. Motion suits activity; verticals suit people. |
| `#gatherings` | **Single wide cinematic plate** (21:9) with the venue capacities as a quiet inline row beneath — no card, no badge. |

Retire the green pill badges. Fold their content into the caption line below each image.

---

### 3.4 Amenities (`#amenities`)

**Purpose** — convey the breadth of facilities.

**Current experience** — the largest section on the page at 1355px, with **61 card elements, 469 words and 7 images at 425×418**. A dense grid.

**Problems**

- *Design.* 61 card elements in one section is a specification sheet. Density signals "value for money"; luxury signals the opposite — it shows three things beautifully and lets you assume the rest.
- *Design.* The square-ish 425×418 crops are the least flattering ratio available for architectural renders, which want either wide or tall.
- *Content.* 469 words is the heaviest block on the page. Each card carries a title, description and feature line, so the reader is asked to parse ~20 micro-documents.
- *Visuals.* Seven images at 425px wide compete with each other; none wins.
- *Interaction.* None.

**Score**

```
Visual Impact:   5/10
Luxury Feel:     3/10
Storytelling:    3/10
Originality:     4/10
User Experience: 6/10

Overall Score:   4/10
```

**Recommended direction** — split into **"the three you will remember" + "everything else."** Promote the pool, the spa and the adventure zone to three tall 3:4 frames with 6–8 words each. Demote the remaining ~17 facilities to a single quiet two-column text list — no cards, no images, no descriptions. This cuts the section roughly in half and makes the top three land.

---

### 3.5 Gallery (`#gallery`)

**Purpose** — show the architectural concepts at leisure.

**Current experience** — 1027px, **17 images at 458×286**, 552 words — the most text of any section.

**Problems**

- *Design.* A gallery is where a viewer wants to *look*. 458×286 is a thumbnail. Seventeen of them at thumbnail scale is a contact sheet.
- *Content.* 552 words inside a gallery is a category error. Pictures should carry this section almost alone.
- *Visuals.* By this point in the scroll the reader has seen these spaces four times already, at a similar size. The gallery adds repetition, not payoff.
- *Interaction.* A slider exists, but there is no lightbox, no full-screen, no zoom — so the images can never be seen larger than 458px anywhere on the site.

**Score**

```
Visual Impact:   4/10
Luxury Feel:     4/10
Storytelling:    3/10
Originality:     4/10
User Experience: 6/10

Overall Score:   4/10
```

**Recommended direction** — make this the page's **cinematic payoff**. Full-bleed, edge-to-edge, one image at a time at `100vw`, advancing on horizontal scroll or drag, with a single caption line and an `03 / 17` counter. Cut the 552 words to under 60 total. Add a full-screen lightbox. This is the section with the most headroom on the entire page.

---

### 3.6 Location (`#location`)

**Purpose** — place the resort geographically and make it feel reachable.

**Current experience** — 931px, 200 words, **19 card elements, zero images**. Distances and routes as text beside an embedded map card.

**Problems**

- *Design.* The only section on the page with **no photography at all**, which makes it read as an administrative appendix.
- *Content.* 200 words of distances and routes presented at equal weight. Nothing is prioritised.
- *Visuals.* A standard embedded map is the single least luxurious component available. Every brand in the benchmark set draws its own.
- *Interaction.* Map interaction is the default third-party behaviour.

**Score**

```
Visual Impact:   3/10
Luxury Feel:     3/10
Storytelling:    4/10
Originality:     2/10
User Experience: 7/10

Overall Score:   3.5/10
```

**Recommended direction** — replace the embedded map with a **custom-drawn minimal map** in the brand palette: cream ground, forest linework, a brass dot for the property, four labelled points (Badami, Bagalkote, Hubli airport, Belagavi). Lead with a landscape plate of the surrounding region. Reduce the routes to three lines — *From Bengaluru · From Hubli · Nearest airport* — and drop the rest to a footnote.

---

### 3.7 Highlights (`#highlights`)

**Purpose** — "why choose us."

**Current experience** — 818px, 6 cards, 176 words, no images.

**Problems**

- *Content.* **This section has no reason to exist.** It restates `#amenities`, `#stay` and `#gatherings` in summary form. A reader who has scrolled 8,000px has already been told all of it.
- *Design.* Six equal cards — the third equal-card grid on the page after `#amenities` and `#location`.
- *Visuals.* No imagery, so it reads as filler before the offer.

**Score**

```
Visual Impact:   3/10
Luxury Feel:     3/10
Storytelling:    2/10
Originality:     2/10
User Experience: 6/10

Overall Score:   3/10
```

**Recommended direction** — **delete it.** If a summary is wanted, replace the whole section with one centred sentence on generous cream — 12 words, 44px, nothing else. Removing ~818px here tightens the ending considerably. If stakeholders insist on retaining it, it should become a single line of four numerals (venues, outlets, acres, categories), not six cards.

---

### 3.8 Offers / Membership (`#offers`)

**Purpose** — drive Privilege Club signups.

**Current experience** — 694px, one 615×519 image, a `Sparkles` icon with "180 Privileges", heading at 36px.

**Problems**

- *Design.* The heading drops to 36px here while every other section is 44px — the commercial moment is set *smaller* than the editorial ones. Backwards.
- *Content.* "Unlock 180 luxury privileges" uses both a hype verb and a round-number claim. "Unlock" is the exact register premium hospitality avoids.
- *Visuals.* The `Sparkles` icon is the one genuinely off-brand element on the page — it belongs to SaaS marketing, not a resort.
- *Design.* Visually indistinguishable from the editorial sections around it, so the one commercial ask does not stand out.

**Score**

```
Visual Impact:   5/10
Luxury Feel:     4/10
Storytelling:    4/10
Originality:     3/10
User Experience: 6/10

Overall Score:   4.5/10
```

**Recommended direction** — give it **the page's only inverted palette** besides the closing band: forest ground, cream type, brass rule. Remove the `Sparkles` icon entirely. Rewrite to a plain statement of what membership gives. Raise the heading to at least 44px. Being the only dark section in the middle of the page makes it unmissable without any decoration.

---

### 3.9 Closing (`#contact`)

**Purpose** — final invitation.

**Current experience** — 702px, forest background, a **1440×702 full-bleed image** — the only one on the page below the hero. 39 words. The most confident section after the hero.

**Problems**

- *Design.* Only 702px tall — it should be the deepest breath on the page.
- *Design.* The secondary "Find us on map" link carries **inline styles** (`color`, `fontSize`, `display`, `gap`) rather than a class, so it sits outside the design system.
- *Content.* "Plan your stay in northern Karnataka" is a navigation label where an invitation belongs.

**Score**

```
Visual Impact:   7/10
Luxury Feel:     7/10
Storytelling:    5/10
Originality:     5/10
User Experience: 8/10

Overall Score:   6.5/10
```

**Recommended direction** — take it to `100svh`, reduce to one line and one action, and move the inline styles into `globals.css`. Let the closing frame be as quiet and as large as the opening one, so the page ends where it began.

---

## 4. Repetition audit

### 4.1 Identical layouts

| Pattern | Occurrences | Verdict |
|---|---|---|
| Text-left / image-right showcase | **4** — `#stay`, `#dining`, `#experiences`, `#gatherings` | Literally the same two CSS classes reused. The dominant failure. |
| Equal-card grid | **3** — `#amenities` (61), `#location` (19), `#highlights` (6) | Three grids of equal boxes. |
| Eyebrow → 44px heading → paragraph → pill button | **9 of 11** sections | One opening gesture for the whole page. |

### 4.2 Measured uniformity

- **Container:** 1325px on 13 of 14 `.wrap` elements. Nothing on the page is ever wider or narrower. This single fact causes most of the monotony — with one width, there is no possible visual surprise.
- **Vertical rhythm:** 76px, 84px ×5, 79.2px ×3, 86.4px. A 10px spread across the entire page. Every section arrives at the same interval, like a metronome.
- **Type scale:** 44px headings in 9 of 11 sections. No section is ever *loud*.
- **Background:** 10 of 12 sections share the same cream. No tonal movement across 11,412px.
- **Image scale:** every in-content image lands between 425px and 672px wide. The page has no close-up and no wide shot — only mid-shots.

### 4.3 Where variation is needed

A premium page should move between at least four gears. Proposed assignment:

| Gear | Treatment | Apply to |
|---|---|---|
| **1 — Cinematic** | 100vh, full-bleed, ≤15 words | Hero, `#story`, `#gallery`, `#contact` |
| **2 — Editorial** | asymmetric, image bleeding off one edge | `#dining`, `#gatherings` |
| **3 — Sticky narrative** | pinned image, captions scrolling over | `#stay` |
| **4 — Quiet index** | text-led, no cards, generous air | `#amenities` overflow, `#location` |

Alternating these breaks the metronome. The rule of thumb: **no two adjacent sections should share a gear.**

---

## 5. Luxury hospitality benchmark

Measured against Aman, Six Senses, Four Seasons, Banyan Tree, Rosewood, COMO and Habitas.

| Trait | Benchmark standard | Golden Hills | Gap |
|---|---|---|---|
| Image scale | 100vw full-bleed is the default | One instance on the page; content images ~670px | **Critical** |
| Words per section | 15–40 | 60–552 | **Critical** |
| Vertical rhythm | Deliberately irregular | 76–86px everywhere | **Critical** |
| Human presence | People in most frames | **Zero people anywhere** | **Critical** |
| Motion | Slow reveals, parallax, drift | None below the hero | **Major** |
| Silence | Large empty areas carry mood | Every area is filled | **Major** |
| Navigation | 4–6 items | **10 items + CTA** | **Major** |
| Typography | Display faces at 64–120px | Capped at 44px | **Major** |
| Colour discipline | Excellent | **Excellent** | None |
| Type quality | Excellent | **Excellent** | None |
| Honesty of claims | Varies | **Better than most** | None |

**Would this feel like a ₹40,000/night resort website?** Not yet. It currently reads as a very well-built ₹8,000–12,000/night property site — competent, trustworthy, informative.

**What is missing, precisely:**

1. **Scale.** Luxury is communicated by how much screen you are willing to give one image. This page never gives more than 47%.
2. **Silence.** Every section explains itself. Premium brands let the reader fill gaps; the restraint *is* the signal.
3. **People.** Nothing on the page shows a human being. A resort sells a feeling of being somewhere — currently the viewer is shown empty rooms.
4. **Pacing.** Eleven sections at an identical interval. Real luxury pacing is irregular: long, short, very long, pause.
5. **A single memorable moment.** There is no one frame a visitor would describe to someone else afterwards.

The honest framing: **the craft is already at benchmark level. The composition is not.** That is a much better position to be in than the reverse — this is a layout and editing problem, not a taste or skill problem.

---

## 6. Typography audit

**Working well** — General Sans for display and Inter for body is a confident pairing. The scale in `tokens.css` is coherent, tracking on large display text is correctly negative, and the brand voice is consistent.

**Problems**

| Issue | Evidence | Fix |
|---|---|---|
| No tonal range | 44px headings on 9 of 11 sections | Introduce a 72–96px tier for 2–3 cinematic moments |
| Commercial moment under-set | `#offers` at 36px, smaller than editorial sections | Raise to ≥44px |
| Text density | `#gallery` 552 words, `#amenities` 469, `#location` 200 | Target ≤60 words per section outside `#story` |
| Small text volume | **145 text nodes below 12px at every breakpoint** | Audit; nothing informational should sit under 12px |
| Headline register | "A family-friendly retreat taking shape in northern Karnataka" | Headlines should evoke; move qualifiers to body |

**Where to cut text:** `#gallery` (552 → ~60), `#amenities` (469 → ~150), `#location` (200 → ~80), `#highlights` (176 → 0, section deleted). That is roughly **1,100 words removed** — about 40% of the page's body copy.

**Where whitespace should increase:** above and below the two or three cinematic plates, which need 120–160px of air to register as moments rather than sections.

---

## 7. Image & photography audit

**Current inventory**

| Section | Rendered size | Verdict |
|---|---|---|
| Hero | 1498×844 | Correct |
| `#story` | 601×412 | Far too small for the opening statement |
| `#stay` / `#dining` / `#experiences` / `#gatherings` | 672×420 each | Mid-shots; no variation |
| `#amenities` | 425×418 ×7 | Too small, worst possible ratio |
| `#gallery` | 458×286 ×17 | Thumbnails in a section meant for looking |
| `#location` | none | A missing opportunity |
| `#contact` | 1440×702 | Correct |

**Findings**

1. **Only two full-bleed images exist** on an 11,412px page. Benchmark sites use 5–8.
2. **No ratio variety.** Everything is landscape and mid-sized. There are no tall 3:4 portraits, no 21:9 panoramas, no close-up details.
3. **No detail shots.** No texture, material, food, water, linen or light study. Detail is what makes a render feel like a place rather than a plan.
4. **No people.** The most significant single gap on the page.
5. **Images are never shown larger than 672px anywhere on the site** — there is no lightbox, so the viewer physically cannot see the architecture at scale.

**Recommendations**

- Promote `#story`, `#gallery` and one of the four showcases to **full-bleed `100vw`**.
- Introduce **tall 3:4 crops** for `#experiences` and the three promoted amenities.
- Add a **21:9 panorama** for `#gatherings`.
- Add a **lightbox** to `#gallery`.
- Commission or render **4–6 detail shots** (water surface, a laid table, a doorway, morning light on stone) and interleave them between sections as full-width breathing plates with no text.
- Where renders permit, **add human figures**. If the renders cannot support it, use silhouettes or distant figures — anything that implies occupancy.

---

## 8. Animation audit

**Current state, measured:** `Reveal` (a 0.7s opacity + 28px rise, `once: true`, `cubic-bezier(.22,1,.36,1)`) is **imported into `page.tsx` and used zero times**. The only motion on the landing page is the hero opening sequence and its slideshow crossfade. `ConceptFigure` has no motion. From `#story` to the footer, **nothing animates**.

So the brief's concern about repetitive animation is inverted: the problem is that the page is inert.

| Recommendation | Reason |
|---|---|
| **Apply the existing `Reveal`** to section headings and images, with a 60–80ms stagger | It is already written, tested and reduced-motion aware. Highest value for lowest risk. |
| **Slow it to ~0.9s** with a 40px rise for cinematic plates | 0.7s/28px is a UI transition. Luxury motion is slower and travels further. |
| **Add slow scale drift (1.0 → 1.06) on full-bleed images** while in view | Makes a still render feel inhabited. The single most effective cinematic device available. |
| **Add Ken Burns drift to hero slides** during the 7s hold | Currently a crossfade between stills; drift makes it feel filmed. |
| **Sticky pin for `#stay`** with captions scrolling over a fixed image | Creates the page's one genuine narrative moment. |
| **Image hover: 1.02 scale over 400ms** on the showcase cards | Currently no hover feedback on any image. |
| **Do not add:** parallax on text, bouncy springs, letter-by-letter reveals, scroll-jacking | They would cost the restraint the page currently has. |

Every recommendation must stay behind `useMotionPreference()`, which the codebase already implements correctly.

---

## 9. Mobile experience audit

Measured at 390×844. Tablet measured at 834×1112.

| Metric | Desktop | Tablet | Mobile |
|---|---|---|---|
| Page height | 11,412px | 14,426px | **16,941px** |
| Horizontal scroll | none | none | none ✓ |
| Nav links | 24 | 24 | 24 |
| Text under 12px | 145 | 145 | 145 |
| Tap targets under 44px | 48/66 | 39/70 | **38/70** |

**Problems**

1. **16,941px is roughly 20 screens of scrolling.** On a phone this is an endurance test. The cuts in §6 (~40% of body copy) plus deleting `#highlights` would bring it to a defensible ~11,000px.
2. **38 of 70 tap targets are under the 44px minimum** — more than half. This is the most concrete usability defect found anywhere in the audit and affects real users, not just aesthetics.
3. **145 text nodes under 12px** do not scale up on mobile. Small type that is merely tight on desktop becomes unreadable on a phone held at arm's length.
4. **Section order is unchanged from desktop.** On mobile, `#amenities` (the longest and densest section) arrives third, before the reader has committed. It should drop below `#dining`.
5. **The 4-section repetition is worse on mobile**, not better: stacked single-column, the four showcases become eight near-identical alternating text/image blocks in sequence.
6. **Images stay small.** On mobile there is no reason for an image not to be edge-to-edge — the gutter costs scale and buys nothing.

**Recommendations**

- Full-bleed every image on mobile (`100vw`, no gutter).
- Enforce a 44px minimum on all interactive elements.
- Raise minimum font size to 12px, and to 13px for anything informational.
- Reorder: hero → story → stay → dining → gallery → experiences → gatherings → amenities → location → offers → contact.
- Collapse the 10-item nav to 5 primary items plus "More".

---

## 10. Improvement roadmap

### Priority 1 — Critical (required for the page to read as premium)

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | **Break the 1325px container.** Introduce a full-bleed utility and apply it to `#story`, `#gallery` and one showcase | M | **Highest** |
| 2 | **Differentiate the four identical showcases** — four distinct treatments per §3.3 | L | **Highest** |
| 3 | **Cut ~1,100 words** (`#gallery` 552→60, `#amenities` 469→150, `#location` 200→80) | M | High |
| 4 | **Delete `#highlights`** or reduce it to one line | S | High |
| 5 | **Hero to `100svh`**; reduce the lower-left to one headline and one action | S | High |
| 6 | **Fix 38 sub-44px tap targets** on mobile | S | High (usability) |
| 7 | **Break the 76–86px rhythm** — introduce 40px, 80px and 160px tiers assigned by gear | M | High |

### Priority 2 — Major

| # | Change | Effort | Impact |
|---|---|---|---|
| 8 | Apply the existing `Reveal` with stagger; slow to 0.9s for cinematic plates | S | High |
| 9 | Add scale drift on full-bleed images and Ken Burns on hero slides | M | High |
| 10 | Rebuild `#gallery` as a full-bleed one-at-a-time experience with a lightbox | L | High |
| 11 | Invert `#offers` to forest ground; remove the `Sparkles` icon | S | Medium |
| 12 | Replace the embedded map with a custom brand-palette map | M | Medium |
| 13 | Introduce a 72–96px display tier for 2–3 moments | S | Medium |
| 14 | Reduce nav from 10 items to 5 + "More" | S | Medium |
| 15 | Add 4–6 full-width detail plates between sections | M | High |
| 16 | Reorder mobile sections; full-bleed mobile images | M | Medium |

### Priority 3 — Refinements

| # | Change | Effort | Impact |
|---|---|---|---|
| 17 | Retire the green pill badges over images | S | Medium |
| 18 | Move `#contact`'s inline styles into `globals.css` | S | Low (hygiene) |
| 19 | Raise minimum font size to 12px; audit the 145 sub-12px nodes | S | Medium |
| 20 | Add 1.02 hover scale to showcase images | S | Low |
| 21 | `#contact` to `100svh` | S | Medium |
| 22 | Rewrite `#story` heading to evoke rather than position | S | Medium |
| 23 | Replace `Stay · Dine · Gather` with a promise | S | Low |
| 24 | Add human figures to renders where feasible | L | **High** |

---

## 11. Final evaluation

```
Current Experience Score:          5.5/10
Expected Score After Priority 1:   7.5/10
Expected Score After Priority 1+2: 9/10
Expected Score After All:          9.5/10
```

A 10/10 is not reachable through layout alone — it would require original photography of a built property with people in it. With renders of an unbuilt resort, **9.5 is the honest ceiling**, and it is reachable.

### What separates this from a world-class luxury resort website

**It is not craft.** The typography, palette, component quality and copy honesty are already at benchmark standard — better than many sites in the comparison set. Nothing here needs to be rebuilt.

**It is editing and scale.** Four things separate this page from Aman or Six Senses:

1. **The page never shuts up.** Benchmark sites use 15–40 words per section. This one averages far more and peaks at 552. Luxury is confidence that the picture is enough.

2. **The page never gets loud.** One container width, one heading size, one spacing interval, one image scale for 11,412 pixels. Without contrast nothing can feel like a climax — and a page with no climax has no memory.

3. **The page never stops explaining.** Every section is complete and self-justifying. Nothing is withheld. Desire is created by the gap between what you are shown and what you imagine; this page closes every gap.

4. **The page is empty of people.** Every frame shows an unoccupied space. A resort sells *being somewhere*, and currently the viewer is shown property rather than experience.

The encouraging part: all four are **subtractive**. The fix is mostly removing words, removing sections, removing cards, and letting the images already in hand be much larger. The hard work — the design system, the palette, the type, the honest voice — is done.

**Start with one change:** let the `#gallery` images touch the edges of the screen. That single move will demonstrate more about where this page can go than any amount of further analysis.

---

*Prepared as a design consultancy document. No code, styling, asset or configuration file was modified in producing it.*
