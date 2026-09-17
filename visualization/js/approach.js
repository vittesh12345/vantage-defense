/* The entry approach: a 2.0-second camera flight from the full Earth into one
   real tracked object, using the orbit map's own scene, catalog and textures.
   This is product output, not a video: the same createViz() that renders
   /visualization/, pointed at COSMOS 2570 and flown for two seconds.

   Contract with the loader (scripts/entry-approach.js):
     prepareApproach()          — loads the 1k texture set + catalog. No DOM.
     playApproach(assets, opts) — builds the overlay, flies, resolves when the
                                  page is back. Never throws out of itself.

   The overlay is additive over a fully rendered page: nothing beneath is
   moved, hidden, or scroll-locked, so every failure mode degrades to "the
   page, exactly as it already was". */

import { buildCatalog } from './catalog.js';
import { createViz } from './scene.js';

const TARGET_NORAD = 58119; // COSMOS 2570, 460 km, inc 67.1 — real catalog identity
const FLY_MS = 1600;        // flight
const FADE_IN_MS = 200;     // overlay fade, overlapping the flight start
const FADE_OUT_MS = 200;    // handoff fade: 200 + 1600 + 200 = the 2.0s budget
const SKIP_FADE_MS = 250;
const BACKSTOP_MS = 4000;   // 2s budget with 2x margin; armed at attach, never cleared

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function prepareApproach() {
  /* The 1k earth is enough: the approach never gets close enough to the
     surface to want the 4k sheet, and it is a quarter of the bytes. The
     starfield is small already. */
  const [earth, night] = await Promise.all([
    loadImage('visualization/img/earth-blue-marble-1k.webp'),
    loadImage('visualization/img/night-sky.webp'),
  ]);
  if (!earth) throw new Error('earth texture failed');
  const objects = buildCatalog();
  const target = objects.findIndex((o) => o.id === TARGET_NORAD);
  if (target < 0) throw new Error('target not in catalog');
  return { earth, night, objects, target };
}

export function playApproach(assets, opts) {
  const theme = (opts && opts.theme) || 'site';
  return new Promise((resolve) => {
    let settled = false;
    let rafId = 0;
    const listeners = [];

    const overlay = document.createElement('div');
    overlay.className = 'approach-overlay approach-' + theme;
    overlay.setAttribute('aria-hidden', 'true');

    const poster = document.createElement('img');
    poster.className = 'poster';
    poster.alt = '';
    poster.src = 'assets/leo-visualization.jpg';
    overlay.appendChild(poster);

    const canvas = document.createElement('canvas');
    overlay.appendChild(canvas);

    const cap = document.createElement('div');
    cap.className = 'approach-cap';
    cap.innerHTML =
      '<div>COSMOS 2570 · NORAD 58119 · INC 67.1°</div>' +
      '<div class="sub">Synthetic catalog · assessments simulated</div>';
    overlay.appendChild(cap);

    const skipHint = document.createElement('div');
    skipHint.className = 'approach-skip';
    skipHint.textContent = 'press any key to skip';
    overlay.appendChild(skipHint);

    if (theme === 'defense') {
      const dtg = document.createElement('div');
      dtg.className = 'approach-dtg';
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      dtg.textContent = p(d.getUTCDate()) + p(d.getUTCHours()) + p(d.getUTCMinutes()) + 'Z ' +
        MON[d.getUTCMonth()] + ' ' + p(d.getUTCFullYear() % 100);
      overlay.appendChild(dtg);
    }

    const on = (target, ev, fn, o) => {
      target.addEventListener(ev, fn, o);
      listeners.push([target, ev, fn, o]);
    };

    const teardown = (fadeMs) => {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(rafId);
      listeners.forEach(([t, ev, fn, o]) => t.removeEventListener(ev, fn, o));
      const finish = () => {
        overlay.remove();
        try {
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          const lose = gl && gl.getExtension('WEBGL_lose_context');
          if (lose) lose.loseContext();
        } catch (_) { /* best effort */ }
        resolve();
      };
      if (fadeMs > 0) {
        overlay.classList.add('hide');
        setTimeout(finish, fadeMs + 50);
      } else {
        finish();
      }
    };

    document.body.appendChild(overlay);

    /* Unconditional backstop: armed the moment the overlay exists, never
       cleared until teardown. Whatever else goes wrong, the page is back
       within four seconds. */
    setTimeout(() => teardown(0), BACKSTOP_MS);

    /* Any input is a skip, at any point. */
    ['wheel', 'keydown', 'pointerdown', 'touchstart'].forEach((ev) =>
      on(window, ev, () => teardown(SKIP_FADE_MS), { passive: true }));
    /* A hidden tab never holds a veil. Instant, no fade: nobody is watching. */
    on(document, 'visibilitychange', () => {
      if (document.visibilityState !== 'visible') teardown(0);
    });

    let viz;
    try {
      viz = createViz({
        canvas,
        textures: { earth: assets.earth, night: assets.night },
        objects: assets.objects,
        sensorSites: [],
      });
    } catch (_) {
      teardown(0);
      return;
    }

    const size = () => viz.resize(overlay.clientWidth, overlay.clientHeight);
    on(window, 'resize', size);
    size();
    viz.setReveal(1);
    viz.select(assets.target);

    const dir = { x: 0, y: 0, z: 0 };
    const tmp = [0, 0, 0];
    const ease3 = (t) => 1 - Math.pow(1 - t, 3);

    let start = 0;
    let shown = false;
    const frame = (now) => {
      if (settled) return;
      if (!start) {
        start = now;
        overlay.classList.add('show');
      }
      const t = Math.min(1, (now - start - FADE_IN_MS * 0.5) / FLY_MS);
      viz.setTime(Date.now());

      viz.objectScenePos(assets.target, tmp);
      const len = Math.hypot(tmp[0], tmp[1], tmp[2]) || 1;
      dir.x = tmp[0] / len; dir.y = tmp[1] / len; dir.z = tmp[2] / len;
      const rEnd = len + 0.06; // ~60 km off the glyph, Earth limb in frame
      const r = 64 + (rEnd - 64) * ease3(Math.max(0, t));
      viz.camera.position.set(dir.x * r, dir.y * r, dir.z * r);

      viz.render();
      if (!shown) {
        shown = true;
        overlay.classList.add('live'); // crossfade poster -> first real frame
      }
      if (t >= 1) {
        teardown(FADE_OUT_MS);
        return;
      }
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
  });
}
