# Vantage: Style Reference (editorial light/dark)

> An institutional instrument dressed as an editorial page. Type and hairline rules carry the structure; the page alternates full-light and full-dark bands down its length; the product is shown, not described. Reference point: a defense-software marketing site (Palantir), not an agency site.

**Theme:** dual-tone. Every band is either `.tone-light` or `.tone-dark`, and the page alternates between them.

---

## Tokens: tone-aware color

The palette is **semantic and tone-aware**. Neutral names resolve to a light set on `:root` and flip to a dark set under `.tone-dark`. A section paints itself from `--bg` / `--fg`, so the alternating rhythm is a matter of one class per band.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--bg` | `#ffffff` | `#0e0f12` | band ground |
| `--bg-2` | `#f2f1ee` | `#16181c` | warm inset / footer / frame bar |
| `--bg-3` | `#e8e7e2` | `#1e2128` | deeper inset, code wells |
| `--fg` | `#16181c` | `#f4f4f2` | headings, key figures |
| `--fg-muted` | `#565a62` | `#a7abb2` | body, descriptions |
| `--fg-faint` | `#83878f` | `#787d86` | labels, fine print |
| `--rule` | `#e4e3df` | `#2a2d33` | hairline inside a container |
| `--rule-strong` | `#c7c6c1` | `#3c414a` | object perimeters, section edges |

`--ink` (`#16181c`) and `--paper` (`#ffffff`) are **fixed** regardless of tone: they build the floating pill's default fill and the ink CTA block, which must not invert with the band behind them.

### Status colors
`--status-nominal / -watch / -threat` each carry one meaning (pass · monitor · threat) and are **tone-aware**: a darkened variant on light surfaces (`#1f9d57 / #9a7400 / #cf3d2c`) so a verdict clears text contrast on white, and the bright originals (`#3ad389 / #ffca16 / #ff6b5f`) under `.tone-dark`. Never decorative, never a fourth accent.

### Back-compat aliases
The original dark-only names (`--surface-canvas`, `--surface-panel`, `--text-primary`, `--rule-edge`, …) are **pinned to fixed dark values** in `:root`. They exist only so the `demo/` console and the `visualization/` app keep their instrument interiors with minimal edits. **Marketing pages never use them.** If a demo/viz color drifts, check this block first.

---

## Tokens: type

**Geist** carries prose and display; **Geist Mono** carries every figure, label, hash, timestamp, and machine readout. Geist replaced Space Grotesk (which had become the default display face of scaffolded product pages); it is a neo-grotesque in the same family of shape as Palantir Sans, which is the register this redesign wants.

| Role | Token | Value |
|------|-------|-------|
| micro | `--text-micro` | 11px (mono indices, tags) |
| caption | `--text-caption` | 12.5px (eyebrows, fine print) |
| body-sm / md / lg | | 14 / 16 / 19px |
| lede | `--text-lede` | `clamp(19px, 1.6vw, 23px)` |
| h3 | `--text-h3` | `clamp(21px, 2.2vw, 28px)` |
| h2 | `--text-h2` | `clamp(28px, 3.4vw, 46px)` |
| h1 | `--text-h1` | `clamp(38px, 5.4vw, 74px)` (hero) |
| statement | `--text-statement` | `clamp(30px, 4.4vw, 60px)` (the argument line) |
| display | `--text-display` | `clamp(40px, 7vw, 104px)` |

Weights: 400 body, 500 medium, 600 headings/display, 700 available. Tracking: `--tracking-display` `-0.03em`, `--tracking-tight` `-0.02em`, `--tracking-label` `0.16em` (uppercase Geist eyebrows). Capability names are set at `clamp(26px, 3.8vw, 52px)` locally — big and scannable, one per row.

---

## Tokens: space & shape

Base unit 4px, scale 4→144 (carried from the original). `--page-max-width` 1240px, `--header-height` 60px, `--header-inset` 14px (the pill's gap from the top), `--anchor-offset` 104px.

Radii: `--radius-sm` 4px (buttons, inputs, cards), `--radius-nav` 16px (the floating pill), `--radius-pill` 999px (footer chips). **The two-tone CTA blocks are square (0 radius)**, per the reference.

Section rhythm: `--section-pad` 96px, `--section-pad-tight` 64px, `--section-pad-lg` 128px.

---

## The band rhythm

The load-bearing decision: **the page alternates light and dark bands**, and each band's tone is chosen to suit its content. The landing page runs:

| # | Section | Tone | Why |
|---|---------|------|-----|
| 1 | Hero `#top` | dark | product-in-a-frame under a centred statement; the reference's opening move |
| 2 | Statement | light | the argument line at display scale, black on white |
| 3 | Capabilities `#capabilities` | dark | eight giant names on charcoal (the Warp-Speed look) |
| 4 | Platform `#platform` | light | the four-stage pipeline |
| 5 | Evidence `#assurance` | dark | discriminator + gate + seal read as instrument |
| 6 | Who it's for `#segments` | dark | blueprint line-art on charcoal (`.divider` separates it from Evidence) |
| 7 | Closing CTA `#contact` | light | the grey + ink CTA blocks need a light ground to read as a pair |
| 8 | Footer | light | multi-column, warm-grey |

Four dark, four light. Where two same-tone bands meet (Evidence → Who-it's-for), a `.divider` hairline carries the boundary. Contact, 404, and the orbit-map wrapper are single-tone **light** pages (the pill is its light form from the first pixel there).

---

## Components

### Floating pill header
Fixed, inset from the top, rounded (`--radius-nav`), pointer-events only on the pill so the flanks never block the hero. **Default state is a frosted light pill** (ink text) — correct over any light page. On the landing page only (`body.has-dark-hero`), the un-scrolled state goes transparent with white content over the dark hero; the first scroll (`#hdr.scrolled`, set by `site.js`) drops back to the light pill. Everything inside inherits `currentColor`, so the whole lockup inverts with one property. The brand SVG mark is `fill:currentColor` for the same reason. Desktop shows four in-page anchors + a bordered "Request a briefing" button; below 1040px the links collapse into a light dropdown that also surfaces the two `.nav-extra` destinations (orbit map, briefing).

### Buttons
`.btn` is bordered and **inverts on hover** (fill `--fg`, text `--bg`); `.btn-solid` starts filled. Both read from `--fg`/`--bg`, so they adapt to their band. There is no third button style; priority is fill vs outline.

### Two-tone CTA blocks
One warm-grey block (`#ecebe7`), one ink block (`#16181c`), **always those literal colors regardless of band tone**, so the pairing reads the way the reference does. Square corners; the arrow slides on hover.

### Editorial capability list
The centrepiece of `#capabilities`: a stack of big names on a shared `--rule`, each a `<details>` collapsing its mechanism. Resting state is eight names + mono metrics at uniform 44px+ summary height, scannable as a catalog; the description opens on demand (`+` becomes `−`). The `.big` figure in each metric resolves digit-by-digit on scroll (see below).

### Blueprint figure
Line-art drawn in `currentColor` (so it inverts with its band), labelled in Geist Mono, in the reference's schematic style: an orbit line with three marked nodes (proximity, pattern-of-life, orbital-compute) and leader labels. Decorative-but-honest; the real audience copy sits in the `.seg-grid` below it.

**Superseded (2026-09-17).** The blueprint and both discriminator schematics are retired under the no-computer-designed-imagery mandate. Their replacements, and the rules that now govern imagery:

### Photography
Real photographs only, and only as context, never as evidence: a product claim still requires product output. Source order: NASA (public domain, credit with mission and photo ID in the mono caption tier) first; ESA (CC BY-SA, attribution in caption) only when NASA has no usable subject. Natural color, at most a subtle darken to seat into a dark band, no duotone, no filter that makes a photograph read as an illustration. The `#segments` figure is `.photo-figure`: NASA iss073e0703405, Cygnus XL on ISS approach, cropped 10:3, webp with srcset. Never use a render, a computer-designed model, or AI-generated imagery where a photograph or product output can stand.

### Product-output figures
The discriminator charts are exported by the engine (themed copies land in `assets/figures/`). Each figure carries its provenance inside the artwork: engine version, data source, scenario id, and the seeded-vs-real distinction. The benign case is real (GRACE-FO 1/2 from public element sets); the figure lead reads "Product output", never "Schematic". Regenerate by re-running the exporter; never edit an exported SVG by hand.

### Framed figure (browser chrome)
`.frame` + `.frame-bar` with three dots and a URL, wrapping the console screenshot (hero) and the orbit-map iframe. `console-preview.js` lays the live `/demo/` over the still once the frame is centred in view; `#shot-stage` scales the 1584×928 demo into the column via `--shot-scale`.

### Metric rail
Three cells on one `--rule`, mono figures over muted labels, no enclosing box. Carries the hero's three real findings + the provenance note that makes them checkable. Collapses to stacked rows below 820px.

### Assurance panel & gate
Framed figure at full width: a chrome header with the policy name and verdict chip, a two-column body with the four-cell gate tally (PASS green, MONITOR amber) and the sealed `sha256`. The verdict chip and gate are never animated into existence — a status color only appears where that exact state is being reported.

### Footer
Warm-grey (`--bg-2`), four columns (brand + statement + link columns), a row of pill chips, and a `.foot-bot` with copyright and the sealed-evidence badge. Social links are intentionally absent (no dead links); the pill chips are the visual echo. Add real socials as pills in `.social-row` when handles exist.

---

## Motion
`--motion-fast` 160ms (hover), `--motion-mid` 320ms (the pill's tone change), `--motion-reveal` 680ms (scroll reveal), easing `cubic-bezier(0.16,0.84,0.3,1)`. `site.js` drives: the mobile menu, the scrolled-header state, the scrollspy `aria-current`, the digit-by-digit figure resolve (`.cap-metric .big`, `.gate .gv`, `.seal .digest`), and staggered `.reveal`. All motion is disabled under `prefers-reduced-motion`, and every page ships a `<noscript>` reveal override so a script-off visitor sees everything.

**Dropped from the original on purpose:** the hero intro flight, the star field, and the animated wireframe spacecraft. The product screenshot in a browser frame is more faithful to the reference and simpler. `scripts/hero-satellite.js` and `capability-demos.js` are not carried into this folder.

*(2026-09-17: an entry experience returned, in a different form that keeps every reason the old one was dropped. See "Entry: the orbit approach" below — real instrument output instead of a drawn spacecraft, overlay-only instead of a veil that could strand a visitor, two seconds instead of a flight sequence.)*

---

## Do's and Don'ts

### Do
- Alternate band tones; choose each band's tone to suit its content, and separate same-tone neighbours with `.divider`.
- Put every figure, label, hash, and readout in Geist Mono; all prose in Geist.
- Keep `--ink`/`--paper` fixed on the pill and the ink CTA block.
- Give the console screenshot and the orbit-map app the same browser frame.
- Keep interactive targets at 44px+.

### Don't
- Never use the back-compat alias tokens on a marketing page.
- Never add a status color decoratively or introduce a fourth accent.
- Never round the two-tone CTA blocks.
- Never write an em dash. Use a comma, colon, period, or restructure.
- Never let a marketing band go tone-less: it must declare `.tone-light` or `.tone-dark`.
- Never fabricate a readout on a schematic; anything that looks like product output must be product output (`/demo/` embedded live).

## Naming: the product lexicon (added 2026-09-17)

The eight models now sit under a two-product umbrella. Names, scopes, and set forms:

| Name | Set form | Scope |
|---|---|---|
| THE COMMAND CENTER | mono, uppercase in labels; "the Command Center" in prose | The operating surface, formerly "Mission Console". Every link to `/demo/` reads "Open the Command Center"; the URL stays `/demo/`. |
| ORBWATCH | mono, uppercase, bare word, never compounded | Read the sky. Five models: maneuver detection, intent classification, pattern of life, proximity and rendezvous watch, collision risk screening. Anchor `#orbwatch`. |
| GUARDIAN | mono, uppercase, bare word, never compounded | Guard the fleet. Three models: defensive maneuver response, sensor tasking, spacecraft health monitoring. Anchor `#guardian`. |

Pipeline attribution: Ingest is platform substrate, Detect and Assess belong to ORBWATCH, Report lands in the Command Center. GUARDIAN and the fleet-health watch ride as a footnote line under the rail; no fifth stage is invented.

Rules. The section id stays `#capabilities` (inbound links keep working; the nav label is "Products"). Product names are always the bare uppercase word so a rename is a global case-sensitive find and replace. A product never claims a surface the console does not have; models are presented with benchmark metrics, not UI claims.

## Motion: scroll-driven enhancement (added 2026-09-17)

Progressive on three levels: CSS scroll-driven animations behind `@supports (animation-timeline: view())`, the IntersectionObserver reveal as the universal fallback, and everything except the clock dead under `prefers-reduced-motion`. Every new held-back state is released in the page's `<noscript>` block. Zero dependencies, as before.

New primitives and rules:

- **Rule-draw**: a chapter head's top hairline draws `scaleX(0)` to `scaleX(1)` over 560ms linear, riding the element's own `.in`. Ported from the sibling build's stage rail, which remains the reference implementation.
- **Wipe-reveal**: photographs and product-output figures arrive as a left-to-right `clip-path` sweep, 900ms `--motion-ease-out`, riding the figure's `.in`. Never applied to text.
- **Terminator crossings**: each band boundary carries a 1px `currentColor` rule whose opacity peaks as the boundary crosses the viewport's entry band. `@supports`-gated CSS only; browsers without scroll-driven animations simply have no terminator. That is the whole band-flip treatment; anything more is costume.
- **UTC clock** (`#utc` in the pill, wide viewports): real system UTC, updated only while the tab is visible. The rule it establishes: **the only time displayed anywhere on a marketing page is real UTC.** A clock is information, so it ticks under reduced motion.
- **Scrollspy rail** (`.rail-spy`, 1440px and up): `S/0x` designators for every top-level section, driven by the same top-band observer logic as the nav scrollspy, `aria-hidden` because the nav already announces position. It takes `.on-dark` from the current section's tone. Below 1440px it does not exist.
- **Sticky chapter heads** (1240px and up): a product chapter's head holds under the pill while its models scroll. The tracking-readout feel comes from position, not animation.
- **Digit-resolve scope** widened to the products counter and the chapter designators. Prose headlines never resolve: instrument, not game HUD.
- **The gate stays still.** Sequential PASS stamping was proposed for the 2026-09 redesign and refused: the gate is a tally of one run, and revealing it in sequence asserts an ordering that does not exist. The existing simultaneous digit-resolve is the ceiling.

## Entry: the orbit approach (added 2026-09-17)

A 2.0-second camera flight from the full Earth into COSMOS 2570, rendered live by the orbit map's own scene, catalog and textures. It is product output, not a video, and not a drawn model: the same `createViz()` that renders `/visualization/`, flown for two seconds.

**The architecture makes blocking impossible.** The page paints completely before the loader (`scripts/entry-approach.js`, a module script old browsers skip natively) even runs. The approach is an additive overlay: nothing beneath it moves, hides, or scroll-locks, so every failure path degrades to the page exactly as it already was. There is no veil state; either the finished overlay fades in over its poster (`assets/leo-visualization.jpg`, the map's own real screenshot) or nothing appears at all.

**The guard gauntlet, all mandatory:** once per session, and the flag is set only when the intro is SEEN, never when it was merely attempted, so a timed-out first visit can still play warm later; no reduced motion; no save-data or 2g; tab visible; page at the top; viewport at least 700px; WebGL present. A 2500ms ready budget covers import, the 1k earth texture (`img/earth-blue-marble-1k.webp`, a quarter of the full sheet's bytes; `/visualization/` keeps the 4k), and the catalog; expiry aborts silently.

**Timing, fixed:** 200ms fade-in overlapping the flight, 1600ms flight (the settle is the hold), 200ms handoff fade: 2.0 seconds visible, total. Any input skips in 250ms. An unconditional 4-second backstop is armed the moment the overlay attaches and never cleared until teardown. A tab going hidden tears down instantly with no fade: nobody is watching.

**The caption is catalog facts only:** name, NORAD id, inclination, plus the map's own standing caveat line ("Synthetic catalog · assessments simulated"). No acquisition vocabulary, no sweeps, no fabricated readouts; those refusals are the sibling build's and they bind here.
