/* Conjunction screening list. Pairs are drawn from the actual catalog so
   every event references two real entries whose orbits genuinely cross in
   altitude; the encounter numbers (TCA, miss distance, Pc) are synthesized
   the way a daily screening product would present them. */

import { KIND } from './catalog.js';
import { apogeeKm, perigeeKm } from './orbits.js';

function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildConjunctions(objects, nowMs, count = 24) {
  const rnd = mulberry32(0xC0F0A57);
  // Index candidates once.
  const primaries = [];
  const hazards = [];
  for (let i = 0; i < objects.length; i++) {
    const o = objects[i];
    const alt = (apogeeKm(o.el.a, o.el.e) + perigeeKm(o.el.a, o.el.e)) / 2;
    if (alt > 2000) continue;
    if (o.kind === KIND.PAYLOAD) primaries.push([i, alt]);
    if (o.kind === KIND.DEBRIS || o.kind === KIND.ROCKET_BODY) hazards.push([i, alt]);
  }
  const events = [];
  let guard = 0;
  while (events.length < count && guard++ < 4000) {
    const [pi, pAlt] = primaries[Math.floor(rnd() * primaries.length)];
    const [hi, hAlt] = hazards[Math.floor(rnd() * hazards.length)];
    if (Math.abs(pAlt - hAlt) > 55) continue;
    if (pi === hi) continue;
    const p = objects[pi], h = objects[hi];
    // encounter numbers
    const tca = nowMs + (0.4 + rnd() * 47.2) * 3600 * 1000;
    const miss = Math.round(Math.exp(Math.log(28) + rnd() * Math.log(6500 / 28)));
    const relV = +(6.5 + rnd() * 8.4).toFixed(2);
    const pcExp = 3.2 + (Math.log(miss / 25) / Math.log(260)) * 3.6 + rnd() * 0.8;
    const pc = Math.pow(10, -pcExp);
    const sev = miss < 150 ? 'threat' : miss < 900 ? 'watch' : 'nominal';
    events.push({
      primary: pi, secondary: hi,
      primaryName: p.name, secondaryName: h.name,
      tca, missM: miss, relKms: relV,
      pc: pc.toExponential(1).replace('e-', 'e-'),
      sev,
    });
  }
  events.sort((a, b) => a.tca - b.tca);
  return events;
}
