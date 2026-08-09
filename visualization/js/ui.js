/* HUD wiring for the reference-style console: the left menu (search, speed,
   layer toggles, view modes, filters), the boxed legend with the fixed
   Selected Object card beneath it, the tracking selection halo, the hover
   chips, the big clock and the objects-displayed counter. */

import { KIND_NAME } from './catalog.js';
import {
  apogeeKm, perigeeKm, periodMinutes, eciPosition, fmtUtc,
} from './orbits.js';

const $ = (id) => document.getElementById(id);

const TYPE_RGB = [
  [0.18, 0.91, 0.24],  // payload — vivid green
  [0.95, 0.78, 0.25],  // rocket body — gold
  [1.00, 0.18, 0.24],  // debris — bright crimson
  [0.25, 0.49, 1.00],  // unknown — bright blue
];

const COUNTRY_COLORS = {
  US: [0.18, 0.51, 0.97], CIS: [0.88, 0.25, 0.25], PRC: [0.91, 0.77, 0.13],
  UK: [0.21, 0.77, 0.30], ESA: [0.55, 0.39, 0.82], JPN: [0.90, 0.45, 0.13],
  IND: [0.13, 0.78, 0.81], FR: [0.85, 0.33, 0.63],
};
const OTHER_COLOR = [0.62, 0.62, 0.62];
const COUNTRY_NAMES = {
  US: 'United States', CIS: 'Russia / CIS', PRC: 'China', UK: 'United Kingdom',
  ESA: 'ESA', JPN: 'Japan', IND: 'India', FR: 'France',
};

/* Blue → cyan → green → yellow → red, like the classic parameter ramps. */
function ramp(t) {
  t = Math.max(0, Math.min(1, t));
  const stops = [
    [0.15, 0.25, 0.90], [0.10, 0.75, 0.90], [0.20, 0.80, 0.20],
    [0.92, 0.85, 0.15], [0.90, 0.22, 0.15],
  ];
  const x = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  return [0, 1, 2].map((k) => stops[i][k] + (stops[i + 1][k] - stops[i][k]) * f);
}

export function initUI({ viz, objects, time, sensorSites }) {
  const n = objects.length;
  const perigee = new Float32Array(n);
  const apogee = new Float32Array(n);
  const period = new Float32Array(n);
  const incDeg = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const el = objects[i].el;
    perigee[i] = perigeeKm(el.a, el.e);
    apogee[i] = apogeeKm(el.a, el.e);
    period[i] = periodMinutes(el.a);
    incDeg[i] = el.inc * 180 / Math.PI;
  }

  const state = {
    view: 'type',
    debris: false,          // the analyst small-debris layer
    filterParam: 'perigee',
    filterMin: NaN,
    filterMax: NaN,
    autoRefresh: true,
  };
  let selectedIdx = -1;
  let shownCount = 0;

  /* ---------------- visibility ---------------- */
  const paramValue = (i) => {
    switch (state.filterParam) {
      case 'perigee': return perigee[i];
      case 'apogee': return apogee[i];
      case 'period': return period[i];
      case 'inclination': return incDeg[i];
      case 'year': return objects[i].year;
      default: return 0;
    }
  };

  function applyVis() {
    let count = 0;
    const lo = Number.isFinite(state.filterMin) ? state.filterMin : -Infinity;
    const hi = Number.isFinite(state.filterMax) ? state.filterMax : Infinity;
    const filtered = lo !== -Infinity || hi !== Infinity;
    viz.setVis((arr) => {
      for (let i = 0; i < n; i++) {
        let on = state.debris || objects[i].group !== 'xdeb';
        if (on && filtered) {
          const v = paramValue(i);
          on = v >= lo && v <= hi;
        }
        arr[i] = on ? 1 : 0;
        if (on) count++;
      }
    });
    shownCount = count;
  }

  /* ---------------- view modes & legend ---------------- */
  const legendHead = $('legend-head');
  const legendBody = $('legend-body');

  function legendRows(rows) {
    legendBody.textContent = '';
    for (const [rgb, label] of rows) {
      const row = document.createElement('div');
      row.className = 'legend-row';
      const sw = document.createElement('span');
      sw.className = 'sw';
      sw.style.background = `rgb(${rgb.map((c) => Math.round(c * 255)).join(',')})`;
      const tx = document.createElement('span');
      tx.textContent = label;
      row.append(sw, tx);
      legendBody.appendChild(row);
    }
  }

  const VIEWS = {
    type: {
      title: 'Object Type',
      color: (i) => TYPE_RGB[objects[i].kind],
      legend: () => legendRows(KIND_NAME.map((name, k) => [TYPE_RGB[k], name === 'Rocket body' ? 'Rocket Body' : name])),
    },
    perigee: {
      title: 'Perigee',
      color: (i) => ramp((perigee[i] - 200) / 1300),
      legend: () => legendRows([0, 0.25, 0.5, 0.75, 1].map((t) => [ramp(t), `${Math.round(200 + t * 1300)} km`])),
    },
    period: {
      title: 'Period',
      color: (i) => ramp((period[i] - 88) / 40),
      legend: () => legendRows([0, 0.25, 0.5, 0.75, 1].map((t) => [ramp(t), `${Math.round(88 + t * 40)} min`])),
    },
    inclination: {
      title: 'Inclination',
      color: (i) => ramp(incDeg[i] / 110),
      legend: () => legendRows([0, 0.25, 0.5, 0.75, 1].map((t) => [ramp(t), `${Math.round(t * 110)}°`])),
    },
    country: {
      title: 'Country of Origin',
      color: (i) => COUNTRY_COLORS[objects[i].country] || OTHER_COLOR,
      legend: () => legendRows([
        ...Object.keys(COUNTRY_COLORS).map((c) => [COUNTRY_COLORS[c], COUNTRY_NAMES[c] || c]),
        [OTHER_COLOR, 'Other'],
      ]),
    },
  };

  function setView(name) {
    state.view = name;
    document.querySelectorAll('.vrow').forEach((r) => r.classList.toggle('sel', r.dataset.view === name));
    const v = VIEWS[name];
    legendHead.textContent = v.title;
    v.legend();
    viz.setColors(v.color);
  }
  document.querySelectorAll('.vrow').forEach((r) => {
    r.addEventListener('click', () => setView(r.dataset.view));
  });

  /* ---------------- menu controls ---------------- */
  const speedEl = $('speed');
  const speedVal = $('speed-val');
  function applySpeed() {
    // The slider value IS the multiplier: 25 means 25x real time, so a ~95 min
    // LEO orbit completes in ~3.8 real minutes and the shell visibly churns
    // while individual objects crawl. 0 pauses.
    const v = +speedEl.value;
    speedVal.textContent = v;
    time.setMultiplier(v);
  }
  speedEl.addEventListener('input', applySpeed);

  $('t-debris').addEventListener('change', (e) => { state.debris = e.target.checked; applyVis(); });
  $('t-beams').addEventListener('change', (e) => viz.toggles.beams(e.target.checked));
  $('t-instruments').addEventListener('change', (e) => viz.toggles.instruments(e.target.checked));
  $('t-follow').addEventListener('change', (e) => viz.toggles.follow(e.target.checked));
  $('t-refresh').addEventListener('change', (e) => { state.autoRefresh = e.target.checked; });

  $('filter-param').addEventListener('change', (e) => { state.filterParam = e.target.value; applyVis(); });
  const numOrNaN = (el) => (el.value.trim() === '' ? NaN : +el.value);
  $('filter-min').addEventListener('input', () => { state.filterMin = numOrNaN($('filter-min')); applyVis(); });
  $('filter-max').addEventListener('input', () => { state.filterMax = numOrNaN($('filter-max')); applyVis(); });

  $('hide-menu').addEventListener('click', () => {
    $('menu').hidden = true;
    $('show-menu').hidden = false;
    $('search-results').hidden = true;
  });
  $('show-menu').addEventListener('click', () => {
    $('menu').hidden = false;
    $('show-menu').hidden = true;
  });

  /* ---------------- search ---------------- */
  const searchEl = $('search');
  const resultsEl = $('search-results');
  let searchTimer = 0;
  function runSearch() {
    const q = searchEl.value.trim().toUpperCase();
    resultsEl.textContent = '';
    if (!q) { resultsEl.hidden = true; return; }
    let found = 0;
    for (let i = 0; i < n && found < 8; i++) {
      const o = objects[i];
      if (o.group === 'xdeb' && !state.debris) continue;
      if (!o.name.toUpperCase().includes(q) && !String(o.id).includes(q)) continue;
      const row = document.createElement('div');
      row.textContent = `${o.name} · ${o.id}`;
      row.addEventListener('click', () => {
        selectObject(i, { fly: true });
        resultsEl.hidden = true;
        searchEl.value = o.name;
      });
      resultsEl.appendChild(row);
      found++;
    }
    resultsEl.hidden = found === 0;
  }
  searchEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 140);
  });
  searchEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = resultsEl.querySelector('div');
      if (first) first.click();
    }
  });

  /* ---------------- selection: fixed card + tracking halo ---------------- */
  const selcard = $('selcard');
  const halo = $('halo');
  function selectObject(i, { fly = false } = {}) {
    selectedIdx = i;
    viz.select(i);
    if (i < 0) {
      selcard.hidden = true;
      halo.hidden = true;
      history.replaceState(null, '', location.pathname + location.search);
      return;
    }
    const o = objects[i];
    $('p-name').textContent = o.name;
    $('p-catnum').textContent = `L${o.id}`;
    $('p-id').textContent = o.id;
    $('p-type').textContent = KIND_NAME[o.kind];
    $('p-inc').textContent = `${incDeg[i].toFixed(2)}°`;
    $('p-per').textContent = `${Math.round(perigee[i])} km`;
    $('p-apo').textContent = `${Math.round(apogee[i])} km`;
    $('p-period').textContent = `${period[i].toFixed(1)} min`;
    selcard.hidden = false;
    history.replaceState(null, '', `#${o.id}`);
    if (fly) viz.flyTo(i);
  }

  /* ---------------- deep link ---------------- */
  const idIndex = new Map();
  objects.forEach((o, i) => { if (!idIndex.has(o.id)) idIndex.set(o.id, i); });
  function applyHash(fly) {
    const m = location.hash.match(/^#(\d+)$/);
    if (!m) return;
    const idx = idIndex.get(+m[1]);
    if (idx != null) selectObject(idx, { fly });
  }
  window.addEventListener('hashchange', () => applyHash(true));

  /* ---------------- copy link ---------------- */
  const toast = document.createElement('div');
  toast.className = 'toast';
  document.body.appendChild(toast);
  let toastTimer = 0;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('on'), 1800);
  }
  $('copy-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast('Link copied to clipboard');
    } catch {
      showToast(location.href);
    }
  });

  /* ---------------- canvas picking & hover chips ---------------- */
  const canvas = $('globe');
  const hoverwrap = $('hoverwrap');
  const hoverChips = $('hover-chips');
  let downXY = null;
  canvas.addEventListener('pointerdown', (e) => { downXY = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!downXY) return;
    const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
    downXY = null;
    if (moved > 5) return;
    const i = viz.pick(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    selectObject(i); // empty-space click deselects
  });
  // Single-line "L####: NAME" chips: nearest bold with the double-ring
  // reticle, neighbors fainter beneath, everything lingering and fading out
  // over ~1.3 s so camera sweeps leave a ghost trail.
  let hoverTimer = 0;
  let hoverFadeTimer = 0;
  canvas.addEventListener('pointermove', (e) => {
    if (hoverTimer) return;
    hoverTimer = setTimeout(() => {
      hoverTimer = 0;
      const found = viz.pickMulti(e.clientX, e.clientY, window.innerWidth, window.innerHeight, 18, 4);
      if (found.length) {
        clearTimeout(hoverFadeTimer);
        hoverFadeTimer = 0;
        hoverChips.textContent = '';
        found.forEach((idx, k) => {
          const o = objects[idx];
          const chip = document.createElement('div');
          chip.className = k === 0 ? 'chip b' : 'chip dim';
          chip.textContent = `L${o.id}: ${o.name}`;
          hoverChips.appendChild(chip);
        });
        hoverwrap.hidden = false;
        hoverwrap.classList.remove('fading');
        hoverwrap.style.left = `${e.clientX}px`;
        hoverwrap.style.top = `${e.clientY}px`;
        canvas.style.cursor = 'pointer';
      } else if (!hoverwrap.hidden && !hoverFadeTimer) {
        hoverwrap.classList.add('fading');
        hoverFadeTimer = setTimeout(() => {
          hoverFadeTimer = 0;
          hoverwrap.hidden = true;
          hoverwrap.classList.remove('fading');
        }, 1350);
        canvas.style.cursor = '';
      } else {
        canvas.style.cursor = '';
      }
    }, 80);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === 'Escape') selectObject(-1);
  });

  /* ---------------- per-frame ---------------- */
  const menuNotes = $('menu-notes');
  function placeNotes() {
    const menu = $('menu');
    const r = menu.hidden ? { bottom: 60 } : menu.getBoundingClientRect();
    menuNotes.style.top = `${(r.bottom || 60) + 16}px`;
  }
  placeNotes();
  window.addEventListener('resize', placeNotes);

  let lastClock = 0, lastRefreshBucket = Math.floor(Date.now() / 30000);
  function tick(nowReal) {
    if (nowReal - lastClock > 200) {
      lastClock = nowReal;
      $('clock').textContent = fmtUtc(viz.simMs).slice(0, 16) + ' UTC';
      const displayed = viz.reveal < 1 ? Math.round(viz.reveal * shownCount) : shownCount;
      $('objcount').textContent = `${displayed} objects displayed`;
      placeNotes();
      // auto refresh: periodic ephemeris sweep
      const bucket = Math.floor(Date.now() / 30000);
      if (bucket !== lastRefreshBucket) {
        lastRefreshBucket = bucket;
        if (state.autoRefresh) viz.pulse();
      }
    }
    // pulsing double-ring halo rides on the selected object
    if (selectedIdx >= 0) {
      const p = viz.project(selectedIdx, window.innerWidth, window.innerHeight);
      if (p.visible) {
        halo.hidden = false;
        halo.style.left = `${p.x}px`;
        halo.style.top = `${p.y}px`;
      } else {
        halo.hidden = true;
      }
    }
  }

  setView('type');
  applyVis();
  applySpeed();
  applyHash(true);
  return { tick, selectObject };
}
