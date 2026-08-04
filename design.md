# Vantage: Style Reference

> An instrument, not a brochure. Type and hairline rules carve structure out of pure black; a four-step surface ladder does the separating; three status colors are the only accents, and each one means exactly one thing.

**Theme:** dark only

Vantage runs on a pure-black canvas (`#000000`) with content lifted onto three progressively lighter near-black surfaces. Hierarchy comes from scale, tracking, and surface level, never from drop shadows or fills. Space Grotesk carries prose at weights 500 and 600; IBM Plex Mono carries everything the engine says, which means every figure, label, timestamp, hash, and status readout. Buttons are ghost outlines without exception. Radii stop at 4px. The single decorative liberty in the system is color, and it is rationed: green, amber, and red appear only where they carry a real state.

The reference point is a mission console, not an agency site. When a choice is between "expressive" and "legible under scrutiny," the system picks legible.

---

## Tokens: Surfaces

A four-step ladder. Steps are sized in CIE L\* so each one is perceptible against its neighbor on a normally calibrated display; WCAG contrast ratios are meaningless at this end of the scale and are not used to size them. **Every level is used in more than one place.**

| Level | Name | Value | L\* | Token | Used by |
|-------|------|-------|-----|-------|---------|
| 0 | Canvas | `#000000` | 0.0 | `--surface-canvas` | `body`, hero, capabilities, who-it's-for, demo console page |
| 1 | Band | `#0c0f14` | 4.2 | `--surface-band` | alternating sections (platform, assurance, closing CTA), footer |
| 2 | Panel | `#151a22` | 9.1 | `--surface-panel` | assurance panel, mission cards, discriminator cases, framed figures, form inputs, demo panels |
| 3 | Chrome | `#1e242e` | 14.0 | `--surface-chrome` | panel header bars, status chips, the footer badge, the contact address block, selected feed rows |

The ladder was previously `0.0 / 2.7 / 5.0 / 9.1`, which compressed three of its four levels into the bottom 5 L\*. That had two visible consequences: a `.band` section was almost indistinguishable from the canvas behind it, so section separation fell entirely to the 1px rule; and a panel sitting inside a band section cleared its background by only 2.3 L\*. Steps are now even at roughly **4.2 / 4.9 / 4.9**. Nothing leaves near-black, and each level separates from its neighbour without help.

Lifting the ladder forced two dependent tokens up with it: `--rule-hairline` and `--text-faint`. Both are recorded below. **If a surface moves again, re-check those two first.**

## Tokens: Rules

Two weights, and only two.

| Name | Value | On canvas | On chrome | Token | Role |
|------|-------|-----------|-----------|-------|------|
| Hairline | `#3d4552` | 2.17:1 | 1.61:1 | `--rule-hairline` | dividers *inside* a container: ledger rows, gate cells, panel header underline |
| Edge | `#525a66` | 3.01:1 | 2.24:1 | `--rule-edge` | structural boundaries: section edges, panel perimeters, button borders, the rule a rail hangs from |

Hairline moved from `#343b44` when the ladder lifted: against the new chrome it measured 1.38:1 and had effectively vanished inside a panel header.

## Tokens: Text

All four tiers clear WCAG AA (4.5:1) on **all four** surfaces. The worst pairing in the system is `--text-faint` on `--surface-chrome` at 4.61:1.

| Name | Value | Min ratio | Token | Role |
|------|-------|-----------|-------|------|
| Primary | `#ffffff` | 15.59:1 | `--text-primary` | headings, key figures, active labels |
| Body | `#e8eaec` | 12.93:1 | `--text-body` | body copy on panels, ledger prose, mission copy |
| Muted | `#a1a4a5` | 6.21:1 | `--text-muted` | secondary copy, descriptions, footer links |
| Faint | `#878c95` | 4.61:1 | `--text-faint` | mono labels, eyebrows, timestamps, fine print |

Faint moved from `#7d828b` when the ladder lifted: against the new chrome the old value measured **4.04:1** and no longer cleared AA. Min ratios above are measured against `--surface-chrome`, the lightest surface and therefore the worst case for every tier.

## Tokens: Status

The only accent colors in the system. Each has one meaning and is applied wherever that state appears, never for decoration. There is no brand accent and no CTA color: a button is never colored.

| Name | Value | Token | Means | Appears on |
|------|-------|-------|-------|-----------|
| Nominal | `#3ad389` | `--status-nominal` | pass, benign, nominal, held by physics | assurance verdict chip, `14 PASS`, the benign-formation case, the contact success chip |
| Watch | `#ffca16` | `--status-watch` | monitor, warning, needs an analyst | `2 MONITOR`, the flagged Δv in the hero schematic |
| Threat | `#ff6b5f` | `--status-threat` | high severity, shadowing, threat | the shadowing case, form validation errors |

The previous palette carried `--color-signal-blue` and `--color-iris-violet`, each used once inside decorative terminal chrome. Both are cut. A sealed hash is not a status and is now typeset in mono body text.

## Tokens: Typography

### Space Grotesk: prose
`--font-sans` · weights 400 / 500 / 600. Only 500 and 600 have tokens (`--font-weight-medium` / `-semibold`); 400 is the body default and is never set explicitly, so it has none.

Headings sit at 500 and sub-headings at 600. Display sizes carry `-0.03em` tracking; nothing above 20px is left at default tracking. Nothing is set in 700.

It replaced Inter, which is the default face of nearly every scaffolded startup page and read as a template no matter what surrounded it. Space Grotesk is wider, has a larger x-height, and reads technical rather than institutional, which is the register this product wants. **It sets optically larger than Inter at the same px**, so the display sizes and the negative tracking were re-checked against it rather than inherited; if the scale changes again, re-check line wrapping at 390px, where the hero headline is closest to breaking.

Overtly sci-fi faces (Orbitron, Michroma, Rajdhani) were rejected on purpose. They read as game HUD or crypto project and work directly against a product whose pitch is auditable evidence for defense buyers. Futurism here comes from proportion, not from styling.

### IBM Plex Mono: machine voice
`--font-mono` · weights 400 / 500 / 600

Everything the system *reports* is mono: figures, eyebrows, section labels, tags, timestamps, the assurance readout, hashes, diagram labels, the contact address. Prose is never mono. This split is the strongest single carrier of the brand.

**Not Space Mono**, the superfamily sibling of the prose face. Space Mono is slab-ish and very wide, which hurts precisely where this system leans on mono hardest: dense timestamps, hashes and the gate readout. Keeping two unrelated families also widens the visible gap between prose and machine voice, which is the point of the split.

### Type scale

| Role | Token | Value |
|------|-------|-------|
| micro | `--text-micro` | 11px (mono labels, tags) |
| caption | `--text-caption` | 12px (eyebrows, badges, fine print) |
| body-sm | `--text-body-sm` | 14px |
| body-md | `--text-body-md` | 16px |
| body-lg | `--text-body-lg` | 19px (lede, mission copy) |
| statement | `--text-statement` | `clamp(23px, 2.9vw, 34px)` |
| h3 | `--text-h3` | `clamp(24px, 3vw, 34px)` |
| h2 | `--text-h2` | `clamp(28px, 3.6vw, 44px)` |
| h2-lg | `--text-h2-lg` | `clamp(30px, 4.4vw, 50px)` |
| display | `--text-display` | `clamp(38px, 6vw, 72px)` |

Tracking: `--tracking-display` `-0.03em`, `--tracking-tight` `-0.02em`, `--tracking-label` `0.2em` (uppercase mono eyebrows only).

## Tokens: Space and shape

**Base unit:** 4px. Scale: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96, 128, 144.

| Token | Value | Role |
|-------|-------|------|
| `--page-max-width` | 1200px | content column |
| `--header-height` | 68px | fixed nav |
| `--anchor-offset` | 108px | `scroll-margin-top`: header height plus 40px clearance, so a jumped-to heading is not flush under the nav |
| `--card-padding` | 32px | card and panel interiors |
| `--section-pad` | 96px | standard section rhythm (`.sec`) |
| `--section-pad-tight` | 64px | compressed sections (`.sec-tight`) |
| `--section-pad-lg` | 128px | the page's larger movements (`.sec-wide`) |

Three tiers, not two. With only two the page ran four consecutive 96px sections through its middle, which is what made it read as one uniform column regardless of what the surfaces were doing.

### Radius

Two values. The system is architectural, not soft.

| Token | Value | Applies to |
|-------|-------|-----------|
| `--radius-xs` | 2px | tags, status chips, badges |
| `--radius-sm` | 4px | buttons, inputs, panels, cards, framed images |

### Motion

`--motion-fast` 150ms (hover and focus), `--motion-reveal` 600ms (scroll reveal), `--motion-ease-out` `cubic-bezier(0,0,0.2,1)`. Reveal stagger is 60ms per sibling, capped at five steps, and applies only within one visual group. All motion is disabled under `prefers-reduced-motion`.

---

## Section separation

This is the system's load-bearing decision, so it is stated as a rule rather than left to each section. A boundary is carried by **three cues together, never one**:

1. Every top-level `<section>` gets `.sec`, which applies `border-top: 1px solid var(--rule-edge)` full-bleed.
2. Sections **alternate** between canvas and `.band`. No section may declare a background equal to the one behind it.
3. Adjacent sections never share both a surface *and* a padding tier. Pace changes across every boundary.

The landing page currently runs:

| # | Section | Surface | Padding |
|---|---------|---------|---------|
| 1 | Hero `#top` | canvas | 144 / 96 |
| 2 | Platform `#platform` | band | 128 |
| 3 | Capabilities `#capabilities` | canvas | 96 |
| 4 | Assurance `#assurance` | band | 128 |
| 5 | Who it's for `#segments` | canvas | 96 |
| 6 | Closing CTA `#contact` | band | 128 |

Two earlier failures this rule is written to prevent, both of which had shipped: `#mission` and `#contact` sat on **canvas back to back**, so one boundary had no surface change at all; and the middle four sections all ran at 96px, so there was no change of pace anywhere in the body of the page.

---

## Components

### Ghost button
Transparent fill, 1px `--rule-edge` border, `--radius-sm`, `min-height: 44px`, 12px/20px padding, Space Grotesk 14px. Hover raises the border and label to `--text-primary`. `.btn-primary` differs only by a brighter resting border (`rgba(255,255,255,.42)`) and a white label. **There is no filled button anywhere in the system**; priority is carried by border and label brightness.

### Eyebrow
Mono 12px, uppercase, `0.2em` tracking, `--text-faint`, preceded by a 26px `--rule-edge` rule. This is the canonical section label: whatever the eyebrow says is what the nav link and the footer link say.

### Status chip
Mono 11px uppercase in `--surface-chrome` with a 6px dot in the status color and a matching 34%-alpha border, `--radius-xs`. Two variants ship, `.chip-nominal` and `.chip-threat`, because those are the two states the site currently reports as a chip. Watch state is carried by the gate readout and the hero schematic instead, so no third variant exists. Add one only alongside the markup that uses it.

### Metric rail
Three or four cells hanging off one `--rule-edge` top rule, divided by `--rule-hairline` vertical rules, with **no enclosing box**. Mono figure at 32px over a 14px muted label. Used for the hero statistics. Collapses to stacked rows with horizontal rules below 560px.

### Capability ledger
Full-width rows on a shared rule: a mono index column, a prose column, and a right-aligned mono metric column. Rows divided by `--rule-hairline`, the set bounded top and bottom by `--rule-edge`. Not a card grid, and deliberately so: it replaced three stacked bordered grids. Rows without a headline figure show the mono sub-label alone.

**Rows stay uniform.** The one-sidedness discriminator was previously embedded inside row 03, which made that row roughly three times the height of every other one and buried the sharpest idea in the product inside a list item. Anything that wants more room than a row is not a row: promote it to a figure below the ledger. Prose here is `--text-body-md` on `--text-body`; at 14px muted, five stacked rows were the densest thing on the page.

A figure headline only earns the `.val` slot if the number is **new**. `84%` and `100%` appear in the hero metric rail, so rows 01 and 03 carry a mono sub-label instead of restating them. Rows 04 and 05 keep their figures because those numbers appear nowhere else.

### Framed figure
`--surface-panel` body, `--rule-edge` perimeter, `--radius-sm`, with a `--surface-chrome` header bar in mono 12px. The only wrapper for a picture of the system: the hero schematic and the real product screenshot both use it, which is what keeps a diagram and a screenshot visually accountable to each other.

### Assurance panel
The page's focal moment. Framed figure chrome at full width, a chrome header carrying the policy name and the verdict chip, then a two-column body: the statement plus the four-cell gate readout on the left, the explanation plus the sealed hash on the right. The gate cells use `--status-nominal` for PASS and `--status-watch` for MONITOR; FAIL and SKIP stay faint because nothing fired.

### Stage rail
Four numbered stages along one `--rule-edge` rule, each marked by a 32px × 3px `--text-primary` tick sitting on the rule. No boxes. Used for the pipeline.

### Mission card
The only bordered card grid on the page, which is what earns it. `--surface-panel`, `--rule-edge` border, `--radius-sm`, 32px padding, a domain mark at the top, a mono kicker, a heading, body copy, and a contact link pinned to the bottom with `margin-top: auto`.

### Domain mark
Line marks at 1.3px stroke in `--text-muted`, drawn from things that mean something in this domain: conjunction geometry with a marked minimum separation, a pattern-of-life cadence with one out-of-character spike. No crosshairs, shields, or stars.

### Explanatory schematic
Inline SVG, hairline strokes, mono labels, status colors where a state is being shown. Always labelled as a schematic and never given console chrome that could read as product output. Two exist: the residual trace in the hero (physics subtracted, Δv marked in `--status-watch`) and the one-sidedness discriminator in orbital compute (benign vs shadowing, identical geometry, the only difference being the Δv).

### Form field
Label in mono 11px uppercase above the control. Control on `--surface-panel` with a `--rule-edge` border, `--radius-sm`, `min-height: 48px`. Invalid state sets `aria-invalid`, a `--status-threat` border, **and** a mono message prefixed with `!` referenced by `aria-describedby`, so the state is never carried by color alone.

### Footer
`--surface-band` with a `--rule-edge` top rule. Four columns: brand statement, then link columns whose headings match the eyebrow of the section they point at. The contact address is plain selectable mono text, not a link.

---

## Do's and Don'ts

### Do
- Alternate section surfaces and give every section boundary a full-bleed `--rule-edge` rule. Both, every time.
- Put every figure, label, hash, and status readout in IBM Plex Mono, and all prose in Space Grotesk. The split is the brand.
- Use `--status-nominal`, `--status-watch`, and `--status-threat` only where that exact state is being reported.
- Let type and index numbers carry a list. Reach for a card grid at most once per page.
- Give a diagram a caption that says it is a schematic, and give a product screenshot the same frame so the two stay accountable to each other.
- Keep every interactive target at 44px minimum, and 44px on coarse pointers at every viewport width.
- Check any new text color against all four surfaces before shipping it.

### Don't
- Never add drop shadows, gradients, glows, or glassmorphism. Separation comes from the surface ladder and the rule weights.
- Never fill a button. Priority is border brightness and label color.
- Never exceed 4px radius.
- Never use a status color decoratively, and never introduce a fourth accent.
- Never draw a fake console, terminal, or fabricated data readout. The site's thesis is receipts; a fabricated screenshot next to a real one undermines the real one.
- Never use stock outline iconography. If a mark cannot be drawn from the domain, use none.
- Never stack more than one bordered card grid in a page. Change the primitive instead.
- Never write an em dash. Use a comma, a colon, a period, or restructure the sentence.
- Never set a section background equal to the surface behind it.

---

## Elevation

No shadows anywhere. Elevation is exactly two mechanisms, used together:

1. **Surface level**: moving up the four-step ladder (canvas → band → panel → chrome).
2. **Rule weight**: `--rule-edge` traces anything that is its own object; `--rule-hairline` divides the inside of one.

A panel reads as raised because it is one step lighter than the section behind it *and* bounded by the heavier rule. Nothing else lifts.

---

## Imagery

One photograph-class asset exists and it is a real screenshot of the product console (`assets/demo-console.png`, 1584×928). It is the page's most important visual and gets a full frame and a link into the live demo. Everything else is authored line work: two explanatory SVG schematics and two domain marks. No stock photography, no illustration, no decorative texture.

The rule that governs this: **anything that looks like product output must be product output.** A schematic is drawn as a labelled diagram so it can never be mistaken for a screenshot.

---

## Layout

Full-bleed surfaces with content constrained to a 1200px centered column (`--page-max-width`, 28px gutters, 20px below 560px). The fixed 68px header blurs the canvas behind it and gains a `--rule-edge` bottom border once scrolled.

The page deliberately changes primitive from section to section: asymmetric hero with a schematic, closing statement, metric rail, product screenshot, stage rail, capability ledger, side-by-side discriminator, focal assurance panel, featured block plus two-card grid, centered closing CTA. Nothing is repeated twice in a row.

**The product is shown early, and on purpose.** The console screenshot is the page's most important visual and the fastest answer to "is this real software", so the platform section carries it directly after the hero: screenshot first, then the pipeline that produces it. It previously sat in section 5 of 8, behind a schematic, a one-line statement, five capability rows and the assurance panel.

### Breakpoints

| Width | What changes |
|-------|--------------|
| ≤1040px | Horizontal nav collapses to the toggle menu |
| ≤900px | Hero, assurance body, discriminator, mission cards, and footer go single-column; stage rail and ledger reflow |
| ≤560px | Nav CTA is replaced by an in-menu contact link, gutters tighten to 20px, metric rail and stage rail stack, gate readout goes 2×2 |
| `pointer: coarse` | All targets reach 44px regardless of viewport width |

---

## The demo console (`/demo/`)

The system covers three pages, not two. `/demo/` is a **product surface**, not a marketing page, and that earns it exactly one exception: it keeps its own shell, a sticky status bar in place of the fixed site header and no footer. Everything inside that shell is drawn from the same tokens as the rest of the site, and it links `tokens.css` and `site.css` like every other page.

It used to be a second design system in the same repository: a private `:root` with a blue-black `#080b11` canvas, Space Grotesk and IBM Plex Sans against the rest of the site's Inter, a `#57a0c4` accent, 6px radii, a glowing status dot, and a filled primary button. It imported neither stylesheet. Since it is the page a buyer clicks into from the landing page, it read as a different company's product.

Two decisions worth keeping:

- **No accent replaced the blue.** The system has three status colors and no brand accent, so the five feed event kinds separate on status where they *are* a status (`k-warn` watch, `k-crit` threat, `k-ok` nominal) and on text tier plus rule weight where they are not (`k-sys` faint on hairline, `k-info` body on edge). An event kind is not a state, and it does not get a color for decoration.
- **Console controls may be compact.** `.chip-btn` is a ghost button that sits below the 44px floor on precise pointers, because a 44px control inside a panel header is wrong for a dense console. It reaches 44px under `pointer: coarse`, so the touch guarantee still holds. This is the only place the floor is relaxed, and the relaxation is pointer-conditional.

## Progressive enhancement

The scroll reveal holds `.reveal` at `opacity: 0` and only scripting clears it, so **every page ships a `<noscript>` override in `<head>`** that forces `opacity: 1; transform: none`. Reveal is driven by one `IntersectionObserver` with a fallback that reveals everything if the API is missing; there is no timeout backstop.

The contact page applies the same principle to its form: the working, script-free path (address, copy button, mailto link) is the *default markup state*, and the form is revealed only when both scripting and a configured `data-endpoint` are present. A failed submission restores the fallback rather than stranding the visitor.

---

## Quick reference

```css
/* Surfaces */    #000000 · #0c0f14 · #151a22 · #1e242e      (L* 0 / 4.2 / 9.1 / 14.0)
/* Rules */       #3d4552 (inside) · #525a66 (structure)
/* Text */        #ffffff · #e8eaec · #a1a4a5 · #878c95      (worst pairing 4.61:1)
/* Status */      #3ad389 nominal · #ffca16 watch · #ff6b5f threat
/* Type */        Space Grotesk 400/500/600 · IBM Plex Mono 400/500/600
/* Sections */    96 · 64 · 128, alternating canvas/band, never both the same twice
/* Radius */      2px · 4px
/* Primary action */ ghost outline, rgba(255,255,255,.42) border, white label: never filled
```

Tokens live in `styles/tokens.css`. The shared shell (reset, sections, nav, buttons, chips, frames, footer, reveal) lives in `styles/site.css` and `scripts/site.js`. Page-specific composition stays in each page's own `<style>` block. All three pages (`/`, `/contact/`, `/demo/`) link both stylesheets.

Two things to check before changing a surface value: `--rule-hairline` and `--text-faint` are both sized against `--surface-chrome` and will silently fall below AA if it moves.
