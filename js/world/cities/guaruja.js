// js/world/cities/guaruja.js — Enseada/Pitangueiras + morro + balsa
import * as THREE from 'three';
import { state } from '../../state.js';
import { CITY_DATA, makeBuildingMat, placeRowAlongCoast, addPalm, CC, SD } from './city-shared.js';
export function buildGuaruja(worldFX) {
  const D = CITY_DATA.guaruja;
  const mat = makeBuildingMat(); worldFX.cityMats.push(mat);
  placeRowAlongCoast({ centerX: D.x, centerZ: D.z, n: D.n, hMin: D.hMin, hMax: D.hMax, spread: D.spread, inset: D.inset, mat, baseW: 7, baseD: 7,
    colFn: () => new THREE.Color().setHSL(0.55, 0.08 + Math.random() * 0.10, 0.70 + Math.random() * 0.18) });
  placeRowAlongCoast({ centerX: D.x + CC.x * 120, centerZ: D.z + CC.z * 120, n: 14, hMin: 8, hMax: 22, spread: 110, inset: 55, mat });
  // morro da Enseada
  const morroM = new THREE.MeshStandardMaterial({ color: 0x2d4a33, roughness: 1, flatShading: true });
  const morro = new THREE.Mesh(new THREE.SphereGeometry(45, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), morroM);
  morro.position.set(D.x - CC.x * 60, -1, D.z - CC.z * 60 - 40);
  morro.scale.set(1.2, 0.7, 1); state.scene.add(morro);
  // terminal de balsas
  const termM = new THREE.MeshStandardMaterial({ color: 0x888680 });
  const term = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 8), termM);
  term.position.set(1800, 2.5, -745); state.scene.add(term);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 10), new THREE.MeshStandardMaterial({ color: 0x7a3a28 }));
  roof.position.set(1800, 4.8, -745); state.scene.add(roof);
  for (let i = 0; i < 10; i++) {
    const t = (i / 9 - 0.5) * 2 * 150;
    addPalm(D.x + CC.x * t - SD.x * 32, D.z + CC.z * t - SD.z * 32, 5.5);
  }
}