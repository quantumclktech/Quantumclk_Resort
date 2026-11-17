# Golden Hills — Through the garden gate

## Checkpoint

`5253b4c` preserves the previous Golden Hour page, assets, source PDFs, and review evidence. Redesign work is left as a working-tree diff against that commit.

## Reference review

All four supplied sites were opened in Chrome at 1440×900 and 390×844, including a desktop scroll sample.

- **Meritage:** forest-green hospitality palette; centred opening followed by an image that expands across the viewport. Its navigation separates resort links, centred identity, and account/booking actions on desktop, then compresses to menu, identity, and booking on mobile. Take that clarity and image scale, not its offers or claims.
- **ERA:** distinctive condensed identity; the mobile hero combines large lettering with a full-view architectural pool render. The desktop capture remained on its opening identity screen, so subsequent desktop transitions were not verified.
- **Vander:** alternating image sizes, asymmetric typography and comfortable interruptions in the page rhythm. Take its willingness to break a grid, not the handwriting or numbered hotel categories.
- **Tidescape:** typography is an active visual element, with a loose image collage around it. Its mobile text and floating template controls compete for space. Golden Hills instead gives its single strongest render priority.
- **Current Golden Hills:** sound factual disclosures and navigation, but an almost constant heading/body/grid rhythm, and a hero image taking up only part of the desktop opening.

## Art direction

The illuminated niche, pale masonry and pool in the actual supplied renders are the creative starting point: a passage from the garden gate into a little world of its own. This is a concept presentation, not an operating hotel's sales site.

### Tokens

- Paper `#F7F2EC`: warm, pale masonry background.
- Forest `#104028`: primary text, deep chapter background, CTA.
- Limestone `#E0DDCF`: quiet secondary surfaces.
- Garden `#D8DFCF`: dining chapter background.
- Brass `#B88828`: sparing accents drawn from the proposed lighting and provisional identity.
- Chalk `#FFFCF4`: reversed text and pale controls.
- Ink `#18241D`: primary readable text on pale surfaces.

All colors live in semantic CSS properties. This remains a provisional brand palette.

### Typography

- **Bodoni Moda**, regular, for the opening and a few expressive statements. Its optical contrast relates to the provisional logo.
- **Manrope**, variable, for navigation, reading copy, captions and strong contrasting chapter headings.
- Sentence case, restrained label tracking; no decorative numbering, faux awards or invented metadata.

### Composition

```text
Desktop                                  Phone
resort links / logo / plan actions       Menu / logo / Book Now
|                                        | pool fills the screen
| full-bleed pool + quiet headline        | headline in sky zone
| pool/arch remain unobstructed           | arch + water visible
| contextual copy / Explore the vision   | CTA / render disclosure

off-centre concept statement             compact concept statement

entrance text  |                          entrance / render
pool text     | sticky three-view story   pool / render
terrace text  |                          terrace / render

large arrival view / small interior       large arrival / smaller interior
different dining scales on garden green  readable, offset normal-flow images
dark, wide bar chapter                    dark bar chapter
wide gathering view / compact caption    gathering view / compact text
typographic closing / useful footer      short closing / useful footer
```

### Motion and accessibility

- One coordinated hero arrival, with a visible server-rendered fallback. Over 70svh of native scroll, the render opens through an arch-shaped mask, settles from a small zoom, and receives the headline as the single provisional logo docks into a fixed masthead.
- The cream-backed masthead remains fixed through every light and dark section. Desktop keeps resort navigation left, the logo centred, and Login/Book Now/Enquire right; mobile keeps Menu, logo, and Book Now clear, with grouped links inside the menu.
- Login, Book Now, and Enquire lead to an honest pre-launch status route because no authentication, booking inventory, or verified contact channel exists.
- A bounded desktop sticky cottage composition reveals three separately labelled design views. An arched aperture opens out from the entrance into the full courtyard view; the label and disclosure stay outside the image transition. Ordinary browser scrolling controls progress and exits naturally.
- Phones and reduced-motion users receive the three views in normal document flow. Reduced motion also bypasses all reveal effects.
- Other chapters use a small set of differentiated image-only transitions. Body copy remains stable.
- Native links, visible focus, keyboard-operable navigation; no wheel handlers in application code.

## Pre-build critique

The initial idea of cream backgrounds and serif statements everywhere repeated the old page. Revised: spend the dramatic typography on the opening, use a strong sans-serif cottage title, give dining a garden-green surface, and make the bar a distinct dark chapter. The arch informs the journey and a few details, rather than becoming a repeated decorative card shape. No collage of stock imagery, ornamental badges or identical section templates.

## Render constraints

The p. 37/p. 35 hero images and p. 32–34 cottage views are only 1586×992. Use these with restrained crops; do not manufacture high-resolution detail or interpolate a day/dusk sequence. A full-width 1440px desktop hero is near their native width at DPR 1 and needs a 3000–4000px re-export for crisp DPR 2 displays. The mobile opening uses p. 35's centred arch, but a dedicated portrait render is preferable. Interior alternatives and dining proposals remain unapproved concepts.
