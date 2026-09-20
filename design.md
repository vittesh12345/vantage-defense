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

**Amended 2026-09-17 → superseded 2026-09-22.** The flight no longer ends by fading out. See "Entry: the settle" below; the guard gauntlet, the skip, and the backstop above all survive intact.

## Entry: the settle, and the hero's night sky (added 2026-09-22)

The flight's fade-out ending was rejected: it spent two seconds arriving somewhere and then threw the arrival away, leaving a flat dark band. The render now **stays**. It shrinks, retreats into the hero's upper right, and remains there as the hero's background, drifting, until the hero scrolls off screen.

**The night sky returns, and this is a deliberate reversal.** The Motion section above still reads "Dropped from the original on purpose: the hero intro flight, the star field, and the animated wireframe spacecraft." The flight came back on 2026-09-17; the star field comes back now. Both reversals stand on the same ground, and it is not "we changed our minds": the predecessor's star field was a **drawn decoration behind a veil that could strand a visitor**. This one is `buildSky()`, the orbit map's own 460-radius sky sphere with its own texture, rendered by the same `createViz()` in the same canvas as the globe, and it can strand nobody (see the architecture note below). The rule the original drop was protecting is intact: **nothing in the hero is a drawing of space; it is the instrument, pointed at space.**

**One canvas, one property change.** The stage (`.approach-stage`) is a single fixed canvas that never moves in the DOM. It attaches at `z-index:400`, which is the black screen the flight plays on, and drops to `z-index:0` at the handoff. That is the entire settle: from that moment every band paints over it and only the hero, made transparent by `body.bg-live`, lets it through. No re-parenting, no second WebGL context, no crossfade between two near-identical framings. The pixels that were the entry become the backdrop with no seam.

`body.bg-live` also gives `main > section` and `footer` `position:relative; z-index:1`, which is what makes `z-index:0` mean "behind the page". It is scoped to that class so a visitor who never gets a backdrop never gets the restacking either. 1 is free: the pill is 50, the skip link 100, the scrollspy rail 5, the sticky chapter heads 2.

**Two gates, not one.** The old gauntlet decided whether *anything* happened. It now decides only whether the **flight** happens, and a second, much smaller gate decides whether the **backdrop** happens:

- **Backdrop gate,** hardware and preference only: viewport at least 700px, WebGL, no save-data or 2g. Everything that passes gets the parked globe on **every visit**, because the backdrop is part of the hero's design, not a first-visit reward. A late backdrop costs nothing, so it waits for the hero to actually be on screen (a deep link to a section far down the page never builds a scene nobody will look at) and has no time budget at all.
- **Flight gate,** the old gauntlet unchanged in spirit: once per session with the flag set only when the flight is SEEN; no reduced motion; tab visible; page at the top; ready inside 2500ms; no input yet. Miss any of it and the backdrop still arrives, without the flight.

Reduced motion keeps the composition and loses the animation: the parked globe is rendered exactly once and never again.

**Timing:** 200ms fade-in, 1600ms flight, then the handoff, then a 1200ms retreat with the hero's content fading up over its first 640ms. The covered period **shrinks from 2.0s to 1.7s**, because the page is uncovered at the *start* of the retreat, not the end; the globe finishes withdrawing behind live content. Total motion is about 2.9s.

**Every exit path settles rather than blanks.** This replaces teardown-to-nothing everywhere. Any input jumps to the parked framing in 250ms; the unconditional 4-second backstop snaps to it; a tab going hidden snaps to it and stops drawing. Only a scene that fails to build removes the stage entirely and restores the plain hero, which is the one case where there is nothing to settle into. A visitor who skips gets the hero with its backdrop, never a torn-down hole.

**The one held-back state that is not a scroll reveal.** `body.approach-veiled` hides `.hero .wrap` and `#hdr` so they can come on as the globe retreats instead of snapping in when the stage drops behind. It is fenced: applied only once the stage is fully opaque, so the hide is never visible; released by the settle on **every** path including the backstop; never applied on the backdrop-only path; and the first Tab is already a skip, so invisible-but-focusable links resolve themselves. The `<noscript>` block releases it too, by convention, though a script-off visitor never receives it.

**The parked framing is a lens shift, not a camera turn.** `PARK_R = 53` units puts Earth at about a third of the frame height (a 252px disc at 1440x800), and the corner position is produced by `camera.setViewOffset()`: the camera keeps looking straight at Earth's centre and the projection is shifted, exactly as a shift lens does. Ask for (0.64, 0.39) and Earth's centre projects to exactly (0.64, 0.39), at any latitude and any aspect.

*Supersedes this amendment's first approach, which turned the camera instead and is recorded here because the failure is not obvious.* Solving an off-centre look direction is a fixed-point iteration on a screen basis built from the world up axis, and it comes apart as the look direction approaches that axis: the basis flips between passes and the solve converges somewhere wrong. The flight ends wherever COSMOS 2570 is in its orbit, and at 67 degrees of inclination the camera regularly lands past 60 degrees of latitude, so the globe arrived in the right place on some visits and in the nav bar on others. It survived a screenshot that looked fine. **Do not reintroduce a camera-rotation solve for this.**

**And the position is a preference, not a constant.** `PARK_X = 0.64`, `PARK_Y = 0.40` are where the globe goes when nothing is in its way. They cannot be fixed, because the globe's size scales with the viewport's **height** (it is a slice of the vertical field of view) while the headline's width scales with **width**: at 1440x800 the raw preference drives the globe into "And prove every call." So the clearances are solved against the measured layout on mount and on resize, against two different radii for two different reasons. The viewport edge must clear the whole **glyph cloud**, because a halo sliced by the window edge is a mistake. The headline only needs to clear the **disc**, because the hero's content paints above the stage, so white type over sparse outer glyphs stays perfectly legible while type over the lit body of the Earth would not. Where both cannot hold, staying on screen wins.

Measure the headline with Ranges over its **line spans**, never over the `h1`. Its children are `display:block`, so a Range across the element returns the centred block box (910px) instead of the glyphs inside it (690px), and a clearance solved against that phantom pushes the globe 110px further right than it needs to go, or gives up and clamps against the window edge.

**Motion has two rates, and keeping them independent is the point.**

*Corrects an error in this amendment's first draft, which said the Speed slider "defaults to 100x".* It does not: `ui.js` calls `applySpeed()` at init, so the orbit map ships at the slider's value, **25x**, and the slider's **maximum is 100**. The `multiplier: 100` field in `main.js` is overwritten before the first frame. So 100 is the product's ceiling, not its default.

- **`TIME_RATE = 100` is the data clock**, and it has that ceiling: it is the same multiplier the map's own slider drives, run at the fastest setting the product itself offers. At real time rate a LEO glyph moves under 1 px/s, which is a photograph.
- **`SKY_DRIFT = 0.35°/s` is the camera**, and it has no ceiling, because a camera move asserts nothing about the data. It is also the only thing that can move the star field at all: the sky is a fixed sphere and the camera is inertial, so without it the stars are nailed in place no matter how fast the clock runs. The first build shipped without it and the backdrop read as a still image, which is the whole reason this paragraph exists.
- The drift is driven by **real elapsed milliseconds, never `simMs`**, so changing one rate can never silently change the other. It turns **against** the planet's spin, so the ground and the stars separate instead of cancelling.

At 1440x800 that is about 7 px/s for the stars, 17 px/s for the satellites and 1.7 px/s across the disc: alive without competing with the headline. The globe itself does not move at all while they do, because the framing is re-applied every frame; verified at zero pixels of drift after two simulated minutes.

**A resize has to re-frame and redraw itself.** It moves the label and the hit circle immediately, but the camera is only re-framed by a frame, and there is not always one coming: the loop stops while the hero is off screen or the tab is hidden, and under reduced motion there is no loop at all. Without that, the globe and its own hit area drift apart.

`followEarth` stays **off**: with it on the camera co-rotates with the planet and the ground is what freezes. The loop is capped at ~30fps and pauses the moment the hero leaves the viewport.

## The parked globe is a door (added 2026-09-22)

Hovering the disc or its label turns the caveat into "Open orbit map ↗", and either one opens `/visualization/`.

**The affordance is its own layer, not part of the stage**, and it has to be. The stage sits *behind* the hero's content, which is the whole settle, and anything buried under `.hero .wrap` can never be clicked or hovered: the wrap is a full-width block and wins hit-testing over the globe even where it is entirely transparent. So the canvas stays at `z-index:0` and `.approach-ui` rides at **2**, over the hero and under the pill.

**Live only at the top of the page**, for two reasons that give one rule: scrolled, the hero's own content slides under the pinned globe and would cut the label in half, and a layer sitting above the console frame must not take the clicks that belong to it. Below the top, the globe goes back to being pure backdrop and the frame keeps its `/demo/` link. The layer is also inert until the globe has actually parked, because during the flight every pointer event is a skip and a click that both skipped and navigated would be a trap.

**The hit area is a circle, not a box.** `border-radius:50%` on an absolutely positioned anchor sized from the same numbers that place the globe, so the corners of empty sky stay unclickable and a stray click never navigates. The label's two lines are stacked and cross-faded rather than swapped in place, so nothing reflows on hover.

**Mouse affordance only:** both anchors carry `aria-hidden` and `tabindex="-1"`. This layer is appended at the end of `<body>`, so a focusable link in it would land last in the tab order while appearing at the top of the page, which is a focus-order defect. The nav and the footer already carry real, correctly ordered orbit-map links, and those remain the accessible path.

**Pinned, then covered.** The stage is fixed, so the globe holds its corner for as long as any part of the hero is on screen. Nothing fades when the hero leaves: the bands below are opaque and simply cover it. Fading would reveal the body's light ground through the transparent hero. The accepted cost of pinning is that the globe passes behind the console frame on the way down; the frame is opaque and stacks above, so it occludes the globe cleanly rather than competing with it.

**The backdrop carries its own caveat.** The catalog is deterministic-synthetic and the map's standing caveat has to appear wherever the map appears. The flight says it in its caption and leaves with it, so the parked state gets its own line, "Orbit map · synthetic catalog", placed from the same constants that place the globe and right-aligned to the disc. It fades on the first scroll and returns at the top: pinned, the hero's own content slides under it and would cut the line in half, and a half-occluded disclosure is worse than one that captions the state it belongs to.

**Not carried forward:** the poster image (`assets/leo-visualization.jpg`). The entry opens on true black now, so the poster has nothing to cover; the file stays in `assets/` but nothing references it.

## Two products, two pages (added 2026-09-22)

The Products section used to carry the whole catalog: two chapters, eight expandable models, every metric and description, in one band. It was the heaviest thing on the page and it buried the two products it was there to introduce. The landing page now **introduces** the two products; each one **has its own page** where its models live.

| Surface | What it carries |
|---|---|
| `#capabilities` on the landing page | Two boxes, one per product, and the metric rail |
| `/orbwatch/` | Page head, the five models, the discriminator evidence, a CTA |
| `/guardian/` | Page head, the three models, what it is graded against, a CTA |

**The section id does not move.** `#capabilities` is linked from 404, contact and the orbit map, and the standing rule that inbound links keep working still binds. The `/ 02 products / 08 models` denominator stays in the section head, and the model indices stay `/0.1` through `/0.8` across both pages so the denominator remains checkable.

**The boxes are panels, not CTA blocks.** Each is a single `<a>` wrapping designator, role line, lede, that product's model names, and an arrow. They use the `.disc-case` / `.assure` panel language, because the two-tone CTA blocks are pinned by this document to their literal colors and square corners and are not a general card.

**The hero lost the console and the numbers, and gained a `min-height`.** Both of those are load-bearing:

- The **metric rail** moved under the two boxes. This **supersedes** the rule recorded with it, that it belongs in the hero as the fastest answer to "working system or a deck". It still answers exactly that, one band lower, next to the products it is evidence for, and it now joins the digit-resolve scope it was previously excluded from. That exclusion had one stated reason, that it sat above the fold and would fire during the intro, and that reason is gone.
- The **console preview** went back to the Platform section, under the four pipeline stages. Stage 04 is "Report, into the analyst queue, The Command Center", so the preview now sits on the sentence it illustrates. `console-preview.js` finds it by id and its header comment already described the platform section as its home, so the markup moved sections without the script changing at all.
- **`min-height:100svh` on the hero is not decoration.** Without the frame and the rail the hero is about 730px, so the light Statement band would push into the first screen and the night-sky backdrop, which is only visible through the hero band, would be cut down with the pinned globe near its edge. Verified: the hero fills the viewport exactly, the globe's disc sits entirely inside it, and the Statement band starts at the fold.

**Product pages follow the subpage template**, `contact/`'s exactly: `../` paths, canonical and OG, the same pill and footer, `../scripts/site.js`. No entry-approach script and no `.hero` class, so no backdrop mounts and the opening band stays opaque. Band rhythm alternates dark, light, dark, light.

**GUARDIAN's evidence is text, and that is a decision, not an omission.** The figure exporter emits the one-sidedness discriminator and nothing else, so ORBWATCH gets those two charts, which are its proximity model's own proof, and GUARDIAN gets a named list of what each of its three models is graded against. **A chart that does not exist is not drawn to fill a space.** Giving GUARDIAN a real figure means extending the figure exporter first. The page says so on the page.

Neither product page duplicates the assurance gate. Both link to it, so the sealed panel exists in one place and cannot drift.

**Shared components moved to `site.css`.** `.chapter` / `.chap-*`, `.rail`, `.disc-*` and `.cta-head` were inline in `index.html` and are now shared, because two or more pages need them. The rule this sets: **a component moves to `site.css` the moment a second page uses it, and anything used by exactly one page stays inline on that page.** Hero, statement, stages, assure/gate/seal, photo-figure and seg-grid are still inline on the landing page and should stay there until something else needs them.

**Label fix.** 404, contact and the orbit map all labelled `#capabilities` as "Capabilities" while the landing nav said "Products", left over from the 2026-09-17 rename. All five pages now say "Products", and all of them carry ORBWATCH and GUARDIAN in the footer so the product pages are reachable from anywhere on the site.

## Editing pass (added 2026-09-22, same day, after the restructure)

A cutting pass once the new structure was in place. Nothing here is new construction.

**The hero is now four elements, centred in a full screen.** The lede lost its third sentence, the one naming the two products, which the section below it now does properly. And once a full-height band holds only four elements, the block has to be centred *in* that band: left in normal flow it sat at the top over 313px of dead space, which is what reads as uncentred even though the text was centred horizontally all along. `display:flex; flex-direction:column; justify-content:center` with symmetric padding that clears the fixed pill. Measured after: 250px above, 250px below, one viewport tall, and the backdrop's globe still clears the headline by 59px and sits entirely inside the band.

**The Platform band leads with the console, then the stages.** The frame moved above the four stages, so the section shows the thing before it diagrams the route to it. The stages lost their prose: designator, attribution, short phrase, nothing else. The attribution line stays, because it is not elaboration and this document pins it. The GUARDIAN footnote under the rail is gone; the "no fifth stage is invented" rule it served still holds, and GUARDIAN now has a whole page of its own.

**The Products headline dropped "One command center."** The line still belongs in the hero eyebrow, which is the one place it earns its keep. The `/ 02 products / 08 models` denominator is untouched.

**The assurance gate is retired from the marketing pages.** It was the weakest evidence on the site: a tally of counts and a hash, next to two charts that actually show the engine discriminating. The headline "Assurance is the product." stays, and the lede stops at "what separated the call from the benign case", dropping a promise of a receipt the page no longer shows.

Consequences, all handled: `.assure*`, `.gate*` and `.seal*` are gone from the stylesheet; `.gate .gv` and `.seal .digest` left the digit-resolve scope (safe, `/demo/` does not load `site.js`); and both product pages' "See the assurance gate →" links were reworded to point at what `#assurance` actually shows now. **The gate itself is not gone from the product.** It still runs in `/demo/`, the contact page still offers to walk it in a briefing, and the footer's SEALED EVIDENCE badge is still true. Only the marketing panel retired.

**The ORBWATCH page dropped its evidence band**, so the discriminator charts live in exactly one place again, the landing Evidence section, and the model that cites them links there. The page is now dark head, light models, light CTA, and the two adjacent light bands take a `.divider`, per the rule above.
