/* HUD wiring: catalog search and filters, the details card, conjunction list,
   display toggles, time transport, tooltip, and sensor labels. The scene is
   driven only through the small API createViz returns. */

import { KIND_NAME } from './catalog.js';
import {
  apogeeKm, perigeeKm, periodMinutes, speedAt, eciPosition, eciToLatLon,
  latLonToScene, sunEci, isSunlit, fmtUtc, R_MEAN,
} from './orbits.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toLocaleString('en-US');

const COUNTRY_NAMES = {
  US: 'United States', CIS: 'Russia / CIS', PRC: 'China', UK: 'United Kingdom',
  ESA: 'ESA', JPN: 'Japan', IND: 'India', FR: 'France', DEU: 'Germany',
  KOR: 'South Korea', CAN: 'Canada', ARG: 'Argentina', FIN: 'Finland',
  SWE: 'Sweden', CHE: 'Switzerland', EUM: 'EUMETSAT', TBD: 'Unassigned',
};

export function initUI({ viz, objects, conjunctions, time, sensorSites }) {
  const meanAlt = new Float32Array(objects.length);
  for (let i = 0; i < objects.length; i++) {
    const el = objects[i].el;
    meanAlt[i] = (apogeeKm(el.a, el.e) + perigeeKm(el.a, el.e)) / 2;
  }

  const filter = {
    kinds: [true, true, true, true],
    altMin: 150, altMax: 42000,
    country: '', group: '', query: '',
  };
  let selectedIdx = -1;

  /* Deterministic per-object tracking metadata (RCS, last-seen, pass count):
     the kind of columns a screening product carries, derived from the catalog
     number so they are stable across loads. */
  function hash32(n) {
    let h = Math.imul(n ^ 0x9E3779B9, 2654435761) >>> 0;
    h ^= h >>> 15; h = Math.imul(h, 0x85EBCA77) >>> 0; h ^= h >>> 13;
    return h >>> 0;
  }
  function trackMeta(o) {
    const h = hash32(o.id);
    const rcsBase = [1.2 + (h % 900) / 25, 4 + (h % 500) / 24, 0.01 + (h % 300) / 620, 0.05 + (h % 200) / 105][o.kind];
    const lastMin = 4 + (h >>> 8) % 560;
    return {
      rcs: rcsBase >= 10 ? rcsBase.toFixed(0) : rcsBase.toFixed(2),
      lastSensor: sensorSites[(h >>> 3) % sensorSites.length].name,
      lastMin,
      passes: 4 + ((h >>> 16) % 13),
    };
  }

  /* Next pass over the sensor network: real geometry, sampled forward. */
  const siteVecs = sensorSites.map((s) => {
    const v = latLonToScene(s.lat, s.lon, R_MEAN);
    const m = Math.hypot(v[0], v[1], v[2]);
    return { v, n: [v[0] / m, v[1] / m, v[2] / m] };
  });
  function nextPass(o, fromMs, horizonH = 12) {
    const stepS = 20;
    const p = [0, 0, 0], q = [0, 0, 0];
    for (let τ = 0; τ < horizonH * 3600; τ += stepS) {
      const ms = fromMs + τ * 1000;
      eciPosition(o.el, viz.tOf(ms), p);
      const g = eciToLatLon(p, ms);
      latLonToScene(g.lat, g.lon, R_MEAN + g.alt, q);
      for (let s = 0; s < siteVecs.length; s++) {
        const sv = siteVecs[s].v, sn = siteVecs[s].n;
        const dx = q[0] - sv[0], dy = q[1] - sv[1], dz = q[2] - sv[2];
        const d = Math.hypot(dx, dy, dz);
        const sinEl = (dx * sn[0] + dy * sn[1] + dz * sn[2]) / d;
        if (sinEl > 0.342) { // elevation above ~20°
          return { site: sensorSites[s].name, ms };
        }
      }
    }
    return null;
  }
  let passCache = null; // { idx, ms, result }

  /* ---------------- filters -> visibility ---------------- */
  const kindTotals = [0, 0, 0, 0];
  for (const o of objects) kindTotals[o.kind]++;

  function matches(i) {
    const o = objects[i];
    if (!filter.kinds[o.kind]) return false;
    if (meanAlt[i] < filter.altMin || meanAlt[i] > filter.altMax) return false;
    if (filter.country && o.country !== filter.country) return false;
    if (filter.group && o.group !== filter.group) return false;
    return true;
  }

  const shownPerKind = [0, 0, 0, 0];
  function applyFilters() {
    shownPerKind.fill(0);
    viz.setVis((arr) => {
      for (let i = 0; i < objects.length; i++) {
        const m = matches(i);
        arr[i] = m ? 1 : 0;
        if (m) shownPerKind[objects[i].kind]++;
      }
    });
    const shown = shownPerKind[0] + shownPerKind[1] + shownPerKind[2] + shownPerKind[3];
    $('catalog-shown').textContent = `${fmt(shown)} shown`;
    $('stat-count').textContent = `${fmt(objects.length)} OBJECTS`;
    for (let k = 0; k < 4; k++) {
      $(`count-k${k}`).textContent = fmt(shownPerKind[k]);
      $(`legend-k${k}`).textContent = fmt(shownPerKind[k]);
    }
    renderResults();
  }

  /* ---------------- results list ---------------- */
  const resultsEl = $('results');
  const rowIndex = new Map(); // li -> object index
  function renderResults() {
    const q = filter.query.trim().toUpperCase();
    resultsEl.textContent = '';
    rowIndex.clear();
    let shown = 0, matched = 0;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < objects.length; i++) {
      if (!matches(i)) continue;
      const o = objects[i];
      if (q && !o.name.toUpperCase().includes(q) && !String(o.id).includes(q)) continue;
      matched++;
      if (shown < 200) {
        const li = document.createElement('li');
        if (i === selectedIdx) li.classList.add('sel');
        const dot = document.createElement('span');
        dot.className = `kdot k${o.kind}`;
        const nm = document.createElement('span');
        nm.className = 'rname';
        nm.textContent = o.name;
        const meta = document.createElement('span');
        meta.className = 'rmeta';
        meta.textContent = `${o.id} · ${fmt(meanAlt[i])} km`;
        li.append(dot, nm, meta);
        rowIndex.set(li, i);
        frag.appendChild(li);
        shown++;
      }
    }
    if (matched > shown) {
      const li = document.createElement('li');
      li.className = 'more';
      li.textContent = `+ ${fmt(matched - shown)} more — refine the search`;
      frag.appendChild(li);
    }
    if (matched === 0) {
      const li = document.createElement('li');
      li.className = 'more';
      li.textContent = 'No objects match';
      frag.appendChild(li);
    }
    resultsEl.appendChild(frag);
  }
  resultsEl.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li || !rowIndex.has(li)) return;
    selectObject(rowIndex.get(li), { fly: true });
  });

  /* ---------------- selection & details ---------------- */
  function selectObject(i, { fly = false, secondary = -1 } = {}) {
    selectedIdx = i;
    viz.select(i, secondary);
    for (const [li, idx] of rowIndex) li.classList.toggle('sel', idx === i);
    const panel = $('details');
    if (i < 0) {
      panel.hidden = true;
      $('d-track').setAttribute('aria-pressed', 'false');
      viz.tracking = false;
      reflectHash();
      return;
    }
    const o = objects[i];
    panel.hidden = false;
    $('d-dot').className = `kdot k${o.kind}`;
    $('d-name').textContent = o.name;
    $('d-id').textContent = o.id;
    $('d-intl').textContent = o.intl;
    $('d-type').textContent = KIND_NAME[o.kind];
    $('d-country').textContent = COUNTRY_NAMES[o.country] || o.country;
    $('d-year').textContent = o.year;
    $('d-apo').textContent = `${fmt(apogeeKm(o.el.a, o.el.e))} km`;
    $('d-per').textContent = `${fmt(perigeeKm(o.el.a, o.el.e))} km`;
    $('d-inc').textContent = `${(o.el.inc * 180 / Math.PI).toFixed(2)}°`;
    $('d-period').textContent = `${periodMinutes(o.el.a).toFixed(1)} min`;
    $('d-ecc').textContent = o.el.e.toFixed(4);
    const meta = trackMeta(o);
    $('d-rcs').textContent = `${meta.rcs} m²`;
    $('d-last').textContent = meta.lastMin < 60
      ? `${meta.lastSensor} · ${meta.lastMin} min ago`
      : `${meta.lastSensor} · ${(meta.lastMin / 60).toFixed(1)} h ago`;
    $('d-passes').textContent = meta.passes;
    passCache = null;
    if (fly) viz.flyTo(i);
    updateLive();
    reflectHash();
  }
  $('d-close').addEventListener('click', () => selectObject(-1));
  $('d-track').addEventListener('click', () => {
    viz.tracking = !viz.tracking;
    $('d-track').setAttribute('aria-pressed', String(viz.tracking));
  });
  $('d-reset').addEventListener('click', () => {
    viz.tracking = false;
    $('d-track').setAttribute('aria-pressed', 'false');
    viz.camera.position.set(11.5, 6.4, 22.5);
  });

  const livePos = [0, 0, 0];
  function updateLive() {
    if (selectedIdx < 0) return;
    const o = objects[selectedIdx];
    eciPosition(o.el, viz.tOf(viz.simMs), livePos);
    const r = Math.hypot(livePos[0], livePos[1], livePos[2]);
    const g = eciToLatLon(livePos, viz.simMs);
    $('d-vel').textContent = `${speedAt(o.el.a, r).toFixed(2)} km/s`;
    $('d-lat').textContent = `${g.lat.toFixed(2)}°`;
    $('d-lon').textContent = `${g.lon.toFixed(2)}°`;
    $('d-alt').textContent = `${fmt(g.alt)} km`;
    const lit = isSunlit(livePos, sunEci(viz.simMs));
    const sunEl = $('d-sun');
    sunEl.textContent = lit ? 'Sunlit' : 'In eclipse';
    sunEl.style.color = lit ? 'var(--status-watch)' : 'var(--text-muted)';
    // Next pass over the network: recompute when stale or already elapsed.
    if (!passCache || passCache.idx !== selectedIdx ||
        Math.abs(viz.simMs - passCache.ms) > 30 * 60 * 1000 ||
        (passCache.result && viz.simMs > passCache.result.ms + 60000)) {
      passCache = { idx: selectedIdx, ms: viz.simMs, result: nextPass(o, viz.simMs) };
      const n = passCache.result;
      $('d-next').textContent = n
        ? `${n.site} · ${fmtUtc(n.ms).slice(5, 19)}`
        : 'None in 12 h';
    }
  }

  /* ---------------- filter inputs ---------------- */
  document.querySelectorAll('[data-kind]').forEach((cb) => {
    cb.addEventListener('change', () => {
      filter.kinds[+cb.dataset.kind] = cb.checked;
      applyFilters();
    });
  });
  $('alt-min').addEventListener('change', () => { filter.altMin = +$('alt-min').value || 0; applyFilters(); });
  $('alt-max').addEventListener('change', () => { filter.altMax = +$('alt-max').value || 42000; applyFilters(); });

  const countrySel = $('country');
  const present = [...new Set(objects.map((o) => o.country))].sort();
  for (const c of present) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = COUNTRY_NAMES[c] || c;
    countrySel.appendChild(opt);
  }
  countrySel.addEventListener('change', () => { filter.country = countrySel.value; applyFilters(); });

  $('group-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#group-chips .chip').forEach((c) => c.classList.toggle('on', c === chip));
    filter.group = chip.dataset.group;
    applyFilters();
  });

  let searchTimer = 0;
  $('search').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filter.query = $('search').value;
      renderResults();
    }, 120);
  });

  /* ---------------- conjunctions ---------------- */
  const conjList = $('conj-list');
  $('conj-count').textContent = `${conjunctions.length} events`;
  const conjRows = [];
  conjunctions.forEach((ev, k) => {
    const li = document.createElement('li');
    const pair = document.createElement('div');
    pair.className = 'conj-pair';
    const sev = document.createElement('span');
    sev.className = `sev s-${ev.sev}`;
    const names = document.createElement('span');
    names.textContent = `${ev.primaryName} × ${ev.secondaryName}`;
    names.style.overflow = 'hidden';
    names.style.textOverflow = 'ellipsis';
    pair.append(sev, names);
    const meta = document.createElement('div');
    meta.className = 'conj-meta';
    const d = new Date(ev.tca);
    const p2 = (n) => String(n).padStart(2, '0');
    const tcaStr = `${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`;
    const tSpan = document.createElement('span');
    tSpan.textContent = `TCA ${tcaStr}`;
    const mSpan = document.createElement('span');
    mSpan.className = 'miss';
    mSpan.textContent = `${fmt(ev.missM)} m · Pc ${ev.pc}`;
    meta.append(tSpan, mSpan);
    li.append(pair, meta);
    conjList.appendChild(li);
    conjRows.push(li);
    li.addEventListener('click', () => {
      conjRows.forEach((r) => r.classList.toggle('sel', r === li));
      time.scrubToMs(ev.tca - 90 * 1000);
      time.setSpeed(1);
      time.setPlaying(true);
      selectObject(ev.primary, { fly: true, secondary: ev.secondary });
    });
  });

  /* ---------------- display toggles ---------------- */
  const wire = (id, fn, init) => {
    const el = $(id);
    el.checked = init;
    fn(init);
    el.addEventListener('change', () => fn(el.checked));
  };
  wire('t-trails', viz.toggles.trails, true);
  wire('t-groundtrack', viz.toggles.groundtrack, true);
  wire('t-graticule', viz.toggles.graticule, true);
  wire('t-terminator', viz.toggles.terminator, true);
  wire('t-atmosphere', viz.toggles.atmosphere, true);
  wire('t-stars', viz.toggles.stars, true);
  wire('t-sensors', (v) => { viz.toggles.sensors(v); $('labels').style.display = v ? '' : 'none'; }, true);
  wire('t-coverage', viz.toggles.coverage, false);
  $('t-size').addEventListener('input', () => viz.setPointSize(+$('t-size').value));

  /* ---------------- panel collapse ---------------- */
  const wireCollapse = (btnId, panelEl) => {
    const btn = $(btnId);
    btn.addEventListener('click', () => {
      const hidden = panelEl.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', String(!hidden));
    });
  };
  wireCollapse('btn-catalog', $('catalog-panel'));
  wireCollapse('btn-panels', $('rightcol'));
  // Small screens start with the catalog closed.
  if (window.innerWidth < 900) {
    $('catalog-panel').classList.add('hidden');
    $('btn-catalog').setAttribute('aria-expanded', 'false');
    $('rightcol').classList.add('hidden');
    $('btn-panels').setAttribute('aria-expanded', 'false');
  }

  /* ---------------- transport ---------------- */
  const playBtn = $('tb-play');
  const liveBtn = $('tb-live');
  function reflectTime() {
    playBtn.textContent = time.playing ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', time.playing ? 'Pause' : 'Play');
    liveBtn.setAttribute('aria-pressed', String(time.live));
    $('live-label').textContent = time.live ? 'LIVE' : 'SIMULATION';
    $('live-dot').classList.toggle('sim', !time.live);
    document.querySelectorAll('.sp').forEach((b) => b.classList.toggle('on', +b.dataset.speed === time.speed));
  }
  playBtn.addEventListener('click', () => { time.setPlaying(!time.playing); reflectTime(); });
  liveBtn.addEventListener('click', () => { time.goLive(); reflectTime(); });
  $('tb-back').addEventListener('click', () => { time.nudge(-3600 * 1000); reflectTime(); });
  $('tb-fwd').addEventListener('click', () => { time.nudge(3600 * 1000); reflectTime(); });
  document.querySelectorAll('.sp').forEach((b) => {
    b.addEventListener('click', () => { time.setSpeed(+b.dataset.speed); reflectTime(); });
  });
  const scrub = $('scrub');
  let scrubbing = false;
  scrub.addEventListener('input', () => {
    scrubbing = true;
    time.scrubToMs(Date.now() + scrub.value * 60000);
    reflectTime();
  });
  scrub.addEventListener('change', () => { scrubbing = false; });

  /* ---------------- date/time jump ---------------- */
  const jump = $('jump');
  jump.addEventListener('change', () => {
    const ms = Date.parse(`${jump.value}Z`);
    if (Number.isFinite(ms)) { time.scrubToMs(ms); reflectTime(); }
  });

  /* ---------------- ground view ---------------- */
  const viewSel = $('view-mode');
  sensorSites.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Ground · ${s.name}`;
    viewSel.appendChild(opt);
  });
  function setView(idx) {
    idx = +idx;
    viewSel.value = String(idx);
    if (idx < 0) {
      viz.exitGroundView();
      $('gv-bar').hidden = true;
    } else {
      viz.enterGroundView(idx);
      $('gv-bar').hidden = false;
      $('gv-site').textContent = `Ground view · ${sensorSites[idx].name}`;
      $('d-track').setAttribute('aria-pressed', 'false');
    }
  }
  viewSel.addEventListener('change', () => setView(viewSel.value));
  $('gv-exit').addEventListener('click', () => setView(-1));

  /* ---------------- help modal ---------------- */
  const helpModal = $('help-modal');
  $('btn-help').addEventListener('click', () => { helpModal.hidden = false; });
  $('help-close').addEventListener('click', () => { helpModal.hidden = true; });
  helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.hidden = true; });

  /* ---------------- deep link ---------------- */
  const idIndex = new Map();
  objects.forEach((o, i) => { if (!idIndex.has(o.id)) idIndex.set(o.id, i); });
  function reflectHash() {
    const h = selectedIdx >= 0 ? `#${objects[selectedIdx].id}` : ' ';
    history.replaceState(null, '', selectedIdx >= 0 ? h : location.pathname + location.search);
  }
  function applyHash(fly) {
    const m = location.hash.match(/^#(\d+)$/);
    if (!m) return false;
    const idx = idIndex.get(+m[1]);
    if (idx == null) return false;
    selectObject(idx, { fly });
    return true;
  }
  window.addEventListener('hashchange', () => applyHash(true));

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); time.setPlaying(!time.playing); reflectTime(); }
    else if (e.key === 'l' || e.key === 'L') { time.goLive(); reflectTime(); }
    else if (e.key === 'Escape') {
      if (!helpModal.hidden) helpModal.hidden = true;
      else if (viz.groundView >= 0) setView(-1);
      else selectObject(-1);
    }
  });

  /* ---------------- canvas picking & tooltip ---------------- */
  const canvas = $('globe');
  const tooltip = $('tooltip');
  let downXY = null;
  canvas.addEventListener('pointerdown', (e) => { downXY = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!downXY) return;
    const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
    downXY = null;
    if (moved > 5) return; // it was a drag
    const i = viz.pick(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    if (i >= 0) selectObject(i);
    else selectObject(-1);
  });
  let hoverTimer = 0;
  canvas.addEventListener('pointermove', (e) => {
    if (hoverTimer) return;
    hoverTimer = setTimeout(() => {
      hoverTimer = 0;
      const i = viz.pick(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
      if (i >= 0) {
        const o = objects[i];
        tooltip.hidden = false;
        tooltip.textContent = '';
        const strong = document.createElement('div');
        strong.textContent = o.name;
        const meta = document.createElement('div');
        meta.className = 'tt-meta';
        meta.textContent = `${KIND_NAME[o.kind]} · ${o.id} · ${fmt(meanAlt[i])} km`;
        tooltip.append(strong, meta);
        tooltip.style.left = `${e.clientX}px`;
        tooltip.style.top = `${e.clientY}px`;
        canvas.style.cursor = 'pointer';
      } else {
        tooltip.hidden = true;
        canvas.style.cursor = '';
      }
    }, 90);
  });
  canvas.addEventListener('pointerleave', () => { tooltip.hidden = true; });

  /* ---------------- sensor labels ---------------- */
  const labelsWrap = $('labels');
  const labelEls = sensorSites.map((s, i) => {
    const el = document.createElement('span');
    el.className = 'slabel';
    el.textContent = s.name;
    el.title = `Ground view from ${s.name}`;
    el.addEventListener('click', () => setView(i));
    labelsWrap.appendChild(el);
    return el;
  });
  const cardinalEls = ['N', 'E', 'S', 'W'].map(() => {
    const el = document.createElement('span');
    el.className = 'cardinal';
    el.style.display = 'none';
    labelsWrap.appendChild(el);
    return el;
  });
  const selLabel = $('sel-label');

  /* ---------------- per-frame hooks ---------------- */
  /* Data-pipeline readout: observation rate wanders like a live feed, the
     track counter follows the filtered population, and every 30 s the
     "ephemeris refresh" sweeps a brightness pulse across the cloud. */
  let lastIngest = 0, lastRefreshBucket = -1, streamed = false;
  function ingestTick(nowReal) {
    if (nowReal - lastIngest < 400) return;
    lastIngest = nowReal;
    const t = nowReal / 1000;
    const rate = Math.round(168 + 74 * Math.sin(t / 6.4) + 31 * Math.sin(t / 1.9) + 12 * Math.sin(t * 1.3));
    $('ing-rate').textContent = rate;
    const shown = shownPerKind[0] + shownPerKind[1] + shownPerKind[2] + shownPerKind[3];
    if (viz.reveal < 1) {
      const n = Math.round(viz.reveal * shown);
      $('ing-tracks').textContent = fmt(n);
      $('stat-count').textContent = `STREAMING ${fmt(Math.round(viz.reveal * objects.length))} / ${fmt(objects.length)}`;
      streamed = true;
    } else {
      $('ing-tracks').textContent = fmt(shown);
      if (streamed) { streamed = false; $('stat-count').textContent = `${fmt(objects.length)} OBJECTS`; }
    }
    const bucket = Math.floor(Date.now() / 30000);
    const remain = 30 - Math.floor((Date.now() / 1000) % 30);
    $('ing-next').textContent = `${remain} s`;
    if (bucket !== lastRefreshBucket) {
      if (lastRefreshBucket !== -1) viz.pulse();
      lastRefreshBucket = bucket;
    }
  }

  let lastClock = 0, lastLive = 0;
  function tick(nowReal) {
    ingestTick(nowReal);
    // clock + offset readout at ~5 Hz
    if (nowReal - lastClock > 200) {
      lastClock = nowReal;
      $('clock').textContent = fmtUtc(viz.simMs);
      const offMin = (viz.simMs - Date.now()) / 60000;
      if (!scrubbing) scrub.value = Math.max(-1440, Math.min(1440, offMin));
      const sign = offMin < -0.02 ? '−' : '+';
      const am = Math.abs(offMin);
      const hh = String(Math.floor(am / 60)).padStart(2, '0');
      const mm = String(Math.floor(am % 60)).padStart(2, '0');
      $('offset').textContent = `T${sign}${hh}:${mm}`;
      if (document.activeElement !== jump) {
        jump.value = new Date(viz.simMs).toISOString().slice(0, 19);
      }
      reflectTime();
    }
    if (nowReal - lastLive > 300) {
      lastLive = nowReal;
      updateLive();
    }
    const w = window.innerWidth, h = window.innerHeight;
    // sensor labels every frame (cheap: 7 sites)
    for (let s = 0; s < sensorSites.length; s++) {
      const p = viz.sensorScreenPos(s, w, h);
      const el = labelEls[s];
      if (p.visible && s !== viz.groundView) {
        el.style.display = '';
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
      } else {
        el.style.display = 'none';
      }
    }
    // ground-view cardinal points
    const cards = viz.cardinalScreenPos(w, h);
    for (let c = 0; c < 4; c++) {
      const el = cardinalEls[c];
      if (cards && cards[c].visible) {
        el.style.display = '';
        el.textContent = cards[c].label;
        el.style.left = `${cards[c].x}px`;
        el.style.top = `${cards[c].y}px`;
      } else {
        el.style.display = 'none';
      }
    }
    // floating name label on the selection
    if (selectedIdx >= 0) {
      const p = viz.project(selectedIdx, w, h);
      if (p.visible) {
        selLabel.hidden = false;
        selLabel.textContent = objects[selectedIdx].name;
        selLabel.style.left = `${p.x}px`;
        selLabel.style.top = `${p.y}px`;
      } else {
        selLabel.hidden = true;
      }
    } else {
      selLabel.hidden = true;
    }
  }

  applyFilters();
  reflectTime();
  applyHash(true);
  return { tick, selectObject };
}
