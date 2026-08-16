// js/world/world-map.js — MAPA FIXO: cidades/serra/estruturas em GRUPOS CULLÁVEIS
import * as THREE from 'three';
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { MATS } from '../boats/boat-base.js';
import { registerVisibility } from './visibility.js';

// ================= MARÉ =================
export const tide = { level: 0 };
export function updateTide(dt) {
  const h = CONFIG.time.hour;
  tide.level = 0.9 * Math.sin((h / 12.42) * Math.PI * 2) + 0.3 * Math.sin((h / 6.21) * Math.PI * 2 + 1.7);
}
export function tideM() { return tide.level; }
export function isHighTide() { return tide.level > 0.35; }

// ================= GEOGRAFIA =================
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
  { id: 'peruibe',    name: 'Peruíbe',                 mood: 'caicara', x: -720,  z: 220, r: 200, swell: 1.00, chop: 1.00, tint: [1, 1, 1] },
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

// ================= BATIMETRIA =================
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

// ================= CIDADES (grupos culláveis) =================
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const CITIES = [
  { id: 'peruibe',    x: -720,  z: 182,  n: 16, hMin: 4,  hMax: 10, spread: 110, inset: 55 },
  { id: 'itanhaem',   x: 65,    z: -39,  n: 44, hMin: 5,  hMax: 16, spread: 300, inset: 60 },
  { id: 'mongagua',   x: 620,   z: -269, n: 24, hMin: 6,  hMax: 18, spread: 170, inset: 55 },
  { id: 'praiagrande',x: 1175,  z: -499, n: 64, hMin: 18, hMax: 48, spread: 310, inset: 55 },
  { id: 'santos',     x: 1619,  z: -683, n: 48, hMin: 22, hMax: 52, spread: 150, inset: 70 },
  { id: 'guaruja',    x: 1841,  z: -775, n: 32, hMin: 14, hMax: 36, spread: 170, inset: 60 }
];
function makeCityMat() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xb9b2a4, roughness: 0.85, metalness: 0.05,
    emissive: 0xffd9a0, emissiveIntensity: 0
  });
  worldFX.cityMats.push(mat);
  return mat;
}
function buildCity(city) {
  const g = new THREE.Group();
  const mat = makeCityMat();
  const im = new THREE.InstancedMesh(UNIT_BOX, mat, city.n);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < city.n; i++) {
    const t = ((i + 0.5) / city.n - 0.5) * 2 * city.spread;
    const off = city.inset + Math.random() * 70;
    const x = city.x + CC.x * t - SD.x * off + (Math.random() - 0.5) * 14;
    const z = city.z + CC.z * t - SD.z * off + (Math.random() - 0.5) * 14;
    const center = 1 - Math.abs(t) / city.spread;
    const h = city.hMin + (city.hMax - city.hMin) * Math.pow(Math.random(), 1.2) * (0.45 + 0.55 * center);
    dummy.position.set(x, h / 2 + 1.6, z);
    dummy.scale.set(5 + Math.random() * 7, h, 5 + Math.random() * 7);
    dummy.rotation.y = Math.atan2(CC.x, CC.z) + (Math.random() - 0.5) * 0.1;
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
    im.setColorAt(i, col.setHSL(0.09, 0.04 + Math.random() * 0.10, 0.55 + Math.random() * 0.30));
  }
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  if (im.computeBoundingSphere) im.computeBoundingSphere(); // frustum culling real
  g.add(im);
  // ícones por cidade
  if (city.id === 'peruibe') {
    const rm = new THREE.MeshStandardMaterial({ color: 0xf2f0e8, roughness: 0.6, emissive: 0xffe9c0, emissiveIntensity: 0 });
    worldFX.round.push({ mat: rm, k: 0.12 });
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 26, 20), rm);
    tw.position.set(LANDMARKS.serraItatis[0], 14.6, LANDMARKS.serraItatis[1]); g.add(tw);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), rm);
    dome.position.set(LANDMARKS.serraItatis[0], 27.6, LANDMARKS.serraItatis[1]); g.add(dome);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x1c2a33, emissive: 0xffd9a0, emissiveIntensity: 0 });
    worldFX.round.push({ mat: bandMat, k: 0.9 });
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(new THREE.TorusGeometry(6.05, 0.12, 6, 24), bandMat);
      b.rotation.x = Math.PI / 2; b.position.set(LANDMARKS.serraItatis[0], 4.6 + i * 4, LANDMARKS.serraItatis[1]);
      g.add(b);
    }
  }
  if (city.id === 'praiagrande') {
    for (const [px, pz] of [[1155, -545], [1170, -552]]) {
      const tw = new THREE.Mesh(new THREE.BoxGeometry(8, 62, 8), mat);
      tw.position.set(px, 32.6, pz); g.add(tw);
    }
  }
  if (city.id === 'santos') {
    const portM = new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.9 });
    const crMat = new THREE.MeshStandardMaterial({ color: 0xe8b833, roughness: 0.7 });
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(12, 8 + ((i * 7) % 8), 8), portM);
      b.position.set(1560 + i * 24 - SD.x * 40, 5, -640 - SD.z * 40); g.add(b);
      const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 20, 6), crMat);
      cr.position.set(1570 + i * 24, 10, -630); g.add(cr);
    }
  }
  const showR = city.spread * 2 + 500, hideR = showR + 300; // pop escondido pelo fog
  state.scene.add(g);
  registerVisibility(g, city.x, city.z, showR, hideR);
  return g;
}

// ================= SERRA (chunks culláveis) =================
function makeFallbackRockTex(baseHex) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#' + baseHex.toString(16).padStart(6, '0'); g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const r = 2 + Math.random() * 8;
    const v = Math.floor(Math.random() * 40) - 20;
    g.fillStyle = `rgba(${Math.max(0, Math.min(255, ((baseHex >> 16) & 255) + v))},${Math.max(0, Math.min(255, ((baseHex >> 8) & 255) + v))},${Math.max(0, Math.min(255, (baseHex & 255) + v))},${0.15 + Math.random() * 0.35})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(2, 2);
  return t;
}
function hillGeo(r, h, seed) {
  const g = new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * 0.045 + seed) * Math.cos(z * 0.055 + seed * 1.7)
      + 0.5 * Math.sin(x * 0.10 + seed * 2.3) * Math.sin(z * 0.12 + seed * 0.7)
      + 0.25 * Math.sin(x * 0.21 + seed * 3.1) * Math.cos(z * 0.19 + seed * 1.3);
    const lift = y / r;
    p.setX(i, x * (1 + n * 0.14 * lift));
    p.setZ(i, z * (1 + n * 0.14 * lift));
    p.setY(i, y * (1 + n * 0.22 * lift));
  }
  g.scale(1, h / r, 1);
  g.computeVertexNormals();
  return g;
}
function buildMountainLayer(tex, dist, n, rMin, rMax, hMin, hMax, sMin, sMax, tint, showR, hideR) {
  const mat = new THREE.MeshStandardMaterial({ map: tex, color: tint, roughness: 1, metalness: 0, fog: false });
  worldFX.mountainMats.push(mat);
  let chunk = new THREE.Group(), cn = 0, cx = 0, cz = 0;
  const flush = () => {
    if (!cn) return;
    state.scene.add(chunk);
    registerVisibility(chunk, cx / cn, cz / cn, showR, hideR);
  };
  const coastLen = COAST.length - 1;
  const startT = -0.2, endT = 1.2, step = (endT - startT) / n;
  for (let i = 0; i < n; i++) {
    const t = startT + (i + 0.5) * step;
    const idx = Math.min(coastLen - 1, Math.max(0, Math.floor(t * coastLen)));
    const f = t * coastLen - idx;
    const a = COAST[idx], b = COAST[Math.min(idx + 1, coastLen)];
    const off = dist + (Math.random() - 0.5) * 240;
    const px = a[0] + (b[0] - a[0]) * f - SD.x * off + (Math.random() - 0.5) * 60;
    const pz = a[1] + (b[1] - a[1]) * f - SD.z * off + (Math.random() - 0.5) * 60;
    const center = 1 - Math.abs(t - 0.5) * 1.2;
    const h = (hMin + (hMax - hMin) * Math.pow(Math.random(), 0.8)) * (0.6 + 0.4 * center);
    const r = rMin + (rMax - rMin) * Math.random();
    const m = new THREE.Mesh(hillGeo(r, h, i * 7.3 + dist * 0.01), mat);
    m.position.set(px, -3, pz);
    m.rotation.y = Math.atan2(CC.x, CC.z) + (Math.random() - 0.5) * 0.5;
    m.scale.set(sMin + Math.random() * (sMax - sMin), 1, 1);
    chunk.add(m);
    cx += px; cz += pz;
    if (++cn >= 6) { flush(); chunk = new THREE.Group(); cn = 0; cx = 0; cz = 0; }
  }
  flush();
}

// ================= ESTRUTURAS (grupo do portinho) =================
function buildPortinho() {
  const g = new THREE.Group();
  const merc = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 5), MATS.mCream);
  merc.position.set(-882, 2.6, 338); g.add(merc);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.5, 4), MATS.mRed);
  roof.position.set(-882, 5.2, 338); roof.rotation.y = Math.PI / 4; g.add(roof);
  const cais = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 14), MATS.mWood);
  cais.position.set(-870, 1.6, 352); g.add(cais);
  state.scene.add(g);
  registerVisibility(g, LANDMARKS.portinho[0], LANDMARKS.portinho[1], 900, 1200);
}
function buildPonteGuarau() {
  const g = new THREE.Group();
  const ponte = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 2.2), MATS.mWood);
  ponte.position.set(LANDMARKS.ponteMadeira[0], 2.3, LANDMARKS.ponteMadeira[1]); g.add(ponte);
  for (const cc of COLLIDERS.slice(ISLANDS.length, ISLANDS.length + 2)) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 3, 6), MATS.mDark);
    st.position.set(cc.x, 1, cc.z); g.add(st);
  }
  state.scene.add(g);
  registerVisibility(g, LANDMARKS.ponteMadeira[0], LANDMARKS.ponteMadeira[1], 900, 1200);
}
function buildPassarela() {
  const g = new THREE.Group();
  const dir = new THREE.Vector2(0.25, 0.97);
  const pass = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 95), MATS.mWood);
  pass.position.set(LANDMARKS.passarelaItanhaem[0] + dir.x * 45, 2.0, LANDMARKS.passarelaItanhaem[1] + dir.y * 45);
  pass.rotation.y = Math.atan2(dir.x, dir.y); g.add(pass);
  for (const cc of COLLIDERS.slice(ISLANDS.length + 2, ISLANDS.length + 5)) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 3, 6), MATS.mDark);
    st.position.set(cc.x, 1, cc.z); g.add(st);
  }
  state.scene.add(g);
  registerVisibility(g, LANDMARKS.passarelaItanhaem[0], LANDMARKS.passarelaItanhaem[1], 900, 1200);
}

// ================= TERRENO / INIT =================
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
export function updateWorldFX() {
  const nf = state.nightF;
  for (const m of worldFX.cityMats) m.emissiveIntensity = nf * 1.2;
  for (const r of worldFX.round) r.mat.emissiveIntensity = nf * r.k;
}
export function initWorldMap() {
  CONFIG.wind.direction = Math.atan2(-SD.z, -SD.x);
  // terreno (sempre visível — é o chão)
  const geo = new THREE.PlaneGeometry(WORLD.sizeX, WORLD.sizeZ, 240, 170);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const sand = new THREE.Color(0.80, 0.70, 0.50), rock = new THREE.Color(0.30, 0.28, 0.25),
        deep = new THREE.Color(0.05, 0.08, 0.12), land = new THREE.Color(0.62, 0.55, 0.38),
        c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), d = depthAt(x, z);
    pos.setY(i, d > 0 ? -Math.min(d, 42) : Math.min(1.8, -d * 0.30));
    if (d < 0) c.copy(land).lerp(sand, 0.5);
    else if (d < 2) c.copy(sand);
    else if (d < 12) c.copy(sand).lerp(rock, (d - 2) / 10);
    else c.copy(rock).lerp(deep, Math.min(1, (d - 12) / 25));
    c.multiplyScalar(0.92 + Math.sin(x * 0.3 + z * 0.2) * 0.08);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const terr = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  terr.receiveShadow = true;
  state.scene.add(terr);
  flat(new THREE.ShapeGeometry(landShape(-25, 900)), new THREE.MeshStandardMaterial({ color: 0xd8c49a, roughness: 1 }), 0.9);
  flat(new THREE.ShapeGeometry(landShape(70, 900)), new THREE.MeshStandardMaterial({ color: 0x2d4a33, roughness: 1 }), 1.5);
  // morro do Itatins + Pedra (perto do spawn: sempre ligados)
  const morroMat = new THREE.MeshStandardMaterial({ color: 0x24402e, roughness: 1 });
  const morro = new THREE.Mesh(hillGeo(160, 120, 42.7), morroMat);
  morro.position.set(LANDMARKS.morroItatins[0], -2, LANDMARKS.morroItatins[1]);
  morro.scale.set(1.6, 1, 1.3);
  state.scene.add(morro);
  const rockM = new THREE.MeshStandardMaterial({ color: 0x1c2024, roughness: 1, flatShading: true });
  const p1 = new THREE.Mesh(new THREE.ConeGeometry(7, 16, 5), rockM);
  const p2 = new THREE.Mesh(new THREE.ConeGeometry(5, 11, 5), rockM);
  p1.position.set(LANDMARKS.pedraSerpente[0], 6, LANDMARKS.pedraSerpente[1]);
  p2.position.set(p1.position.x + 6, 4, p1.position.z + 3); p2.rotation.z = 0.3;
  state.scene.add(p1, p2);
  // ilhas (cada uma cullável individualmente)
  for (const il of ISLANDS) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.ConeGeometry(il.r, il.h, 7),
      new THREE.MeshStandardMaterial({ color: il.c, roughness: 1, flatShading: true }));
    m.position.set(il.x, il.h * 0.5 - 0.6, il.z);
    g.add(m);
    state.scene.add(g);
    registerVisibility(g, il.x, il.z, il.r * 8 + 400, il.r * 8 + 700);
  }
  // mangue (perto da Barra do Una)
  for (const mg of MANGUE) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(mg.r, mg.r * 1.1, 0.7, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e3a24, roughness: 1 }));
    m.position.set(mg.x, 0.6, mg.z);
    state.scene.add(m);
  }
  // serra em chunks culláveis
  const tex1 = makeFallbackRockTex(0x2a3d2e), tex2 = makeFallbackRockTex(0x1e3026);
  buildMountainLayer(tex1, 700, 30, 60, 110, 45, 90, 1.6, 2.6, 0xbfd6e4, 1500, 1900);
  buildMountainLayer(tex2, 1150, 24, 90, 160, 90, 175, 1.8, 3.0, 0x9dbcd2, 2000, 2400);
  buildMountainLayer(tex2, 1700, 16, 140, 240, 170, 300, 2.0, 3.4, 0x5a7590, 2600, 3000);
  // cidades + estruturas
  for (const city of CITIES) buildCity(city);
  buildPortinho();
  buildPonteGuarau();
  buildPassarela();
  // spawn
  state.boatRoot.position.set(SPAWN.x, 0, SPAWN.z);
  state.physics.y = 0; state.physics.vy = 0;
  updateWorldFX();
}