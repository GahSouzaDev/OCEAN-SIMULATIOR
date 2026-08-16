// js/world/cities/santos.js — maior jardim de praia do mundo + muralha + porto
import * as THREE from 'three';
import { state } from '../../state.js';
import { CITY_DATA, makeBuildingMat, placeRowAlongCoast, addPalm, CC, SD } from './city-shared.js';
export function buildSantos(worldFX) {
  const D = CITY_DATA.santos;
  const mat = makeBuildingMat(); worldFX.cityMats.push(mat);
  placeRowAlongCoast({ centerX: D.x, centerZ: D.z, n: D.n, hMin: D.hMin, hMax: D.hMax, spread: D.spread, inset: D.inset, mat, baseW: 8, baseD: 8 });
  // lajes horizontais da orla
  for (let i = 0; i < 4; i++) {
    const t = (i / 3 - 0.5) * 2 * 130;
    const hh = 28 + Math.random() * 12;
    const sl = new THREE.Mesh(new THREE.BoxGeometry(18, hh, 9), mat);
    sl.position.set(D.x + CC.x * t - SD.x * (D.inset + 25), hh / 2 + 1.6, D.z + CC.z * t - SD.z * (D.inset + 25));
    sl.rotation.y = Math.atan2(CC.x, CC.z); state.scene.add(sl);
  }
  // 🌴 jardim da praia (3 fileiras de palmeiras)
  for (let row = 0; row < 3; row++) {
    const inset = 28 + row * 6;
    for (let i = 0; i < 22; i++) {
      const t = (i / 21 - 0.5) * 2 * 140;
      addPalm(D.x + CC.x * t - SD.x * inset, D.z + CC.z * t - SD.z * inset, 6);
    }
  }
  // 🏗️ porto: armazéns, guindastes, contêineres, cais
  const portM = new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.9 });
  const crMat = new THREE.MeshStandardMaterial({ color: 0xe8b833, roughness: 0.7 });
  const contM = [0xb23a2a, 0x2a5ab2, 0xd4a833, 0x33a854].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
  for (let i = 0; i < 5; i++) {
    const bx = 1560 + CC.x * i * 24, bz = -640 + CC.z * i * 24;
    const b = new THREE.Mesh(new THREE.BoxGeometry(12, 8 + ((i * 7) % 8), 8), portM);
    b.position.set(bx - SD.x * 40, 5, bz - SD.z * 40); state.scene.add(b);
    const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 20, 6), crMat);
    cr.position.set(bx - SD.x * 20, 10, bz - SD.z * 20); state.scene.add(cr);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 0.6), crMat);
    boom.position.set(bx - SD.x * 20 + 6, 19, bz - SD.z * 20); state.scene.add(boom);
    for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 6), contM[(i + j + k) % 4]);
      c.position.set(bx - SD.x * 55 + k * 3, 2.3 + j * 2.6, bz - SD.z * 55); state.scene.add(c);
    }
  }
  const cais = new THREE.Mesh(new THREE.BoxGeometry(180, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x4a4540 }));
  cais.position.set(1600 - SD.x * 15, 1.6, -660 - SD.z * 15);
  cais.rotation.y = Math.atan2(CC.x, CC.z); state.scene.add(cais);
}