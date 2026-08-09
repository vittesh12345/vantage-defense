/* Entry point: builds the catalog, stands the scene up, wires the HUD and
   runs the clock. Everything is static — no backend, no keys, no build. */

import { buildCatalog } from './catalog.js';
import { createViz } from './scene.js';
import { buildConjunctions } from './conj.js';
import { initUI } from './ui.js';

const SENSOR_SITES = [
  { name: 'South Island NZ', lat: -43.9, lon: 170.45, fov: 75 },
  { name: 'West Texas US', lat: 31.95, lon: -102.35, fov: 75 },
  { name: 'Guanacaste CR', lat: 10.62, lon: -85.51, fov: 90 },
  { name: 'Interior Alaska US', lat: 65.12, lon: -147.47, fov: 75 },
  { name: 'Azores PT', lat: 37.78, lon: -25.5, fov: 75 },
  { name: 'Great Sandy AU', lat: -19.9, lon: 120.62, fov: 90 },
  { name: 'Hokkaido JP', lat: 43.52, lon: 143.0, fov: 75 },
];

const bootLine = document.getElementById('boot-line');

async function boot() {
  bootLine.textContent = 'Loading basemap…';
  const topo = await fetch('data/land-50m.json').then((r) => r.json());

  bootLine.textContent = 'Generating resident-object catalog…';
  await new Promise((r) => setTimeout(r, 0)); // let the splash paint
  const objects = buildCatalog();

  bootLine.textContent = 'Standing up the scene…';
  const canvas = document.getElementById('globe');
  const viz = createViz({ canvas, topology: topo, objects, sensorSites: SENSOR_SITES });

  const conjunctions = buildConjunctions(objects, Date.now());

  /* ---- time engine ---- */
  const time = {
    speed: 1,
    playing: true,
    live: true,
    simMs: Date.now(),
    setSpeed(s) { this.speed = s; if (s !== 1) this.live = false; },
    setPlaying(p) { this.playing = p; if (!p) this.live = false; },
    goLive() { this.live = true; this.playing = true; this.speed = 1; this.simMs = Date.now(); },
    nudge(ms) { this.live = false; this.simMs += ms; },
    scrubToMs(ms) { this.live = false; this.simMs = ms; },
    update(dtMs) {
      if (this.live) this.simMs = Date.now();
      else if (this.playing) this.simMs += dtMs * this.speed;
    },
  };

  const ui = initUI({ viz, objects, conjunctions, time, sensorSites: SENSOR_SITES });
  window.__viz = viz; // console handle, also used by the harness
  window.__time = time;

  const resize = () => viz.resize(window.innerWidth, window.innerHeight);
  window.addEventListener('resize', resize);
  resize();

  // The catalog streams in over the first seconds, the way a live feed pages
  // object states down to the client.
  viz.setReveal(0);
  let revealT = 0;

  /* ---- intro pull-in ---- */
  const introFrom = viz.camera.position.clone().normalize().multiplyScalar(64);
  const introTo = viz.camera.position.clone();
  let introT = 0;
  viz.camera.position.copy(introFrom);

  let last = performance.now();
  let firstFrame = true;
  function loop(now) {
    const dt = Math.min(now - last, 250);
    last = now;

    if (introT < 1) {
      introT = Math.min(1, introT + dt / 2400);
      const k = 1 - Math.pow(1 - introT, 3);
      viz.camera.position.lerpVectors(introFrom, introTo, k);
    }
    if (revealT < 1) {
      revealT = Math.min(1, revealT + dt / 3400);
      viz.setReveal(revealT * revealT * (3 - 2 * revealT)); // smoothstep pacing
    }

    time.update(dt);
    // Trail length follows playback speed so motion reads at every timescale:
    // ghosts should trail by a few pixels and merge into a streak, not detach.
    viz.setTrailGap(Math.min(Math.max(3 * (time.live ? 1 : time.speed), 6), 45));
    viz.setTime(time.simMs);
    viz.render();
    ui.tick(now);

    if (firstFrame) {
      firstFrame = false;
      document.getElementById('boot').classList.add('gone');
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

boot().catch((err) => {
  bootLine.textContent = `Failed to start: ${err.message}`;
  console.error(err);
});
