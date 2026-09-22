# vantage.industries

The public marketing site for Vantage. Hand-written static HTML, CSS, and vanilla JS —
**no build step, no framework, no package.json.**

Live at **[vantage.industries](https://vantage.industries)**.

## Run it locally

Any static server works. Nothing to install, nothing to compile:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Serve it — don't open `index.html` off the filesystem. The visualization and the hero
backdrop load as ES modules, which browsers block over `file://`.

## Pages

| Path | Page |
|---|---|
| `index.html` | Landing page |
| `orbwatch/` | ORBWATCH — the five detection and assessment models |
| `guardian/` | GUARDIAN — the three response models |
| `demo/` | Interactive console demo |
| `visualization/` | Orbital map — `index.html` embedded, `full.html` standalone |
| `contact/` | Contact form |
| `404.html` | Not-found page |

## Layout

```
index.html          landing page
404.html            not-found page
design.md           the design system — read before changing anything visual

styles/             tokens.css (design tokens) + site.css (shared components)
scripts/            site.js, console-preview.js, entry-approach.js
assets/             images, favicons, og-card, exported engine figures

orbwatch/           product page
guardian/           product page
demo/               console demo (single page)
contact/            contact form + contact.js
visualization/      orbital map
  index.html          embedded view
  full.html           standalone view
  viz.css
  js/                 main, scene, orbits, catalog, ui, approach (ES modules)
  vendor/             three.js
  img/                textures

CNAME               custom domain
```

## Before you change anything visual

**Read [`design.md`](design.md) first.** It is the source of truth for this site, and it
is unusually specific — it records not just the tokens but *why* each value is what it
is, including the measurements several decisions depend on.

The rules that catch people out:

- **Every band declares its tone.** Sections alternate `.tone-light` and `.tone-dark`,
  and the neutral tokens resolve differently under each. A band with no tone class is a
  bug. Where two same-tone bands meet, a `.divider` hairline carries the boundary.
- Border radius stops at **4px** — except the floating nav pill (16px) and the footer
  chips. The two-tone CTA blocks are square, deliberately.
- Three status colors only — green, amber, red — and each means exactly one thing.
  There is no brand accent, and a status color is never decorative.
- Geist for prose, **Geist Mono for every figure, label, hash and readout.**
- **No em dashes in visible copy.** Use a comma, colon, period, or restructure.
- Anything that looks like product output must *be* product output. No CGI, no renders,
  no AI imagery: real photography (credited) or exported engine output only.

## Where the shared CSS lives

A component moves from a page's inline `<style>` into `styles/site.css` the moment a
second page needs it; anything used by exactly one page stays inline on that page. The
model lists, the metric rail, the product-output figures and the closing CTA are shared.
The landing page's hero, statement, pipeline stages and segment grid are not.

## Deployment

GitHub Pages, with `CNAME` pointing the custom domain at the repo. There is no CI
workflow and no build step, so **what is committed is exactly what goes live** — commit
carefully, and check the deployed page after pushing.

Because nothing is compiled, a broken edit ships as-is. Serve the site locally and click
through `/`, `/orbwatch/`, `/guardian/`, `/demo/`, `/visualization/`, and `/contact/`
before pushing.
