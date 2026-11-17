# Golden Hills Resort — local landing page

Next.js App Router project using React, TypeScript, and ESLint. The application lives at this repository's root.

The `/` route presents Golden Hills Resort through rooms, cottages, dining, amenities, experiences and gatherings. All supplied property visuals are 3D artist's impressions; they are not photographs. ERP work is separate from this website.

## Requirements

- Node.js 20.9 or newer (setup verified with Node.js 24)
- npm

## Local development

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Stop the server with Ctrl+C.

**Member sign-in (Gold Membership):** `/login`, `/profile` and `/membership` sign guests and members in with Keycloak (realm `gh-guests`, PKCE) through `src/app/guest-auth.ts`; passwords are typed only on Keycloak's page. The welcome-email link is `/member/activate`. API calls go to `/api/v1/portal` on the same origin (`next.config.ts` rewrites `/api` to the gateway on localhost:3000). Settings: `.env.example`. Design: `ERP_DEV/docs/02-architecture/identity/MEMBER-LOGIN.md`.

## Checks and production

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

## Structure

- `src/app/`: root layout, resort page, navigation, and semantic design tokens in `globals.css`
- `DESIGN.md`: reference review, visual concept, responsive story, and source-render constraints
- `review-shots/redesign/`: native screenshots, scroll recordings, and browser verification for the redesign
- `next.config.ts`: Next.js configuration
- `source-assets/pdfs/`: preserved copies of supplied concept PDFs
- `source-assets/resort/scene-masters/`: native extracted images kept outside the public web root
- `public/assets/resort/`: website-ready images, provisional logo, preview contact sheet, and provenance manifest
- `ERP Resort/`: untouched original PDFs (ignored by Git to avoid duplicating assets)
- `.agents/skills/`: project-local agent skills, registered through `opencode.json`
- `skills-lock.json`: installed skill sources and integrity metadata

See `source-assets/README.md` for the asset inventory. Source PDFs are not publicly served.

## Local preview decisions

- **Golden Hills Resort** is the canonical public name used by this website.
- The colored PNG logo in `public/assets/resort/logo/` is extracted from catalogue page 11 and cleaned to transparency without tracing. It is a provisional raster derivative, **not** an approved vector or brand master; the client's final SVG/AI is still required.
- The core semantic palette in `src/app/globals.css` is sampled from the catalogue: forest `#104028`, muted gold `#B88828`, and warm cream `#F7F2EC`, with a separate legible ink token and supporting neutrals.
- `public/assets/resort/asset-manifest.json` records each image's source PDF/page, dimensions, hashes, intended use, and unapproved status. The preview uses only a curated subset; alternatives remain concepts.
- The public page presents 46 rooms and cottages, the documented room categories, six dining outlets, amenities, Mystery Experiences and Loyalty offers. Reservation and official enquiry details are intentionally left for the client’s verified channels.
- Every displayed render has a visible artist's-impression disclosure. The marked pool image (rooms/cottages p. 36), conflicting reception signage (p. 8), and unconfirmed day/dusk transition are excluded.
- Ask the client for approved brand assets, final scheme decisions, higher-resolution hero and portrait render exports, confirmed project details, and permission to publish the chosen images.

## Compare or restore the previous design

Checkpoint **`5253b4c`** (`Checkpoint Golden Hour landing page before redesign`) preserves the working Golden Hour page before the creative redesign, together with its assets and browser evidence. The redesign is an uncommitted working-tree diff against that checkpoint.

Use `git diff 5253b4c -- src package.json package-lock.json` to inspect the implementation changes. To inspect the old page without overwriting current work, create a separate worktree with `git worktree add --detach ../golden-hills-checkpoint 5253b4c`, then run `npm ci` inside it.

## Animation and fonts

- Free `motion` package; React APIs imported from `motion/react`.
- Local font assets: Bodoni Moda and Manrope, supplied through Fontsource packages. No runtime external font requests.
- Hero entrance and differentiated image reveals use opacity/transforms. The desktop cottage story uses a bounded native sticky frame with a single opening aperture and three labelled views.
- Below 1000px, on short viewports, and with reduced motion, the cottage story becomes normal document flow. Reduced motion shows all content immediately and disables the cinematic frame.
- No scroll interception, paid Motion components, or day-to-dusk sequence.

## Agent skills

Installed for OpenCode at project scope:

| Skill | Source |
| --- | --- |
| `frontend-design` | `anthropics/skills` |
| `web-design-guidelines` | `vercel-labs/agent-skills` |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` |
| `motion-react` | `bm629/agent-skills` |

Restart OpenCode from this project folder to load the skills. These are agent instructions; the application separately uses the free `motion` package.

## Setup notes

- ESLint 10 was incompatible with the React plugins used by Next.js's ESLint configuration. ESLint is kept on compatible 9.39.5, which currently emits an upstream deprecation notice during installation.
- The first `motion-react` installation attempt from `pedronauck/skills` failed because that repository no longer listed the skill. Installation from `bm629/agent-skills` succeeded.

## Verification

- `npm ci`: successful; npm reported zero vulnerabilities.
- `npm run lint`: passed.
- `npm run build`: passed; `/` is statically prerendered.
- `npm run typecheck`: passed.
- Production browser review: 390×844, 768×1024, and 1440×900 with normal and reduced-motion preferences. See `review-shots/redesign/report.json`.
- All six PDF copies match their unchanged originals by SHA-256.
