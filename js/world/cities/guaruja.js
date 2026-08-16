// js/world/cities/guaruja.js — ULTRA OTIMIZADO (convertido para InstancedMesh)
import * as THREE from 'three';
import { state } from '../../state.js';
import { CITY_DATA, CC, SD } from './city-shared.js';

const _dummy = new THREE.Object3D();
const _col = new THREE.Color();

function makeInstanced(geo, mat, count, addColors = true) {
  const im = new THREE.InstancedMesh(geo, mat, count);
  if (addColors) im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  im.count = 0;
  im.frustumCulled = true;
  return im;
}

function finalizeInstanced(im) {
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  if (im.computeBoundingSphere) im.computeBoundingSphere();
  im.matrixAutoUpdate = false;
  im.updateMatrix();
  state.scene.add(im);
}

function setDummy(x, y, z, sx, sy, sz, rx, ry, rz) {
  _dummy.position.set(x, y, z);
  _dummy.scale.set(sx, sy, sz);
  _dummy.rotation.set(rx || 0, ry || 0, rz || 0);
  _dummy.updateMatrix();
  return _dummy.matrix;
}

export function buildGuaruja(worldFX) {
  const D = CITY_DATA.guaruja;
  const angle = Math.atan2(CC.x, CC.z);

  // Materiais
  const matWhite = new THREE.MeshStandardMaterial({ color: 0xf8f8f5, roughness: 0.6, emissive: 0xffd9a0, emissiveIntensity: 0 });
  worldFX.cityMats.push(matWhite);
  worldFX.round.push({ mat: matWhite, k: 0.2 });

  const matWhiteLit = new THREE.MeshStandardMaterial({ color: 0xfcfcfc, roughness: 0.55, emissive: 0xffffff, emissiveIntensity: 0.25 });
  worldFX.cityMats.push(matWhiteLit);
  worldFX.round.push({ mat: matWhiteLit, k: 0.65 });

  const matBeige = new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.8 });
  worldFX.cityMats.push(matBeige);

  const matGreen = new THREE.MeshStandardMaterial({ color: 0xa8c9a0, roughness: 0.85 });
  worldFX.cityMats.push(matGreen);

  const matGlass = new THREE.MeshStandardMaterial({ color: 0xaaccdd, roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.7, emissive: 0x88aacc, emissiveIntensity: 0 });
  worldFX.cityMats.push(matGlass);
  worldFX.round.push({ mat: matGlass, k: 0.7 });

  const matBalcony = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
  const matConcrete = new THREE.MeshStandardMaterial({ color: 0xb5b0a6, roughness: 0.95 });
  const matTrunk = new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.9 });
  const matLeaf = new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 0.7 });
  const matRock = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1, flatShading: true });
  const matLampPost = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
  const matLampGlow = new THREE.MeshStandardMaterial({ color: 0xfff5d1, emissive: 0xffddaa, emissiveIntensity: 0.95 });
  worldFX.round.push({ mat: matLampGlow, k: 0.85 });
  const matKiosk = new THREE.MeshStandardMaterial({ color: 0xe8dfc4, roughness: 0.8, emissive: 0xffddaa, emissiveIntensity: 0 });
  worldFX.cityMats.push(matKiosk);
  worldFX.round.push({ mat: matKiosk, k: 0.3 });
  const matKioskRoof = new THREE.MeshStandardMaterial({ color: 0x9c4a38, roughness: 0.85 });
  const matKioskLamp = new THREE.MeshStandardMaterial({ color: 0xfff5d1, emissive: 0xffddaa, emissiveIntensity: 0.8 });
  worldFX.round.push({ mat: matKioskLamp, k: 0.9 });

  const bldGeo = new THREE.BoxGeometry(1, 1, 1);

  // Fileira 1
  const row1 = makeInstanced(bldGeo, matWhite, D.n);
  for (let i = 0; i < D.n; i++) {
    const t = (i + 0.5) / D.n - 0.5;
    const along = t * 2 * D.spread;
    const x = D.x + CC.x * along - SD.x * D.inset + (Math.random() - 0.5) * 8;
    const z = D.z + CC.z * along - SD.z * D.inset + (Math.random() - 0.5) * 8;
    const center = 1 - Math.abs(t) * 1.2;
    const h = D.hMin + (D.hMax - D.hMin) * Math.pow(Math.random(), 0.8) * (0.5 + 0.5 * center);
    _col.setHSL(0.55, 0.08 + Math.random() * 0.10, 0.70 + Math.random() * 0.18);
    row1.setMatrixAt(i, setDummy(x, h / 2 + 2, z, 8, h, 8, 0, angle, 0));
    row1.setColorAt(i, _col);
  }
  row1.count = D.n;
  finalizeInstanced(row1);

  // Fileira 2 (Enseada)
  const row2 = makeInstanced(bldGeo, matBeige, 16);
  for (let i = 0; i < 16; i++) {
    const t = (i + 0.5) / 16 - 0.5;
    const along = t * 2 * 110;
    const x = D.x + CC.x * 120 + CC.x * along - SD.x * 55 + (Math.random() - 0.5) * 10;
    const z = D.z + CC.z * 120 + CC.z * along - SD.z * 55 + (Math.random() - 0.5) * 10;
    const center = 1 - Math.abs(t) * 1.2;
    const h = 10 + (24 - 10) * Math.pow(Math.random(), 0.9) * (0.5 + 0.5 * center);
    _col.setHSL(0.1, 0.1, 0.72);
    row2.setMatrixAt(i, setDummy(x, h / 2 + 2, z, 9, h, 9, 0, angle, 0));
    row2.setColorAt(i, _col);
  }
  row2.count = 16;
  finalizeInstanced(row2);

  // Fileira 3 (iluminada)
  const row3 = makeInstanced(bldGeo, matWhiteLit, 22);
  for (let i = 0; i < 22; i++) {
    const t = (i + 0.5) / 22 - 0.5;
    const along = t * 2 * (D.spread * 0.92);
    const x = D.x + CC.x * along - SD.x * (D.inset + 60) + (Math.random() - 0.5) * 10;
    const z = D.z + CC.z * along - SD.z * (D.inset + 60) + (Math.random() - 0.5) * 10;
    const center = 1 - Math.abs(t) * 1.2;
    const h = 14 + (30 - 14) * Math.pow(Math.random(), 0.9) * (0.5 + 0.5 * center);
    _col.setHSL(0.55, 0.1, 0.65);
    row3.setMatrixAt(i, setDummy(x, h / 2 + 2, z, 9, h, 9, 0, angle, 0));
    row3.setColorAt(i, _col);
  }
  row3.count = 22;
  finalizeInstanced(row3);

  // Fileira 4 (verde)
  const row4 = makeInstanced(bldGeo, matGreen, 26);
  for (let i = 0; i < 26; i++) {
    const t = (i + 0.5) / 26 - 0.5;
    const along = t * 2 * (D.spread * 0.98);
    const x = D.x + CC.x * along - SD.x * (D.inset + 120) + (Math.random() - 0.5) * 12;
    const z = D.z + CC.z * along - SD.z * (D.inset + 120) + (Math.random() - 0.5) * 12;
    const center = 1 - Math.abs(t) * 1.2;
    const h = 8 + (18 - 8) * Math.pow(Math.random(), 0.9) * (0.5 + 0.5 * center);
    _col.setHSL(0.3, 0.15, 0.6);
    row4.setMatrixAt(i, setDummy(x, h / 2 + 2, z, 7, h, 7, 0, angle, 0));
    row4.setColorAt(i, _col);
  }
  row4.count = 26;
  finalizeInstanced(row4);

  // Torres individuais
  const towerPositions = [];
  for (let i = 0; i < 10; i++) {
    const t = (i / 9 - 0.5) * D.spread * 0.85;
    const inset = D.inset + 20 + Math.random() * 120;
    const x = D.x + CC.x * t - SD.x * inset;
    const z = D.z + CC.z * t - SD.z * inset;
    const height = 20 + Math.random() * 18;
    towerPositions.push({ x, z, height });
  }

  const towerIM = makeInstanced(bldGeo, matWhite, 10);
  towerPositions.forEach((tp, i) => {
    towerIM.setMatrixAt(i, setDummy(tp.x, tp.height / 2 + 2, tp.z, 10, tp.height, 10, 0, 0, 0));
  });
  towerIM.count = 10;
  finalizeInstanced(towerIM);

  const balconyGeo = new THREE.BoxGeometry(10.6, 0.4, 10.6);
  const balconyIM = makeInstanced(balconyGeo, matBalcony, 150, false);
  let bIdx = 0;
  towerPositions.forEach(tp => {
    const bands = Math.floor(tp.height / 3);
    for (let j = 0; j < bands && bIdx < 150; j++) {
      balconyIM.setMatrixAt(bIdx++, setDummy(tp.x, 2 + j * 3 + 1.5, tp.z, 1, 1, 1, 0, 0, 0));
    }
  });
  balconyIM.count = bIdx;
  finalizeInstanced(balconyIM);

  const crownGeo = new THREE.BoxGeometry(12, 2, 12);
  const crownIM = makeInstanced(crownGeo, matDark, 10, false);
  towerPositions.forEach((tp, i) => {
    crownIM.setMatrixAt(i, setDummy(tp.x, tp.height + 3, tp.z, 1, 1, 1, 0, 0, 0));
  });
  crownIM.count = 10;
  finalizeInstanced(crownIM);

  // Morro
  const morroM = new THREE.MeshStandardMaterial({ color: 0x2d4a33, roughness: 1, flatShading: true });
  const morro = new THREE.Mesh(new THREE.SphereGeometry(55, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2), morroM);
  morro.position.set(D.x - CC.x * 70, -1, D.z - CC.z * 70 - 50);
  morro.scale.set(1.3, 0.75, 1.1);
  morro.matrixAutoUpdate = false;
  morro.updateMatrix();
  state.scene.add(morro);

  // Palmeiras do morro
  const palmMorroGeo = new THREE.CylinderGeometry(0.3, 0.5, 1, 6);
  const leafMorroGeo = new THREE.SphereGeometry(1.8, 6, 4);
  const palmMorroIM = makeInstanced(palmMorroGeo, matTrunk, 20, false);
  const leafMorroIM = makeInstanced(leafMorroGeo, matLeaf, 20, false);
  for (let i = 0; i < 20; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 25;
    const px = morro.position.x + Math.cos(ang) * dist;
    const pz = morro.position.z + Math.sin(ang) * dist;
    const h = 3.5 + Math.random() * 2.5;
    palmMorroIM.setMatrixAt(i, setDummy(px, h / 2, pz, 1, h, 1, 0, Math.random() * Math.PI * 2, 0));
    leafMorroIM.setMatrixAt(i, setDummy(px, h + 0.8, pz, 1 + Math.random() * 0.2, 1, 1 + Math.random() * 0.2, 0, 0, 0));
  }
  palmMorroIM.count = leafMorroIM.count = 20;
  finalizeInstanced(palmMorroIM);
  finalizeInstanced(leafMorroIM);

  // Palmeiras da orla
  const totalPalms = 66;
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 1, 6);
  const leafGeo = new THREE.SphereGeometry(1.8, 6, 4);
  const trunkIM = makeInstanced(trunkGeo, matTrunk, totalPalms, false);
  const leafIM = makeInstanced(leafGeo, matLeaf, totalPalms, false);
  let palmIdx = 0;
  for (let row = 0; row < 3; row++) {
    const inset = 28 + row * 6;
    for (let i = 0; i < 22; i++) {
      const t = (i / 21 - 0.5) * 2 * 150;
      const x = D.x + CC.x * t - SD.x * inset;
      const z = D.z + CC.z * t - SD.z * inset;
      const h = 5.5 + Math.random();
      trunkIM.setMatrixAt(palmIdx, setDummy(x, h / 2, z, 1, h, 1, 0, Math.random() * Math.PI * 2, 0));
      leafIM.setMatrixAt(palmIdx, setDummy(x, h + 0.8, z, 1 + Math.random() * 0.2, 1, 1 + Math.random() * 0.2, 0, 0, 0));
      palmIdx++;
    }
  }
  trunkIM.count = leafIM.count = totalPalms;
  finalizeInstanced(trunkIM);
  finalizeInstanced(leafIM);

  // Quiosques
  const kioskGeo = new THREE.BoxGeometry(3.5, 2.5, 3.5);
  const kioskIM = makeInstanced(kioskGeo, matKiosk, 10, false);
  const kioskRoofGeo = new THREE.ConeGeometry(2.8, 1.2, 4);
  const kioskRoofIM = makeInstanced(kioskRoofGeo, matKioskRoof, 10, false);
  const kioskLampGeo = new THREE.SphereGeometry(0.2, 6, 6);
  const kioskLampIM = makeInstanced(kioskLampGeo, matKioskLamp, 10, false);
  for (let i = 0; i < 10; i++) {
    const t = (i / 9 - 0.5) * 2 * 180;
    const x = D.x + CC.x * t - SD.x * 40;
    const z = D.z + CC.z * t - SD.z * 40;
    kioskIM.setMatrixAt(i, setDummy(x, 1.75, z, 1, 1, 1, 0, Math.random() * 0.3, 0));
    kioskRoofIM.setMatrixAt(i, setDummy(x, 4.6, z, 1, 1, 1, 0, Math.PI / 4, 0));
    kioskLampIM.setMatrixAt(i, setDummy(x, 4.0, z, 1, 1, 1, 0, 0, 0));
  }
  kioskIM.count = kioskRoofIM.count = kioskLampIM.count = 10;
  [kioskIM, kioskRoofIM, kioskLampIM].forEach(finalizeInstanced);

  // Marina e pier
  const woodM = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.9 });
  const poleM = new THREE.MeshStandardMaterial({ color: 0x3a2a1c });
  const boatHullM = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 });
  const boatHullM2 = new THREE.MeshStandardMaterial({ color: 0x2f4a5a, roughness: 0.8 });
  const boatCabinM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const sailM = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.9, side: THREE.DoubleSide });

  const pierStartX = D.x + CC.x * 180;
  const pierStartZ = D.z + CC.z * 180;
  const pierLength = 50;
  const pierDirX = SD.x;
  const pierDirZ = SD.z;
  const pierAngle = Math.atan2(pierDirX, pierDirZ);
  const pierMidX = pierStartX + pierDirX * pierLength * 0.5;
  const pierMidZ = pierStartZ + pierDirZ * pierLength * 0.5;

  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, pierLength), woodM);
  deck.position.set(pierMidX, 2.2, pierMidZ);
  deck.rotation.y = pierAngle;
  deck.matrixAutoUpdate = false;
  deck.updateMatrix();
  state.scene.add(deck);

  for (const side of [-1, 1]) {
    const offsetX = CC.x * side * 1.7;
    const offsetZ = CC.z * side * 1.7;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, pierLength), poleM);
    rail.position.set(pierMidX + offsetX, 3.0, pierMidZ + offsetZ);
    rail.rotation.y = pierAngle;
    rail.matrixAutoUpdate = false;
    rail.updateMatrix();
    state.scene.add(rail);
  }

  // Postes do pier
  const pierPostGeo = new THREE.CylinderGeometry(0.14, 0.18, 12, 6);
  const pierPostIM = makeInstanced(pierPostGeo, poleM, 18, false);
  let postIdx = 0;
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const px = pierStartX + pierDirX * t * pierLength;
    const pz = pierStartZ + pierDirZ * t * pierLength;
    for (const side of [-1, 1]) {
      const offX = CC.x * side * 1.7;
      const offZ = CC.z * side * 1.7;
      pierPostIM.setMatrixAt(postIdx++, setDummy(px + offX, 2.2 - 12 / 2, pz + offZ, 1, 1, 1, 0, 0, 0));
    }
  }
  pierPostIM.count = 18;
  finalizeInstanced(pierPostIM);

  // Barcos na marina
  const slipCount = 5;
  const lateralOffset = 5.5;
  const boatGeo = new THREE.BoxGeometry(4.4, 1, 1.8);
  const boatIM = makeInstanced(boatGeo, boatHullM, slipCount, false);
  const cabinGeo = new THREE.BoxGeometry(1.4, 0.9, 1.5);
  const cabinIM = makeInstanced(cabinGeo, boatCabinM, slipCount, false);
  const mastGeo = new THREE.CylinderGeometry(0.06, 0.08, 6, 6);
  const mastIM = makeInstanced(mastGeo, poleM, slipCount, false);
  const sailGeo = new THREE.PlaneGeometry(2.6, 4);
  const sailIM = makeInstanced(sailGeo, sailM, slipCount, false);
  
  let boatIdx = 0;
  for (let i = 0; i < slipCount; i++) {
    const t = 0.2 + (i / (slipCount - 1)) * 0.7;
    const alongPier = t * pierLength;
    const side = i % 2 === 0 ? 1 : -1;
    const bx = pierStartX + pierDirX * alongPier + CC.x * side * lateralOffset;
    const bz = pierStartZ + pierDirZ * alongPier + CC.z * side * lateralOffset;
    const isSailboat = i % 3 === 1;

    boatIM.setMatrixAt(boatIdx, setDummy(bx, 0.5, bz, 1, 1, 1, 0, pierAngle, 0));
    
    if (isSailboat) {
      mastIM.setMatrixAt(boatIdx, setDummy(bx, 4, bz, 1, 1, 1, 0, 0, 0));
      sailIM.setMatrixAt(boatIdx, setDummy(bx + SD.x * 0.6, 3.4, bz + SD.z * 0.6, 1, 1, 1, 0, pierAngle + Math.PI / 2, 0));
      cabinIM.setMatrixAt(boatIdx, setDummy(0, -1000, 0, 0, 0, 0, 0, 0, 0)); // esconder
    } else {
      cabinIM.setMatrixAt(boatIdx, setDummy(bx, 1.45, bz, 1, 1, 1, 0, pierAngle, 0));
      mastIM.setMatrixAt(boatIdx, setDummy(0, -1000, 0, 0, 0, 0, 0, 0, 0)); // esconder
      sailIM.setMatrixAt(boatIdx, setDummy(0, -1000, 0, 0, 0, 0, 0, 0, 0)); // esconder
    }
    boatIdx++;
  }
  boatIM.count = cabinIM.count = mastIM.count = sailIM.count = slipCount;
  [boatIM, cabinIM, mastIM, sailIM].forEach(finalizeInstanced);

  // Terminal de balsas
  const terminalX = 1790;
  const terminalZ = -710;
  const termM = new THREE.MeshStandardMaterial({ color: 0x888680, roughness: 0.85 });
  const term = new THREE.Mesh(new THREE.BoxGeometry(22, 2.5, 10), termM);
  term.position.set(terminalX, 1.8, terminalZ);
  term.rotation.y = Math.atan2(CC.x, CC.z);
  term.matrixAutoUpdate = false;
  term.updateMatrix();
  state.scene.add(term);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x7a3a28, roughness: 0.85 }));
  roof.position.set(terminalX, 3.4, terminalZ);
  roof.rotation.y = Math.atan2(CC.x, CC.z);
  roof.matrixAutoUpdate = false;
  roof.updateMatrix();
  state.scene.add(roof);

  const pillarGeo = new THREE.CylinderGeometry(0.4, 0.5, 3.2, 8);
  const pillarIM = makeInstanced(pillarGeo, matDark, 4, false);
  let pIdx = 0;
  for (const [fx, rz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const px = terminalX + CC.x * fx * 10;
    const pz = terminalZ + CC.z * rz * 4;
    pillarIM.setMatrixAt(pIdx++, setDummy(px, 1.6, pz, 1, 1, 1, 0, 0, 0));
  }
  pillarIM.count = 4;
  finalizeInstanced(pillarIM);

  // Postes
  const postGeo = new THREE.CylinderGeometry(0.1, 0.15, 5, 6);
  const lampGeo = new THREE.SphereGeometry(0.22, 8, 8);
  const postIM = makeInstanced(postGeo, matLampPost, 22, false);
  const lampIM = makeInstanced(lampGeo, matLampGlow, 22, false);
  for (let i = 0; i < 22; i++) {
    const t = (i / 21 - 0.5) * D.spread * 0.95;
    const x = D.x + CC.x * t - SD.x * (D.inset - 5);
    const z = D.z + CC.z * t - SD.z * (D.inset - 5);
    postIM.setMatrixAt(i, setDummy(x, 2.5, z, 1, 1, 1, 0, 0, 0));
    lampIM.setMatrixAt(i, setDummy(x + CC.x * 0.8, 5.2, z + CC.z * 0.8, 1, 1, 1, 0, 0, 0));
  }
  postIM.count = lampIM.count = 22;
  finalizeInstanced(postIM);
  finalizeInstanced(lampIM);

  // Rochas
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rockIM = makeInstanced(rockGeo, matRock, 8, false);
  for (let i = 0; i < 8; i++) {
    const t = (i / 7 - 0.5) * 100;
    const x = D.x + CC.x * t - SD.x * 25;
    const z = D.z + CC.z * t - SD.z * 25;
    const rockSize = 0.8 + Math.random() * 1.8;
    rockIM.setMatrixAt(i, setDummy(x, 0.1 + rockSize * 0.25, z, rockSize, rockSize, rockSize, Math.random(), Math.random(), Math.random()));
  }
  rockIM.count = 8;
  finalizeInstanced(rockIM);
}