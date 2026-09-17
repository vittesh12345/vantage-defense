/* Entry-approach loader: decides whether the 2-second orbit-map approach may
   run, and only then pays for it. The hero has already painted; this module
   is additive or absent, never blocking.

   The guard gauntlet, all mandatory:
     - once per session, and the flag is set only when the intro is SEEN
     - no reduced motion, no save-data, no 2g
     - tab visible, page at the top, viewport wide enough, WebGL present
   A 2500ms ready budget covers module import + textures + catalog; if it
   expires, or the visitor scrolls/types meanwhile, nothing ever appears and
   the flag stays unset so a warm-cache navigation later may still play. */
(() => {
  'use strict';
  const FLAG = 'vantage-approach';
  const BUDGET_MS = 2500;

  let flagged = 'done';
  try { flagged = sessionStorage.getItem(FLAG) || ''; } catch (_) { /* storage off = play once per load */ }
  if (flagged === 'done') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const conn = navigator.connection;
  if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return;
  if (document.visibilityState !== 'visible') return;
  if (scrollY >= 8) return;
  if (innerWidth < 700) return;
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  let aborted = false;
  const abort = () => { aborted = true; };
  const evs = ['wheel', 'keydown', 'pointerdown', 'touchstart'];
  evs.forEach((ev) => addEventListener(ev, abort, { passive: true, once: true }));
  const unarm = () => evs.forEach((ev) => removeEventListener(ev, abort));

  const budget = new Promise((r) => setTimeout(() => r(null), BUDGET_MS));
  const ready = import('../visualization/js/approach.js')
    .then((m) => m.prepareApproach().then((assets) => ({ m, assets })))
    .catch(() => null);

  Promise.race([budget, ready]).then((hit) => {
    unarm();
    if (!hit || aborted) return;
    if (scrollY >= 8 || document.visibilityState !== 'visible') return;
    try { sessionStorage.setItem(FLAG, 'done'); } catch (_) { /* best effort */ }
    hit.m.playApproach(hit.assets, { theme: document.body.dataset.approachTheme || 'site' })
      .catch(() => { /* playApproach resolves on every path; belt over braces */ });
  });
})();
