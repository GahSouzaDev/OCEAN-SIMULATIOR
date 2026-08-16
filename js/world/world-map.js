// js/world/world-map.js — SÓ A CAMADA DA FRENTE + MORROS PROCEDURAIS (sem textura de imagem)
import * as THREE from 'three';
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { MATS } from '../boats/boat-base.js';
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

export const COAST = [
  [-1600, 650], [-1304, 527], [-1082, 436], [-860, 344], [-638, 252], [-379, 145],
  [-194, 68], [65, -39], [324, -147], [620, -269], [879, -376], [1175, -499],
  [1434, -606], [1619, -683], [1730, -729], [1841, -775]
];
const SD = { x: 0.40, z: 0.92 };
const CC = { x: 0.925, z: -0.383 };
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
  { name: 'Ilha do Costão',          x: -812, z: 454,  r: 40, h: 14,  c: 0x2d4a33 },
  { name: 'Ilha da Queimada Grande', x: -250, z: 742,  r: 70, h: 30,  c: 0x22301f },
  { name: 'Laje da Conceição',       x: 145,  z: 145,  r: 16, h: 2.2, c: 0x3a3f44 },
  { name: 'Laje de Santos',          x: 1779, z: -315, r: 22, h: 2.5, c: 0x3a3f44 },
  { name: 'Ilha do Guarujá',         x: 1889, z: -665, r: 45, h: 18,  c: 0x2d4a33 },
  { name: 'Alcatrazes',              x: 2520, z: 250,  r: 60, h: 22,  c: 0x2d4a33 },
  { name: 'ilhote Guarau A',         x: -1350, z: 600, r: 12, h: 5,   c: 0x2d4a33 },
  { name: 'ilhote Guarau B',         x: -1310, z: 630, r: 10, h: 4,   c: 0x2d4a33 }
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
  { id: 'protecao', name: 'Proteção Ambiental (Alcatrazes)', pvp: 'limited', fishing: 'illegal', x: 2520,  z: 250,  r: 200 },
  { id: 'mystic',   name: 'Zona da Pedra',                   pvp: 'strange', fishing: 'legal',   x: -1106, z: 381,  r: 150 },
  { id: 'mystic',   name: 'Águas do Costão',                 pvp: 'strange', fishing: 'legal',   x: -812,  z: 454,  r: 120 },
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
  { id: 'costao',     name: 'Ilha do Costão',          mood: 'mistico', x: -812,  z: 454, r: 120, swell: 1.10, chop: 1.10, tint: [0.70, 0.85, 0.95] },
  { id: 'itanhaem',   name: 'Itanhaém',                mood: 'caicara', x: 65,    z: -39, r: 300, swell: 1.00, chop: 1.00, tint: [1, 1, 1] },
  { id: 'mongagua',   name: 'Mongaguá',                mood: 'caicara', x: 620,   z: -269, r: 170, swell: 0.95, chop: 0.95, tint: [1, 1, 1] },
  { id: 'praiag',     name: 'Praia Grande',            mood: 'urbano',  x: 1175,  z: -499, r: 310, swell: 1.00, chop: 1.00, tint: [0.9, 0.95, 0.95] },
  { id: 'santos',     name: 'Baía de Santos',          mood: 'urbano',  x: 1619,  z: -683, r: 200, swell: 0.70, chop: 0.70, tint: [0.75, 0.85, 0.85] },
  { id: 'guaruja',    name: 'Guarujá',                 mood: 'urbano',  x: 1841,  z: -775, r: 170, swell: 0.80, chop: 0.85, tint: [0.8, 0.9, 0.9] },
  { id: 'queimada',   name: 'Ilha da Queimada Grande', mood: 'perigo',  x: -250,  z: 742, r: 260, swell: 1.35, chop: 1.25, tint: [0.40, 0.50, 0.60] },
  { id: 'lajeconc',   name: 'Laje da Conceição',       mood: 'perigo',  x: 145,   z: 145, r: 120, swell: 1.15, chop: 1.15, tint: [0.60, 0.80, 0.90] },
  { id: 'lajesantos', name: 'Laje de Santos',          mood: 'aberto',  x: 1779,  z: -315, r: 140, swell: 1.20, chop: 1.10, tint: [0.80, 1.00, 1.20] },
  { id: 'alcatrazes', name: 'Alcatrazes',              mood: 'mistico', x: 2520,  z: 250, r: 220, swell: 1.25, chop: 1.20, tint: [0.50, 0.70, 0.90] }
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
  return (x - best.qx) * SD.x + (z - best.qz) * SD.z;
}
function distPoly(x, z, pts) {
  let m = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const r = distSeg(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    m = Math.min(m, r.d);
  }
  return m;
}
export function depthAt(x, z) {
  const s = offshore(x, z);
  let d = s <= 0 ? -2 : Math.min(80, 0.5 + s * 0.06 + s * s * 0.00001);
  d += Math.sin(x * 0.008) * 0.5 + Math.cos(z * 0.01) * 0.5;
  for (const r of RIVERS) {
    const dd = distPoly(x, z, r.pts);
    if (dd < r.w) d = Math.max(d, r.depth * (1 - (dd / r.w) * (dd / r.w) * 0.85));
  }
  for (const m of MANGUE) {
    const dd = Math.hypot(x - m.x, z - m.z);
    if (dd < m.r) d = Math.max(d, m.depth * (1 - dd / m.r));
  }
  for (const il of ISLANDS) {
    const dd = Math.hypot(x - il.x, z - il.z);
    d -= il.h * Math.exp(-(dd * dd) / (1.1 * il.r * il.r));
  }
  return d;
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
    const damp = sstep(0.4, 4.5, d);
    const surf = Math.exp(-((d - 1.6) * (d - 1.6)) / 1.1);
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

// ============================================================
// 🏔️ MORROS 100% THREE.JS — sem textura de imagem
//    vertex colors: mata embaixo → vegetação → rocha no topo
// ============================================================
const C_MATA  = new THREE.Color(0x1e3a28);
const C_VEGET = new THREE.Color(0x3a5c38);
const C_ROCHA = new THREE.Color(0x71695c);
const _hc = new THREE.Color();
function hillGeo(r, h, seed) {
  const g = new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
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
    // cor por altura + ruído de manchas
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
// material único procedural (recebe luz do sol / noite automaticamente)
const hillMat = new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: 1, metalness: 0, fog: false
});
worldFX.mountainMats.push(hillMat);

// SÓ A CAMADA DA FRENTE (a que estava perfeita) — a de trás foi removida
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
    const m = new THREE.Mesh(hillGeo(r, h, i * 7.3 + dist * 0.01), hillMat);
    m.position.set(px, -3, pz);
    m.rotation.y = Math.atan2(CC.x, CC.z) + (Math.random() - 0.5) * 0.5;
    m.scale.set(sMin + Math.random() * (sMax - sMin), 1, 1);
    group.add(m);
    if (Math.random() < 0.75) {
      const h2 = h * (0.4 + Math.random() * 0.35), r2 = r * (0.5 + Math.random() * 0.3);
      const side = Math.random() < 0.5 ? -1 : 1;
      const m2 = new THREE.Mesh(hillGeo(r2, h2, i * 3.1 + dist), hillMat);
      m2.position.set(px + CC.x * side * r * 0.85, -3, pz + CC.z * side * r * 0.85);
      m2.rotation.y = m.rotation.y;
      m2.scale.set(sMin + Math.random() * (sMax - sMin), 1, 1);
      group.add(m2);
    }
  }
  state.scene.add(group);
}
function buildMountains() {
  // apenas a camada da frente, agora procedural
  buildMountainLayer(700, 30, 60, 110, 45, 90, 1.6, 2.6);
}
export function updateWorldFX() {
  const nf = state.nightF;
  for (const m of worldFX.cityMats) m.emissiveIntensity = nf * 1.2;
  for (const r of worldFX.round) r.mat.emissiveIntensity = nf * r.k;
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
export function initWorldMap() {
  CONFIG.wind.direction = Math.atan2(-SD.z, -SD.x);
  const geo = new THREE.PlaneGeometry(WORLD.sizeX, WORLD.sizeZ, 240, 170);
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

  // Morro do Itatins — agora com o mesmo material procedural
  const morroMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  const morro = new THREE.Mesh(hillGeo(160, 120, 42.7), morroMat);
  morro.position.set(LANDMARKS.morroItatins[0], -2, LANDMARKS.morroItatins[1]);
  morro.scale.set(1.6, 1, 1.3);
  state.scene.add(morro);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.3;
    const d = 90 + Math.random() * 40;
    const sub = new THREE.Mesh(hillGeo(50 + Math.random() * 30, 40 + Math.random() * 30, i * 9.1), morroMat);
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
    const m = new THREE.Mesh(new THREE.ConeGeometry(il.r, il.h, 7),
      new THREE.MeshStandardMaterial({ color: il.c, roughness: 1, flatShading: true }));
    m.position.set(il.x, il.h * 0.5 - 0.6, il.z);
    state.scene.add(m);
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
    st.position.set(cc.x, 1, cc.z); state.scene.add(st);
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

  buildPeruibe(worldFX);
  buildItanhaem(worldFX);
  buildMongagua(worldFX);
  buildPraiaGrande(worldFX);
  buildSantos(worldFX);
  buildGuaruja(worldFX);

  state.boatRoot.position.set(SPAWN.x, 0, SPAWN.z);
  state.physics.y = 0;
  state.physics.vy = 0;
  updateWorldFX();
}