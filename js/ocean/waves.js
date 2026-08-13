import * as THREE from 'three';
import { state } from '../state.js';

export const WAVES = [
  { deg:  15, len: 60.0, a: 0.75 },
  { deg:  42, len: 38.0, a: 0.52 },
  { deg: -18, len: 46.0, a: 0.46 },
  { deg:   8, len: 25.0, a: 0.30 },
  { deg:  65, len: 17.0, a: 0.18 },
  { deg: -35, len: 11.0, a: 0.12 },
  { deg:  25, len:  7.0, a: 0.08 },
  { deg: -60, len:  4.5, a: 0.05 }
];
WAVES.forEach(v => {
  const r = v.deg * Math.PI / 180;
  v.dx = Math.cos(r); v.dz = Math.sin(r);
  v.k = 2 * Math.PI / v.len;
  v.w = Math.sqrt(9.81 * v.k) * 0.85;
  v.Q = Math.min(1.1, 0.8 / (v.k * v.a * WAVES.length));
});
export const AMP_SUM = WAVES.reduce((s, v) => s + v.a, 0);

export function waveHAt(x, z) {
  let h = 0;
  for (const v of WAVES) {
    const ph = v.k * (v.dx * x + v.dz * z) - v.w * state.wavePhase;
    h += v.a * Math.sin(ph);
  }
  return h * state.waveHMul;
}

export function waveHeightEnvelope(x, z) {
  return Math.abs(waveHAt(x, z));
}

export function waveSprayFactor(waveLocalH) {
  const maxRef = Math.max(AMP_SUM * state.waveHMul * 1.8, 0.4);
  const normalized = Math.min(waveLocalH / maxRef, 1.0);
  return Math.pow(normalized, 0.65);
}

export function waveNormalAt(x, z) {
  const e = 0.7, h0 = waveHAt(x, z);
  return new THREE.Vector3(h0 - waveHAt(x + e, z), e, h0 - waveHAt(x, z + e)).normalize();
}

// ========== NOVAS FUNÇÕES PARA FÍSICA ==========

// Gradiente da superfície (inclinação) no ponto (x,z)
export function waveGradient(x, z) {
  const delta = 0.5;
  const hx = waveHAt(x + delta, z) - waveHAt(x - delta, z);
  const hz = waveHAt(x, z + delta) - waveHAt(x, z - delta);
  return { dx: hx / (2 * delta), dz: hz / (2 * delta) };
}

// Velocidade horizontal da água (corrente) na superfície
export function waveWaterVelocity(x, z, phase) {
  let vx = 0, vz = 0;
  for (const v of WAVES) {
    const theta = v.k * (v.dx * x + v.dz * z) - v.w * phase;
    const cosT = Math.cos(theta);
    const amp = v.a * state.waveHMul;
    const speed = (v.w / v.k) * amp * cosT;
    vx += speed * v.dx;
    vz += speed * v.dz;
  }
  return { vx, vz };
}

// GLSL builders (já existentes)
export function glslLOD() {
  return WAVES.map((v, i) =>
    `m${i}=1.0-smoothstep(${(v.len * 12).toFixed(1)},${(v.len * 24).toFixed(1)},dL);`
  ).join('\n');
}
export const M_DECL = 'float ' + WAVES.map((_, i) => 'm' + i).join(',') + ';';
export function glslH() {
  return WAVES.map((v, i) =>
    `ph=${v.k.toFixed(4)}*dot(vec2(${v.dx.toFixed(4)},${v.dz.toFixed(4)}),p)-${v.w.toFixed(4)}*uPhase;h+=${v.a.toFixed(4)}*m${i}*sin(ph);`
  ).join('\n');
}
export function glslC() {
  return WAVES.map((v, i) =>
    `ph=${v.k.toFixed(4)}*dot(vec2(${v.dx.toFixed(4)},${v.dz.toFixed(4)}),p)-${v.w.toFixed(4)}*uPhase;c+=vec2(${v.dx.toFixed(4)},${v.dz.toFixed(4)})*${(v.a * v.Q).toFixed(4)}*m${i}*cos(ph);`
  ).join('\n');
}