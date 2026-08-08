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
| Watch | `#ffca16` | `--status-watch` | monitor, warning, needs an analyst | `2 MONITOR`, the flagged Δv on the hero orbit track and in the residual trace, the apogee engine while that marker is live |
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

**The stagger step is per group.** 60ms is the default and suits two or three items that just need to not arrive together. A group whose members read as a *sequence* can ask for a longer one with `data-stagger` on the group: the pipeline rail uses 130ms, because four stages at 60ms finish inside 180ms and read as simultaneous. Opt-in, so nothing else moved.

**Motion inventory for `/`, so the budget is visible in one place:** the intro flight, the spacecraft's yaw drift, the orbit track draw-in, the Δv ping (the only repeating one, and it retires on contact), the live console replay, the pipeline sweep, and the resolving figures. Everything except the ping is one-shot. Platform carries two of them at once, the console and the rail, and is the section to thin first if this ever needs trimming.

Three tokens exist for exactly one moment and are named for it rather than added to the general scale: `--motion-flight` 1150ms, `--motion-veil` 700ms, and `--motion-ease-flight` `cubic-bezier(0.16,0.84,0.3,1)`, which carry the hero spacecraft from its opening full-viewport view into its frame. **Nothing else may use them.** If a second thing ever needs a transit, that is the point at which this stops being a one-off and earns a real tier.

---

## Section separation

This is the system's load-bearing decision, so it is stated as a rule rather than left to each section. A boundary is carried by **three cues together, never one**:

1. Every top-level `<section>` gets `.sec`, which applies `border-top: 1px solid var(--rule-edge)` full-bleed.
2. Sections **alternate** between canvas and `.band`. No section may declare a background equal to the one behind it.
3. Adjacent sections never share both a surface *and* a padding tier. Pace changes across every boundary.

The landing page currently runs:

**The hero holds two blocks and no more:** `.hero-grid` (eyebrow, headline, one-line lede, the two actions, the schematic) and the metric rail with its provenance note.

It had grown to five stacked blocks, which is more than a first screen can introduce without the visitor triaging it. Cutting it to one was tried first and went too far: it moved the page's only real-world evidence below the fold. The rail came back because **those three figures are the fastest answer a visitor gets to "is this a working system or a deck,"** which is the one question a first screen exists to settle. The other two blocks did not come back.

The rule is a count, and the test for admission is evidentiary, not editorial: **a third block does not go in the hero, and a block only earns the second slot if it is proof rather than argument.** The statement line is argument. The signpost is navigation. Neither qualifies.

Where the other two went, and why each landed there:

| Block | New home | Reason |
|-------|----------|--------|
| Statement line | opens `#capabilities`, above the ledger | It is the pivot from *that* to *why*, and the ledger below it is the list of whys. It replaced a sec-head sentence that said the same thing less well. |
| Audience signpost | `#platform`, below the sec-head | First body section, so role relevance still arrives early without moving `#segments` and re-deriving this table. |

**The provenance note travels with the rail, always.** Three bare figures are assertions; `Computed by Vantage from public CelesTrak element sets. No sensors, no credentials, reproducible.` is what makes them checkable, and checkable is the entire thesis. Shipping the figures without it would break the same law that `#assurance` was breaking.

The three cells are not interchangeable and are not three of a kind. Two are **outputs** computed on named public objects, which is what gets a meeting; the third is a **calibration input** for a different reader, the evaluator who has to sign off. Replacing the rail with the calibration figure alone was considered and rejected: it is the only one of the three that already appears elsewhere on the page (ledger row 04 twice, and the assurance panel), and it is the one that answers the later question rather than the first one.

| # | Section | Surface | Padding |
|---|---------|---------|---------|
| 1 | Hero `#top` | canvas | 144 / 96 |
| 2 | Platform `#platform` | band | 128 |
| 3 | Capabilities `#capabilities` | canvas | 96 |
| 4 | Assurance `#assurance` | band | 128 |
| 5 | Who it's for `#segments` | canvas | 96 |
| 6 | Closing CTA `#contact` | band | 128 |

This order is load-bearing and **section 5 does not move**. The full cost of moving it, and the signpost that reaches the same goal without touching this table, are recorded under §Audience signpost.

Two earlier failures this rule is written to prevent, both of which had shipped: `#mission` and `#contact` sat on **canvas back to back**, so one boundary had no surface change at all; and the middle four sections all ran at 96px, so there was no change of pace anywhere in the body of the page.

---

## Components

### Ghost button
Transparent fill, 1px `--rule-edge` border, `--radius-sm`, `min-height: 44px`, 12px/20px padding, Space Grotesk 14px. Hover raises the border and label to `--text-primary`. `.btn-primary` differs only by a brighter resting border (`rgba(255,255,255,.42)`) and a white label. **There is no filled button anywhere in the system**; priority is carried by border and label brightness.

**At most one `.btn-primary` is visible at a time.** The landing page previously carried three: the header CTA, the hero CTA, and the closing CTA, with the first two on screen together and pointing at the same destination. When the strongest treatment is the default, it stops being a hierarchy, and the audit read the page as having two co-equal primary actions.

The header CTA is therefore deliberately **not** primary on any page. It keeps its priority from placement, being the only button in a 68px bar, which is the other mechanism this component already relies on. The accepted cost is that the one conversion affordance visible mid-scroll is now the quieter control; demoting the hero CTA instead would have been worse, because the hero is where the choice is actually made. On `/contact/` the same rule hands primary to the form's submit.

### Eyebrow
Mono 12px, uppercase, `0.2em` tracking, `--text-faint`, preceded by a 26px `--rule-edge` rule. This is the canonical section label: whatever the eyebrow says is what the nav link and the footer link say.

### Status chip
Mono 11px uppercase in `--surface-chrome` with a 6px dot in the status color and a matching 34%-alpha border, `--radius-xs`. Two variants ship, `.chip-nominal` and `.chip-threat`, because those are the two states the site currently reports as a chip. Watch state is carried by the gate readout and the hero schematic instead, so no third variant exists. Add one only alongside the markup that uses it.

### Metric rail
Three or four cells hanging off one `--rule-edge` top rule, divided by `--rule-hairline` vertical rules, with **no enclosing box**. Mono figure at 32px over a 14px muted label. Used for the hero statistics. Collapses to stacked rows with horizontal rules below 560px.

### Audience signpost
A mono `BUILT FOR` label and three links to `#defense`, `#operators`, and `#orbital-compute`, set in the `.rail-note` caption tier. It opens `#platform`, directly under that section's sec-head.

It carries **no rule of its own**, and should not be given one. It first hung off the metric rail's bottom edge in the hero; when it moved to `#platform` it was briefly given a hairline underline, which at that moment put two horizontal rules 48px apart. The rail has since returned to the hero, so the signpost now sits between the sec-head and the screenshot with only spacing around it, which is correct: it is a caption-tier label, and a rule would promote it to a structural element it is not.

**It exists because reordering sections was rejected, and that is the part worth remembering.** "Who it's for" is section 5 of 6, so role-specific relevance arrives about 85% of the way down the page. Moving `#segments` to slot 3 produces canvas back-to-back at 96px on both sides, which is precisely the pair of failures §Section separation was written to prevent. Repairing that means flipping capabilities to band, which collides with assurance's band, which cascades into flipping assurance, the focal moment whose panel clearance was tuned against band. One section cannot move without re-deriving all six rows of that table and re-checking every panel-on-surface pairing. It would also put the page's one permitted card grid ahead of the ledger, breaking §Layout's ordered list of primitives.

The signpost reaches the same goal by routing to anchors that already exist: no new section, no surface change, no padding change, and the banding table is untouched. **If someone later proposes "just move Who it's for higher," this paragraph is the answer.**

Links rather than buttons, so neither the ghost-button hierarchy nor the one-card-grid budget is affected, and machine voice so it reads as a label rather than a fourth call to action. The 44px floor is met by making each link an `inline-flex` box; inline links in running text cannot reach that height without wrecking the line, and that constraint is what dictates the component's shape.

### Capability ledger
Full-width rows on a shared rule: a mono index column, a prose column, and a right-aligned mono metric column. Rows divided by `--rule-hairline`, the set bounded top and bottom by `--rule-edge`. Not a card grid, and deliberately so: it replaced three stacked bordered grids. Rows without a headline figure show the mono sub-label alone.

**Rows stay uniform.** The one-sidedness discriminator was previously embedded inside row 03, which made that row roughly three times the height of every other one and buried the sharpest idea in the product inside a list item. Anything that wants more room than a row is not a row: promote it to a figure below the ledger. Prose here is `--text-body-md` on `--text-body`; at 14px muted, five stacked rows were the densest thing on the page.

A figure headline only earns the `.val` slot if the number is **new**. `84%` and `100%` appear in the hero metric rail, so rows 01 and 03 carry a mono sub-label instead of restating them. Rows 04 and 05 keep their figures because those numbers appear nowhere else.

**A figure's unit belongs at the figure's tier.** Row 04 showed a bare `0.963` in `.val` while `ROC-AUC` and `Brier 0.010` sat in `.key` at `--text-micro` on `--text-faint`, the smallest and dimmest type on the page. A magnitude whose unit is demoted below it cannot be read at all, and this was the page's most technical claim. The unit now leads the `.key` line with the denominator under it, and the prose carries the same numbers in sentence form so the claim survives without the rail.

**Prose leads with the outcome; mechanism and jargon follow.** Each row opens with what the capability tells an operator, then explains how, defining terms in apposition on first use ("the Earth's equatorial bulge (J2)", "Proximity and rendezvous watch (RPO)"). That prose now lives behind the disclosure below, so it is what a visitor reads *after* choosing the row rather than what they wade through to reach the next heading.

**The description collapses behind its own heading.** Each row is a `<details>`: the `<summary>` carries the `h3` and a mono `+` that becomes `−`, and the metric column stays outside it and always visible. A collapsed row is a 44px summary, so the resting ledger is five capability names and five figures, and every row is the same height.

Two earlier readings of this are worth keeping apart, because the file previously recorded the second as a flat rejection:

- **Rejected:** moving *extra* methodology behind a toggle while leaving the visible paragraph in place. That leaves the default state as it was and makes an opened row tower over its neighbours, which is the row-03 failure above.
- **Adopted:** collapsing the *existing* description, so the default state becomes strictly more uniform than the always-open ledger it replaced, and the tall state exists only because a visitor asked for it.

The rule "rows stay uniform" is about what the ledger looks like when you scan it. A user-initiated expansion is not a violation of it; a permanent 3× row was.

`<details>` and not a scripted toggle: it is keyboard operable, announces its own expanded state, and works with scripting off, which matters on a page whose no-script path is the default markup state everywhere else. The `+`/`−` is typographic rather than an icon, on the same grounds as the `→` and `↗` already in the buttons and frame bars.

Padding dropped from 32px to 24px per row when this landed, because the old spacing was sized around a four-line paragraph that is no longer there by default.

**Rows without a `.val` still align.** `.key` carries a top margin sized to sit under a figure, so on the one row that has no figure the sub-label started at the cell top and fell out of line with every other row's baseline. `.key:first-child` gets the figure's height added back. The fix is alignment, not inventing a number to fill the slot.

**Every one of these alignment offsets is scoped to the wide layout.** The index gets 11px and the metric column 7px so both sit on the heading's optical centre inside a 44px summary, and the figure-less row gets 38px. All three exist only to line things up *across* a side-by-side grid. Below 900px the metric stacks underneath its heading, and there they are not alignment, they are a hole: the 38px one in particular left a visible gap on the row that has no figure. They are reset in the ≤900px block. **Any future offset added for the wide grid has to be reset there too.**

### Resolving figures
Headline figures arrive as an unresolved readout and lock on, digit by digit, left to right, when they are scrolled to: `-.---` → `0.---` → `0.9--` → `0.96-` → `0.963`.

**Not a count-up, and the distinction is the point.** A count-up renders a run of *wrong values* on the way to the right one. On a site whose argument is that its numbers are checkable and sealed, briefly displaying `37%` where the answer is `84%` is the wrong instinct even though nobody would notice. A masked readout asserts nothing until it asserts the truth, and a half-resolved `0.9--` reads as a readout mid-lock, not as a claim.

The mask is the value with every digit replaced by a hyphen, so units, decimal points and thousands separators survive. Both figure tiers are set in IBM Plex Mono, so **the mask is exactly as wide as the value and nothing moves while it resolves.** 180ms hold, then 70ms per digit: the longest figure on the page lands in 460ms.

**The sealed digest resolves too**, and it is the one element where letters are value characters: `732c19` is hex, so it masks to `------` rather than to `---c--`. Only the digest is wrapped and masked; `sha256:` is the name of the algorithm, not part of the value, and masking the `256` inside it would read as noise instead of as a readout locking on.

**Scope is `.ledger .val`, `.gate .gv` and `.seal .digest`, and the hero metric rail is excluded.** Two reasons that happen to agree: one of the rail's three figures is `under 15 km`, which has no digits to lock, and the rail sits above the fold, where this would fire during the intro and compete with the spacecraft acquisition. That gives a rule rather than an exception: **figures resolve when you scroll to them, and nothing resolves during the intro.**

The real value is the resting state in the markup and script masks it, not the other way round, so no-script and reduced-motion visitors never see a placeholder and the settled DOM is always the number.

### Framed figure
`--surface-panel` body, `--rule-edge` perimeter, `--radius-sm`, with a `--surface-chrome` header bar in mono 12px. The only wrapper for a picture of the system: the hero spacecraft and the real product screenshot both use it, which is what keeps a diagram and a screenshot visually accountable to each other. The header bar's right slot carries a mono affordance note where the figure is interactive (`Δv marker opens the residual`), and that note is injected by script, because without script it would not be true.

### Assurance panel
**The verdict chip is never animated, and the gate is never staggered.** Both were proposed and both are refused for the same reason, which is worth stating because the proposals are attractive.

The chip is the one element in the system whose *colour is the claim*: `--status-nominal` means pass, and §Tokens: Status says a status colour appears only where that exact state is being reported. Fading it up from a muted or neutral state renders, however briefly, a verdict that never existed. A masked figure says "not read yet"; a grey verdict chip says "not decided yet", and the gate was decided at release time, not when someone scrolled to it.

The four gate cells are a **tally of one run**, not a sequence of steps. The pipeline rail is staggered because ingest really does precede detect; `14 PASS / 0 FAIL / 1 SKIP / 2 MONITOR` are four categories of a single result, and revealing them in order asserts an ordering that does not exist. They resolve, which is the right amount of ceremony, and they resolve together.

A sweep across the hash "as if the bundle is being cryptographically finalized" is refused on the same grounds as the sensor sweep in §Acquisition: the bundle was sealed on release. Animating the act of sealing at scroll time dramatises an operation that is not happening.

The page's focal moment. Framed figure chrome at full width, a chrome header carrying the policy name and the verdict chip, then a two-column body: the statement plus the four-cell gate readout on the left, the explanation plus the sealed hash on the right. The gate cells use `--status-nominal` for PASS and `--status-watch` for MONITOR; FAIL and SKIP stay faint because nothing fired.

### Stage rail
Four numbered stages along one `--rule-edge` rule, each marked by a 32px × 3px `--text-primary` tick sitting on the rule. No boxes. Used for the pipeline.

### Mission card
The only bordered card grid on the page, which is what earns it. `--surface-panel`, `--rule-edge` border, `--radius-sm`, 32px padding, a domain mark at the top, a mono kicker, a heading, body copy, and a contact link pinned to the bottom with `margin-top: auto`.

### Domain mark
Line marks at 1.3px stroke in `--text-muted`, drawn from things that mean something in this domain: conjunction geometry with a marked minimum separation, a pattern-of-life cadence with one out-of-character spike. No crosshairs, shields, or stars.

### The discriminator animates the difference
Both cases run the **same wipe, over the same span, at the same moment**, and their labels land together. What emerges on the left is a dashed gap; on the right, an engine firing across it. The animation is symmetric and the content is not, which is the entire argument of the figure, so the comparison teaches itself rather than being captioned.

No JavaScript: `.disc-figure` is already a `.reveal`, so `.in` arrives on scroll and the transitions ride it. The held-back states sit on the elements rather than behind `.reveal`, so the `<noscript>` override can release them.

**The markers are not recoloured, and that is deliberate.** The proposal was to make the two cases initially identical and let them diverge, which would mean rendering the shadowing case's nodes in `--status-nominal` green for a moment. That is the verdict-chip rule again: a status colour appears only where that exact state is being reported, and green on the shadower reports "benign" for a case that is not. So the shared beat is the wipe, not the palette.

**Worth knowing for a future pass:** the note under this figure claims *"The only difference is which side is spending propellant."* The schematic actually differs in three places, since the marker colours and the labels differ too. The animation now foregrounds the one difference the note names, but the copy and the drawing still disagree slightly, and the honest fix is a copy change rather than more motion.

### Explanatory schematic
Inline SVG, hairline strokes, mono labels, status colors where a state is being shown. Always labelled as a schematic and never given console chrome that could read as product output. Two exist: the residual trace in the hero (physics subtracted, Δv marked in `--status-watch`) and the one-sidedness discriminator in orbital compute (benign vs shadowing, identical geometry, the only difference being the Δv).

### Hero spacecraft
The one drawing in the system that moves. A wireframe spacecraft on an orbit track, rendered to `<canvas>` by `scripts/hero-satellite.js`, sitting in the hero's framed figure. It is line work under the same rules as the SVG schematics, and it is governed by them, not exempted from them:

- **Strokes are hairlines at every scale.** Line width is set in screen CSS pixels by dividing by the live CSS scale, so a hairline stays a hairline through the intro flight instead of fattening with the transform.
- **Depth is the only shading.** Far edges fade toward 18% and thin slightly; there are no fills, no shading, no glow. Buckets are quantised so the whole drawing is a handful of stroke calls.
- **Callouts name parts, never report numbers.** `SPACECRAFT BUS`, `SOLAR ARRAY`, `HIGH-GAIN ANTENNA`, `APOGEE ENGINE`, in mono at the frame's edges with leaders into the drawing. They were set beside their parts first and landed on top of the solar arrays every time the spacecraft turned. Suppressed below 430px. A fabricated telemetry readout here would undermine the real console screenshot two sections down, which is why there is none.
- **One status color, one meaning.** The Δv marker on the orbit track is `--status-watch`, the same meaning it carries in the residual trace and the gate readout. The apogee engine highlights to `watch` while that marker is hovered, focused, or open, because that is the part being reported. Nothing else in the drawing is colored.
- **The orbit track restates the residual.** Dashed is where physics alone puts the object, solid is where it was observed, and the two only separate after the marked burn. It is the residual schematic in orbital form, which is what earns the marker its payoff.

The Δv marker is a real 44px `<button>` over the drawn diamond, with `aria-expanded` and `aria-controls`: clicking it covers the figure body with the residual trace, Escape and a ghost close button dismiss it, and focus returns to the marker. The drawing pauses whenever the overlay is open, the figure is off screen, or the tab is hidden.

### The residual draws
The overlay used to fade in finished, which made the page's central explanation something to read rather than watch. It now draws left to right over 900ms: the observed and modelled tracks run together and then separate, the residual below stays flat and then steps, and the Δv snaps in at the instant the sweep reaches the burn.

**That order is the product.** Subtract the physics, and what is left is the engine. Frozen half-way, the schematic says it on its own: at the burn the two tracks are still one line and the residual is still flat. This is the one place on the page where motion is allowed most of a second, because here the motion *is* the argument.

It costs nothing against the motion budget: nobody sees it unless they ask. It runs on open and re-runs on every open, because an explanation requested a second time should play a second time.

Three implementation points worth keeping:

- **A clip, not `stroke-dashoffset`.** Two of these paths are already dashed to distinguish the physics model from the observed track, and a dash-based draw would destroy the pattern that carries the meaning. A `<clipPath>` rect whose width animates handles dashed strokes, solid strokes and text identically.
- **The right-anchored labels are held out of the clip** and faded in at 82%. A left-to-right wipe slices `OBSERVED` and `PHYSICS MODEL (J2 + DRAG)` through their letterforms, and they only become true once the tracks have separated anyway.
- **The Δv group is held out too**, so it snaps in rather than being revealed by the sweep. Its delay is derived from the geometry: the burn sits at x=300 of 560, so the cue fires at `900 × 300/560` = 482ms, exactly when the wipe arrives.

The rect is full width in the markup, so the no-script and reduced-motion paths get the finished schematic and never touch any of this.

### Hero intro
The opening view, and the system's single largest motion. On the first load of a session the stage is pinned at its natural rect, transformed out to the centre of the viewport over a star field, held, then transitioned back to identity so it lands exactly in its frame. The hero copy is held and released as it flies, so the two arrive together.

Constraints it is built to respect: it plays **once per session** (`sessionStorage`), never under `prefers-reduced-motion`, and any input skips it. Scroll is locked for its duration because the stage is positioned against a rect measured at rest.

The star field is the one decorative surface in the system, and it is deliberately thin: sparse authored points in `--text-faint` at low alpha with cursor parallax, no glow and no nebula. It exists only while the intro is on screen and is `display:none` before and after.

### Acquisition
The one-shot moment when the figure settles, and the only animation in the system that is not a hover, a reveal, or the intro flight. Two beats, ~1.2s total:

1. **The observed track lays itself down.** A cursor walks the orbit once, laying the solid observed arc over the dashed physics model, so the departure at the Δv is something a visitor watches happen rather than something they have to find.
2. **The Δv marker pulses**, first at the instant the cursor reaches the burn, then on a slow repeat until the marker is found.

The track beat runs **once per page view** and covers every entry path: after the intro flight for a first-time visitor, and at load for returning visitors, background-tab loads, and anyone who skipped. Under `prefers-reduced-motion` both beats are skipped and the track and marker simply arrive finished.

**The ping repeats, and the condition attached to it is the whole justification.** This file previously recorded the opposite rule, that one pulse is an affordance and a repeating one is an ornament. That is right for an unconditional blink and wrong for this: a single ping at load is missed by anyone who arrives mid-scroll, reads the headline first, or tabs away, and the marker it points at opens the page's central explanation.

So the ping retires on contact. Hovering, focusing, or clicking the marker stops it **permanently for that page view**, because all three mean the visitor's attention has reached it and the ping's only job is done. A ping that continues after that is decoration; one that gives up once it has worked is an affordance. The repeats are also softer than the acquisition ping (gain 0.62) so the first still reads as the louder event.

Timing: 700ms pulse, 1300ms of quiet, so a **2s cycle**. The constant is named `PULSE_GAP` rather than a period because the timer is set when a pulse *ends*; naming it a period is how someone mis-tunes it. To change the cycle, set `PULSE_GAP = cycle − PULSE_MS`. Nothing is scheduled at all under reduced motion.

At this cadence the ring is on screen for **35% of every cycle**, which is close to the ceiling for something that reads as a cue rather than a blinking light. If it needs to go faster still, shorten `PULSE_MS` rather than only closing the gap, or the pings start to run together.

Verified by replaying the tick state machine against a synthetic clock, with the constants read out of the file rather than retyped: ten pings in twenty seconds at 2.0s spacing, the first at full gain and the rest at 0.62; none after a simulated hover; none at all under reduced motion.

**Two things were proposed here and rejected, and the reasoning matters more than the verdict.**

- **A scanning sweep across the orbit.** A sweep is radar language, and the page's headline claim is *"No telescopes, no radar"* with *"No sensors, no credentials"* directly under it. Animating a sensor sweep on a product whose whole differentiator is that it uses no sensors contradicts the copy a few centimetres away. The track draw-in replaced it and is strictly better on the merits: it animates the engine's *actual* operation, walking an element-set history and resolving the residual.
- **`ACQUIRING OBJECT → TRACK ESTABLISHED` status text.** Same problem, plus it is a fabricated readout, which §Imagery already bans. Nothing is being acquired; there is no sensor to acquire with. The intro keeps its one true caption instead.

The test both failed is the one the proposal itself named: *product reveal, not sci-fi movie UI*. A sweep and an acquisition readout are the sci-fi parts. **If motion here cannot be traced to something the engine actually does, it does not ship.**

### Navigation state
The nav reports where the visitor is, not only where they can go. `site.css` had styled a current-link state for some time that nothing ever set, so the rule was dead; the scrollspy in `site.js` now writes it.

- **`aria-current="location"`, not `"page"`.** `page` means the current page within a set of pages and `/contact/` already uses it correctly on its own link. Reusing it for an in-page section would make that marker ambiguous. The selector is `.navlinks a[aria-current]` so one rule covers both.
- **A top band, not "whichever section is most visible."** These sections differ enormously in height, so an area test would keep the tallest one lit most of the way down the page. A section becomes current when it enters a band running from `--anchor-offset` to 30% of the viewport. The offset is read from the token rather than hard-coded, so moving the header moves the band with it.
- The band can hold several sections or none: take the last in document order, and when it empties hold the previous. **The hero owns no nav link, so "nothing current" is a real state at the top of the page**, not a gap to paper over.
- Only same-document hash links are managed. On `/contact/` the hrefs are `../#platform`, nothing resolves, the block disables itself, and the hand-written `aria-current="page"` there is never touched. No page detection needed.
- Clicking a nav link smooth-scrolls through the sections in between and flashes each one current. Accepted: it is honest positional feedback, and suppressing it needs a flag plus a scroll-end heuristic, which is more machinery than the feature earns.

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
- One destination, one label. The demo was reached by "See the live demo", "Open the live demo" and "Open live demo" at once. A framed figure's affordance note is **not** a CTA and is exempt: `Open live demo ↗` in the screenshot's frame bar is chrome, and the arrow is what distinguishes it.
- Scope element selectors that belong to one component. A bare `nav {}` rule for the header quietly imposed `space-between` and a 68px height on the hero's audience signpost; it is now `header nav`.

### Don't
- Never add drop shadows, gradients, glows, or glassmorphism. Separation comes from the surface ladder and the rule weights. This holds inside the canvas drawing too: depth there is carried by fading and thinning far strokes, never by a fill or a halo.
- Never let the hero spacecraft report a number. It names its parts and nothing else; the moment it displays a figure it becomes a fabricated readout standing next to a real screenshot.
- Never add a second decorative texture. The intro star field is the one exception in the system and it is scoped to a view that lasts under three seconds.
- Never fill a button. Priority is border brightness and label color.
- Never exceed 4px radius.
- Never use a status color decoratively, and never introduce a fourth accent.
- Never use stock outline iconography. If a mark cannot be drawn from the domain, use none.
- Never stack more than one bordered card grid in a page. Change the primitive instead.
- Never write an em dash. Use a comma, a colon, a period, or restructure the sentence.
- Never set a section background equal to the surface behind it.
- Never publish a figure the site cannot state the denominator of.
- Never let a sentence-ending "No X, no Y" become the page's default rhythm. Four of them ran on the landing page, three inside the first 120 lines of body copy, which turns an evidentiary claim into a campaign slogan. Two survive, and each is load-bearing: the rail note, which is what makes the figures checkable, and row 02, which has no figure so the sentence carries the row.
- Never claim a scope the page does not enumerate. "Every mission" sat directly above exactly three audiences; it now says three.

---

## Elevation

No shadows anywhere. Elevation is exactly two mechanisms, used together:

1. **Surface level**: moving up the four-step ladder (canvas → band → panel → chrome).
2. **Rule weight**: `--rule-edge` traces anything that is its own object; `--rule-hairline` divides the inside of one.

A panel reads as raised because it is one step lighter than the section behind it *and* bounded by the heavier rule. Nothing else lifts.

---

## Imagery

One photograph-class asset exists and it is a real screenshot of the product console (`assets/demo-console.png`, 1584×928). It is the page's most important visual and gets a full frame and a link into the live demo. Everything else is authored line work: two explanatory SVG schematics, the drawn spacecraft in the hero, and two domain marks. No stock photography, no illustration.

**That still is now a poster for the running console.** `scripts/console-preview.js` lays `/demo/` over it in an iframe once the figure is on screen. The screenshot was captured at exactly the viewport the demo lays out at, so the two share an aspect ratio and the swap moves nothing; the iframe is *scaled*, not resized, because reflowing the console into a 1040px column would produce a different layout from the one the screenshot shows.

**What this is not is a second console.** The obvious way to animate this section is to draw a console assembling itself, and that is banned below for good reason. The distinction that matters: the rule forbids fabricating *output*, not rendering real output in code rather than as a PNG. `/demo/` is already a code-rendered replay of real engine output, already labelled as a synthetic scenario on its own chrome, so embedding it is the same evidence in a more honest medium. Rebuilding the feed on the landing page would have been a second copy of the event data that drifts from the first. **There is one console; everything else points at it.**

The rule that governs this: **anything that looks like product output must be product output.** A schematic is drawn as a labelled diagram so it can never be mistaken for a screenshot. The spacecraft is held to the same standard: it is a labelled wireframe under a frame bar that says "Schematic", and it reports no numbers.

Its sibling, which the assurance section had been violating: **anything that says it is checkable must be checkable, or must say why it is not.** `#assurance` claimed a reviewer "can re-check the claim instead of trusting it" and then offered nothing to check, no link, no artifact, in the one section whose entire subject is receipts. It now links the same gate running in the console, and the link discloses in its own label that the scenario is synthetic. A route to partial evidence, labelled as partial, beats an unsupported claim; **a receipt that oversells what it proves is worse than the silence it replaced.**

**The one exception to "no decorative texture" is the intro star field**, and it is written down here so it stays an exception rather than a precedent. It is sparse authored points in `--text-faint`, no glow and no gradient, it exists only during the opening view, and it is `display:none` for the rest of the session. A satellite on a black canvas needed to read as being *in orbit* rather than floating in a void, and one hairline point field is the least the system could spend to say that. Nothing else on the site gets a texture, and if a second one is ever proposed, the answer is a surface level or a rule weight instead.

---

## Layout

Full-bleed surfaces with content constrained to a 1200px centered column (`--page-max-width`, 28px gutters, 20px below 560px). The fixed 68px header blurs the canvas behind it and gains a `--rule-edge` bottom border once scrolled.

The page deliberately changes primitive from section to section: asymmetric hero with the drawn spacecraft, metric rail, audience signpost, product screenshot, stage rail, statement line, capability ledger, side-by-side discriminator, focal assurance panel, featured block plus two-card grid, centered closing CTA. Nothing is repeated twice in a row.

The metric rail and the stage rail are the same primitive, cells hanging off one `--rule-edge` rule, so they must never end up adjacent. Keeping the rail in the hero separates them by a whole section; when the rail briefly lived in `#platform` it had to sit above the screenshot for exactly this reason.

The spacecraft's slot is `aspect-ratio: 7/4`, close to the 560×300 of the SVG that used to fill this frame, so the hero grid keeps the proportions it was balanced against.

**The product is shown early, and on purpose.** The console screenshot is the page's most important visual and the fastest answer to "is this real software", so the platform section carries it directly after the hero: screenshot first, then the pipeline that produces it. It previously sat in section 5 of 8, behind a schematic, a one-line statement, five capability rows and the assurance panel.

### Breakpoints

| Width | What changes |
|-------|--------------|
| ≤1040px | Horizontal nav collapses to the toggle menu |
| ≤900px | Hero, assurance body, discriminator, mission cards, and footer go single-column; stage rail and ledger reflow |
| stage <430px | The spacecraft's edge callouts are dropped: four labels need room the narrow layouts do not have, and touch has no hover to dismiss them with |
| ≤560px | Nav CTA is replaced by an in-menu contact link, gutters tighten to 20px, metric rail and stage rail stack, gate readout goes 2×2, the hero figure's affordance note is dropped because a caption and a note cannot share that bar at this width |
| `pointer: coarse` | All targets reach 44px regardless of viewport width |

---

## Pages

Four routes, in three classes. **Every one of them links `tokens.css` and `site.css`.** The class decides what, if anything, it may do differently:

| Route | Class | Exceptions allowed |
|-------|-------|--------------------|
| `/`, `/contact/` | marketing | none |
| `/demo/` | product surface | exactly one, recorded below |
| `404.html` | utility | none |

This table replaces a "three pages, not two" framing that was wrong twice over: `404.html` was never counted, and it was not merely uncounted but running a private design system.

`404.html` had a `:root` of its own on a `#05070a` canvas, Inter at weight 700, a `#4da3ff` fourth accent used as a CTA color, a masked two-gradient grid texture, a filled button, a 2px button radius, and it linked neither stylesheet. That is the demo page's old sin verbatim, and a 404 is disproportionately where a stale link from a briefing email lands, which makes it a first impression for exactly the buyer this site is written for. It is now composed entirely from shared primitives, with `.eyebrow` carrying `Error 404` (a machine label, which is what the eyebrow is for) and about six lines of page-specific CSS for vertical centering.

**A utility page earns no exceptions.** Low traffic is a reason to spend little effort on it, not a licence to run a second design system in it.

## The demo console (`/demo/`)

`/demo/` is a **product surface**, not a marketing page, and that earns it exactly one exception: it keeps its own shell, a sticky status bar in place of the fixed site header and no footer. Everything inside that shell is drawn from the same tokens as the rest of the site, and it links `tokens.css` and `site.css` like every other page.

It is also load-bearing for the landing page's central claim. `#assurance` links `demo/#assure`, and the feed accepts any event kind as a hash so that deep link lands on the assurance gate rather than the scenario's default event. A deep-linked arrival plays instantly instead of making the visitor sit through the replay to reach the thing they clicked for.

It used to be a second design system in the same repository: a private `:root` with a blue-black `#080b11` canvas, Space Grotesk and IBM Plex Sans against the rest of the site's Inter, a `#57a0c4` accent, 6px radii, a glowing status dot, and a filled primary button. It imported neither stylesheet. Since it is the page a buyer clicks into from the landing page, it read as a different company's product.

Two decisions worth keeping:

- **No accent replaced the blue.** The system has three status colors and no brand accent, so the five feed event kinds separate on status where they *are* a status (`k-warn` watch, `k-crit` threat, `k-ok` nominal) and on text tier plus rule weight where they are not (`k-sys` faint on hairline, `k-info` body on edge). An event kind is not a state, and it does not get a color for decoration.
- **Console controls may be compact.** `.chip-btn` is a ghost button that sits below the 44px floor on precise pointers, because a 44px control inside a panel header is wrong for a dense console. It reaches 44px under `pointer: coarse`, so the touch guarantee still holds. This is the only place the floor is relaxed, and the relaxation is pointer-conditional.

## Progressive enhancement

The scroll reveal holds `.reveal` at `opacity: 0` and only scripting clears it, so **every page ships a `<noscript>` override in `<head>`** that forces `opacity: 1; transform: none`. Reveal is driven by one `IntersectionObserver` with a fallback that reveals everything if the API is missing; there is no timeout backstop.

The hero spacecraft applies the same principle by making the **fallback the default markup state**. The residual SVG sits in the figure, in flow and fully labelled, exactly as it did before the spacecraft existed. `hero-satellite.js` adds `.sat-live` to the figure only once it actually holds a 2D context, and that class is what hides the SVG, shows the canvas, and turns the SVG into the overlay the Δv marker opens. No script, no canvas, no loss: a visitor gets the schematic this replaced.

**Enhancements fail open or closed depending on what their absence costs.** The reveal must fail **open**: its absence hides content, so a missing `IntersectionObserver` reveals everything. The scrollspy fails **closed**: an absent position indicator costs a visitor nothing, so it does nothing and adds no polyfill. Deciding this per feature, rather than adopting one house style, is the point.

Ordering in `site.js` matters for the same reason. The reveal block ends in an early return from the shared IIFE, so **anything added after it dies on a page that has a nav and no `.reveal` elements**. The scrollspy is therefore placed before it.

The intro is the one place a timeout backstop is warranted, and it is there. The veil is full-viewport, so a `hero-satellite.js` that never arrives must not be able to strand a visitor behind it: the inline head script that arms the intro also schedules a 6s clear of `.intro-armed`, and `hero-satellite.js` cancels that timer when it takes over.

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

Tokens live in `styles/tokens.css`. The shared shell (reset, sections, nav, buttons, chips, frames, footer, reveal, nav state) lives in `styles/site.css` and `scripts/site.js`. Page-specific composition stays in each page's own `<style>` block. **All four routes** (`/`, `/contact/`, `/demo/`, `404.html`) link both stylesheets; see §Pages.

Two page-specific scripts exist, both loaded with `defer` by `/` alone and both failing closed:

- `scripts/hero-satellite.js` draws the hero spacecraft. It reads its colors from `tokens.css` through `getComputedStyle` rather than hard-coding them, so the drawing stays governed by the tokens like everything else: **if a surface or text tier moves, the spacecraft follows automatically, but check the star field's alpha range by eye.**
- `scripts/console-preview.js` lays the running `/demo/` over the platform screenshot. It declines on small viewports (below 700px the console is illegible scaled down), under reduced motion, and without `IntersectionObserver` — in each case the still is a perfectly good answer and loading a whole page in an iframe is not worth it.

**Timing is the hard part of that file, and two obvious ways of expressing it are wrong.** The replay lasts about four seconds and `/demo/` starts it on its own load, so mounting the iframe early means the assembly finishes before anyone is looking. Mounting is therefore deferred until the figure is genuinely on screen, and because loading the frame is what starts it, arriving and playing are the same event. Nothing reaches into the frame to drive it.

The trigger is an `IntersectionObserver` on a **zero-size sentinel pinned at the figure's midpoint**, with `rootMargin: '-25% 0px -25% 0px'`. The two approaches it replaced both looked correct:

| Trigger | Fires when the figure is | Why it fails |
|---|---|---|
| `threshold: 0.35` on the figure | 37% visible | fires as the figure enters; replay is over before arrival |
| `-25%` band on the figure | 37% visible | intersection means *any* overlap, so a 609px figure clips the band while still mostly below the fold — measured 5px later than the threshold it replaced |
| `-25%` band on a centre sentinel | **71–99% visible** | correct |

A high threshold is also unsatisfiable whenever the figure is taller than the viewport, so short windows would never play it at all. **A point either is in the band or is not**, at every viewport height and every figure height — which is why the sentinel is the thing being observed rather than the figure.

The embedded frame is `inert` and `aria-hidden`, and the still keeps its alt text underneath: the frame is one link to `/demo/`, and letting a keyboard user tab into a preview's controls would be a trap.

Two things to check before changing a surface value: `--rule-hairline` and `--text-faint` are both sized against `--surface-chrome` and will silently fall below AA if it moves.
