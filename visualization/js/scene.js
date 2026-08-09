/* The 3D scene, matched to the reference console's look: NASA Blue Marble
   earth with a drifting cloud layer, a Milky Way panorama behind it, the
   catalog as small lit 3D boxes propagated per-instance in the vertex shader,
   and the radar network's translucent red beam volumes. 1 scene unit =
   1000 km; earth axis = +Y; the earth group carries the GMST rotation while
   every orbiting object lives in ECI. */

import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import {
  gmst, sunEci, eciPosition, sceneFromEci, latLonToScene,
  KM_TO_UNITS, R_MEAN, TAU,
} from './orbits.js';

const R = R_MEAN * KM_TO_UNITS; // globe radius in units (~6.371)

/* Object-type palette sampled from the reference legend. */
export const TYPE_COLORS = [0x35c418, 0xc9bc2b, 0xd43333, 0x2b3fd4];

/* ------------------------------------------------------------------ */
/* Sky: star-field panorama with a painted Milky Way band              */
/* ------------------------------------------------------------------ */
function buildSky(nightImg) {
  const w = 4096, h = 2048;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  if (nightImg) {
    ctx.globalAlpha = 0.5; // the reference sky is near-black away from the band
    ctx.drawImage(nightImg, 0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  let s = 977;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

  // Galactic plane as a tilted great circle in the equirect projection.
  const tilt = 1.05, node = 0.62;
  const bandY = (u) => h / 2 - Math.asin(Math.sin(tilt) * Math.sin(TAU * (u - node))) / (Math.PI / 2) * (h / 2) * 0.92;

  const blob = (x, y, r, rgb, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // diffuse warm glow along the band, brightest near the "core"
  for (let i = 0; i < 900; i++) {
    const u = rnd();
    const x = u * w;
    const y = bandY(u) + (rnd() - 0.5) * 120;
    const core = Math.exp(-Math.pow(((u - 0.30 + 1.5) % 1) - 0.5, 2) / 0.02);
    blob(x, y, 50 + rnd() * 110, '235,225,205', 0.028 + 0.05 * core * rnd());
  }
  // brown dust lanes threading the band
  for (let i = 0; i < 500; i++) {
    const u = rnd();
    const x = u * w;
    const y = bandY(u) + (rnd() - 0.5) * 55;
    blob(x, y, 18 + rnd() * 60, '62,40,26', 0.06 + rnd() * 0.12);
  }
  // star dust concentrated toward the band
  ctx.fillStyle = 'rgba(255,250,240,0.8)';
  for (let i = 0; i < 7000; i++) {
    const u = rnd();
    const spread = 60 + rnd() * rnd() * 600;
    const x = u * w;
    const y = bandY(u) + (rnd() - 0.5) * spread;
    if (y < 0 || y >= h) continue;
    const b = 0.2 + rnd() * 0.6;
    ctx.globalAlpha = b * (spread < 220 ? 0.7 : 0.22);
    const r2 = rnd() < 0.94 ? 0.7 : 1.3;
    ctx.fillRect(x, y, r2, r2);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  const geo = new THREE.SphereGeometry(460, 48, 32);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.z = 0.35; // tip the band diagonally like the reference view
  return mesh;
}

/* ------------------------------------------------------------------ */
/* Earth: Blue Marble + soft sun lambert + thin atmosphere             */
/* ------------------------------------------------------------------ */
function buildEarth(tex) {
  const geo = new THREE.SphereGeometry(R, 96, 64);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: tex },
      uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vUv = uv;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap;
      uniform vec3 uSunDir;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 base = texture2D(uMap, vUv).rgb;
        float dn = dot(vNormalW, uSunDir);
        float shade = 0.97 + 0.2 * smoothstep(-0.3, 0.4, dn);
        vec3 col = base * shade;
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float rim = pow(1.0 - clamp(dot(viewDir, vNormalW), 0.0, 1.0), 3.0);
        col += vec3(0.14, 0.30, 0.55) * rim * 0.4;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  return new THREE.Mesh(geo, mat);
}

/* Procedural wispy cloud layer, drifting slowly against the ground. */
function buildClouds() {
  const gw = 256, gh = 128;
  let s = 1234;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const grid = new Float32Array(gw * gh);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const sample = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const g = (ix, iy) => grid[((iy % gh + gh) % gh) * gw + ((ix % gw + gw) % gw)];
    const a = g(xi, yi), b = g(xi + 1, yi), c = g(xi, yi + 1), d = g(xi + 1, yi + 1);
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
  const w = 1024, h = 512;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // stretched fBm: clouds smear along latitude bands
      let n = 0, amp = 1, fx = x / w * 46, fy = y / h * 32;
      for (let o = 0; o < 5; o++) {
        n += sample(fx, fy) * amp;
        fx *= 2.03; fy *= 1.94; amp *= 0.52;
      }
      n /= 1.95;
      const lat = Math.abs(y / h - 0.5) * 2;
      const belt = 0.92 + 0.25 * Math.sin(lat * 9.0); // storm belts
      let a = Math.max(0, (n - 0.55) * 3.2) * belt;
      a = Math.min(1, a * a * 1.5);
      const k = (y * w + x) * 4;
      img.data[k] = 255; img.data[k + 1] = 255; img.data[k + 2] = 255;
      img.data[k + 3] = Math.round(a * 150);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.007, 72, 48),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  return mesh;
}

function buildAtmosphere() {
  const geo = new THREE.SphereGeometry(R * 1.032, 64, 48);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(0x4a9fe0) } },
    vertexShader: /* glsl */`
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float f = pow(1.0 - abs(dot(viewDir, vNormalW)), 3.4);
        gl_FragColor = vec4(uColor, f * 0.6);
      }`,
  });
  return new THREE.Mesh(geo, mat);
}

/* ------------------------------------------------------------------ */
/* Catalog as instanced, velocity-aligned boxes                        */
/* ------------------------------------------------------------------ */
function buildObjects(objects) {
  const n = objects.length;
  const base = new THREE.BoxGeometry(1, 0.34, 0.34);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.attributes.position = base.attributes.position;
  geo.attributes.normal = base.attributes.normal;
  geo.instanceCount = n;

  const e1 = new Float32Array(n * 4);
  const e2 = new Float32Array(n * 4);
  const e3 = new Float32Array(n * 2);
  const vis = new Float32Array(n).fill(1);
  const rand = new Float32Array(n);
  const color = new Float32Array(n * 3);
  let seed = 77;
  for (let i = 0; i < n; i++) {
    const el = objects[i].el;
    e1[i * 4] = el.a; e1[i * 4 + 1] = el.e; e1[i * 4 + 2] = el.inc; e1[i * 4 + 3] = el.raan;
    e2[i * 4] = el.argp; e2[i * 4 + 1] = el.m0; e2[i * 4 + 2] = el.n; e2[i * 4 + 3] = el.raanDot;
    e3[i * 2] = el.argpDot; e3[i * 2 + 1] = objects[i].kind;
    seed = (seed * 16807) % 2147483647;
    rand[i] = seed / 2147483647;
  }
  geo.setAttribute('iE1', new THREE.InstancedBufferAttribute(e1, 4));
  geo.setAttribute('iE2', new THREE.InstancedBufferAttribute(e2, 4));
  geo.setAttribute('iE3', new THREE.InstancedBufferAttribute(e3, 2));
  geo.setAttribute('iVis', new THREE.InstancedBufferAttribute(vis, 1));
  geo.setAttribute('iRand', new THREE.InstancedBufferAttribute(rand, 1));
  geo.setAttribute('iColor', new THREE.InstancedBufferAttribute(color, 3));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 1 },
      uDim: { value: 1 },
      uFlash: { value: 0 },
      uScale: { value: 0.055 }, // ~55 km boxes: exaggerated like the reference
      uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    },
    vertexShader: /* glsl */`
      attribute vec4 iE1; // a(km), e, inc, raan
      attribute vec4 iE2; // argp, m0, n, raanDot
      attribute vec2 iE3; // argpDot, kind
      attribute float iVis;
      attribute float iRand;
      attribute vec3 iColor;
      uniform float uTime;
      uniform float uReveal;
      uniform float uScale;
      uniform vec3 uSunDir;
      varying vec3 vCol;
      const float KM = 0.001;
      vec3 orbitPos(float t) {
        float a = iE1.x, e = iE1.y, inc = iE1.z;
        float raan = iE1.w + iE2.w * t;
        float argp = iE2.x + iE3.x * t;
        float M = iE2.y + iE2.z * t;
        float E = M;
        for (int k = 0; k < 6; k++) {
          E = E - (E - e * sin(E) - M) / (1.0 - e * cos(E));
        }
        float cE = cos(E), sE = sin(E);
        float xp = a * (cE - e);
        float yp = a * sqrt(1.0 - e * e) * sE;
        float cO = cos(raan), sO = sin(raan);
        float cw = cos(argp), sw = sin(argp);
        float ci = cos(inc), si = sin(inc);
        float x1 = cw * xp - sw * yp;
        float y1 = sw * xp + cw * yp;
        return vec3(
          (cO * x1 - sO * ci * y1) * KM,
          (si * y1) * KM,
          -(sO * x1 + cO * ci * y1) * KM
        );
      }
      void main() {
        float on = iVis * step(iRand, uReveal);
        vec3 c0 = orbitPos(uTime);
        vec3 c1 = orbitPos(uTime + 2.0);
        vec3 f = normalize(c1 - c0);          // along-track
        vec3 up = normalize(c0);              // radial
        vec3 s = normalize(cross(f, up));     // cross-track
        vec3 u2 = cross(s, f);
        float kind = iE3.y;
        float len = kind < 0.5 ? 1.0 : (kind < 1.5 ? 0.9 : (kind < 2.5 ? 0.5 : 0.7));
        float sc = uScale * (0.75 + iRand * 0.55) * len * on;
        vec3 wpos = c0 + (f * position.x + s * position.y + u2 * position.z) * sc;
        vec3 nrm = normalize(f * normal.x + s * normal.y + u2 * normal.z);
        float light = 0.52 + 0.58 * max(dot(nrm, uSunDir), 0.0);
        vCol = iColor * light;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(wpos, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uDim;
      uniform float uFlash;
      varying vec3 vCol;
      void main() {
        gl_FragColor = vec4(vCol * (1.0 + uFlash * 0.8) * uDim + vec3(1.0) * uFlash * 0.08, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

/* ------------------------------------------------------------------ */
/* Orbit line for the selection                                        */
/* ------------------------------------------------------------------ */
function makeOrbitLine(color) {
  const N = 384;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((N + 1) * 3), 3));
  const mat = new THREE.LineBasicMaterial({
    color, transparent: true, opacity: 0.9, depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  line.visible = false;
  line.frustumCulled = false;
  line.userData.N = N;
  return line;
}

function fillOrbitLine(line, el, t) {
  const N = line.userData.N;
  const arr = line.geometry.attributes.position.array;
  const period = TAU / el.n;
  const p = [0, 0, 0], s = [0, 0, 0];
  for (let i = 0; i <= N; i++) {
    eciPosition(el, t + (i / N) * period, p);
    sceneFromEci(p, s);
    arr[i * 3] = s[0]; arr[i * 3 + 1] = s[1]; arr[i * 3 + 2] = s[2];
  }
  line.geometry.attributes.position.needsUpdate = true;
  line.visible = true;
}

function bracketTexture() {
  const s = 128, m = 18, L = 34, w = 8;
  const cv = document.createElement('canvas');
  cv.width = s; cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = w;
  ctx.lineCap = 'square';
  const corner = (x, y, dx, dy) => {
    ctx.beginPath();
    ctx.moveTo(x + dx * L, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * L);
    ctx.stroke();
  };
  corner(m, m, 1, 1);
  corner(s - m, m, -1, 1);
  corner(m, s - m, 1, -1);
  corner(s - m, s - m, -1, -1);
  return new THREE.CanvasTexture(cv);
}

/* ------------------------------------------------------------------ */
/* Sensor sites and their beam volumes                                 */
/* ------------------------------------------------------------------ */
function diamondTexture() {
  const s = 96;
  const cv = document.createElement('canvas');
  cv.width = s; cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.translate(s / 2, s / 2);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#eaf6fa';
  const w = 30;
  ctx.fillRect(-w / 2, -w / 2, w, w);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 5;
  ctx.strokeRect(-w / 2, -w / 2, w, w);
  return new THREE.CanvasTexture(cv);
}

function beamMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xd23b3b, transparent: true, opacity: 0.30,
    side: THREE.DoubleSide, depthWrite: false,
  });
}

/* A cone whose apex sits at the origin, opening along +Y. */
function apexCone(radius, height, radial) {
  const g = new THREE.ConeGeometry(radius, height, radial, 1, false);
  g.rotateX(Math.PI);
  g.translate(0, height / 2, 0);
  return g;
}

function buildBeamMesh(type) {
  const group = new THREE.Group();
  if (type === 'star') {
    // rosette of tilted petals, like the reference's six-pointed radar fence
    for (let k = 0; k < 6; k++) {
      const g = apexCone(0.72, 2.3, 10);
      g.scale(1, 1, 0.22);
      g.rotateX(0.66);
      g.rotateY((k / 6) * TAU);
      group.add(new THREE.Mesh(g, beamMaterial()));
    }
  } else if (type === 'fan') {
    for (let k = 0; k < 2; k++) {
      const g = apexCone(1.5, 2.2, 18);
      g.scale(1, 1, 0.05);
      g.rotateY(k * Math.PI / 2 + 0.4);
      group.add(new THREE.Mesh(g, beamMaterial()));
    }
  } else { // wide surveillance cone
    const g = apexCone(2.0, 1.6, 40);
    group.add(new THREE.Mesh(g, beamMaterial()));
  }
  return group;
}

function buildSensors(sites) {
  const group = new THREE.Group();
  const beams = new THREE.Group();
  const dTex = diamondTexture();
  const markers = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (const site of sites) {
    const pos = latLonToScene(site.lat, site.lon, R_MEAN * 1.002);
    const v = new THREE.Vector3(...pos);
    const marker = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dTex, transparent: true, depthWrite: false,
    }));
    marker.position.copy(v);
    marker.scale.setScalar(0.16);
    group.add(marker);
    markers.push(marker);

    const beam = buildBeamMesh(site.beam || 'cone');
    beam.position.copy(v);
    beam.quaternion.setFromUnitVectors(up, v.clone().normalize());
    beams.add(beam);
  }
  return { group, beams, markers, sites };
}

/* ------------------------------------------------------------------ */
/* Scene assembly                                                      */
/* ------------------------------------------------------------------ */
export function createViz({ canvas, textures, objects, sensorSites }) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
  });
  const pr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pr);
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 2, 0.05, 900);
  camera.position.set(11.5, 6.4, 22.5);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.42;
  controls.minDistance = 7.4;
  controls.maxDistance = 120;
  controls.zoomSpeed = 0.7;
  controls.enablePan = false;

  const earthGroup = new THREE.Group();
  const earthTex = new THREE.Texture(textures.earth);
  earthTex.needsUpdate = true;
  earthTex.colorSpace = THREE.SRGBColorSpace;
  earthTex.anisotropy = 4;
  earthTex.wrapS = THREE.RepeatWrapping; // no dark seam at the antimeridian
  const earth = buildEarth(earthTex);
  earthGroup.add(earth);
  const sensors = buildSensors(sensorSites);
  earthGroup.add(sensors.group);
  earthGroup.add(sensors.beams);
  scene.add(earthGroup);

  const clouds = buildClouds();
  scene.add(clouds);

  const sky = buildSky(textures.night);
  scene.add(sky);
  const atmosphere = buildAtmosphere();
  scene.add(atmosphere);

  const cloud = buildObjects(objects);
  scene.add(cloud);

  const orbitLine = makeOrbitLine(0xffffff);
  scene.add(orbitLine);
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({
    map: bracketTexture(), color: 0xffffff, transparent: true,
    depthTest: false, depthWrite: false,
  }));
  marker.visible = false;
  marker.renderOrder = 10;
  scene.add(marker);

  let epochMs = Date.now();
  let simMs = epochMs;
  let selected = -1;
  let followEarth = true;
  let lastGmst = gmst(simMs);
  const tmpP = [0, 0, 0], tmpS = [0, 0, 0];
  const v3 = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);

  function tSec() { return (simMs - epochMs) / 1000; }

  function rebase() {
    const dt = tSec();
    const e1 = cloud.geometry.attributes.iE1;
    const e2 = cloud.geometry.attributes.iE2;
    for (let i = 0; i < objects.length; i++) {
      const el = objects[i].el;
      el.m0 = (el.m0 + el.n * dt) % TAU;
      el.raan += el.raanDot * dt;
      el.argp += el.argpDot * dt;
      e1.array[i * 4 + 3] = el.raan;
      e2.array[i * 4] = el.argp;
      e2.array[i * 4 + 1] = el.m0;
    }
    e1.needsUpdate = true;
    e2.needsUpdate = true;
    epochMs = simMs;
  }

  function objectScenePos(i, out) {
    eciPosition(objects[i].el, tSec(), tmpP);
    return sceneFromEci(tmpP, out || tmpS);
  }

  const visArr = cloud.geometry.attributes.iVis.array;
  function pick(px, py, w, h) {
    const proj = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix, camera.matrixWorldInverse);
    let best = -1, bestD = 14 * 14;
    const camPos = camera.position;
    for (let i = 0; i < objects.length; i++) {
      if (visArr[i] < 0.5) continue;
      objectScenePos(i, tmpS);
      v3.set(tmpS[0], tmpS[1], tmpS[2]);
      const toObj = v3.clone().sub(camPos);
      const dist = toObj.length();
      const tca = -camPos.dot(toObj) / (dist * dist);
      if (tca > 0 && tca < 1) {
        const closest = camPos.clone().addScaledVector(toObj, tca).length();
        if (closest < R * 0.995) continue;
      }
      v3.applyMatrix4(proj);
      if (v3.z > 1) continue;
      const sx = (v3.x * 0.5 + 0.5) * w;
      const sy = (-v3.y * 0.5 + 0.5) * h;
      const d = (sx - px) * (sx - px) + (sy - py) * (sy - py);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  function project(i, w, h) {
    objectScenePos(i, tmpS);
    v3.set(tmpS[0], tmpS[1], tmpS[2]);
    const camPos = camera.position;
    const toObj = v3.clone().sub(camPos);
    const dist = toObj.length();
    const tca = -camPos.dot(toObj) / (dist * dist);
    let occluded = false;
    if (tca > 0 && tca < 1) {
      occluded = camPos.clone().addScaledVector(toObj, tca).length() < R * 0.995;
    }
    const inFront = v3.clone().applyMatrix4(camera.matrixWorldInverse).z < 0;
    v3.project(camera);
    return {
      x: (v3.x * 0.5 + 0.5) * w,
      y: (-v3.y * 0.5 + 0.5) * h,
      visible: !occluded && inFront,
    };
  }

  function select(i) {
    selected = i;
    if (i >= 0) {
      fillOrbitLine(orbitLine, objects[i].el, tSec());
      marker.visible = true;
    } else {
      orbitLine.visible = false;
      marker.visible = false;
    }
  }

  let flyAnim = null;
  function flyTo(i, dist) {
    if (i < 0) return;
    objectScenePos(i, tmpS);
    v3.set(tmpS[0], tmpS[1], tmpS[2]).normalize();
    const d = dist || Math.max(camera.position.length(), 13);
    flyAnim = { from: camera.position.clone(), to: v3.clone().multiplyScalar(d), t: 0 };
  }

  function sensorScreenPos(idx, w, h) {
    const site = sensorSites[idx];
    const p = latLonToScene(site.lat, site.lon, R_MEAN * 1.002);
    v3.set(p[0], p[1], p[2]).applyAxisAngle(yAxis, earthGroup.rotation.y);
    const camPos = camera.position;
    const toObj = v3.clone().sub(camPos);
    const tca = -camPos.dot(toObj) / toObj.lengthSq();
    let occluded = false;
    if (tca > 0 && tca < 1) {
      occluded = camPos.clone().addScaledVector(toObj, tca).length() < R * 0.995;
    }
    const inFront = v3.clone().applyMatrix4(camera.matrixWorldInverse).z < 0;
    v3.project(camera);
    return {
      x: (v3.x * 0.5 + 0.5) * w,
      y: (-v3.y * 0.5 + 0.5) * h,
      visible: !occluded && inFront,
    };
  }

  let lastOrbitRefresh = 0;
  function setTime(ms) {
    simMs = ms;
    if (Math.abs(tSec()) > 3 * 86400) rebase();
    const t = tSec();
    cloud.material.uniforms.uTime.value = t;
    const g = gmst(simMs);
    if (followEarth) {
      // keep the camera fixed over the ground: rotate it with the planet
      const dg = g - lastGmst;
      if (dg !== 0 && !flyAnim) camera.position.applyAxisAngle(yAxis, dg);
    }
    lastGmst = g;
    earthGroup.rotation.y = g;
    clouds.rotation.y = g + (simMs / 1000) * 0.0000105; // slow eastward drift
    const s = sunEci(simMs);
    earth.material.uniforms.uSunDir.value.set(s[0], s[2], -s[1]);
    cloud.material.uniforms.uSunDir.value.set(s[0], s[2], -s[1]);
    if (selected >= 0 && Math.abs(simMs - lastOrbitRefresh) > 60000) {
      fillOrbitLine(orbitLine, objects[selected].el, t);
      lastOrbitRefresh = simMs;
    }
  }

  let lastFrame = performance.now();
  function render() {
    const nowF = performance.now();
    const dt = Math.min((nowF - lastFrame) / 1000, 0.25);
    lastFrame = nowF;

    if (flyAnim) {
      flyAnim.t += dt / 0.9;
      const k = flyAnim.t >= 1 ? 1 : 1 - Math.pow(1 - flyAnim.t, 3);
      camera.position.lerpVectors(flyAnim.from, flyAnim.to, k);
      if (flyAnim.t >= 1) flyAnim = null;
    }
    controls.update();

    if (selected >= 0) {
      objectScenePos(selected, tmpS);
      marker.position.set(tmpS[0], tmpS[1], tmpS[2]);
      const d = marker.position.distanceTo(camera.position);
      marker.scale.setScalar(d * 0.02);
    }

    const fl = cloud.material.uniforms.uFlash.value;
    if (fl > 0.002) cloud.material.uniforms.uFlash.value = fl * Math.exp(-dt * 3.2);
    else if (fl !== 0) cloud.material.uniforms.uFlash.value = 0;

    renderer.render(scene, camera);
  }

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  return {
    renderer, scene, camera, controls, cloud, objects,
    setTime, render, resize, pick, project, select, flyTo, sensorScreenPos,
    get selected() { return selected; },
    get simMs() { return simMs; },
    tOf(ms) { return (ms - epochMs) / 1000; },
    setVis(updateFn) {
      const arr = cloud.geometry.attributes.iVis.array;
      updateFn(arr);
      cloud.geometry.attributes.iVis.needsUpdate = true;
    },
    /* Per-object colors for the view modes; fn(i) -> [r,g,b] in 0..1 */
    setColors(fn) {
      const arr = cloud.geometry.attributes.iColor.array;
      for (let i = 0; i < objects.length; i++) {
        const c = fn(i);
        arr[i * 3] = c[0]; arr[i * 3 + 1] = c[1]; arr[i * 3 + 2] = c[2];
      }
      cloud.geometry.attributes.iColor.needsUpdate = true;
    },
    toggles: {
      beams: (v) => { sensors.beams.visible = v; },
      instruments: (v) => { sensors.group.visible = v; },
      follow: (v) => { followEarth = v; },
    },
    setReveal(v) { cloud.material.uniforms.uReveal.value = v; },
    get reveal() { return cloud.material.uniforms.uReveal.value; },
    pulse() { cloud.material.uniforms.uFlash.value = 1; },
  };
}
