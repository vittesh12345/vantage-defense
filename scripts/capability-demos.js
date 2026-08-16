/* Vantage capability demos
   ==========================================================================
   Three of the engines, running. Not a fabricated animation: this replays the
   REAL output the engines produced on their held-out splits, exported by the
   console's `npm run export:demos` into assets/demos.js. The site is static, so
   the output is precomputed rather than recomputed in the browser, but every
   marker, curve, and score below is a number an engine actually returned.

   Everything is labelled-SYNTHETIC, the same data the benchmarks score, and the
   figure says so in its header.

   Progressive enhancement, same shape as the rest of the site: the figure ships
   a plain-text results summary in the markup as its default state. This script
   replaces it with the interactive figure only when the data and the DOM are
   both present; with no script, or no data, the honest numbers still stand.
   Animation is a further layer on top, skipped under reduced motion. */
(function () {
  'use strict';

  var D = window.VANTAGE_DEMOS;
  var root = document.getElementById('engine-demos');
  if (!D || !root) return; /* fail closed: the text summary stays */

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C = {
    track: '#e8eaec', good: '#3ad389', warn: '#ffca16', bad: '#ff6b5f',
    line: '#3d4552', edge: '#525a66', faint: '#878c95', muted: '#a1a4a5'
  };
  var W = 720, H = 240, PL = 52, PR = 16, PT = 18, PB = 30;
  var uid = 0;

  var TYPE = { CK: 'chemical', EK: 'electric', HK: 'hybrid', NK: 'coasting' };

  /* ---- small helpers ---------------------------------------------------- */
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function scale(dmin, dmax, rmin, rmax) {
    var s = dmax === dmin ? 0 : (rmax - rmin) / (dmax - dmin);
    return function (v) { return rmin + (v - dmin) * s; };
  }
  function extent(a) { return [Math.min.apply(null, a), Math.max.apply(null, a)]; }
  function path(xs, ys) {
    var d = '';
    for (var i = 0; i < xs.length; i++) d += (i ? 'L' : 'M') + xs[i].toFixed(1) + ',' + ys[i].toFixed(1);
    return d;
  }
  /* nearest sample value at fractional position t in [0,1] */
  function at(arr, t) { return arr[Math.max(0, Math.min(arr.length - 1, Math.round(t * (arr.length - 1))))]; }

  /* Wrap the "drawn" markup in a clip whose width animates left to right; the
     returned <defs>/attribute pair and the animate() closure share one id. */
  function wipe(inner) {
    var id = 'wipe' + (uid++);
    var svg = '<clipPath id="' + id + '"><rect x="' + PL + '" y="0" width="0" height="' + H + '"></rect></clipPath>';
    return { defs: svg, group: '<g clip-path="url(#' + id + ')">' + inner + '</g>', id: id };
  }
  function play(svgEl, id, onDone) {
    var rect = svgEl.querySelector('#' + id + ' rect');
    var full = W - PL - PR;
    if (reduce || !rect) { if (rect) rect.setAttribute('width', full); svgEl.classList.add('demo-done'); if (onDone) onDone(); return; }
    var t0 = null, dur = 900;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      rect.setAttribute('width', (full * k).toFixed(1));
      if (k < 1) requestAnimationFrame(step); else { svgEl.classList.add('demo-done'); if (onDone) onDone(); }
    }
    requestAnimationFrame(step);
  }

  /* ---- Pattern of life -------------------------------------------------- */
  function renderPol() {
    var p = D.pol;
    var ex = extent(p.longitude), pad = (ex[1] - ex[0]) * 0.12 || 1;
    var xs = scale(0, 1, PL, W - PR), ys = scale(ex[0] - pad, ex[1] + pad, H - PB, PT);
    var px = p.x.map(xs), py = p.longitude.map(ys);

    var guides = '', marks = '';
    var cps = p.truth.filter(function (n) { return n.node === 'ID' || n.node === 'IK' || n.node === 'AD'; });
    cps.forEach(function (n) {
      var x = xs(n.t);
      guides += '<line x1="' + x.toFixed(1) + '" y1="' + PT + '" x2="' + x.toFixed(1) + '" y2="' + (H - PB) + '" stroke="' + C.line + '" stroke-dasharray="3 3"></line>';
    });
    p.learned.filter(function (n) { return n.node === 'ID' || n.node === 'IK'; }).forEach(function (n) {
      var x = xs(n.t), y = ys(at(p.longitude, n.t));
      var label = n.node === 'ID' ? 'drift starts' : 're-stations';
      marks += diamond(x, y, C.good) +
        '<text class="demo-mk" x="' + x.toFixed(1) + '" y="' + (y - 12).toFixed(1) + '" text-anchor="middle" fill="' + C.good + '" font-family="IBM Plex Mono, monospace" font-size="10">' + label + '</text>';
    });

    var svg = openSvg('Longitude of one held-out GEO object over six months, with the learned engine\'s detected behavioural nodes.');
    var w = wipe('<path d="' + path(px, py) + '" fill="none" stroke="' + C.track + '" stroke-width="1.5"></path>');
    svg += '<defs>' + w.defs + '</defs>' + axisY('longitude (deg)') + guides + w.group + marks;
    /* the propulsion-type read, the learned engine's edge over the rules */
    var ik = p.learned.filter(function (n) { return n.node === 'IK'; })[0];
    var rIk = p.rules.filter(function (n) { return n.node === 'IK'; })[0];
    if (ik && rIk && ik.type !== rIk.type) {
      svg += '<text class="demo-mk" x="' + (W - PR) + '" y="' + (PT + 4) + '" text-anchor="end" fill="' + C.good + '" font-family="IBM Plex Mono, monospace" font-size="10">learned: ' + esc(TYPE[ik.type] || ik.type) + ' ✓</text>';
      svg += '<text class="demo-mk" x="' + (W - PR) + '" y="' + (PT + 18) + '" text-anchor="end" fill="' + C.bad + '" font-family="IBM Plex Mono, monospace" font-size="10">fixed rules: ' + esc(TYPE[rIk.type] || rIk.type) + ' ✗</text>';
    }
    svg += '</svg>';
    return {
      svg: svg, wipe: w.id,
      note: 'One held-out GEO object: it holds a slot, drifts to a new longitude, and re-stations. The learned engine marks both changes and reads the electric propulsion type from the station-keeping signature the fixed rules misread as chemical. Scored by the public SPLID evaluator, F₂ ' + p.scoreLearned.toFixed(2) + ' versus ' + p.scoreRules.toFixed(2) + ' for the rules on this object.'
    };
  }
  function diamond(x, y, c) { var r = 5; return '<path class="demo-mk" d="M' + x + ' ' + (y - r) + 'L' + (x + r) + ' ' + y + 'L' + x + ' ' + (y + r) + 'L' + (x - r) + ' ' + y + 'Z" fill="none" stroke="' + c + '" stroke-width="1.8"></path>'; }

  /* ---- Sensor tasking --------------------------------------------------- */
  function renderTasking() {
    var t = D.tasking, n = t.trained.length;
    var all = t.trained.concat(t.greedy, t.random), ex = extent(all);
    var xs = scale(0, n - 1, PL, W - PR), ys = scale(ex[0], ex[1] * 1.02, H - PB, PT);
    function line(arr) { return path(arr.map(function (_, i) { return xs(i); }), arr.map(ys)); }

    var svg = openSvg('Priority-weighted catalogue uncertainty over a 12-hour window for three tasking policies.');
    var w = wipe(
      '<path d="' + line(t.random) + '" fill="none" stroke="' + C.faint + '" stroke-width="1.3" stroke-dasharray="4 3"></path>' +
      '<path d="' + line(t.greedy) + '" fill="none" stroke="' + C.warn + '" stroke-width="1.4"></path>' +
      '<path d="' + line(t.trained) + '" fill="none" stroke="' + C.good + '" stroke-width="1.6"></path>'
    );
    svg += '<defs>' + w.defs + '</defs>' + axisY('uncertainty (km)') + w.group;
    svg += legend([['trained', C.good], ['greedy', C.warn], ['naive', C.faint]]);
    svg += '<text class="demo-mk" x="' + (W - PR) + '" y="' + (H - PB - 6) + '" text-anchor="end" fill="' + C.muted + '" font-family="IBM Plex Mono, monospace" font-size="10">worst-tracked object: trained ' + t.worstTrained.toFixed(1) + ' km · greedy ' + t.worstGreedy.toFixed(1) + ' km</text>';
    svg += '</svg>';
    return {
      svg: svg, wipe: w.id,
      note: 'One held-out scenario, ' + t.objects + ' objects across a 3-site network, ' + t.flagged + ' flagged by the warning queue. The trained scheduler tracks the strong greedy baseline on the whole catalogue and both crush naive tasking; the trained edge shows up on the worst-tracked object, held ' + Math.round((1 - t.worstTrained / t.worstGreedy) * 100) + '% tighter.'
    };
  }
  function legend(items) {
    var x = PL + 6, out = '';
    items.forEach(function (it) {
      out += '<line x1="' + x + '" y1="' + (PT + 6) + '" x2="' + (x + 16) + '" y2="' + (PT + 6) + '" stroke="' + it[1] + '" stroke-width="2"></line>';
      out += '<text x="' + (x + 21) + '" y="' + (PT + 10) + '" fill="' + C.muted + '" font-family="IBM Plex Mono, monospace" font-size="10">' + it[0] + '</text>';
      x += 21 + it[0].length * 6.4 + 16;
    });
    return out;
  }

  /* ---- Telemetry -------------------------------------------------------- */
  var telSeg = 0;
  function renderTelemetry() {
    var tel = D.telemetry, seg = tel.segments[telSeg];
    var ex = extent(seg.values), pad = (ex[1] - ex[0]) * 0.08 || 1;
    var xs = scale(0, seg.values.length - 1, PL, W - PR), ys = scale(ex[0] - pad, ex[1] + pad, H - PB, PT);
    var col = seg.anomaly ? C.bad : C.good;
    var svg = openSvg('One telemetry segment with the anomaly detector\'s verdict.');
    var w = wipe('<path d="' + path(seg.values.map(function (_, i) { return xs(i); }), seg.values.map(ys)) + '" fill="none" stroke="' + col + '" stroke-width="1.5"></path>');
    svg += '<defs>' + w.defs + '</defs>' + axisY(seg.channel.replace(/_/g, ' ').toLowerCase()) + w.group;
    var verdict = seg.anomaly ? 'FLAGGED' : 'CLEAR';
    svg += '<text class="demo-mk" x="' + (W - PR) + '" y="' + (PT + 4) + '" text-anchor="end" fill="' + col + '" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600">' + verdict + '</text>';
    svg += '<text class="demo-mk" x="' + (W - PR) + '" y="' + (PT + 19) + '" text-anchor="end" fill="' + C.muted + '" font-family="IBM Plex Mono, monospace" font-size="10">score ' + fmt(seg.score) + ' · threshold ' + tel.threshold.toFixed(2) + '</text>';
    svg += '</svg>';
    return {
      svg: svg, wipe: w.id, chips: true,
      note: 'The detector is fit only on healthy history, so it needs no catalogue of past failures. The healthy segment scores below the threshold; each anomalous one scores well above it. Built in the shape of the public OPS-SAT anomaly benchmark.'
    };
  }
  function fmt(v) { return v >= 10 ? v.toFixed(0) : v.toFixed(2); }

  /* ---- shared svg scaffolding ------------------------------------------ */
  function openSvg(label) {
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="demo-svg" role="img" aria-label="' + esc(label) + '">';
  }
  function axisY(label) {
    return '<line x1="' + PL + '" y1="' + PT + '" x2="' + PL + '" y2="' + (H - PB) + '" stroke="' + C.line + '"></line>' +
      '<line x1="' + PL + '" y1="' + (H - PB) + '" x2="' + (W - PR) + '" y2="' + (H - PB) + '" stroke="' + C.line + '"></line>' +
      '<text x="' + PL + '" y="' + (H - 8) + '" fill="' + C.faint + '" font-family="IBM Plex Mono, monospace" font-size="10">' + esc(label) + '</text>' +
      '<text x="' + (W - PR) + '" y="' + (H - 8) + '" text-anchor="end" fill="' + C.faint + '" font-family="IBM Plex Mono, monospace" font-size="10">time →</text>';
  }

  /* ---- shell ------------------------------------------------------------ */
  var TABS = [
    { id: 'pol', label: 'Pattern of life', render: renderPol },
    { id: 'tasking', label: 'Sensor tasking', render: renderTasking },
    { id: 'telemetry', label: 'Health monitoring', render: renderTelemetry }
  ];
  var active = 0, revealed = false;

  var shell = document.createElement('div');
  shell.className = 'demo-shell';
  shell.innerHTML =
    '<div class="demo-tabs" role="tablist"></div>' +
    '<div class="demo-stage"></div>' +
    '<div class="demo-chips"></div>' +
    '<p class="demo-note disc-note"></p>';
  /* replace the no-JS fallback */
  var fallback = root.querySelector('.demo-fallback');
  if (fallback) fallback.style.display = 'none';
  root.appendChild(shell);

  var tabsEl = shell.querySelector('.demo-tabs');
  var stageEl = shell.querySelector('.demo-stage');
  var chipsEl = shell.querySelector('.demo-chips');
  var noteEl = shell.querySelector('.demo-note');

  TABS.forEach(function (tab, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'demo-tab';
    b.textContent = tab.label;
    b.setAttribute('role', 'tab');
    b.addEventListener('click', function () { select(i, true); });
    tabsEl.appendChild(b);
  });

  function select(i, animate) {
    active = i;
    Array.prototype.forEach.call(tabsEl.children, function (b, k) {
      b.classList.toggle('is-active', k === i);
      b.setAttribute('aria-selected', k === i ? 'true' : 'false');
    });
    draw(animate);
  }

  function draw(animate) {
    var out = TABS[active].render();
    stageEl.innerHTML = out.svg;
    noteEl.textContent = out.note;
    /* telemetry segment chips */
    chipsEl.innerHTML = '';
    if (out.chips) {
      D.telemetry.segments.forEach(function (s, k) {
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'demo-chip' + (k === telSeg ? ' is-active' : '');
        c.textContent = s.anomaly ? 'anomaly ' + k : 'healthy';
        c.addEventListener('click', function () { telSeg = k; draw(true); });
        chipsEl.appendChild(c);
      });
    }
    var svgEl = stageEl.querySelector('svg');
    if (svgEl && out.wipe) { if (animate && !reduce) play(svgEl, out.wipe); else play(svgEl, out.wipe, null); }
  }

  select(0, false); /* build the finished first tab immediately */

  /* replay on first reveal, same sentinel technique as the console preview */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || revealed) return;
      revealed = true; io.disconnect();
      draw(true);
    }, { rootMargin: '-20% 0px -20% 0px', threshold: 0 });
    io.observe(root);
  }
})();
