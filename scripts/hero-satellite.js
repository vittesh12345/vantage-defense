/* Vantage hero spacecraft
   ==========================================================================
   An authored wireframe spacecraft drawn on <canvas> as line work in the same
   register as the page's SVG schematics: hairline strokes, mono callouts, and
   status color only where a state is actually being reported. No photography,
   no texture, no glow. Nothing here is dressed as product output: the frame
   says "Schematic" and the drawing is a labelled diagram.

   Three jobs.

   1. Draw the spacecraft and its orbit track, and keep it alive under the
      pointer: a slow yaw drift with cursor parallax on top.
   2. On the first load of a session, play it full-viewport over a sparse star
      field, then fly it into the hero frame.
   3. Carry the claim the hero rests on. The Delta-v marker on the orbit track
      opens the residual trace that used to sit in this frame as a static SVG,
      so the explanation is the payoff of the interaction rather than a
      diagram the visitor has to decode cold.

   Progressive enhancement: the residual SVG is the *default* markup state, so
   a visitor without scripting sees the schematic this replaced, in place and
   fully labelled. This file adds `sat-live` to the figure, and that class is
   what hides the SVG and shows the canvas. No script, no loss.
*/
(function () {
  'use strict';

  var stage = document.getElementById('sat-stage');
  var canvas = stage && stage.querySelector('.sat-canvas');
  var ctx = canvas && canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  var root     = document.documentElement;
  var figure   = document.getElementById('hero-figure');
  var veil     = document.getElementById('intro-veil');
  var veilCv   = veil && veil.querySelector('canvas');
  var veilCtx  = veilCv && veilCv.getContext && veilCv.getContext('2d');
  var dvBtn    = document.getElementById('dv-marker');
  var residual = document.getElementById('residual');
  var closeBtn = document.getElementById('residual-close');
  var hint     = document.getElementById('sat-hint');

  var reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  var hoverMQ  = matchMedia('(hover: none)');

  /* The figure swaps to the live drawing only once we know a context exists. */
  figure.classList.add('sat-live');
  if (hint) hint.hidden = false;

  /* --- Tokens -------------------------------------------------------------
     Colors are read from the stylesheet rather than hard-coded, so the canvas
     stays governed by tokens.css like everything else on the page. */
  var cs = getComputedStyle(root);
  function token(name, fallback) {
    var v = cs.getPropertyValue(name).trim();
    return v || fallback;
  }
  function rgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  var TONE = {
    body:  rgb(token('--text-body', '#e8eaec')),
    faint: rgb(token('--text-faint', '#878c95')),
    edge:  rgb(token('--rule-edge', '#525a66')),
    watch: rgb(token('--status-watch', '#ffca16'))
  };
  function stroke(tone, alpha) {
    var c = TONE[tone] || TONE.body;
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha.toFixed(3) + ')';
  }
  var MONO = token('--font-mono', 'monospace');

  /* --- Model --------------------------------------------------------------
     Built once, in model units, as a flat list of polylines. Everything is
     line work: there is no fill anywhere in the drawing.

       +Y  antenna mast          -Y  high-gain dish (nadir pointing)
       +/-X  solar arrays        -Z  apogee engine

     The engine is drawn because it is the subject: a Delta-v is an engine
     firing, and the residual trace behind the marker is how that firing is
     recovered from public element sets. */
  function ring(r, axis, offset, n) {
    var pts = [], i, a, u, v;
    for (i = 0; i <= n; i++) {
      a = i / n * Math.PI * 2;
      u = Math.cos(a) * r;
      v = Math.sin(a) * r;
      pts.push(axis === 'y' ? [u, offset, v] : axis === 'z' ? [u, v, offset] : [offset, u, v]);
    }
    return pts;
  }

  function buildModel() {
    var P = [];
    function add(pts, tone, part) { P.push({ pts: pts, tone: tone || 'body', part: part || '' }); }
    function line(a, b, tone, part) { add([a, b], tone, part); }

    /* Spacecraft bus: a plain box with two equatorial bands, so there is
       always some interior detail facing the viewer as it yaws. */
    var bx = 0.22, by = 0.26, bz = 0.22, i, c = [];
    for (i = 0; i < 8; i++) c.push([(i & 1) ? bx : -bx, (i & 2) ? by : -by, (i & 4) ? bz : -bz]);
    [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7],
     [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) {
      line(c[e[0]], c[e[1]], 'body', 'bus');
    });
    [0.075, -0.075].forEach(function (y) {
      add([[-bx, y, -bz], [bx, y, -bz], [bx, y, bz], [-bx, y, bz], [-bx, y, -bz]], 'faint', 'bus');
    });

    /* Booms and solar arrays. Cell divisions give the wings enough line
       density to read as structure rather than as two empty rectangles. */
    [-1, 1].forEach(function (s) {
      var x0 = bx * s, x1 = 0.46 * s, t, xt;
      line([x0, 0.045, 0], [x1, 0.045, 0], 'faint', 'array');
      line([x0, -0.045, 0], [x1, -0.045, 0], 'faint', 'array');
      for (t = 0; t <= 3; t++) {
        xt = x0 + (x1 - x0) * t / 3;
        line([xt, 0.045, 0], [xt, -0.045, 0], 'faint', 'array');
      }
      var ax0 = 0.46 * s, ax1 = 1.66 * s, ay = 0.34, k, xx;
      add([[ax0, -ay, 0], [ax1, -ay, 0], [ax1, ay, 0], [ax0, ay, 0], [ax0, -ay, 0]], 'body', 'array');
      for (k = 1; k < 4; k++) {
        xx = ax0 + (ax1 - ax0) * k / 4;
        line([xx, -ay, 0], [xx, ay, 0], 'faint', 'array');
      }
      line([ax0, 0, 0], [ax1, 0, 0], 'faint', 'array');
    });

    /* Antenna mast: two rails and rungs, capped with a small ring. */
    var mx = 0.038, m0 = by, m1 = 0.82, r;
    line([-mx, m0, 0], [-mx, m1, 0], 'faint', 'mast');
    line([mx, m0, 0], [mx, m1, 0], 'faint', 'mast');
    for (r = 0; r <= 4; r++) {
      var yy = m0 + (m1 - m0) * r / 4;
      line([-mx, yy, 0], [mx, yy, 0], 'faint', 'mast');
    }
    add(ring(0.11, 'y', m1, 20), 'faint', 'mast');

    /* High-gain dish, nadir pointing: a paraboloid drawn as ribs between a
       rim ring and the vertex, with a three-strut feed at the focus. */
    var vy = -0.44, rim = 0.40, depth = 0.28, rimY = vy - depth;
    function dishY(rr) { return vy - depth * Math.pow(rr / rim, 2); }
    line([0, -by, 0], [0, vy, 0], 'faint', 'dish');
    add(ring(rim, 'y', rimY, 28), 'body', 'dish');
    add(ring(rim * 0.62, 'y', dishY(rim * 0.62), 24), 'faint', 'dish');
    for (r = 0; r < 8; r++) {
      var a = r / 8 * Math.PI * 2, rib = [], t2, rr;
      for (t2 = 0; t2 <= 4; t2++) {
        rr = rim * t2 / 4;
        rib.push([Math.cos(a) * rr, dishY(rr), Math.sin(a) * rr]);
      }
      add(rib, 'faint', 'dish');
    }
    var feed = [0, -1.02, 0];
    for (r = 0; r < 3; r++) {
      var a2 = r / 3 * Math.PI * 2 + 0.5;
      line([Math.cos(a2) * rim, rimY, Math.sin(a2) * rim], feed, 'faint', 'dish');
    }
    add(ring(0.055, 'y', -0.97, 12), 'faint', 'dish');

    /* Apogee engine: a bell between a throat ring and an exit ring. This is
       the part that highlights to `watch` while the Delta-v marker is being
       hovered or opened, which is the one status color the drawing uses.
       It is drawn long on purpose: at the resting yaw a short nozzle sits
       almost end-on and disappears into the bus outline. */
    var throat = 0.055, exit = 0.19, z0 = -bz, z1 = -0.62;
    add(ring(throat, 'z', z0, 16), 'faint', 'engine');
    add(ring(exit, 'z', z1, 20), 'body', 'engine');
    for (r = 0; r < 8; r++) {
      var a3 = r / 8 * Math.PI * 2, gore = [], t3, tt, rr2;
      for (t3 = 0; t3 <= 4; t3++) {
        tt = t3 / 4;
        rr2 = throat + (exit - throat) * Math.pow(tt, 1.7);
        gore.push([Math.cos(a3) * rr2, Math.sin(a3) * rr2, z0 + (z1 - z0) * tt]);
      }
      add(gore, 'body', 'engine');
    }

    return P;
  }

  var MODEL = buildModel();

  /* Callouts name parts of the drawing. They are annotations on a diagram,
     never a data readout: nothing here reports a number, because a fabricated
     readout next to a real console screenshot would undermine the real one.

     Labels are parked on the frame's own edges at fixed heights and reach
     their part with a leader, rather than floating beside a point that is
     still moving. Set on the drawing they landed on top of the solar arrays
     every time the spacecraft turned. `y` is a fraction of stage height, and
     the upper right is left clear because the Delta-v marker lives there. */
  var CALLOUTS = [
    { text: 'SPACECRAFT BUS',    at: [-0.22, 0.26, 0.22], side: -1, y: 0.13 },
    { text: 'HIGH-GAIN ANTENNA', at: [0, -0.72, 0.40],    side: -1, y: 0.90 },
    { text: 'SOLAR ARRAY',       at: [1.30, 0.34, 0],     side: 1,  y: 0.62 },
    { text: 'APOGEE ENGINE',     at: [0, -0.14, -0.62],   side: 1,  y: 0.90 }
  ];

  /* --- Orbit track ---------------------------------------------------------
     Drawn in screen space, not model space, so the Delta-v marker holds still
     and can carry a real button. It restates the residual schematic in orbital
     form: dashed is where physics alone says the object should be, solid is
     where it was observed, and the two only separate after the burn. */
  var ORBIT = { rot: -0.20, rx: 0.45, ry: 0.295, mark: -0.62, depart: 0.135 };

  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var superScale = 1;   /* canvas supersampling, raised while the intro is enlarged */
  var pinned = false;   /* true whenever the stage carries an intro transform  */

  function orbitPt(a, mul) {
    var rx = W * ORBIT.rx * (mul || 1), ry = H * ORBIT.ry * (mul || 1);
    var x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    var c = Math.cos(ORBIT.rot), s = Math.sin(ORBIT.rot);
    return [W / 2 + x * c - y * s, H / 2 + x * s + y * c];
  }

  /* --- Sizing --------------------------------------------------------------
     The canvas backing store is sized for the *largest* it will be displayed,
     so the intro is drawn at 1:1 and the landed figure is supersampled. Line
     widths are then set in screen CSS pixels by dividing by the live CSS
     scale, which keeps a hairline a hairline at every point of the flight. */
  function sizeCanvas() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    if (!W || !H) return;
    var px = dpr * superScale;
    canvas.width = Math.round(W * px);
    canvas.height = Math.round(H * px);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.setTransform(px, 0, 0, px, 0, 0);
    placeMarker();
  }

  function cssScale() {
    if (!pinned) return 1;
    var t = getComputedStyle(stage).transform;
    if (!t || t === 'none') return 1;
    var m = /matrix3?d?\(([^)]+)\)/.exec(t);
    return m ? (parseFloat(m[1].split(',')[0]) || 1) : 1;
  }

  function placeMarker() {
    if (!dvBtn || !W) return;
    var p = orbitPt(ORBIT.mark);
    dvBtn.style.left = p[0] + 'px';
    dvBtn.style.top = p[1] + 'px';
  }

  /* --- View state ---------------------------------------------------------- */
  var yaw = 0.55, pitch = 0.26;
  var yawTarget = 0.55, pitchTarget = 0.26;
  var drift = reduceMQ.matches ? 0 : 0.13;   /* rad/s, about one turn per 48s */
  var parallax = { x: 0, y: 0 };
  var hoverAmt = hoverMQ.matches ? 1 : 0;    /* touch has no hover: show callouts */
  var hoverWant = hoverAmt;
  var dvAmt = 0, dvWant = 0;                 /* engine highlight, 0..1 */
  var last = 0;

  /* --- Acquisition ---------------------------------------------------------
     The one-shot moment when the figure settles: the observed track lays
     itself down, and the Δv marker pulses once as the track reaches it. Runs
     exactly once per page view, never loops, and is skipped outright under
     reduced motion, where both simply arrive finished. */
  /* PULSE_GAP is the quiet time *between* pings, not the period: the timer is
     set when a pulse ends, so the ping cycle is PULSE_MS + PULSE_GAP = 2.0s. */
  var TRACK_MS = 1150, PULSE_MS = 700, PULSE_GAP = 1300;
  var trackAmt = 0;      /* 0..1, how much of the observed arc is laid down */
  var pulseAmt = 0;      /* 0..1 across one pulse; 0 or >=1 means not pulsing */
  var pulseGain = 1;     /* the acquisition ping is full strength, repeats softer */
  var nextPulse = 0;     /* timestamp of the next ping; 0 = none scheduled */
  var dvFound = false;   /* the visitor has reached the marker: stop pinging */
  var acquiring = false, pulsing = false, acquired = false;

  /* The marker keeps pinging on a slow interval until it has been found, and
     then never again. That conditional is the whole justification: a ping that
     continues after the visitor has hovered, focused or opened the marker is
     decoration, and this system has none. One that retires on contact is an
     affordance that gave up once it worked.

     Repeats are softer than the acquisition ping so the first one still reads
     as the louder event, and the loop already runs for the yaw drift, so this
     costs no frames that were not being drawn anyway. */
  function markerFound() {
    dvFound = true;
    nextPulse = 0;
  }

  function acquire() {
    if (acquired) return;
    acquired = true;
    if (reduceMQ.matches) { trackAmt = 1; pulseAmt = 1; draw(); return; }
    trackAmt = 0;
    pulseAmt = 0;
    acquiring = true;
    start();
  }

  function project(p, out) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var x = p[0] * cy + p[2] * sy;
    var z = -p[0] * sy + p[2] * cy;
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var y = p[1] * cp - z * sp;
    z = p[1] * sp + z * cp;
    var D = 5, unit = Math.min(W / 3.85, H / 2.46), k = D / (D - z);
    out[0] = W / 2 + x * k * unit;
    out[1] = H / 2 - y * k * unit;
    out[2] = z;
    return out;
  }

  /* --- Draw ---------------------------------------------------------------- */
  var scratch = [0, 0, 0];
  var BANDS = 8;   /* depth-fade buckets; one stroke call per tone per bucket */

  function draw() {
    if (!W || !H) return;
    var k = cssScale(), px = 1 / k;   /* one screen CSS pixel, in canvas units */
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawOrbit(px);

    /* Project once, bucket by depth, then stroke each bucket as one path. */
    var i, j, pl, pts, n, sum, screen, bucket;
    var buckets = {};
    for (i = 0; i < MODEL.length; i++) {
      pl = MODEL[i];
      pts = pl.pts;
      n = pts.length;
      screen = new Array(n);
      sum = 0;
      for (j = 0; j < n; j++) {
        project(pts[j], scratch);
        screen[j] = [scratch[0], scratch[1]];
        sum += scratch[2];
      }
      /* Depth cue: far edges fade back. This is the only thing separating the
         near and far sides of a wireframe, so it does the work a fill would. */
      var depth = sum / n;
      bucket = Math.max(0, Math.min(BANDS - 1, Math.round((depth + 1.7) / 3.4 * (BANDS - 1))));
      var tone = pl.tone;
      if (pl.part === 'engine' && dvAmt > 0.02) tone = 'watch';
      var key = tone + bucket;
      (buckets[key] || (buckets[key] = { tone: tone, bucket: bucket, lines: [] })).lines.push(screen);
    }

    for (var key in buckets) {
      var b = buckets[key];
      /* Wide range on purpose. At a narrower one the far and near sides of the
         wireframe measured within a few percent of each other and the drawing
         read flat: this fade is the only thing doing the job a fill would. */
      var t = b.bucket / (BANDS - 1);
      var fade = 0.18 + 0.82 * t;
      var base = b.tone === 'faint' ? 0.80 : b.tone === 'watch' ? 0.95 : 0.92;
      var alpha = base * fade;
      if (b.tone === 'watch') alpha *= (0.35 + 0.65 * dvAmt);
      ctx.strokeStyle = stroke(b.tone, alpha);
      ctx.lineWidth = px * (b.tone === 'body' ? 1.05 : 0.9) * (0.82 + 0.18 * t);
      ctx.beginPath();
      for (i = 0; i < b.lines.length; i++) {
        var L = b.lines[i];
        ctx.moveTo(L[0][0], L[0][1]);
        for (j = 1; j < L.length; j++) ctx.lineTo(L[j][0], L[j][1]);
      }
      ctx.stroke();
    }

    if (hoverAmt > 0.01) drawCallouts(px);
    drawMarker(px);
  }

  function drawOrbit(px) {
    var a, p, i;

    /* Physics model: the whole ellipse, dashed. Where the object would be if
       nothing but J2 and drag were acting on it. */
    ctx.setLineDash([3 * px, 4 * px]);
    ctx.strokeStyle = stroke('edge', 0.55);
    ctx.lineWidth = px;
    ctx.beginPath();
    for (i = 0; i <= 128; i++) {
      a = i / 128 * Math.PI * 2;
      p = orbitPt(a);
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    /* Observed: solid, coincident with the model before the burn and peeling
       away after it. The gap between the two is the whole product.

       It lays itself down once, on landing, rather than arriving finished. A
       cursor walks the track from the start of the window to the end, so the
       departure at the Δv is something the visitor watches happen instead of
       something they have to find. This is deliberately NOT a sweep: a sweep
       is radar, and the product's headline claim is that it uses no radar.
       What is being animated is the engine's actual operation, walking an
       element-set history and resolving the residual. */
    if (trackAmt <= 0) return;
    var span = trackAmt, steps = Math.max(2, Math.round(96 * span));
    ctx.strokeStyle = stroke('body', 0.42);
    ctx.lineWidth = px * 1.2;
    ctx.beginPath();
    for (i = 0; i <= steps; i++) {
      var t = i / steps * span;
      a = ORBIT.mark - 2.5 + t * (2.5 + 2.7);
      var after = Math.max(0, (a - ORBIT.mark) / 2.7);
      p = orbitPt(a, 1 + ORBIT.depart * after * after);
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    ctx.stroke();

    /* The head of the track while it is still being laid. */
    if (trackAmt < 1) {
      ctx.fillStyle = stroke('body', 0.9);
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2 * px, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawMarker(px) {
    var p = orbitPt(ORBIT.mark);
    var r = (4.4 + dvAmt * 1.2) * px;

    /* Diamond in `watch`: the flagged maneuver, the same meaning this color
       carries in the residual trace and in the gate readout. */
    ctx.fillStyle = stroke('watch', 0.92);
    ctx.beginPath();
    ctx.moveTo(p[0], p[1] - r);
    ctx.lineTo(p[0] + r, p[1]);
    ctx.lineTo(p[0], p[1] + r);
    ctx.lineTo(p[0] - r, p[1]);
    ctx.closePath();
    ctx.fill();

    /* One pulse, once, at the moment the track reaches the burn. The marker is
       the only interactive thing in the figure and it was going unnoticed;
       this points at it exactly once and is never repeated, which is the
       difference between an affordance and a blinking ornament. */
    if (pulseAmt > 0 && pulseAmt < 1) {
      var e = 1 - Math.pow(1 - pulseAmt, 3);
      ctx.strokeStyle = stroke('watch', 0.6 * pulseGain * (1 - pulseAmt));
      ctx.lineWidth = px * 1.4;
      ctx.beginPath();
      ctx.arc(p[0], p[1], (13 + e * 30) * px, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* Affordance ring: sits still until pointed at, then closes in. */
    ctx.strokeStyle = stroke('watch', 0.20 + 0.55 * dvAmt);
    ctx.lineWidth = px;
    ctx.beginPath();
    ctx.arc(p[0], p[1], (13 - dvAmt * 3) * px, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = (12 * px) + 'px ' + MONO;
    ctx.fillStyle = stroke('watch', 0.75 + 0.25 * dvAmt);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Δv', p[0] + 20 * px, p[1] - 1 * px);
  }

  function drawCallouts(px) {
    /* Four edge labels need room the narrow layouts do not have, and touch
       has no hover to dismiss them with. Below this width they are dropped. */
    if (W < 430) return;

    var out = [0, 0, 0], pad = 10 * px, i, c, p, tw, endX, elbowX, ly;
    ctx.font = (10 * px) + 'px ' + MONO;
    if ('letterSpacing' in ctx) ctx.letterSpacing = (0.9 * px) + 'px';
    ctx.textBaseline = 'middle';

    for (i = 0; i < CALLOUTS.length; i++) {
      c = CALLOUTS[i];
      p = project(c.at, out);
      ly = c.y * H;
      tw = ctx.measureText(c.text).width;
      endX = c.side > 0 ? W - pad - tw - 8 * px : pad + tw + 8 * px;
      elbowX = endX - c.side * 16 * px;

      /* Leader: a diagonal off the part, then a short horizontal into the
         label, the way an annotated drawing does it. */
      ctx.strokeStyle = stroke('faint', 0.50 * hoverAmt);
      ctx.lineWidth = px;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(elbowX, ly);
      ctx.lineTo(endX, ly);
      ctx.stroke();

      ctx.fillStyle = stroke('faint', 0.70 * hoverAmt);
      ctx.beginPath();
      ctx.arc(p[0], p[1], 1.7 * px, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = stroke('faint', 0.95 * hoverAmt);
      ctx.textAlign = c.side > 0 ? 'right' : 'left';
      ctx.fillText(c.text, c.side > 0 ? W - pad : pad, ly);
    }
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  /* --- Loop ---------------------------------------------------------------
     Runs only while the figure is on screen, the tab is visible, and the
     residual overlay is closed. Under reduced motion it renders once per
     state change instead of continuously. */
  var onScreen = true, visible = true, overlayOpen = false, rafId = 0;

  function shouldRun() {
    return onScreen && visible && !overlayOpen;
  }

  function tick(now) {
    rafId = 0;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;

    if (drift) {
      yawTarget += drift * dt;
      /* Wrap both together so a tab left open overnight does not drift into
         the range where float precision starts costing us angle. */
      if (yawTarget > Math.PI * 2) { yawTarget -= Math.PI * 2; yaw -= Math.PI * 2; }
    }
    var ease = 1 - Math.pow(0.001, dt);
    yaw += (yawTarget + parallax.x - yaw) * ease;
    pitch += (pitchTarget + parallax.y - pitch) * ease;
    hoverAmt += (hoverWant - hoverAmt) * ease;
    dvAmt += (dvWant - dvAmt) * ease;

    if (acquiring) {
      trackAmt += dt * 1000 / TRACK_MS;
      /* The pulse fires when the track reaches the burn, not when the whole
         window finishes drawing, so the cue lands on the thing it points at. */
      if (!pulsing && trackAmt >= 2.5 / 5.2) { pulsing = true; pulseAmt = 0.0001; }
      if (trackAmt >= 1) { trackAmt = 1; acquiring = false; }
    }
    if (pulsing) {
      pulseAmt += dt * 1000 / PULSE_MS;
      if (pulseAmt >= 1) {
        pulseAmt = 1;
        pulsing = false;
        /* Schedule the next ping only while the marker is still unfound. */
        if (!dvFound && !reduceMQ.matches) nextPulse = now + PULSE_GAP;
      }
    } else if (nextPulse && now >= nextPulse && !acquiring) {
      pulsing = true;
      pulseAmt = 0.0001;
      pulseGain = 0.62;
    }

    draw();

    /* With drift off (reduced motion) the drawing is static once the eased
       values have caught up, so the loop parks itself instead of burning
       frames on a picture that is not changing. Any interaction restarts it. */
    if (!drift && !pinned && settled()) { rafId = 0; return; }
    if (shouldRun()) rafId = requestAnimationFrame(tick);
  }

  function settled() {
    if (acquiring || pulsing || nextPulse) return false;
    return Math.abs(yawTarget + parallax.x - yaw) < 1e-3 &&
           Math.abs(pitchTarget + parallax.y - pitch) < 1e-3 &&
           Math.abs(hoverWant - hoverAmt) < 1e-3 &&
           Math.abs(dvWant - dvAmt) < 1e-3;
  }

  function start() {
    if (!rafId && shouldRun()) {
      last = 0;
      rafId = requestAnimationFrame(tick);
    }
  }
  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      onScreen ? start() : stop();
    }, { threshold: 0 }).observe(figure);
  }
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    visible ? start() : stop();
  });

  /* --- Pointer ------------------------------------------------------------- */
  if (!hoverMQ.matches) {
    stage.addEventListener('pointerenter', function () { hoverWant = 1; start(); });
    stage.addEventListener('pointerleave', function () {
      hoverWant = 0;
      parallax.x = 0;
      parallax.y = 0;
      start();
    });
  }
  stage.addEventListener('pointermove', function (e) {
    if (reduceMQ.matches) return;
    var r = stage.getBoundingClientRect();
    parallax.x = ((e.clientX - r.left) / r.width - 0.5) * 0.62;
    parallax.y = ((e.clientY - r.top) / r.height - 0.5) * 0.34;
    start();
  });

  var ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(function () { if (!pinned) { sizeCanvas(); draw(); } });
    ro.observe(stage);
  } else {
    addEventListener('resize', function () { if (!pinned) { sizeCanvas(); draw(); } });
  }

  /* --- Residual overlay ----------------------------------------------------
     The Delta-v marker is a real button sitting over the drawn diamond, so the
     interaction is reachable by keyboard and announced to assistive tech. */
  /* --- Drawing the residual ------------------------------------------------
     The overlay used to fade in finished, which made the page's central
     explanation something a visitor had to read rather than watch. It now
     draws left to right: the observed and modelled tracks run together, then
     separate; the residual below stays flat, then steps; and the Δv snaps in
     at the moment the sweep reaches the burn.

     That order is the product. Subtract the physics, and what is left is the
     engine. The animation is the argument, so it is worth the one place on
     the page where motion is allowed to take most of a second.

     It costs nothing in the page's motion budget because nobody sees it
     unless they ask: it runs on open, and it re-runs on every open, because
     an explanation you asked for a second time should play a second time.

     Full width in the markup means the no-script and reduced-motion paths get
     the finished schematic and never touch any of this. */
  var WIPE_MS = 900, DV_AT = 300 / 560;   /* the burn sits at x=300 of 560 */

  function drawResidual() {
    if (!residual || reduceMQ.matches) return;
    var wipe = residual.querySelector('#residual-wipe');
    var dv = residual.querySelector('.res-dv');
    var late = residual.querySelector('.res-late');
    if (!wipe) return;

    var parts = [dv, late];
    wipe.style.transition = 'none';
    wipe.style.width = '0px';
    parts.forEach(function (g) {
      if (!g) return;
      g.style.transition = 'none';
      g.style.opacity = '0';
    });

    /* Flush the reset so the browser animates from it rather than
       coalescing both states into one style change and showing nothing. */
    void wipe.getBoundingClientRect();

    wipe.style.transition = 'width ' + WIPE_MS + 'ms linear';
    wipe.style.width = '560px';
    if (dv) {
      dv.style.transition = 'opacity 200ms var(--motion-ease-out) ' + Math.round(WIPE_MS * DV_AT) + 'ms';
      dv.style.opacity = '1';
    }
    if (late) {
      late.style.transition = 'opacity 260ms var(--motion-ease-out) ' + Math.round(WIPE_MS * 0.82) + 'ms';
      late.style.opacity = '1';
    }
  }

  function setOverlay(open) {
    overlayOpen = open;
    figure.classList.toggle('residual-open', open);
    if (dvBtn) dvBtn.setAttribute('aria-expanded', String(open));
    if (residual) residual.setAttribute('aria-hidden', String(!open));
    if (open) {
      stop();
      drawResidual();
      if (closeBtn) closeBtn.focus();
    } else {
      /* Only pull focus back if it was inside the thing being closed, so an
         Escape pressed further down the page does not yank the view up. */
      if (dvBtn && residual && residual.contains(document.activeElement)) dvBtn.focus();
      start();
    }
  }

  if (dvBtn) {
    /* Any of these means the marker has been found, which is the ping's only
       job. Hovering counts: the visitor's eye is already on it. */
    dvBtn.addEventListener('click', function () { markerFound(); setOverlay(!overlayOpen); });
    dvBtn.addEventListener('pointerenter', function () { markerFound(); dvWant = 1; start(); });
    dvBtn.addEventListener('pointerleave', function () { dvWant = 0; start(); });
    dvBtn.addEventListener('focus', function () { markerFound(); dvWant = 1; start(); });
    dvBtn.addEventListener('blur', function () { dvWant = 0; start(); });
  }
  if (closeBtn) closeBtn.addEventListener('click', function () { setOverlay(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlayOpen) setOverlay(false);
  });

  /* --- Star field ----------------------------------------------------------
     Sparse authored points, no glow and no nebula: this is the one decorative
     surface in the system and it is deliberately thin, present only while the
     intro is on screen. */
  var stars = [];
  function seedStars(w, h) {
    stars.length = 0;
    var count = Math.round(Math.min(w * h / 9000, 190));
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.4 + Math.random() * 0.9,
        a: 0.10 + Math.random() * 0.42,
        d: 0.3 + Math.random() * 1.4    /* parallax depth */
      });
    }
  }
  function drawStars(ox, oy) {
    if (!veilCtx) return;
    var w = veilCv.clientWidth, h = veilCv.clientHeight;
    veilCtx.clearRect(0, 0, w, h);
    var c = TONE.faint;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      veilCtx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + s.a.toFixed(3) + ')';
      veilCtx.beginPath();
      veilCtx.arc(s.x * w + ox * s.d, s.y * h + oy * s.d, s.r, 0, Math.PI * 2);
      veilCtx.fill();
    }
  }
  function sizeVeil() {
    if (!veilCtx) return;
    var w = innerWidth, h = innerHeight;
    veilCv.style.width = w + 'px';
    veilCv.style.height = h + 'px';
    veilCv.width = Math.round(w * dpr);
    veilCv.height = Math.round(h * dpr);
    veilCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedStars(w, h);
    drawStars(0, 0);
  }

  /* --- Intro ---------------------------------------------------------------
     A FLIP: pin the stage at its natural rect, transform it out to the centre
     of the viewport, hold, then transition the transform away so it lands
     exactly where it belongs. Plays once per session, never under reduced
     motion, and any input skips it. */
  var armed = root.classList.contains('intro-armed');

  function markDone() {
    try { sessionStorage.setItem('vantage-intro', 'done'); } catch (e) {}
  }

  function land(immediate) {
    if (!pinned && !armed) return;
    var finish = function () {
      pinned = false;
      stage.removeAttribute('style');
      root.classList.remove('intro-armed', 'intro-flying');
      superScale = 1;
      sizeCanvas();
      draw();
      start();
      acquire();     /* the figure has settled: lay the track, pulse the marker */
    };
    root.classList.remove('intro-armed');
    root.classList.add('intro-flying');
    if (immediate) {
      stage.style.transition = 'none';
      stage.style.transform = 'none';
      finish();
      return;
    }
    stage.style.transition = 'transform var(--motion-flight) var(--motion-ease-flight)';
    stage.style.transform = 'translate(0px, 0px) scale(1)';
    var done = false;
    var end = function () { if (!done) { done = true; finish(); } };
    stage.addEventListener('transitionend', end, { once: true });
    setTimeout(end, 1400);
  }

  function runIntro() {
    /* The head script's backstop may have fired already, in which case the
       page is on screen and un-veiled and an intro starting now would pin the
       stage under a visitor who is mid-read. Only ever run while still armed. */
    if (!root.classList.contains('intro-armed')) { markDone(); return; }
    clearTimeout(window.__vantageIntroBackstop);
    var r = stage.getBoundingClientRect();
    if (!r.width || !r.height) { root.classList.remove('intro-armed'); return; }

    var vw = innerWidth, vh = innerHeight;
    var S = Math.max(1.05, Math.min(vw * 0.60 / r.width, vh * 0.62 / r.height));
    superScale = Math.min(S, 2);
    pinned = true;

    stage.style.position = 'fixed';
    stage.style.left = r.left + 'px';
    stage.style.top = r.top + 'px';
    stage.style.width = r.width + 'px';
    stage.style.height = r.height + 'px';
    stage.style.margin = '0';
    stage.style.zIndex = '61';
    stage.style.transformOrigin = '50% 50%';
    stage.style.transform = 'translate(' + (vw / 2 - (r.left + r.width / 2)) + 'px,' +
                            (vh / 2 - (r.top + r.height / 2)) + 'px) scale(' + S + ')';

    sizeCanvas();
    sizeVeil();
    yawTarget = yaw = -0.35;      /* start turned away, settle into the resting angle */
    start();

    var skipped = false;
    var skip = function () {
      if (skipped) return;
      skipped = true;
      clearTimeout(holdT);
      teardown();
      land(false);
      markDone();
    };
    var teardown = function () {
      removeEventListener('wheel', skip);
      removeEventListener('touchstart', skip);
      removeEventListener('keydown', skip);
      removeEventListener('pointerdown', skip);
      removeEventListener('resize', sizeVeil);
    };
    addEventListener('wheel', skip, { passive: true });
    addEventListener('touchstart', skip, { passive: true });
    addEventListener('keydown', skip);
    addEventListener('pointerdown', skip);
    addEventListener('resize', sizeVeil);

    if (!hoverMQ.matches) {
      addEventListener('pointermove', function onMove(e) {
        if (!pinned) { removeEventListener('pointermove', onMove); return; }
        drawStars((e.clientX / innerWidth - 0.5) * 26, (e.clientY / innerHeight - 0.5) * 18);
      });
    }

    var holdT = setTimeout(function () {
      if (skipped) return;
      skipped = true;
      teardown();
      land(false);
      markDone();
    }, 1750);
  }

  /* Boot ------------------------------------------------------------------- */
  sizeCanvas();

  /* A tab that loads in the background gets no animation frames, so running
     the intro now would leave it frozen behind a full-viewport veil.

     It used to be discarded outright on that path, and marked seen with it,
     which meant a page opened in a background tab, restored with a session, or
     prerendered from the address bar never showed the intro at all, not even
     once it was brought forward. That over-corrected: the thing worth avoiding
     is the intro ambushing someone mid-read, not the intro happening.

     So it is held rather than dropped. The veil stays up while the tab is
     hidden, which costs nothing because nobody is looking at it, and the head
     script's stranding backstop is suspended and restarted on first sight, so
     it measures time the visitor could actually see rather than wall time. */
  var held = armed && document.hidden && !reduceMQ.matches;

  if (held) {
    clearTimeout(window.__vantageIntroBackstop);
    document.addEventListener('visibilitychange', function onFirstSight() {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onFirstSight);
      window.__vantageIntroBackstop = setTimeout(function () {
        root.classList.remove('intro-armed');
      }, 6000);

      /* Only from the top of the page. At scrollY 0 nobody is mid-read, so
         there is nothing for the veil to interrupt; below that, the visitor
         has already engaged and the intro has missed its moment. */
      if (scrollY > 4) {
        root.classList.remove('intro-armed');
        clearTimeout(window.__vantageIntroBackstop);
        markDone();
        draw();
        start();
        acquire();
        return;
      }
      requestAnimationFrame(function () { requestAnimationFrame(runIntro); });
    });
  } else if (armed && !reduceMQ.matches) {
    /* Give layout and the web fonts a frame to settle before measuring. */
    requestAnimationFrame(function () { requestAnimationFrame(runIntro); });
  } else {
    root.classList.remove('intro-armed');
    clearTimeout(window.__vantageIntroBackstop);
    markDone();
    draw();
    start();
    /* Returning visitors and reduced motion skip the intro, but they should
       still get the acquisition once: it is what makes the Δv marker findable,
       and it is the only thing that shows the observed track separating from
       the model. The hero is at the top of the page, so there is nothing to
       wait for. */
    acquire();
  }

  if (reduceMQ.matches) { stop(); draw(); }
  reduceMQ.addEventListener && reduceMQ.addEventListener('change', function () {
    drift = reduceMQ.matches ? 0 : 0.13;
    reduceMQ.matches ? (stop(), draw()) : start();
  });
})();
