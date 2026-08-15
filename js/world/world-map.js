// js/world/world-map.js — MORROS REDONDOS + AREIA FÍSICA + MAR ABERTO MAIS LONGE
import * as THREE from 'three';
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { MATS } from '../boats/boat-base.js';

// ================= MARÉ =================
export const tide = { level: 0 };
export function updateTide(dt) {
  const h = CONFIG.time.hour;
  tide.level = 0.9 * Math.sin((h / 12.42) * Math.PI * 2) + 0.3 * Math.sin((h / 6.21) * Math.PI * 2 + 1.7);
}
export function tideM() { return tide.level; }
export function isHighTide() { return tide.level > 0.35; }

// ================= GEOGRAFIA =================
export const COAST = [
  [-1150, 470], [-1080, 432], [-980, 362], [-900, 302], [-830, 257], [-800, 237],
  [-760, 207], [-720, 182], [-640, 132], [-560, 92], [-470, 47], [-380, 12],
  [-300, -23], [-180, -78], [-60, -123], [10, -148], [70, -168], [150, -178], [230, -168]
];
const SD = { x: 0.40, z: 0.92 };
const CC = { x: 0.925, z: -0.383 };
export const RIVERS = [
  { name: 'rio Barra do Una', depth: 1.5, w: 26, pts: [[-1120, 470], [-1160, 430], [-1190, 380], [-1170, 330], [-1120, 300], [-1060, 300], [-1010, 330]] },
  { name: 'bifurcação Guarau (maré alta)', depth: 0.5, w: 14, pts: [[-1010, 330], [-985, 340], [-975, 352], [-980, 362]] },
  { name: 'rio Guarau', depth: 1.4, w: 20, pts: [[-980, 362], [-1000, 335], [-1010, 330]] },
  { name: 'portinho (mercado do peixe)', depth: 1.0, w: 10, pts: [[-760, 207], [-770, 192], [-780, 182]] },
  { name: 'rio Itanhaém/Mongaguá', depth: 1.6, w: 22, pts: [[-380, 12], [-402, -18], [-432, -40]] }
];
export const MANGUE = [
  { x: -1090, z: 350, r: 55, depth: 1.2 },
  { x: -1150, z: 400, r: 70, depth: 1.0 },
  { x: -1000, z: 300, r: 45, depth: 1.0 }
];
export const ISLANDS = [
  { name: 'Ilha do Costão',          x: -760, z: 330, r: 40, h: 14,  c: 0x2d4a33 },
  { name: 'Ilha da Queimada Grande', x: -680, z: 700, r: 70, h: 30,  c: 0x22301f },
  { name: 'Laje da Conceição',       x: -430, z: 260, r: 16, h: 2.2, c: 0x3a3f44 },
  { name: 'Laje de Santos',          x: 350,  z: 250, r: 22, h: 2.5, c: 0x3a3f44 },
  { name: 'Ilha do Guarujá',         x: 520,  z: -40, r: 45, h: 18,  c: 0x2d4a33 },
  { name: 'Alcatrazes',              x: 900,  z: 420, r: 60, h: 22,  c: 0x2d4a33 },
  { name: 'ilhote Guarau A',         x: -940, z: 420, r: 12, h: 5,   c: 0x2d4a33 },
  { name: 'ilhote Guarau B',         x: -900, z: 452, r: 10, h: 4,   c: 0x2d4a33 }
];
export const LANDMARKS = {
  pedraSerpente: [-795, 210], morroItatins: [-848, 127], praiaCostao: [-830, 257],
  portinho: [-760, 207], passarelaItanhaem: [-455, 50], ponteMadeira: [-977, 352],
  rotatoriaMangue: [-1090, 350], lagoasReserva: [-560, 60], serraItatis: [-806, 186]
};
export const GATES = [
  { name: 'ponte de madeira', x: -977, z: 352, r: 6, open: (cb, spec) => spec.airDraft <= 2.2 }
];
export const BOAT_PHYS = {
  trawler: { draft: 1.8, airDraft: 4.2, radius: 2.4 },
  pilot:   { draft: 0.6, airDraft: 1.6, radius: 1.2 }
};
const ZONES = [
  { id: 'port',     name: 'Porto',                           pvp: 'safe',    fishing: 'none',    x: -762, z: 200,  r: 45 },
  { id: 'port',     name: 'Porto de Santos',                 pvp: 'safe',    fishing: 'none',    x: 70,   z: -185, r: 60 },
  { id: 'protecao', name: 'Proteção Ambiental (Una)',        pvp: 'limited', fishing: 'illegal', x: -1050, z: 640, r: 260 },
  { id: 'protecao', name: 'Proteção Ambiental (Alcatrazes)', pvp: 'limited', fishing: 'illegal', x: 900,  z: 420,  r: 200 },
  { id: 'mystic',   name: 'Zona da Pedra',                   pvp: 'strange', fishing: 'legal',   x: -790, z: 280,  r: 150 },
  { id: 'mystic',   name: 'Águas do Costão',                 pvp: 'strange', fishing: 'legal',   x: -700, z: 500,  r: 120 },
  { id: 'marinha',  name: 'Baía da Marinha',                 pvp: 'limited', fishing: 'none',    x: 140,  z: -110, r: 170 },
  { id: 'reserva',  name: 'Reserva Tekoa Kwaray',            pvp: 'safe',    fishing: 'none',    x: -560, z: 40,   r: 120 },
  { id: 'pesca',    name: 'Pesca Livre',                     pvp: 'limited', fishing: 'legal',   x: -450, z: 250,  r: 300 }
];

// ================= REGIÕES =================
export const OPEN_REGION = { id: 'aberto', name: 'Mar Aberto', mood: 'aberto', swell: 1.15, chop: 1.1, tint: [0.85, 1.0, 1.15] };
const REGIONS = [
  { id: 'barrauna',   name: 'Barra do Una',            mood: 'selva',   x: -1100, z: 470, r: 260, swell: 0.80, chop: 0.80, tint: [0.55, 0.95, 0.75] },
  { id: 'guarau',     name: 'Guarau',                  mood: 'selva',   x: -960,  z: 380, r: 160, swell: 0.85, chop: 0.85, tint: [0.55, 0.95, 0.75] },
  { id: 'reserva',    name: 'Lagoas da Reserva',       mood: 'selva',   x: -560,  z: 80,  r: 140, swell: 0.90, chop: 0.90, tint: [0.60, 0.95, 0.80] },
  { id: 'peruibe',    name: 'Peruíbe',                 mood: 'caicara', x: -740,  z: 220, r: 200, swell: 1.00, chop: 1.00, tint: [1, 1, 1] },
  { id: 'pedra',      name: 'Pedra da Serpente',       mood: 'mistico', x: -790,  z: 280, r: 150, swell: 1.05, chop: 1.10, tint: [0.80, 0.90, 1.00] },
  { id: 'costao',     name: 'Ilha do Costão',          mood: 'mistico', x: -760,  z: 330, r: 120, swell: 1.10, chop: 1.10, tint: [0.70, 0.85, 0.95] },
  { id: 'itanhaem',   name: 'Itanhaém',                mood: 'caicara', x: -450,  z: 60,  r: 180, swell: 1.00, chop: 1.00, tint: [1, 1, 1] },
  { id: 'mongagua',   name: 'Mongaguá',                mood: 'caicara', x: -290,  z: -20, r: 140, swell: 0.95, chop: 0.95, tint: [1, 1, 1] },
  { id: 'praiag',     name: 'Praia Grande',            mood: 'urbano',  x: -60,   z: -120, r: 160, swell: 1.00, chop: 1.00, tint: [0.9, 0.95, 0.95] },
  { id: 'santos',     name: 'Baía de Santos',          mood: 'urbano',  x: 90,    z: -160, r: 200, swell: 0.70, chop: 0.70, tint: [0.75, 0.85, 0.85] },
  { id: 'guaruja',    name: 'Guarujá',                 mood: 'urbano',  x: 300,   z: -140, r: 160, swell: 0.80, chop: 0.85, tint: [0.8, 0.9, 0.9] },
  { id: 'queimada',   name: 'Ilha da Queimada Grande', mood: 'perigo',  x: -680,  z: 700, r: 260, swell: 1.35, chop: 1.25, tint: [0.40, 0.50, 0.60] },
  { id: 'lajeconc',   name: 'Laje da Conceição',       mood: 'perigo',  x: -430,  z: 260, r: 120, swell: 1.15, chop: 1.15, tint: [0.60, 0.80, 0.90] },
  { id: 'lajesantos', name: 'Laje de Santos',          mood: 'aberto',  x: 350,   z: 250, r: 140, swell: 1.20, chop: 1.10, tint: [0.80, 1.00, 1.20] },
  { id: 'alcatrazes', name: 'Alcatrazes',              mood: 'mistico', x: 900,   z: 420, r: 220, swell: 1.25, chop: 1.20, tint: [0.50, 0.70, 0.90] }
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
  // 🌊 MAR ABERTO MAIS LONGE: costa agora vai até 450 m
  return offshore(x, z) < 450
    ? { id: 'costa', name: 'Costa', pvp: 'limited', fishing: 'legal' }
    : { id: 'aberto', name: 'Mar Aberto', pvp: 'open', fishing: 'legal' };
}

// ================= BATIMETRIA + TERRENO FÍSICO =================
export const WORLD = { minX: -1700, minZ: -700, sizeX: 3200, sizeZ: 2200 };
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
  d += Math.sin(x * 0.01) * 0.5 + Math.cos(z * 0.013) * 0.5;
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
// 🏖️ altura sólida do terreno (negativo = fundo, positivo = terra acima d'água)
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
  bathyTex.magFilter = bathyTex.minFilter = THREE.LinearFilter;
  bathyTex.needsUpdate = true;
  tintTex = new THREE.DataTexture(t8, N, N, THREE.RGBAFormat);
  tintTex.magFilter = tintTex.minFilter = THREE.LinearFilter;
  tintTex.needsUpdate = true;
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
  { x: -975, z: 350, r: 0.4 }, { x: -979, z: 354, r: 0.4 },
  { x: -448, z: 70, r: 0.4 }, { x: -443, z: 95, r: 0.4 }, { x: -438, z: 120, r: 0.4 },
  { x: -762, z: 212, r: 0.4 }
];

// ================= CIDADES =================
export const worldFX = { cityMats: [], round: [], mountainMats: [] };
const CITIES = [
  { name: 'Peruíbe',      x: -720, z: 182,  n: 7,  hMin: 4,  hMax: 9,  spread: 90,  inset: 60 },
  { name: 'Itanhaém',     x: -470, z: 47,   n: 9,  hMin: 5,  hMax: 14, spread: 110, inset: 70 },
  { name: 'Mongaguá',     x: -300, z: -23,  n: 12, hMin: 6,  hMax: 16, spread: 120, inset: 60 },
  { name: 'Praia Grande', x: -60,  z: -123, n: 34, hMin: 18, hMax: 45, spread: 260, inset: 55 },
  { name: 'Santos',       x: 60,   z: -175, n: 38, hMin: 20, hMax: 50, spread: 220, inset: 70 },
  { name: 'Guarujá',      x: 240,  z: -150, n: 22, hMin: 14, hMax: 34, spread: 160, inset: 60 }
];
function cityTextures() {
  const w = 64, h = 256;
  const day = document.createElement('canvas'); day.width = w; day.height = h;
  const em = document.createElement('canvas'); em.width = w; em.height = h;
  const dg = day.getContext('2d'), eg = em.getContext('2d');
  dg.fillStyle = '#a9a49a'; dg.fillRect(0, 0, w, h);
  eg.fillStyle = '#000'; eg.fillRect(0, 0, w, h);
  for (let y = 6; y < h - 4; y += 10) for (let x = 5; x < w - 4; x += 9) {
    dg.fillStyle = 'rgba(15,25,35,0.8)'; dg.fillRect(x, y, 5, 7);
    if (Math.random() < 0.45) {
      eg.fillStyle = Math.random() < 0.8 ? '#ffd9a0' : '#d8ecff';
      eg.fillRect(x, y, 5, 7);
    }
  }
  const t1 = new THREE.CanvasTexture(day); t1.colorSpace = THREE.SRGBColorSpace;
  const t2 = new THREE.CanvasTexture(em); t2.colorSpace = THREE.SRGBColorSpace;
  return { t1, t2 };
}
function buildCities() {
  const { t1, t2 } = cityTextures();
  const mat = new THREE.MeshStandardMaterial({
    map: t1, emissiveMap: t2, emissive: 0xffffff,
    emissiveIntensity: 0, roughness: 0.85, metalness: 0.05
  });
  worldFX.cityMats.push(mat);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  for (const ct of CITIES) {
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, ct.n);
    for (let i = 0; i < ct.n; i++) {
      const t = ((i + 0.5) / ct.n - 0.5) * 2 * ct.spread;
      const inset = ct.inset + Math.random() * 70;
      const x = ct.x + CC.x * t - SD.x * inset + (Math.random() - 0.5) * 14;
      const z = ct.z + CC.z * t - SD.z * inset + (Math.random() - 0.5) * 14;
      const center = 1 - Math.abs(t) / ct.spread;
      const hgt = ct.hMin + (ct.hMax - ct.hMin) * Math.pow(Math.random(), 1.2) * (0.45 + 0.55 * center);
      dummy.position.set(x, hgt / 2 + 1.6, z);
      dummy.scale.set(5 + Math.random() * 7, hgt, 5 + Math.random() * 7);
      dummy.rotation.y = Math.atan2(CC.x, CC.z) + (Math.random() - 0.5) * 0.1;
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
      im.setColorAt(i, col.setHSL(0.09, 0.04 + Math.random() * 0.10, 0.55 + Math.random() * 0.30));
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    state.scene.add(im);
  }
  for (const pp of [[-86, -166], [-72, -172]]) {
    const tw = new THREE.Mesh(new THREE.BoxGeometry(7, 60, 7), mat);
    tw.position.set(pp[0], 31.6, pp[1]);
    state.scene.add(tw);
  }
  for (const sl of [[40, -215, 34], [70, -225, 40], [95, -215, 30]]) {
    const m2 = new THREE.Mesh(new THREE.BoxGeometry(16, sl[2], 8), mat);
    m2.position.set(sl[0], sl[2] / 2 + 1.6, sl[1]);
    state.scene.add(m2);
  }
  const rm = new THREE.MeshStandardMaterial({ color: 0xf2f0e8, roughness: 0.6, emissive: 0xffe9c0, emissiveIntensity: 0 });
  worldFX.round.push({ mat: rm, k: 0.12 });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 26, 20), rm);
  tower.position.set(LANDMARKS.serraItatis[0], 14.6, LANDMARKS.serraItatis[1]);
  state.scene.add(tower);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), rm);
  dome.position.set(LANDMARKS.serraItatis[0], 27.6, LANDMARKS.serraItatis[1]);
  state.scene.add(dome);
  const bandMat = new THREE.MeshStandardMaterial({ color: 0x1c2a33, emissive: 0xffd9a0, emissiveIntensity: 0 });
  worldFX.round.push({ mat: bandMat, k: 0.9 });
  for (let i = 0; i < 6; i++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(6.05, 0.12, 6, 24), bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(LANDMARKS.serraItatis[0], 4.6 + i * 4, LANDMARKS.serraItatis[1]);
    state.scene.add(band);
  }
}

// ================= SERRA DO MAR — MORROS REDONDOS DE VERDADE =================
function makeFallbackRockTex(baseHex) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#' + baseHex.toString(16).padStart(6, '0'); g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const r = 2 + Math.random() * 8;
    const v = Math.floor(Math.random() * 40) - 20;
    const rr = Math.max(0, Math.min(255, ((baseHex >> 16) & 0xff) + v));
    const gg = Math.max(0, Math.min(255, ((baseHex >> 8) & 0xff) + v));
    const bb = Math.max(0, Math.min(255, (baseHex & 0xff) + v));
    g.fillStyle = `rgba(${rr},${gg},${bb},${0.15 + Math.random() * 0.35})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const w = 1 + Math.random() * 3, h = 30 + Math.random() * 120;
    g.fillStyle = `rgba(20,40,25,${0.08 + Math.random() * 0.2})`;
    g.fillRect(x, y, w, h);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(2, 2);
  return t;
}
function loadMountainTexture(url, fallbackHex) {
  const fallback = makeFallbackRockTex(fallbackHex);
  const holder = { tex: fallback, ready: false, onReady: null };
  new THREE.TextureLoader().load(url, (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(3, 2);
    t.anisotropy = 4;
    holder.tex = t; holder.ready = true;
    if (holder.onReady) holder.onReady(t);
  }, undefined, () => {});
  return holder;
}
const LAYER_1_TEX = loadMountainTexture('assets/fundo1.png', 0x2a3d2e);
const LAYER_2_TEX = loadMountainTexture('assets/fundo2.png', 0x1e3026);
// 🏔️ morro orgânico: hemisfério deslocado por ruído — NADA de cone pontudo
function hillGeo(r, h, seed) {
  const g = new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * 0.045 + seed) * Math.cos(z * 0.055 + seed * 1.7)
      + 0.5 * Math.sin(x * 0.10 + seed * 2.3) * Math.sin(z * 0.12 + seed * 0.7)
      + 0.25 * Math.sin(x * 0.21 + seed * 3.1) * Math.cos(z * 0.19 + seed * 1.3);
    const lift = y / r; // desloca mais no topo, zero na base (saia fechada)
    p.setX(i, x * (1 + n * 0.14 * lift));
    p.setZ(i, z * (1 + n * 0.14 * lift));
    p.setY(i, y * (1 + n * 0.22 * lift));
  }
  g.scale(1, h / r, 1);
  g.computeVertexNormals();
  return g;
}
function buildMountainLayer(texHolder, dist, n, rMin, rMax, hMin, hMax, tint, sMin, sMax) {
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
    const mat = new THREE.MeshStandardMaterial({
      map: texHolder.tex, color: tint, roughness: 1, metalness: 0, fog: false
    });
    worldFX.mountainMats.push(mat);
    texHolder.onReady = (loaded) => {
      worldFX.mountainMats.forEach(m => { m.map = loaded; m.needsUpdate = true; });
    };
    const m = new THREE.Mesh(hillGeo(r, h, i * 7.3 + dist * 0.01), mat);
    m.position.set(px, -3, pz);
    const ang = Math.atan2(CC.x, CC.z) + (Math.random() - 0.5) * 0.5;
    m.rotation.y = ang;
    m.scale.set(sMin + Math.random() * (sMax - sMin), 1, 1);
    group.add(m);
    // domo secundário encostado → silhueta composta, nunca um cone sozinho
    if (Math.random() < 0.75) {
      const h2 = h * (0.4 + Math.random() * 0.35), r2 = r * (0.5 + Math.random() * 0.3);
      const side = Math.random() < 0.5 ? -1 : 1;
      const m2 = new THREE.Mesh(hillGeo(r2, h2, i * 3.1 + dist), mat);
      m2.position.set(px + CC.x * side * r * 0.85, -3, pz + CC.z * side * r * 0.85);
      m2.rotation.y = ang;
      m2.scale.set(sMin + Math.random() * (sMax - sMin), 1, 1);
      group.add(m2);
    }
  }
  state.scene.add(group);
}
function buildMountains() {
  // pé da serra: maiores e mais longe que antes
  buildMountainLayer(LAYER_1_TEX, 700, 26, 60, 110, 45, 90, 0xbfd6e4, 1.6, 2.6);
  // serra média
  buildMountainLayer(LAYER_2_TEX, 1150, 20, 90, 160, 90, 175, 0x9dbcd2, 1.8, 3.0);
  // paredão alto da Serra do Mar, dissolvendo no horizonte
  buildMountainLayer(LAYER_2_TEX, 1700, 14, 140, 240, 170, 300, 0x5a7590, 2.0, 3.4);
}
export function updateWorldFX() {
  const nf = state.nightF;
  for (const m of worldFX.cityMats) m.emissiveIntensity = nf * 1.2;
  for (const r of worldFX.round) r.mat.emissiveIntensity = nf * r.k;
}

// ================= TERRENO + ESTRUTURAS =================
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
  m.position.y = y;
  m.receiveShadow = true;
  state.scene.add(m);
  return m;
}
export function initWorldMap() {
  CONFIG.wind.direction = Math.atan2(-SD.z, -SD.x);
  const geo = new THREE.PlaneGeometry(WORLD.sizeX, WORLD.sizeZ, 220, 160);
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
    // 🏖️ AREIA MOLHADA na linha d'água (acaba o "tostado")
    if (d > -0.5 && d < 1.6) c.multiplyScalar(0.58);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const terr = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  terr.receiveShadow = true;
  state.scene.add(terr);
  flat(new THREE.ShapeGeometry(landShape(-25, 700)), new THREE.MeshStandardMaterial({ color: 0xd8c49a, roughness: 1 }), 0.9);
  flat(new THREE.ShapeGeometry(landShape(70, 700)), new THREE.MeshStandardMaterial({ color: 0x2d4a33, roughness: 1 }), 1.5);

  buildMountains();

  // Morro do Itatins — redondo e orgânico como os demais
  const morroMat = new THREE.MeshStandardMaterial({ color: 0x24402e, roughness: 1 });
  const morro = new THREE.Mesh(hillGeo(120, 95, 42.7), morroMat);
  morro.position.set(LANDMARKS.morroItatins[0], -2, LANDMARKS.morroItatins[1]);
  morro.scale.set(1.6, 1, 1.2);
  state.scene.add(morro);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    const d = 70 + Math.random() * 30;
    const sub = new THREE.Mesh(hillGeo(45 + Math.random() * 25, 35 + Math.random() * 25, i * 9.1), morroMat);
    sub.position.set(
      LANDMARKS.morroItatins[0] + Math.cos(a) * d,
      -2,
      LANDMARKS.morroItatins[1] + Math.sin(a) * d
    );
    state.scene.add(sub);
  }

  const rockM = new THREE.MeshStandardMaterial({ color: 0x1c2024, roughness: 1, flatShading: true });
  const p1 = new THREE.Mesh(new THREE.ConeGeometry(7, 16, 5), rockM);
  const p2 = new THREE.Mesh(new THREE.ConeGeometry(5, 11, 5), rockM);
  p1.position.set(LANDMARKS.pedraSerpente[0], 6, LANDMARKS.pedraSerpente[1]);
  p2.position.set(p1.position.x + 6, 4, p1.position.z + 3);
  p2.rotation.z = 0.3;
  state.scene.add(p1, p2);

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
    st.position.set(cc.x, 1, cc.z);
    state.scene.add(st);
  }
  const dir = new THREE.Vector2(0.25, 0.97);
  const pass = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 95), MATS.mWood);
  pass.position.set(LANDMARKS.passarelaItanhaem[0] + dir.x * 45, 2.0, LANDMARKS.passarelaItanhaem[1] + dir.y * 45);
  pass.rotation.y = Math.atan2(dir.x, dir.y);
  state.scene.add(pass);
  for (const cc of COLLIDERS.slice(ISLANDS.length + 2, ISLANDS.length + 5)) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 3, 6), MATS.mDark);
    st.position.set(cc.x, 1, cc.z);
    state.scene.add(st);
  }
  const merc = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 5), MATS.mCream);
  merc.position.set(-782, 2.6, 178);
  state.scene.add(merc);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.5, 4), MATS.mRed);
  roof.position.set(-782, 5.2, 178);
  roof.rotation.y = Math.PI / 4;
  state.scene.add(roof);
  const cais = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 14), MATS.mWood);
  cais.position.set(-762, 1.6, 212);
  state.scene.add(cais);
  const portM = new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(10, 8 + ((i * 7) % 8), 6), portM);
    b.position.set(40 + i * 22, 5, -200);
    state.scene.add(b);
    const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 18, 6), MATS.mYel);
    cr.position.set(50 + i * 22, 9, -192);
    state.scene.add(cr);
  }
  const buoyM = new THREE.MeshStandardMaterial({ color: 0xddcc33 });
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 8), buoyM);
    b.position.set(-1050 + Math.cos(a) * 260, 0.6, 640 + Math.sin(a) * 260);
    state.scene.add(b);
  }
  buildCities();
  updateWorldFX();
}