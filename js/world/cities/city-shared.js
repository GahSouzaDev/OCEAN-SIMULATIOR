// js/world/cities/city-shared.js — DADOS REAIS + helpers compartilhados
import * as THREE from 'three';
import { state } from '../../state.js';

export const SD = { x: 0.40, z: 0.92 };   // direção do mar
export const CC = { x: 0.925, z: -0.383 }; // eixo da costa SW→NE

// Proporções reais (pesquisadas): Itanhaém comprida, PG enorme, Peruíbe curta
export const CITY_DATA = {
  peruibe:     { x: -860,  z: 344,  spread: 110, inset: 55, hMin: 4,  hMax: 10, n: 16 },
  itanhaem:    { x: 65,    z: -39,  spread: 300, inset: 60, hMin: 5,  hMax: 16, n: 44 },
  mongagua:    { x: 620,   z: -269, spread: 170, inset: 55, hMin: 6,  hMax: 18, n: 24 },
  praiagrande: { x: 1175,  z: -499, spread: 310, inset: 55, hMin: 18, hMax: 48, n: 64 },
  santos:      { x: 1619,  z: -683, spread: 150, inset: 70, hMin: 22, hMax: 52, n: 48 },
  guaruja:     { x: 1841,  z: -775, spread: 170, inset: 60, hMin: 14, hMax: 36, n: 32 }
};

let _tex = null;
export function getCityTextures() {
  if (_tex) return _tex;
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
  _tex = { t1, t2 };
  return _tex;
}
export function makeBuildingMat() {
  const { t1, t2 } = getCityTextures();
  return new THREE.MeshStandardMaterial({
    map: t1, emissiveMap: t2, emissive: 0xffffff,
    emissiveIntensity: 0, roughness: 0.85, metalness: 0.05
  });
}
export function placeBuilding(x, z, w, h, d, rotY, mat, col) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, h / 2 + 1.6, z);
  m.rotation.y = rotY;
  if (col) { m.material = mat.clone(); m.material.color.copy(col); }
  state.scene.add(m);
  return m;
}
export function placeRowAlongCoast(o) {
  for (let i = 0; i < o.n; i++) {
    const t = ((i + 0.5) / o.n - 0.5) * 2 * o.spread;
    const off = o.inset + Math.random() * 70;
    const x = o.centerX + CC.x * t - SD.x * off + (Math.random() - 0.5) * 14;
    const z = o.centerZ + CC.z * t - SD.z * off + (Math.random() - 0.5) * 14;
    const center = 1 - Math.abs(t) / o.spread;
    const h = o.hMin + (o.hMax - o.hMin) * Math.pow(Math.random(), 1.2) * (0.45 + 0.55 * center);
    const col = o.colFn ? o.colFn() : null;
    placeBuilding(x, z, (o.baseW || 6) + Math.random() * 7, h, (o.baseD || 6) + Math.random() * 7,
      Math.atan2(CC.x, CC.z) + (Math.random() - 0.5) * 0.1, o.mat, col);
  }
}
export function addPalm(x, z, h = 6) {
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 });
  const leafM = new THREE.MeshStandardMaterial({ color: 0x2d5a2a, roughness: 0.85 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, h, 6), trunkM);
  trunk.position.set(x, h / 2 + 1.6, z); state.scene.add(trunk);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.7, 8, 6), leafM);
  leaf.position.set(x, h + 1.8, z); leaf.scale.y = 0.6; state.scene.add(leaf);
}