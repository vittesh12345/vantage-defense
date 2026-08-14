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

Serve it — don't open `index.html` off the filesystem. The visualization loads as ES
modules, which browsers block over `file://`.

## Pages

| Path | Page |
|---|---|
| `index.html` | Landing page |
| `demo/` | Interactive console demo |
| `visualization/` | Orbital visualization — `index.html` embedded, `full.html` standalone |
| `contact/` | Contact form |
| `404.html` | Not-found page |

## Layout

```
index.html          landing page
404.html            not-found page
design.md           the design system — read before changing anything visual

styles/             tokens.css (design tokens) + site.css
scripts/            site.js, hero-satellite.js, console-preview.js
assets/             images, favicons, og-card

demo/               console demo (single page)
contact/            contact form + contact.js
visualization/      orbital viz
  index.html          embedded view
  full.html           standalone view
  viz.css
  js/                 main, scene, orbits, catalog, ui (ES modules)
  vendor/             three.js
  img/                textures

CNAME               custom domain
```

## Before you change anything visual

**Read [`design.md`](design.md) first.** It is the source of truth for this site, and it
is unusually specific — it records not just the tokens but *why* each value is what it
is, including contrast measurements that several tokens depend on.

The rules that catch people out:

- No shadows, no gradients, no glows. Hierarchy comes from scale, tracking, and surface
  level.
- Border radius stops at **4px**.
- Buttons are ghost outlines. A button is never filled and never colored.
- Three status colors only — green, amber, red — and each means exactly one thing.
  There is no brand accent.
- Sections alternate surfaces from a four-step ladder. Don't add a fifth.

**If you move a surface token, re-check `--rule-hairline` and `--text-faint` immediately.**
Both are sized against `--surface-chrome` and silently fall below WCAG AA when it moves.
This has already happened once; `design.md` documents the fix.

## Deployment

GitHub Pages, with `CNAME` pointing the custom domain at the repo. There is no CI
workflow and no build step, so **what is committed is exactly what goes live** — commit
carefully, and check the deployed page after pushing.

Because nothing is compiled, a broken edit ships as-is. Serve the site locally and click
through `/`, `/demo/`, `/visualization/`, and `/contact/` before pushing.
