// js/world/world-map.js
import * as THREE from 'three';
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { MATS } from '../boats/boat-base.js';
import { buildCityCulled, registerCullGroup } from './streaming.js';
import { buildPeruibe } from './cities/peruibe.js';
import { buildItanhaem } from './cities/itanhaem.js';
import { buildMongagua } from './cities/mongagua.js';
import { buildPraiaGrande } from './cities/praiagrande.js';
import { buildSantos } from './cities/santos.js';
import { buildGuaruja } from './cities/guaruja.js';

export const tide = { level: 0 };
export function updateTide(dt) {
  const h = CONFIG.time.hour;
  tide.level = 0.9 * Math.sin((h / 12.42) * Math.PI * 2) + 0.3 * Math.sin((h / 6.21) * Math.PI * 2 + 1.7);
}
export function tideM() { return tide.level; }
export function isHighTide() { return tide.level > 0.35; }

export const SPAWN = { x: -780, z: 520 };

// ---- COSTA ORIGINAL (com mais pontos interpolados para suavizar) ----
const COAST_RAW = [
  [-1600, 650], [-1304, 527], [-1082, 436], [-860, 344], [-638, 252], [-379, 145],
  [-194, 68], [65, -39], [324, -147], [620, -269], [879, -376], [1175, -499],
  [1434, -606], [1619, -683], [1730, -729], [1841, -775]
];

// ---- INTERPOLAÇÃO CATMULL-ROM (suaviza a costa) ----
function catmullRom(points, segments = 4) {
  const pts = points.map(p => ({ x: p[0], z: p[1] }));
  const result = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let t = 0; t < 1; t += 1 / segments) {
      const t2 = t * t, t3 = t2 * t;
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      const z = 0.5 * (
        (2 * p1.z) +
        (-p0.z + p2.z) * t +
        (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
        (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3
      );
      result.push([x, z]);
    }
  }
  result.push([pts[pts.length - 1].x, pts[pts.length - 1].z]);
  return result;
}

// Gerar costa suavizada com 8 segmentos entre cada par de pontos
export const COAST = catmullRom(COAST_RAW, 8);
// Ajustar SD e CC para a costa suavizada (usando os pontos originais para manter referência)
export const SD = { x: 0.40, z: 0.92 };
export const CC = { x: 0.925, z: -0.383 };
export const RIVERS = [
  { name: 'rio Barra do Una', depth: 1.5, w: 26, pts: [[-1620, 660], [-1660, 620], [-1690, 570], [-1670, 520], [-1620, 490], [-1560, 490], [-1510, 520]] },
  { name: 'bifurcação Guarau (maré alta)', depth: 0.5, w: 14, pts: [[-1510, 520], [-1450, 510], [-1390, 500], [-1340, 490]] },
  { name: 'rio Guarau', depth: 1.4, w: 20, pts: [[-1304, 527], [-1330, 500], [-1340, 470]] },
  { name: 'portinho (mercado do peixe)', depth: 1.0, w: 10, pts: [[-870, 350], [-880, 335], [-890, 325]] },
  { name: 'rio Itanhaém', depth: 2.0, w: 26, pts: [[65, -39], [40, -70], [10, -100]] },
  { name: 'rio Mongaguá', depth: 1.6, w: 22, pts: [[620, -269], [600, -300], [580, -330]] }
];
export const MANGUE = [
  { x: -1590, z: 560, r: 55, depth: 1.2 },
  { x: -1650, z: 610, r: 70, depth: 1.0 },
  { x: -1500, z: 470, r: 45, depth: 1.0 }
];

export const ISLANDS = [
  { name: 'Ilha do Costão',          x: -600,  z: 650,  r: 50, h: 18, c: 0x2d4a33, type: 'forest' },
  { name: 'Ilha da Queimada Grande', x: -100,  z: 900,  r: 85, h: 38, c: 0x22301f, type: 'forest' },
  { name: 'Laje da Conceição',       x: 400,   z: 500,  r: 20, h: 3.5, c: 0x3a3f44, type: 'rock' },
  { name: 'Laje de Santos',          x: 2100,  z: -150, r: 28, h: 4,   c: 0x3a3f44, type: 'rock' },
  { name: 'Ilha do Guarujá',         x: 2050,  z: -580, r: 60, h: 25,  c: 0x2d4a33, type: 'forest' },
  { name: 'Alcatrazes',              x: 2800,  z: 400,  r: 75, h: 28,  c: 0x2d4a33, type: 'rock' },
  { name: 'ilhote Guarau A',         x: -1200, z: 720,  r: 16, h: 6,   c: 0x2d4a33, type: 'rock' },
  { name: 'ilhote Guarau B',         x: -1150, z: 760,  r: 13, h: 5,   c: 0x2d4a33, type: 'rock' },
  { name: 'Refúgio',                 x: -1400, z: 850,  r: 40, h: 15,  c: 0x2d4a33, type: 'forest' }
];

export const LANDMARKS = {
  morroItatins: [-1130, 326], pedraSerpente: [-1106, 381], praiaCostao: [-971, 390],
  portinho: [-870, 350], passarelaItanhaem: [67, -34], ponteMadeira: [-1320, 495],
  rotatoriaMangue: [-1590, 560], lagoasReserva: [-419, 53], serraItatis: [-840, 330]
};
export const GATES = [
  { name: 'ponte de madeira', x: -1320, z: 495, r: 6, open: (cb, spec) => spec.airDraft <= 2.2 }
];
export const BOAT_PHYS = {
  trawler: { draft: 1.8, airDraft: 4.2, radius: 2.4 },
  pilot:   { draft: 0.6, airDraft: 1.6, radius: 1.2 }
};
const ZONES = [
  { id: 'port',     name: 'Portinho Peruíbe',                pvp: 'safe',    fishing: 'none',    x: -870,  z: 350,  r: 45 },
  { id: 'port',     name: 'Porto de Santos',                 pvp: 'safe',    fishing: 'none',    x: 1560,  z: -640, r: 60 },
  { id: 'protecao', name: 'Proteção Ambiental (Una)',        pvp: 'limited', fishing: 'illegal', x: -1600, z: 830,  r: 260 },
  { id: 'protecao', name: 'Proteção Ambiental (Alcatrazes)', pvp: 'limited', fishing: 'illegal', x: 2800,  z: 400,  r: 250 },
  { id: 'mystic',   name: 'Zona da Pedra',                   pvp: 'strange', fishing: 'legal',   x: -1106, z: 381,  r: 150 },
  { id: 'mystic',   name: 'Águas do Costão',                 pvp: 'strange', fishing: 'legal',   x: -600,  z: 650,  r: 150 },
  { id: 'marinha',  name: 'Baía da Marinha',                 pvp: 'limited', fishing: 'none',    x: 1650,  z: -600, r: 170 },
  { id: 'reserva',  name: 'Reserva Tekoa Kwaray',            pvp: 'safe',    fishing: 'none',    x: -419,  z: 53,   r: 120 },
  { id: 'pesca',    name: 'Pesca Livre',                     pvp: 'limited', fishing: 'legal',   x: -100,  z: 300,  r: 300 }
];
export const OPEN_REGION = { id: 'aberto', name: 'Mar Aberto', mood: 'aberto', swell: 1.15, chop: 1.1, tint: [0.85, 1.0, 1.15] };
const REGIONS = [
  { id: 'barrauna',   name: 'Barra do Una',            mood: 'selva',   x: -1600, z: 650, r: 260, swell: 0.80, chop: 0.80, tint: [0.55, 0.95, 0.75] },
  { id: 'guarau',     name: 'Guarau',                  mood: 'selva',   x: -1304, z: 527, r: 160, swell: 0.85, chop: 0.85, tint: [0.55, 0.95, 0.75] },
  { id: 'reserva',    name: 'Lagoas da Reserva',       mood: 'selva',   x: -419,  z: 53,  r: 140, swell: 0.90, chop: 0.90, tint: [0.60, 0.95, 0.80] },
  { id: 'peruibe',    name: 'Peruíbe',                 mood: 'caicara', x: -860,  z: 344, r: 200, swell: 1.00, chop: 1.00, tint: [1, 1, 1] },
  { id: 'pedra',      name: 'Pedra da Serpente',       mood: 'mistico', x: -1106, z: 381, r: 150, swell: 1.05, chop: 1.10, tint: [0.80, 0.90, 1.00] },
  { id: 'costao',     name: 'Ilha do Costão',          mood: 'mistico', x: -600,  z: 650, r: 150, swell: 1.10, chop: 1.10, tint: [0.70, 0.85, 0.95] },
  { id: 'itanhaem',   name: 'Itanhaém',                mood: 'caicara', x: 65,    z: -39, r: 300, swell: 1.00, chop: 1.00, tint: [1, 1, 1] },
  { id: 'mongagua',   name: 'Mongaguá',                mood: 'caicara', x: 620,   z: -269, r: 170, swell: 0.95, chop: 0.95, tint: [1, 1, 1] },
  { id: 'praiag',     name: 'Praia Grande',            mood: 'urbano',  x: 1175,  z: -499, r: 310, swell: 1.00, chop: 1.00, tint: [0.9, 0.95, 0.95] },
  { id: 'santos',     name: 'Baía de Santos',          mood: 'urbano',  x: 1619,  z: -683, r: 200, swell: 0.70, chop: 0.70, tint: [0.75, 0.85, 0.85] },
  { id: 'guaruja',    name: 'Guarujá',                 mood: 'urbano',  x: 1841,  z: -775, r: 170, swell: 0.80, chop: 0.85, tint: [0.8, 0.9, 0.9] },
  { id: 'queimada',   name: 'Ilha da Queimada Grande', mood: 'perigo',  x: -100,  z: 900, r: 300, swell: 1.35, chop: 1.25, tint: [0.40, 0.50, 0.60] },
  { id: 'lajeconc',   name: 'Laje da Conceição',       mood: 'perigo',  x: 400,   z: 500, r: 140, swell: 1.15, chop: 1.15, tint: [0.60, 0.80, 0.90] },
  { id: 'lajesantos', name: 'Laje de Santos',          mood: 'aberto',  x: 2100,  z: -150, r: 160, swell: 1.20, chop: 1.10, tint: [0.80, 1.00, 1.20] },
  { id: 'alcatrazes', name: 'Alcatrazes',              mood: 'mistico', x: 2800,  z: 400, r: 250, swell: 1.25, chop: 1.20, tint: [0.50, 0.70, 0.90] }
];
function sstep(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
export function getDiscoveryRegionAt(x, z) {
  for (const r of REGIONS) if (Math.hypot(x - r.x, z - r.z) < r.r) return r;
  return OPEN_REGION;
}
export function regionWaveAt(x, z) {
  let best = null, bw = 0;
  for (const r of REGIONS) {
    const w = 1 - sstep(r.r * 0.72, r.r, Math.hypot(x - r.x, z - r.z));
    if (w > bw) { bw = w; best = r; }
  }
  if (!best) return { swell: OPEN_REGION.swell, chop: OPEN_REGION.chop, tint: OPEN_REGION.tint };
  const o = OPEN_REGION;
  return {
    swell: o.swell + (best.swell - o.swell) * bw,
    chop: o.chop + (best.chop - o.chop) * bw,
    tint: [0, 1, 2].map(i => o.tint[i] + (best.tint[i] - o.tint[i]) * bw)
  };
}
export function getRegionAt(x, z) {
  for (const zn of ZONES) if (Math.hypot(x - zn.x, z - zn.z) < zn.r) return zn;
  return offshore(x, z) < 1400
    ? { id: 'costa', name: 'Costa', pvp: 'limited', fishing: 'legal' }
    : { id: 'aberto', name: 'Mar Aberto', pvp: 'open', fishing: 'legal' };
}

export const WORLD = { minX: -2200, minZ: -1400, sizeX: 5600, sizeZ: 2800 };
const N = 256;
const cpu = new Float32Array(N * N * 4);
let bathyTex = null, tintTex = null;

const depthCache = new Map();
function getDepth(x, z) {
  const key = Math.round(x * 10) + ',' + Math.round(z * 10);
  if (depthCache.has(key)) return depthCache.get(key);
  const d = depthAtRaw(x, z);
  depthCache.set(key, d);
  return d;
}

function distSeg(px, pz, ax, az, bx, bz) {
  const abx = bx - ax, abz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (pz - az) * abz) / (abx * abx + abz * abz || 1)));
  const qx = ax + abx * t, qz = az + abz * t;
  return { d: Math.hypot(px - qx, pz - qz), qx, qz };
}
export function offshore(x, z) {
  let best = null;
  for (let i = 0; i < COAST.length - 1; i++) {
    const r = distSeg(x, z, COAST[i][0], COAST[i][1], COAST[i + 1][0], COAST[i + 1][1]);
    if (!best || r.d < best.d) best = r;
  }
  // O sinal é dado pela projeção do vetor (x - ponto) na direção SD (mar)
  // Usamos a direção do mar para determinar se está dentro ou fora
  // Se offshore > 0, está no mar; se < 0, está em terra.
  // Para simplificar, usamos a projeção no vetor SD a partir do ponto mais próximo.
  const dx = x - best.qx, dz = z - best.qz;
  const s = dx * SD.x + dz * SD.z;
  return s;
}
function distPoly(x, z, pts) {
  let m = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const r = distSeg(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    m = Math.min(m, r.d);
  }
  return m;
}

// ============================================================
// 🌊 BATIMETRIA: usa offshore com costa suavizada (curvada)
// ============================================================
function depthAtRaw(x, z) {
  const s = offshore(x, z);
  const santosRegion = REGIONS.find(r => r.id === 'santos');
  const isSantos = santosRegion && Math.hypot(x - santosRegion.x, z - santosRegion.z) < santosRegion.r * 0.9;

  let d;
  if (s <= 0) {
    d = -2.0 + (s + 2) * 0.3;
    d = Math.max(-2.5, Math.min(0, d));
  } else {
    if (isSantos) {
      const A = 80, k = 0.022, n = 1.6;
      const sn = Math.pow(s, n);
      d = A * sn / (Math.pow(k, n) + sn);
      d = Math.max(0.5, Math.min(A, d));
    } else {
      d = 0.2 + s * 0.035 + Math.pow(s, 1.5) * 0.00003;
      d = Math.min(80, d);
    }
  }

  d += Math.sin(x * 0.008 + z * 0.006) * 0.3 + Math.cos(z * 0.01 - x * 0.005) * 0.3;

  for (const r of RIVERS) {
    const dd = distPoly(x, z, r.pts);
    if (dd < r.w) {
      const fator = 1 - (dd / r.w) * (dd / r.w) * 0.85;
      d = Math.max(d, r.depth * fator);
    }
  }
  for (const m of MANGUE) {
    const dd = Math.hypot(x - m.x, z - m.z);
    if (dd < m.r) {
      const fator = 1 - dd / m.r;
      d = Math.max(d, m.depth * fator);
    }
  }
  for (const il of ISLANDS) {
    const dd = Math.hypot(x - il.x, z - il.z);
    if (dd < il.r * 2.5) {
      const h = il.h * 0.9;
      d -= h * Math.exp(-(dd * dd) / (1.3 * il.r * il.r));
    }
  }
  return d;
}

export function depthAt(x, z) {
  return getDepth(x, z);
}
export function groundHeightAt(x, z) {
  const d = depthAt(x, z);
  return d > 0 ? -Math.min(d, 42) : Math.min(1.8, -d * 0.30);
}

(function bake() {
  const d8 = new Uint8Array(N * N * 4), t8 = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = WORLD.minX + (i / (N - 1)) * WORLD.sizeX;
    const z = WORLD.minZ + (j / (N - 1)) * WORLD.sizeZ;
    const d = depthAt(x, z);
    const damp = sstep(0.4, 5.5, d);
    const surf = Math.exp(-((d - 1.8) * (d - 1.8)) / 1.2);
    const rw = regionWaveAt(x, z);
    const k = (j * N + i) * 4;
    cpu[k] = damp; cpu[k + 1] = rw.swell; cpu[k + 2] = rw.chop; cpu[k + 3] = surf;
    d8[k] = damp * 255;
    d8[k + 1] = Math.min(255, rw.swell / 1.5 * 255);
    d8[k + 2] = Math.min(255, rw.chop / 1.5 * 255);
    d8[k + 3] = surf * 255;
    t8[k] = Math.min(255, rw.tint[0] / 1.5 * 255);
    t8[k + 1] = Math.min(255, rw.tint[1] / 1.5 * 255);
    t8[k + 2] = Math.min(255, rw.tint[2] / 1.5 * 255);
    t8[k + 3] = 255;
  }
  bathyTex = new THREE.DataTexture(d8, N, N, THREE.RGBAFormat);
  bathyTex.magFilter = bathyTex.minFilter = THREE.LinearFilter; bathyTex.needsUpdate = true;
  tintTex = new THREE.DataTexture(t8, N, N, THREE.RGBAFormat);
  tintTex.magFilter = tintTex.minFilter = THREE.LinearFilter; tintTex.needsUpdate = true;
})();
export function bathyTextures() { return { bathyTex, tintTex }; }
export function sampleBathy(x, z) {
  const i = Math.min(N - 1, Math.max(0, Math.round((x - WORLD.minX) / WORLD.sizeX * (N - 1))));
  const j = Math.min(N - 1, Math.max(0, Math.round((z - WORLD.minZ) / WORLD.sizeZ * (N - 1))));
  const k = (j * N + i) * 4;
  return { damp: cpu[k], swell: cpu[k + 1], chop: cpu[k + 2], surf: cpu[k + 3] };
}
export const COLLIDERS = [
  ...ISLANDS.map(il => ({ x: il.x, z: il.z, r: il.r * 0.75 })),
  { x: -1318, z: 493, r: 0.4 }, { x: -1323, z: 498, r: 0.4 },
  { x: 80, z: -12, r: 0.4 }, { x: 92, z: 16, r: 0.4 }, { x: 104, z: 44, r: 0.4 },
  { x: -870, z: 352, r: 0.4 }
];
export const worldFX = { cityMats: [], round: [], mountainMats: [] };

const C_MATA  = new THREE.Color(0x1e3a28);
const C_VEGET = new THREE.Color(0x3a5c38);
const C_ROCHA = new THREE.Color(0x71695c);
const C_SAND  = new THREE.Color(0xdcc79a);
const _hc = new THREE.Color();
function hillGeo(r, h, seed, segments = 20) {
  const g = new THREE.SphereGeometry(r, segments, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * 0.045 + seed) * Math.cos(z * 0.055 + seed * 1.7)
      + 0.5 * Math.sin(x * 0.10 + seed * 2.3) * Math.sin(z * 0.12 + seed * 0.7)
      + 0.25 * Math.sin(x * 0.21 + seed * 3.1) * Math.cos(z * 0.19 + seed * 1.3);
    const lift = y / r;
    p.setX(i, x * (1 + n * 0.14 * lift));
    p.setZ(i, z * (1 + n * 0.14 * lift));
    p.setY(i, y * (1 + n * 0.22 * lift));
    const hn = THREE.MathUtils.clamp(p.getY(i) / r + n * 0.18, 0, 1);
    if (hn < 0.5) _hc.copy(C_MATA).lerp(C_VEGET, hn / 0.5);
    else _hc.copy(C_VEGET).lerp(C_ROCHA, (hn - 0.5) / 0.5);
    _hc.multiplyScalar(0.88 + 0.24 * Math.abs(Math.sin(seed * 7.3 + i * 0.131)));
    colors[i * 3] = _hc.r; colors[i * 3 + 1] = _hc.g; colors[i * 3 + 2] = _hc.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.scale(1, h / r, 1);
  g.computeVertexNormals();
  return g;
}
const hillMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
worldFX.mountainMats.push(hillMat);

function buildMountainLayer(dist, n, rMin, rMax, hMin, hMax, sMin, sMax) {
  const group = new THREE.Group();
  const coastLen = COAST.length - 1;
  const startT = -0.2, endT = 1.2;
  const step = (endT - startT) / n;
  for (let i = 0; i < n; i++) {
    const t = startT + (i + 0.5) * step;
    const idx = Math.min(coastLen - 1, Math.max(0, Math.floor(t * coastLen)));
    const f = t * coastLen - idx;
    const a = COAST[idx], b = COAST[Math.min(idx + 1, coastLen)];
    const cx = a[0] + (b[0] - a[0]) * f, cz = a[1] + (b[1] - a[1]) * f;
    const off = dist + (Math.random() - 0.5) * 240;
    const px = cx - SD.x * off + (Math.random() - 0.5) * 60;
    const pz = cz - SD.z * off + (Math.random() - 0.5) * 60;
    const center = 1 - Math.abs(t - 0.5) * 1.2;
    const h = (hMin + (hMax - hMin) * Math.pow(Math.random(), 0.8)) * (0.6 + 0.4 * center);
    const r = rMin + (rMax - rMin) * Math.random();
    const m = new THREE.Mesh(hillGeo(r, h, i * 7.3 + dist * 0.01, 16), hillMat);
    m.position.set(px, -3, pz);
    m.rotation.y = Math.atan2(CC.x, CC.z) + (Math.random() - 0.5) * 0.5;
    m.scale.set(sMin + Math.random() * (sMax - sMin), 1, 1);
    group.add(m);
    if (Math.random() < 0.75) {
      const h2 = h * (0.4 + Math.random() * 0.35), r2 = r * (0.5 + Math.random() * 0.3);
      const side = Math.random() < 0.5 ? -1 : 1;
      const m2 = new THREE.Mesh(hillGeo(r2, h2, i * 3.1 + dist, 16), hillMat);
      m2.position.set(px + CC.x * side * r * 0.85, -3, pz + CC.z * side * r * 0.85);
      m2.rotation.y = m.rotation.y;
      m2.scale.set(sMin + Math.random() * (sMax - sMin), 1, 1);
      group.add(m2);
    }
  }
  let cx = 0, cz = 0, count = 0;
  group.children.forEach(m => { cx += m.position.x; cz += m.position.z; count++; });
  if (count > 0) { cx /= count; cz /= count; }
  registerCullGroup(group, cx, cz, 1200, 1800);
}
function buildMountains() {
  buildMountainLayer(700, 20, 60, 110, 45, 90, 1.6, 2.6);
}

export function updateWorldFX() {
  const nf = state.nightF;
  for (const m of worldFX.cityMats) m.emissiveIntensity = nf * 1.2;
  for (const r of worldFX.round) r.mat.emissiveIntensity = nf * r.k;
}

function islandGeo(r, h, seed, rocky, segs = 16) {
  const g = new THREE.SphereGeometry(r, segs, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const rockBias = rocky ? 0.34 : 0.14;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * 0.05 + seed) * Math.cos(z * 0.06 + seed * 1.9)
      + 0.5 * Math.sin(x * 0.11 + seed * 2.4) * Math.sin(z * 0.13 + seed * 0.6)
      + rockBias * Math.sin(x * 0.24 + seed * 3.3) * Math.cos(z * 0.21 + seed * 1.1);
    const lift = y / r;
    p.setX(i, x * (1 + n * 0.17 * lift));
    p.setZ(i, z * (1 + n * 0.17 * lift));
    p.setY(i, y * (1 + n * (rocky ? 0.32 : 0.20) * lift));
    const hn = THREE.MathUtils.clamp(p.getY(i) / r + n * 0.15, 0, 1);
    if (hn < 0.11) _hc.copy(C_SAND);
    else if (hn < 0.55) _hc.copy(C_SAND).lerp(rocky ? C_ROCHA : C_VEGET, (hn - 0.11) / 0.44);
    else _hc.copy(rocky ? C_ROCHA : C_VEGET).lerp(C_ROCHA, (hn - 0.55) / 0.45);
    _hc.multiplyScalar(0.88 + 0.22 * Math.abs(Math.sin(seed * 6.1 + i * 0.157)));
    colors[i * 3] = _hc.r; colors[i * 3 + 1] = _hc.g; colors[i * 3 + 2] = _hc.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.scale(1, h / r, 1);
  g.computeVertexNormals();
  return g;
}
function islandSurfaceY(dist, r, h) {
  const t = Math.min(1, dist / r);
  return h * Math.sqrt(Math.max(0, 1 - t * t)) * 0.88;
}
const islandMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
worldFX.mountainMats.push(islandMat);

function makeIslandTree(height, palm) {
  const g = new THREE.Group();
  if (palm) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.22, height, 5),
      new THREE.MeshStandardMaterial({ color: 0x7a5a34, roughness: 0.9 })
    );
    trunk.position.y = height / 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.25;
    g.add(trunk);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x2f7d3c, roughness: 0.8 });
    for (let i = 0; i < 5; i++) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.18, height * 0.55, 4), crownMat);
      const a = (i / 5) * Math.PI * 2;
      frond.position.set(Math.cos(a) * height * 0.16, height, Math.sin(a) * height * 0.16);
      frond.rotation.x = 1.1;
      frond.rotation.y = a;
      g.add(frond);
    }
  } else {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, height, 5),
      new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 })
    );
    trunk.position.y = height / 2;
    g.add(trunk);
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(height * 0.38, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 0.8 })
    );
    leaves.position.y = height + 0.2;
    g.add(leaves);
  }
  return g;
}

function buildIsland(il) {
  const group = new THREE.Group();
  const rocky = il.type === 'rock';
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 1, flatShading: true });
  const seed = (il.x * 0.013 + il.z * 0.021) % 100;
  const body = new THREE.Mesh(islandGeo(il.r, il.h, seed, rocky, 14), islandMat);
  body.position.y = -0.4;
  group.add(body);
  if (il.r > 18 && Math.random() < 0.6) {
    const a2 = Math.random() * Math.PI * 2;
    const d2 = il.r * (0.35 + Math.random() * 0.25);
    const r2 = il.r * (0.35 + Math.random() * 0.25);
    const h2 = il.h * (0.45 + Math.random() * 0.3);
    const sat = new THREE.Mesh(islandGeo(r2, h2, seed * 1.7 + 3, rocky, 12), islandMat);
    sat.position.set(Math.cos(a2) * d2, -0.4, Math.sin(a2) * d2);
    group.add(sat);
  }
  const rockCount = (rocky ? 3 : 1) + Math.floor(il.r * 0.45);
  for (let i = 0; i < rockCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = il.r * (0.7 + Math.random() * 0.45);
    const rockSize = 1.0 + Math.random() * (rocky ? 3.2 : 2.2);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rockSize, 0), rockMat);
    const surfY = islandSurfaceY(Math.min(dist, il.r * 0.98), il.r, il.h);
    rock.position.set(
      Math.cos(angle) * dist,
      surfY * 0.4 + rockSize * 0.15,
      Math.sin(angle) * dist
    );
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    group.add(rock);
  }
  if (il.type === 'forest') {
    const treeCount = Math.max(4, Math.floor(il.r / 2.4));
    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = il.r * (0.12 + Math.random() * 0.42);
      const treeHeight = 2.8 + Math.random() * 3.4;
      const surfY = islandSurfaceY(dist, il.r, il.h) * 0.6;
      const palm = Math.random() < 0.5;
      const tree = makeIslandTree(treeHeight, palm);
      tree.position.set(Math.cos(angle) * dist, surfY + 0.1, Math.sin(angle) * dist);
      tree.rotation.y = Math.random() * Math.PI * 2;
      group.add(tree);
    }
  }
  group.position.set(il.x, 0, il.z);
  state.scene.add(group);
}

function landShape(coastOff, backOff) {
  const sh = new THREE.Shape();
  const pts = COAST.map(p => [p[0] - SD.x * coastOff, -(p[1] - SD.z * coastOff)]);
  const back = [...COAST].reverse().map(p => [p[0] - SD.x * backOff, -(p[1] - SD.z * backOff)]);
  sh.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
  for (let i = 0; i < back.length; i++) sh.lineTo(back[i][0], back[i][1]);
  sh.closePath();
  return sh;
}
function flat(geo, mat, y) {
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y; m.receiveShadow = true;
  state.scene.add(m);
  return m;
}

function buildPortoAreia() {
  const portoX = 2200, portoZ = -900;
  const matAreia = new THREE.MeshStandardMaterial({ color: 0xd4b896, roughness: 0.95 });
  const matConcreto = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.9 });
  const matMadeira = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.85 });
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.6 });
  const matLuz = new THREE.MeshStandardMaterial({ color: 0xfff5d1, emissive: 0xffddaa, emissiveIntensity: 1.2 });
  worldFX.round.push({ mat: matLuz, k: 0.9 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(60, 1.5, 40), matAreia);
  base.position.set(portoX, 1.5, portoZ);
  state.scene.add(base);

  const pier = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 25), matMadeira);
  pier.position.set(portoX, 2.5, portoZ - 15);
  state.scene.add(pier);

  for (let i = -3; i <= 3; i += 1.5) {
    const pilar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 6), matConcreto);
    pilar.position.set(portoX + i, -2.0, portoZ - 15);
    state.scene.add(pilar);
  }

  const g = new THREE.Group();
  const baseG = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 3), matMetal);
  baseG.position.y = 1.5;
  g.add(baseG);
  const coluna = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 10, 8), matMetal);
  coluna.position.y = 7;
  g.add(coluna);
  const braco = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 0.6), matMetal);
  braco.position.set(4, 12, 0);
  g.add(braco);
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6, 4), matMetal);
  cabo.position.set(8, 9, 0);
  g.add(cabo);
  const gancho = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), matMetal);
  gancho.position.set(8, 6, 0);
  g.add(gancho);
  g.position.set(portoX + 15, 1.5, portoZ);
  state.scene.add(g);

  const galpao = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 14), new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.7 }));
  galpao.position.set(portoX - 20, 4.5, portoZ);
  state.scene.add(galpao);
  const telhado = new THREE.Mesh(new THREE.BoxGeometry(22, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 }));
  telhado.position.set(portoX - 20, 7.8, portoZ);
  state.scene.add(telhado);

  for (let i = -2; i <= 2; i += 1) {
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 4, 6), matMetal);
    poste.position.set(portoX + i * 4, 3.5, portoZ - 10);
    state.scene.add(poste);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), matLuz);
    lamp.position.set(portoX + i * 4, 5.5, portoZ - 10);
    state.scene.add(lamp);
  }

  for (let i = 0; i < 3; i++) {
    const draga = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 2), matMetal);
    draga.position.set(portoX + 10 + i * 5, 2.0, portoZ + 10);
    draga.rotation.y = 0.3;
    state.scene.add(draga);
  }

  const buoyMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const dist = 25;
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 8), buoyMat);
    b.position.set(portoX + Math.cos(ang) * dist, 0.6, portoZ + Math.sin(ang) * dist);
    state.scene.add(b);
  }
}

const cityTasks = [
  { id:'peruibe', x:-760, z:260, build: buildPeruibe },
  { id:'itanhaem', x:65, z:-39, build: buildItanhaem },
  { id:'mongagua', x:620, z:-269, build: buildMongagua },
  { id:'praiagrande', x:1175, z:-499, build: buildPraiaGrande },
  { id:'santos', x:1619, z:-683, build: buildSantos },
  { id:'guaruja', x:1841, z:-775, build: buildGuaruja }
];
let citiesLoaded = false;

function loadCitiesLazy() {
  if (citiesLoaded) return;
  citiesLoaded = true;
  let index = 0;
  function loadNext() {
    if (index >= cityTasks.length) return;
    const task = cityTasks[index];
    const dist = Math.hypot(task.x - SPAWN.x, task.z - SPAWN.z);
    if (dist < 1500) {
      buildCityCulled(task.id, task.x, task.z, 1300, 1600, task.build, worldFX);
      index++;
      loadNext();
    } else {
      requestIdleCallback(() => {
        buildCityCulled(task.id, task.x, task.z, 1300, 1600, task.build, worldFX);
        index++;
        loadNext();
      }, { timeout: 3000 });
    }
  }
  loadNext();
}

export function initWorldMap() {
  const geo = new THREE.PlaneGeometry(WORLD.sizeX, WORLD.sizeZ, 120, 85);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const sand = new THREE.Color(0.80, 0.70, 0.50);
  const rock = new THREE.Color(0.30, 0.28, 0.25);
  const deep = new THREE.Color(0.05, 0.08, 0.12);
  const land = new THREE.Color(0.62, 0.55, 0.38);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), d = depthAt(x, z);
    pos.setY(i, d > 0 ? -Math.min(d, 42) : Math.min(1.8, -d * 0.30));
    if (d < 0) c.copy(land).lerp(sand, 0.5);
    else if (d < 2) c.copy(sand);
    else if (d < 12) c.copy(sand).lerp(rock, (d - 2) / 10);
    else c.copy(rock).lerp(deep, Math.min(1, (d - 12) / 25));
    c.multiplyScalar(0.92 + Math.sin(x * 0.3 + z * 0.2) * 0.08);
    if (d > -0.5 && d < 1.6) c.multiplyScalar(0.58);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const terr = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  terr.receiveShadow = true;
  state.scene.add(terr);

  flat(new THREE.ShapeGeometry(landShape(-25, 900)), new THREE.MeshStandardMaterial({ color: 0xd8c49a, roughness: 1 }), 0.9);
  flat(new THREE.ShapeGeometry(landShape(70, 900)), new THREE.MeshStandardMaterial({ color: 0x2d4a33, roughness: 1 }), 1.5);

  buildMountains();

  const morroMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  const morro = new THREE.Mesh(hillGeo(160, 120, 42.7, 18), morroMat);
  morro.position.set(LANDMARKS.morroItatins[0], -2, LANDMARKS.morroItatins[1]);
  morro.scale.set(1.6, 1, 1.3);
  const morroGroup = new THREE.Group();
  morroGroup.add(morro);
  registerCullGroup(morroGroup, LANDMARKS.morroItatins[0], LANDMARKS.morroItatins[1], 1200, 1800);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.3;
    const d = 90 + Math.random() * 40;
    const sub = new THREE.Mesh(hillGeo(50 + Math.random() * 30, 40 + Math.random() * 30, i * 9.1, 14), morroMat);
    sub.position.set(LANDMARKS.morroItatins[0] + Math.cos(a) * d, -2, LANDMARKS.morroItatins[1] + Math.sin(a) * d);
    state.scene.add(sub);
  }
  const rockM = new THREE.MeshStandardMaterial({ color: 0x1c2024, roughness: 1, flatShading: true });
  const p1 = new THREE.Mesh(new THREE.ConeGeometry(7, 16, 5), rockM);
  const p2 = new THREE.Mesh(new THREE.ConeGeometry(5, 11, 5), rockM);
  p1.position.set(LANDMARKS.pedraSerpente[0], 6, LANDMARKS.pedraSerpente[1]);
  p2.position.set(p1.position.x + 6, 4, p1.position.z + 3);
  p2.rotation.z = 0.3;
  state.scene.add(p1, p2);

  const lagoonM = new THREE.MeshStandardMaterial({ color: 0x14486a, roughness: 0.15, metalness: 0.3 });
  for (const [lx, lz, lr] of [[-419, 53, 26], [-380, 90, 18], [-460, 20, 20]]) {
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(lr, lr * 1.1, 0.15, 16), lagoonM);
    lg.position.set(lx, 1.1, lz);
    state.scene.add(lg);
  }
  const hutM = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 });
  const strawM = new THREE.MeshStandardMaterial({ color: 0x9a7a3a, roughness: 1 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const hx = -419 + Math.cos(a) * 40, hz = 53 + Math.sin(a) * 30;
    const hut = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 1.4, 8), hutM);
    hut.position.set(hx, 1.9, hz); state.scene.add(hut);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.6, 8), strawM);
    roof.position.set(hx, 3.4, hz); state.scene.add(roof);
  }

  for (const il of ISLANDS) {
    buildIsland(il);
  }

  for (const mg of MANGUE) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(mg.r, mg.r * 1.1, 0.7, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e3a24, roughness: 1 }));
    m.position.set(mg.x, 0.6, mg.z);
    state.scene.add(m);
  }
  const ponte = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 2.2), MATS.mWood);
  ponte.position.set(LANDMARKS.ponteMadeira[0], 2.3, LANDMARKS.ponteMadeira[1]);
  state.scene.add(ponte);
  for (const cc of COLLIDERS.slice(ISLANDS.length, ISLANDS.length + 2)) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 3, 6), MATS.mDark);
    st.position.set(cc.x, 1, cc.z);
    state.scene.add(st);
  }
  const merc = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 5), MATS.mCream);
  merc.position.set(-882, 2.6, 338); state.scene.add(merc);
  const roofM = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.5, 4), MATS.mRed);
  roofM.position.set(-882, 5.2, 338); roofM.rotation.y = Math.PI / 4; state.scene.add(roofM);
  const cais = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 14), MATS.mWood);
  cais.position.set(-870, 1.6, 352); state.scene.add(cais);
  const buoyM = new THREE.MeshStandardMaterial({ color: 0xddcc33 });
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 8), buoyM);
    b.position.set(-1600 + Math.cos(a) * 260, 0.6, 830 + Math.sin(a) * 260);
    state.scene.add(b);
  }

  buildPortoAreia();
  loadCitiesLazy();

  state.boatRoot.position.set(SPAWN.x, 0, SPAWN.z);
  state.physics.y = 0;
  state.physics.vy = 0;
  updateWorldFX();
}