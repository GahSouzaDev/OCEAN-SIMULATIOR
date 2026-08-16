// js/world/cities/praiagrande.js — a "Miami brasileira": muralha de torres
import * as THREE from 'three';
import { state } from '../../state.js';
import { CITY_DATA, makeBuildingMat, placeRowAlongCoast, placeBuilding, CC, SD } from './city-shared.js';
export function buildPraiaGrande(worldFX) {
  const D = CITY_DATA.praiagrande;
  const mat = makeBuildingMat(); worldFX.cityMats.push(mat);
  placeRowAlongCoast({ centerX: D.x, centerZ: D.z, n: D.n, hMin: D.hMin, hMax: D.hMax, spread: D.spread, inset: D.inset, mat, baseW: 7, baseD: 7,
    colFn: () => new THREE.Color().setHSL(0.09, 0.04 + Math.random() * 0.12, 0.60 + Math.random() * 0.25) });
  placeRowAlongCoast({ centerX: D.x, centerZ: D.z, n: 30, hMin: 14, hMax: 30, spread: D.spread * 0.9, inset: D.inset + 70, mat, baseW: 9, baseD: 9 });
  // 🏢 Mar I & II (~150 m, os mais altos da Baixada)
  for (const [px, pz] of [[1155, -545], [1170, -552]]) {
    const tw = new THREE.Mesh(new THREE.BoxGeometry(8, 62, 8), mat);
    tw.position.set(px, 32.6, pz); state.scene.add(tw);
    const top = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 10), new THREE.MeshStandardMaterial({ color: 0x4a4840 }));
    top.position.set(px, 65, pz); state.scene.add(top);
  }
  // paredão da orla
  const concrM = new THREE.MeshStandardMaterial({ color: 0xb5b0a6, roughness: 0.95 });
  for (let i = 0; i < 14; i++) {
    const t = (i + 0.5) / 14;
    const along = (t - 0.5) * 2 * D.spread;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(24, 1.6, 1.2), concrM);
    seg.position.set(D.x + CC.x * along - SD.x * 45, 2.4, D.z + CC.z * along - SD.z * 45);
    seg.rotation.y = Math.atan2(CC.x, CC.z); state.scene.add(seg);
  }
  // quiosques
  const qM = new THREE.MeshStandardMaterial({ color: 0xe8dfc4 });
  const qR = new THREE.MeshStandardMaterial({ color: 0x9c4a38 });
  for (let i = 0; i < 10; i++) {
    const t = (i / 9 - 0.5) * 2 * 280;
    const x = D.x + CC.x * t - SD.x * 48, z = D.z + CC.z * t - SD.z * 48;
    const q = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 3), qM); q.position.set(x, 2.85, z); state.scene.add(q);
    const qr = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1, 4), qR); qr.position.set(x, 4.6, z); qr.rotation.y = Math.PI / 4; state.scene.add(qr);
  }
}