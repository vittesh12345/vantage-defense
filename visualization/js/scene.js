/* The 3D scene: a stylized dark earth in an inertial frame, a GPU-propagated
   point cloud for the whole catalog, orbit lines for the selection, and the
   ground sensor network. 1 scene unit = 1000 km; earth axis = +Y; the earth
   group carries the GMST rotation while every orbiting object lives in ECI. */

import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import {
  gmst, sunEci, eciPosition, sceneFromEci, latLonToScene, eciToLatLon,
  KM_TO_UNITS, R_MEAN, TAU,
} from './orbits.js';

const R = R_MEAN * KM_TO_UNITS; // globe radius in units (~6.371)

export const PALETTE = {
  payload: 0x35d6e8,   // cyan — payloads
  rocket: 0xffca16,    // amber — rocket bodies
  debris: 0x8d97a5,    // gray — debris
  unknown: 0x8f6fe8,   // violet — uncorrelated
  select: 0xffffff,
  orbit: 0x35d6e8,
  orbitSecondary: 0xff6b5f,
};

/* ------------------------------------------------------------------ */
/* Land texture drawn from TopoJSON                                    */
/* ------------------------------------------------------------------ */
function buildLandTexture(topology) {
  const w = 4096, h = 2048;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#0b1929';
  ctx.fillRect(0, 0, w, h);

  const land = window.topojson.feature(topology, topology.objects.land);
  const X = (lon) => (lon + 180) / 360 * w;
  const Y = (lat) => (90 - lat) / 180 * h;

  const drawRings = (polys) => {
    ctx.beginPath();
    for (const poly of polys) {
      for (const ring of poly) {
        ring.forEach(([lon, lat], i) => {
          const x = X(lon), y = Y(lat);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
      }
    }
  };

  const polys = [];
  for (const f of land.features) {
    if (f.geometry.type === 'Polygon') polys.push(f.geometry.coordinates);
    else for (const p of f.geometry.coordinates) polys.push(p);
  }
  drawRings(polys);
  ctx.fillStyle = '#25425f';
  ctx.fill('evenodd');
  ctx.strokeStyle = 'rgba(130, 190, 222, 0.55)';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ------------------------------------------------------------------ */
/* Earth                                                               */
/* ------------------------------------------------------------------ */
function buildEarth(tex) {
  const geo = new THREE.SphereGeometry(R, 96, 64);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: tex },
      uSunDir: { value: new THREE.Vector3(1, 0, 0) },
      uNight: { value: 1.0 }, // 1 = day/night shading on
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
      uniform float uNight;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 base = texture2D(uMap, vUv).rgb;
        float dn = dot(vNormalW, uSunDir);
        float day = smoothstep(-0.18, 0.25, dn);
        float shade = mix(1.0, mix(0.72, 1.15, day), uNight);
        vec3 col = base * shade;
        // soft rim so the limb never goes dead black
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float rim = pow(1.0 - clamp(dot(viewDir, vNormalW), 0.0, 1.0), 2.6);
        col += vec3(0.10, 0.24, 0.34) * rim * 0.85;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  return new THREE.Mesh(geo, mat);
}

function buildAtmosphere() {
  const geo = new THREE.SphereGeometry(R * 1.045, 64, 48);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(0x3b8fc9) } },
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
        float f = pow(1.0 - abs(dot(viewDir, vNormalW)), 3.2);
        gl_FragColor = vec4(uColor, f * 1.1);
      }`,
  });
  return new THREE.Mesh(geo, mat);
}

function buildGraticule() {
  const pts = [];
  const seg = 90;
  for (let lat = -75; lat <= 75; lat += 15) {
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * 360, b = ((i + 1) / seg) * 360;
      pts.push(...latLonToScene(lat, a, R_MEAN * 1.001), ...latLonToScene(lat, b, R_MEAN * 1.001));
    }
  }
  for (let lon = 0; lon < 360; lon += 15) {
    for (let i = 0; i < seg; i++) {
      const a = -90 + (i / seg) * 180, b = -90 + ((i + 1) / seg) * 180;
      pts.push(...latLonToScene(a, lon, R_MEAN * 1.001), ...latLonToScene(b, lon, R_MEAN * 1.001));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0x3d4552, transparent: true, opacity: 0.26, depthWrite: false,
  });
  return new THREE.LineSegments(geo, mat);
}

function buildStars() {
  const n = 1600;
  const pos = new Float32Array(n * 3);
  const sz = new Float32Array(n);
  let s = 421;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1, th = rnd() * TAU;
    const r = 380;
    const q = Math.sqrt(1 - u * u);
    pos[i * 3] = r * q * Math.cos(th);
    pos[i * 3 + 1] = r * u;
    pos[i * 3 + 2] = r * q * Math.sin(th);
    sz[i] = 0.6 + rnd() * rnd() * 1.6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uPr: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSize;
      uniform float uPr;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPr;
      }`,
    fragmentShader: /* glsl */`
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.12, length(d));
        gl_FragColor = vec4(vec3(0.75, 0.8, 0.86), a * 0.5);
      }`,
  });
  return new THREE.Points(geo, mat);
}

/* ------------------------------------------------------------------ */
/* Catalog point cloud — orbits solved in the vertex shader            */
/* ------------------------------------------------------------------ */
function buildCloud(objects) {
  const n = objects.length;
  const e1 = new Float32Array(n * 4); // a(km), e, inc, raan
  const e2 = new Float32Array(n * 4); // argp, m0, n(rad/s), raanDot
  const e3 = new Float32Array(n * 2); // argpDot, kind
  const vis = new Float32Array(n).fill(1);
  for (let i = 0; i < n; i++) {
    const el = objects[i].el;
    e1[i * 4] = el.a; e1[i * 4 + 1] = el.e; e1[i * 4 + 2] = el.inc; e1[i * 4 + 3] = el.raan;
    e2[i * 4] = el.argp; e2[i * 4 + 1] = el.m0; e2[i * 4 + 2] = el.n; e2[i * 4 + 3] = el.raanDot;
    e3[i * 2] = el.argpDot; e3[i * 2 + 1] = objects[i].kind;
  }
  const geo = new THREE.BufferGeometry();
  // Position attribute is required by three's bounding logic; unused in shader.
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aE1', new THREE.BufferAttribute(e1, 4));
  geo.setAttribute('aE2', new THREE.BufferAttribute(e2, 4));
  geo.setAttribute('aE3', new THREE.BufferAttribute(e3, 2));
  geo.setAttribute('aVis', new THREE.BufferAttribute(vis, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uPr: { value: 1 },
      uDim: { value: 1 },
      uSize: { value: 1 },
      uPalette: { value: [
        new THREE.Color(PALETTE.payload),
        new THREE.Color(PALETTE.rocket),
        new THREE.Color(PALETTE.debris),
        new THREE.Color(PALETTE.unknown),
      ] },
    },
    vertexShader: /* glsl */`
      attribute vec4 aE1; // a(km), e, inc, raan
      attribute vec4 aE2; // argp, m0, n, raanDot
      attribute vec2 aE3; // argpDot, kind
      attribute float aVis;
      uniform float uTime;
      uniform float uPr;
      uniform float uSize;
      varying float vKind;
      varying float vVis;
      const float KM = 0.001;
      void main() {
        vKind = aE3.y;
        vVis = aVis;
        float a = aE1.x, e = aE1.y, inc = aE1.z;
        float raan = aE1.w + aE2.w * uTime;
        float argp = aE2.x + aE3.x * uTime;
        float M = aE2.y + aE2.z * uTime;
        // Kepler: Newton iterations (LEO e is small; HEO converges in 6)
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
        // ECI km -> scene units (x, z, -y) * KM
        vec3 p = vec3(
          (cO * x1 - sO * ci * y1) * KM,
          (si * y1) * KM,
          -(sO * x1 + cO * ci * y1) * KM
        );
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float base = vKind < 0.5 ? 2.9 : (vKind < 1.5 ? 3.1 : (vKind < 2.5 ? 2.0 : 2.5));
        float att = clamp(pow(16.0 / max(length(mv.xyz), 0.05), 0.42), 0.62, 3.4);
        gl_PointSize = base * att * uPr * uSize * (vVis > 0.5 ? 1.0 : 0.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uPalette[4];
      uniform float uDim;
      varying float vKind;
      varying float vVis;
      void main() {
        if (vVis < 0.5) discard;
        vec2 d = gl_PointCoord - 0.5;
        float r = length(d);
        if (r > 0.5) discard;
        float a = smoothstep(0.5, 0.18, r);
        vec3 col = uPalette[int(vKind + 0.5)];
        float alpha = (vKind < 2.5 && vKind > 1.5) ? 0.62 : 0.88; // debris dimmer
        gl_FragColor = vec4(col, a * alpha * uDim);
      }`,
  });
  return new THREE.Points(geo, mat);
}

/* ------------------------------------------------------------------ */
/* Orbit line + selection markers                                      */
/* ------------------------------------------------------------------ */
function makeOrbitLine(color) {
  const N = 384;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((N + 1) * 3), 3));
  const mat = new THREE.LineBasicMaterial({
    color, transparent: true, opacity: 0.85, depthWrite: false,
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

/* Ground track: the selection's sub-satellite path, drawn on the rotating
   earth (so it lives in the earth-fixed group, not ECI). */
function makeGroundTrack() {
  const N = 288;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((N + 1) * 3), 3));
  const mat = new THREE.LineBasicMaterial({
    color: PALETTE.orbit, transparent: true, opacity: 0.45, depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  line.visible = false;
  line.frustumCulled = false;
  line.userData.N = N;
  return line;
}

function fillGroundTrack(line, el, t, simMs) {
  const N = line.userData.N;
  const arr = line.geometry.attributes.position.array;
  const period = TAU / el.n;
  const p = [0, 0, 0], s = [0, 0, 0];
  for (let i = 0; i <= N; i++) {
    const dtau = (i / N - 0.2) * period; // a bit of past, most of it ahead
    eciPosition(el, t + dtau, p);
    const g = eciToLatLon(p, simMs + dtau * 1000);
    latLonToScene(g.lat, g.lon, R_MEAN * 1.0025, s);
    arr[i * 3] = s[0]; arr[i * 3 + 1] = s[1]; arr[i * 3 + 2] = s[2];
  }
  line.geometry.attributes.position.needsUpdate = true;
}

function ringTexture(hollow) {
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = s; cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - 12, 0, TAU);
  ctx.stroke();
  if (!hollow) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, 12, 0, TAU);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  return tex;
}

function makeMarker(color) {
  const mat = new THREE.SpriteMaterial({
    map: ringTexture(true), color, transparent: true,
    depthTest: false, depthWrite: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.visible = false;
  sp.renderOrder = 10;
  return sp;
}

/* ------------------------------------------------------------------ */
/* Sensor network                                                      */
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
  ctx.strokeStyle = 'rgba(53,214,232,0.9)';
  ctx.lineWidth = 5;
  ctx.strokeRect(-w / 2, -w / 2, w, w);
  return new THREE.CanvasTexture(cv);
}

function buildSensors(sites) {
  const group = new THREE.Group();
  const dTex = diamondTexture();
  const pulses = [];
  const markers = [];
  const cones = new THREE.Group();
  for (const site of sites) {
    const pos = latLonToScene(site.lat, site.lon, R_MEAN * 1.004);
    const v = new THREE.Vector3(...pos);
    const marker = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dTex, transparent: true, depthWrite: false,
    }));
    marker.position.copy(v);
    marker.scale.setScalar(0.2);
    group.add(marker);
    markers.push(marker);

    // pulse ring lying on the surface
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.53, 48),
      new THREE.MeshBasicMaterial({
        color: 0x35d6e8, transparent: true, opacity: 0.5,
        side: THREE.DoubleSide, depthWrite: false,
      })
    );
    ring.position.copy(v);
    ring.lookAt(v.clone().multiplyScalar(2));
    ring.userData.phase = Math.random();
    group.add(ring);
    pulses.push(ring);

    // coverage cone: apex at site, opening outward
    const h = 1.15; // ~1150 km
    const ang = (site.fov || 60) * Math.PI / 180;
    const rad = Math.tan(ang / 2) * h;
    const cg = new THREE.ConeGeometry(rad, h, 40, 1, true);
    cg.translate(0, -h / 2, 0);       // apex at origin, opens toward -Y
    cg.rotateX(Math.PI);              // opens toward +Y
    const cone = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({
      color: 0x35d6e8, transparent: true, opacity: 0.055,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    cone.position.copy(v);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
    cones.add(cone);
  }
  group.add(cones);
  return { group, pulses, markers, cones, sites };
}

/* ------------------------------------------------------------------ */
/* Scene assembly                                                      */
/* ------------------------------------------------------------------ */
export function createViz({ canvas, topology, objects, sensorSites }) {
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
  const tex = buildLandTexture(topology);
  const earth = buildEarth(tex);
  earthGroup.add(earth);
  const graticule = buildGraticule();
  earthGroup.add(graticule);
  const sensors = buildSensors(sensorSites);
  earthGroup.add(sensors.group);
  const groundTrack = makeGroundTrack();
  earthGroup.add(groundTrack);
  scene.add(earthGroup);

  // Ground-view horizon: a faint ring in the local tangent plane of a site.
  const horizon = new THREE.Mesh(
    new THREE.RingGeometry(2.55, 2.585, 96),
    new THREE.MeshBasicMaterial({
      color: 0x8fb8c9, transparent: true, opacity: 0.35,
      side: THREE.DoubleSide, depthWrite: false, depthTest: false,
    })
  );
  horizon.visible = false;
  horizon.renderOrder = 5;
  earthGroup.add(horizon);

  const atmosphere = buildAtmosphere();
  scene.add(atmosphere);
  const stars = buildStars();
  scene.add(stars);

  const cloud = buildCloud(objects);
  cloud.material.uniforms.uPr.value = pr;
  stars.material.uniforms.uPr.value = pr;
  scene.add(cloud);

  const orbitLine = makeOrbitLine(PALETTE.orbit);
  const orbitLine2 = makeOrbitLine(PALETTE.orbitSecondary);
  scene.add(orbitLine, orbitLine2);
  const marker = makeMarker(PALETTE.select);
  const marker2 = makeMarker(PALETTE.orbitSecondary);
  scene.add(marker, marker2);

  let epochMs = Date.now();
  let simMs = epochMs;
  let selected = -1, secondary = -1;
  let tracking = false;
  const tmpP = [0, 0, 0], tmpS = [0, 0, 0];
  const v3 = new THREE.Vector3();

  function tSec() { return (simMs - epochMs) / 1000; }

  /* Rebase element epochs so the shader's fp32 time stays small. */
  function rebase() {
    const dt = tSec();
    const e1 = cloud.geometry.attributes.aE1;
    const e2 = cloud.geometry.attributes.aE2;
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

  /* Screen-space pick against the filtered cloud. */
  const visArr = cloud.geometry.attributes.aVis.array;
  function pick(px, py, w, h) {
    const proj = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix, camera.matrixWorldInverse);
    let best = -1, bestD = 14 * 14;
    const camPos = camera.position;
    for (let i = 0; i < objects.length; i++) {
      if (visArr[i] < 0.5) continue;
      objectScenePos(i, tmpS);
      v3.set(tmpS[0], tmpS[1], tmpS[2]);
      // occlusion by the globe
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

  let groundTrackOn = true;
  function select(i, sec = -1) {
    selected = i; secondary = sec;
    if (i >= 0) {
      fillOrbitLine(orbitLine, objects[i].el, tSec());
      fillGroundTrack(groundTrack, objects[i].el, tSec(), simMs);
      groundTrack.visible = groundTrackOn;
      marker.visible = true;
      cloud.material.uniforms.uDim.value = 0.32;
    } else {
      orbitLine.visible = false;
      groundTrack.visible = false;
      marker.visible = false;
      tracking = false;
      cloud.material.uniforms.uDim.value = 1;
    }
    if (sec >= 0) {
      fillOrbitLine(orbitLine2, objects[sec].el, tSec());
      marker2.visible = true;
    } else {
      orbitLine2.visible = false;
      marker2.visible = false;
    }
  }

  /* ---------------- ground view ---------------- */
  let atmosphereOn = true;
  let groundView = -1; // sensor site index, -1 = orbital view
  let gvYaw = 0, gvPitch = 0.5; // azimuth from north (eastward), elevation
  const gvUp = new THREE.Vector3(), gvNorth = new THREE.Vector3(), gvEast = new THREE.Vector3();
  const worldY = new THREE.Vector3(0, 1, 0);

  function siteWorldPos(idx, rScale, out) {
    const s = sensorSites[idx];
    const p = latLonToScene(s.lat, s.lon, R_MEAN * rScale);
    out.set(p[0], p[1], p[2]);
    out.applyAxisAngle(worldY, earthGroup.rotation.y);
    return out;
  }

  function enterGroundView(idx) {
    groundView = idx;
    tracking = false;
    flyAnim = null;
    controls.enabled = false;
    // From inside the shell the additive atmosphere would wash out the sky,
    // and the site's own marker sprite would fill the frame at point-blank.
    atmosphere.visible = false;
    sensors.markers.forEach((m, k) => { m.visible = k !== idx; });
    sensors.pulses.forEach((p, k) => { p.visible = k !== idx; });
    sensors.cones.children.forEach((c, k) => { c.visible = k !== idx; });
    camera.near = 0.0008;
    camera.updateProjectionMatrix();
    gvYaw = 0; gvPitch = 0.5;
    const s = sensorSites[idx];
    const p = latLonToScene(s.lat, s.lon, R_MEAN * 1.0006);
    horizon.position.set(p[0], p[1], p[2]);
    horizon.lookAt(new THREE.Vector3(p[0], p[1], p[2]).multiplyScalar(2));
    horizon.visible = true;
  }

  function exitGroundView() {
    groundView = -1;
    horizon.visible = false;
    atmosphere.visible = atmosphereOn;
    sensors.markers.forEach((m) => { m.visible = true; });
    sensors.pulses.forEach((p) => { p.visible = true; });
    sensors.cones.children.forEach((c) => { c.visible = true; });
    controls.enabled = true;
    camera.near = 0.05;
    camera.fov = 42;
    camera.updateProjectionMatrix();
    camera.position.set(11.5, 6.4, 22.5);
    camera.up.set(0, 1, 0);
  }

  // Look-around and FOV zoom, active only on the ground.
  let gvDrag = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (groundView >= 0) gvDrag = [e.clientX, e.clientY];
  });
  window.addEventListener('pointerup', () => { gvDrag = null; });
  canvas.addEventListener('pointermove', (e) => {
    if (groundView < 0 || !gvDrag) return;
    gvYaw -= (e.clientX - gvDrag[0]) * 0.0035 * (camera.fov / 42);
    gvPitch += (e.clientY - gvDrag[1]) * 0.0035 * (camera.fov / 42);
    gvPitch = Math.max(-0.12, Math.min(1.55, gvPitch));
    gvDrag = [e.clientX, e.clientY];
  });
  canvas.addEventListener('wheel', (e) => {
    if (groundView < 0) return;
    e.preventDefault();
    camera.fov = Math.max(18, Math.min(70, camera.fov + e.deltaY * 0.03));
    camera.updateProjectionMatrix();
  }, { passive: false });

  /* Screen positions of the cardinal points on the ground-view horizon. */
  function cardinalScreenPos(w, h) {
    if (groundView < 0) return null;
    siteWorldPos(groundView, 1.0006, v3);
    gvUp.copy(v3).normalize();
    gvNorth.copy(worldY).addScaledVector(gvUp, -worldY.dot(gvUp)).normalize();
    gvEast.crossVectors(gvNorth, gvUp);
    const out = [];
    const dirs = [
      ['N', gvNorth.clone()], ['E', gvEast.clone()],
      ['S', gvNorth.clone().negate()], ['W', gvEast.clone().negate()],
    ];
    for (const [label, d] of dirs) {
      const p = v3.clone().addScaledVector(d, 2.56);
      const inFront = p.clone().applyMatrix4(camera.matrixWorldInverse).z < 0;
      const q = p.project(camera);
      out.push({ label, x: (q.x * 0.5 + 0.5) * w, y: (-q.y * 0.5 + 0.5) * h, visible: inFront });
    }
    return out;
  }

  function flyTo(i, dist) {
    if (i < 0 || groundView >= 0) return;
    objectScenePos(i, tmpS);
    v3.set(tmpS[0], tmpS[1], tmpS[2]).normalize();
    const d = dist || Math.max(camera.position.length(), 13);
    flyAnim = {
      from: camera.position.clone(),
      to: v3.clone().multiplyScalar(d),
      t: 0,
    };
  }
  let flyAnim = null;

  /* Sensor site labels are HTML; the caller positions them via this. */
  function sensorScreenPos(idx, w, h) {
    const site = sensorSites[idx];
    const p = latLonToScene(site.lat, site.lon, R_MEAN * 1.004);
    v3.set(p[0], p[1], p[2]).applyMatrix4(earthGroup.matrixWorld);
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
    earthGroup.rotation.y = gmst(simMs);
    const s = sunEci(simMs);
    earth.material.uniforms.uSunDir.value.set(s[0], s[2], -s[1]);
    // Orbit lines drift with J2; refresh occasionally and when scrubbing.
    if (selected >= 0 && Math.abs(simMs - lastOrbitRefresh) > 60000) {
      fillOrbitLine(orbitLine, objects[selected].el, t);
      if (groundTrackOn) fillGroundTrack(groundTrack, objects[selected].el, t, simMs);
      if (secondary >= 0) fillOrbitLine(orbitLine2, objects[secondary].el, t);
      lastOrbitRefresh = simMs;
    }
  }

  let lastFrame = performance.now();
  function render() {
    const nowF = performance.now();
    const dt = Math.min((nowF - lastFrame) / 1000, 0.25);
    lastFrame = nowF;

    if (groundView >= 0) {
      // Stand at the site, which rotates with the earth; re-derive the local
      // ENU frame every frame so the view co-rotates with the ground.
      earthGroup.rotation.y = gmst(simMs);
      siteWorldPos(groundView, 1.0006, camera.position);
      gvUp.copy(camera.position).normalize();
      gvNorth.copy(worldY).addScaledVector(gvUp, -worldY.dot(gvUp)).normalize();
      gvEast.crossVectors(gvNorth, gvUp);
      const cp = Math.cos(gvPitch), sp = Math.sin(gvPitch);
      const cy = Math.cos(gvYaw), sy = Math.sin(gvYaw);
      v3.copy(gvNorth).multiplyScalar(cp * cy)
        .addScaledVector(gvEast, cp * sy)
        .addScaledVector(gvUp, sp);
      camera.up.copy(gvUp);
      camera.lookAt(v3.add(camera.position));
    } else if (flyAnim) {
      flyAnim.t += dt / 0.9;
      const k = flyAnim.t >= 1 ? 1 : 1 - Math.pow(1 - flyAnim.t, 3);
      camera.position.lerpVectors(flyAnim.from, flyAnim.to, k);
      if (flyAnim.t >= 1) flyAnim = null;
    } else if (tracking && selected >= 0) {
      objectScenePos(selected, tmpS);
      v3.set(tmpS[0], tmpS[1], tmpS[2]).normalize().multiplyScalar(camera.position.length());
      camera.position.lerp(v3, Math.min(1, dt * 3.2));
    }
    if (groundView < 0) controls.update();

    if (selected >= 0) {
      objectScenePos(selected, tmpS);
      marker.position.set(tmpS[0], tmpS[1], tmpS[2]);
      const d = marker.position.distanceTo(camera.position);
      marker.scale.setScalar(d * 0.016);
    }
    if (secondary >= 0) {
      objectScenePos(secondary, tmpS);
      marker2.position.set(tmpS[0], tmpS[1], tmpS[2]);
      const d = marker2.position.distanceTo(camera.position);
      marker2.scale.setScalar(d * 0.013);
    }

    for (const ring of sensors.pulses) {
      ring.userData.phase = (ring.userData.phase + dt * 0.45) % 1;
      const ph = ring.userData.phase;
      ring.scale.setScalar(0.12 + ph * 0.85);
      ring.material.opacity = 0.5 * (1 - ph);
    }

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
    get secondary() { return secondary; },
    get simMs() { return simMs; },
    tOf(ms) { return (ms - epochMs) / 1000; },
    set tracking(v) { tracking = v; },
    get tracking() { return tracking; },
    enterGroundView, exitGroundView, cardinalScreenPos,
    get groundView() { return groundView; },
    setVis(updateFn) {
      const arr = cloud.geometry.attributes.aVis.array;
      updateFn(arr);
      cloud.geometry.attributes.aVis.needsUpdate = true;
    },
    toggles: {
      groundtrack: (v) => {
        groundTrackOn = v;
        groundTrack.visible = v && selected >= 0;
      },
      graticule: (v) => { graticule.visible = v; },
      atmosphere: (v) => { atmosphereOn = v; if (groundView < 0) atmosphere.visible = v; },
      stars: (v) => { stars.visible = v; },
      sensors: (v) => { sensors.group.visible = v; },
      coverage: (v) => { sensors.cones.visible = v; },
      terminator: (v) => { earth.material.uniforms.uNight.value = v ? 1 : 0; },
    },
    setPointSize(v) { cloud.material.uniforms.uSize.value = v; },
  };
}
