// js/world/cities/praiagrande.js — OTIMIZADO (bonito + leve)
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

export function buildPraiaGrande(worldFX) {
  const D = CITY_DATA.praiagrande;
  const angle = Math.atan2(CC.x, CC.z);

  // Materiais otimizados - menos emissive, mais eficiente
  const matWhite = new THREE.MeshStandardMaterial({ 
    color: 0xf8f8f5, 
    roughness: 0.65,
    metalness: 0.05
  });
  worldFX.cityMats.push(matWhite);

  const matWhiteLit = new THREE.MeshStandardMaterial({ 
    color: 0xfcfcfc, 
    roughness: 0.6, 
    emissive: 0xffeebb, 
    emissiveIntensity: 0.4
  });
  worldFX.cityMats.push(matWhiteLit);
  worldFX.round.push({ mat: matWhiteLit, k: 0.8 });

  const matGlass = new THREE.MeshStandardMaterial({ 
    color: 0xaaccdd, 
    roughness: 0.15, 
    metalness: 0.5, 
    transparent: true, 
    opacity: 0.7,
    emissive: 0x88aacc,
    emissiveIntensity: 0.3
  });
  worldFX.cityMats.push(matGlass);
  worldFX.round.push({ mat: matGlass, k: 0.6 });

  const matBalcony = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
  const matConcrete = new THREE.MeshStandardMaterial({ color: 0xb5b0a6, roughness: 0.95 });
  const matRock = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1, flatShading: true });
  const matNet = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, transparent: true, opacity: 0.4 });
  const matTrunk = new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.9 });
  const matLeaf = new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 0.7 });
  
  const matLampPost = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
  const matLampGlow = new THREE.MeshStandardMaterial({ 
    color: 0xfff5d1, 
    emissive: 0xffddaa, 
    emissiveIntensity: 1.2
  });
  worldFX.round.push({ mat: matLampGlow, k: 1.0 });
  
  const matKiosk = new THREE.MeshStandardMaterial({ 
    color: 0xe8dfc4, 
    roughness: 0.8
  });
  worldFX.cityMats.push(matKiosk);
  const matKioskRoof = new THREE.MeshStandardMaterial({ color: 0x9c4a38, roughness: 0.85 });
  const matKioskLamp = new THREE.MeshStandardMaterial({ 
    color: 0xfff5d1, 
    emissive: 0xffddaa, 
    emissiveIntensity: 1.0
  });
  worldFX.round.push({ mat: matKioskLamp, k: 0.9 });

  const bldGeo = new THREE.BoxGeometry(1, 1, 1);

  // Fileira 1 - REDUZIDO de D.n para 32 prédios (metade)
  const row1Count = Math.min(32, Math.floor(D.n / 2));
  const row1 = makeInstanced(bldGeo, matWhite, row1Count);
  for (let i = 0; i < row1Count; i++) {
    const t = (i + 0.5) / row1Count - 0.5;
    const along = t * 2 * D.spread;
    const x = D.x + CC.x * along - SD.x * D.inset + (Math.random() - 0.5) * 8;
    const z = D.z + CC.z * along - SD.z * D.inset + (Math.random() - 0.5) * 8;
    const center = 1 - Math.abs(t) * 1.2;
    const h = D.hMin + (D.hMax - D.hMin) * Math.pow(Math.random(), 0.8) * (0.5 + 0.5 * center);
    _col.setHSL(0.1, 0.05, 0.78 + Math.random() * 0.08);
    _dummy.position.set(x, h / 2 + 0.5, z);
    _dummy.scale.set(8, h, 8);
    _dummy.rotation.set(0, angle, 0);
    _dummy.updateMatrix();
    row1.setMatrixAt(i, _dummy.matrix);
    row1.setColorAt(i, _col);
  }
  row1.count = row1Count;
  finalizeInstanced(row1);

  // Fileira 2 - prédios iluminados
  const row2Count = 20; // reduzido de 26
  const row2 = makeInstanced(bldGeo, matWhiteLit, row2Count);
  for (let i = 0; i < row2Count; i++) {
    const t = (i + 0.5) / row2Count - 0.5;
    const along = t * 2 * (D.spread * 0.92);
    const x = D.x + CC.x * along - SD.x * (D.inset + 60) + (Math.random() - 0.5) * 10;
    const z = D.z + CC.z * along - SD.z * (D.inset + 60) + (Math.random() - 0.5) * 10;
    const center = 1 - Math.abs(t) * 1.2;
    const h = 20 + (38 - 20) * Math.pow(Math.random(), 0.9) * (0.5 + 0.5 * center);
    _col.setHSL(0.1, 0.06, 0.75 + Math.random() * 0.08);
    _dummy.position.set(x, h / 2 + 0.5, z);
    _dummy.scale.set(9, h, 9);
    _dummy.rotation.set(0, angle, 0);
    _dummy.updateMatrix();
    row2.setMatrixAt(i, _dummy.matrix);
    row2.setColorAt(i, _col);
  }
  row2.count = row2Count;
  finalizeInstanced(row2);

  // Fileira 3 - torres de vidro
  const row3Count = 22; // reduzido de 30
  const row3 = makeInstanced(bldGeo, matGlass, row3Count);
  for (let i = 0; i < row3Count; i++) {
    const t = (i + 0.5) / row3Count - 0.5;
    const along = t * 2 * (D.spread * 0.95);
    const x = D.x + CC.x * along - SD.x * (D.inset + 110) + (Math.random() - 0.5) * 12;
    const z = D.z + CC.z * along - SD.z * (D.inset + 110) + (Math.random() - 0.5) * 12;
    const center = 1 - Math.abs(t) * 1.2;
    const h = 30 + (55 - 30) * Math.pow(Math.random(), 0.85) * (0.5 + 0.5 * center);
    _col.setHSL(0.55 + Math.random() * 0.05, 0.3, 0.6);
    _dummy.position.set(x, h / 2 + 0.5, z);
    _dummy.scale.set(10, h, 10);
    _dummy.rotation.set(0, angle, 0);
    _dummy.updateMatrix();
    row3.setMatrixAt(i, _dummy.matrix);
    row3.setColorAt(i, _col);
  }
  row3.count = row3Count;
  finalizeInstanced(row3);

  // Fileira 4 - prédios recuados
  const row4Count = 24; // reduzido de 34
  const row4 = makeInstanced(bldGeo, matWhite, row4Count);
  for (let i = 0; i < row4Count; i++) {
    const t = (i + 0.5) / row4Count - 0.5;
    const along = t * 2 * (D.spread * 0.98);
    const x = D.x + CC.x * along - SD.x * (D.inset + 170) + (Math.random() - 0.5) * 12;
    const z = D.z + CC.z * along - SD.z * (D.inset + 170) + (Math.random() - 0.5) * 12;
    const center = 1 - Math.abs(t) * 1.2;
    const h = 25 + (45 - 25) * Math.pow(Math.random(), 0.9) * (0.5 + 0.5 * center);
    _col.setHSL(0.1, 0.05, 0.7 + Math.random() * 0.08);
    _dummy.position.set(x, h / 2 + 0.5, z);
    _dummy.scale.set(8, h, 8);
    _dummy.rotation.set(0, angle, 0);
    _dummy.updateMatrix();
    row4.setMatrixAt(i, _dummy.matrix);
    row4.setColorAt(i, _col);
  }
  row4.count = row4Count;
  finalizeInstanced(row4);

  // Torres Mar I & II (individuais - mantidas pois são marcantes)
  for (const [px, pz] of [[1155, -545], [1170, -552]]) {
    const height = 70;
    const body = new THREE.Mesh(new THREE.BoxGeometry(12, height, 12), matWhiteLit);
    body.position.set(px, height / 2 + 2, pz);
    body.matrixAutoUpdate = false;
    body.updateMatrix();
    state.scene.add(body);
    
    // Faixas simplificadas - menos subdivisões
    const bandCount = Math.min(12, Math.floor(height / 5)); // reduzido de 23 para 12
    const bandGeo = new THREE.BoxGeometry(12.6, 0.5, 12.6);
    const bandIM = makeInstanced(bandGeo, matBalcony, bandCount, false);
    for (let i = 0; i < bandCount; i++) {
      _dummy.position.set(px, 2 + i * 5 + 2.5, pz); // espaçamento maior
      _dummy.scale.set(1, 1, 1);
      _dummy.rotation.set(0, 0, 0);
      _dummy.updateMatrix();
      bandIM.setMatrixAt(i, _dummy.matrix);
    }
    bandIM.count = bandCount;
    finalizeInstanced(bandIM);
    
    const crown = new THREE.Mesh(new THREE.BoxGeometry(14, 2.5, 14), matDark);
    crown.position.set(px, height + 3, pz);
    crown.matrixAutoUpdate = false;
    crown.updateMatrix();
    state.scene.add(crown);
  }

  // Torres de vidro espelhado
  const glassTowerGeo = new THREE.BoxGeometry(1, 1, 1);
  const glassTowerIM = makeInstanced(glassTowerGeo, matGlass, 4);
  const glassPositions = [[1135, -560], [1145, -570], [1160, -575], [1175, -580]];
  for (let i = 0; i < glassPositions.length; i++) {
    const [gx, gz] = glassPositions[i];
    const h = 45 + Math.random() * 20;
    _dummy.position.set(gx, h / 2 + 2, gz);
    _dummy.scale.set(9, h, 9);
    _dummy.rotation.set(0, 0, 0);
    _dummy.updateMatrix();
    glassTowerIM.setMatrixAt(i, _dummy.matrix);
  }
  glassTowerIM.count = 4;
  finalizeInstanced(glassTowerIM);

  // Paredão - reduzido de 20 para 14 segmentos
  const wallSegments = 14;
  const wallGeo = new THREE.BoxGeometry(24, 1.8, 1.2);
  const wallIM = makeInstanced(wallGeo, matConcrete, wallSegments, false);
  const railGeo = new THREE.BoxGeometry(24, 0.8, 0.1);
  const railIM = makeInstanced(railGeo, matDark, wallSegments, false);
  for (let i = 0; i < wallSegments; i++) {
    const t = (i + 0.5) / wallSegments;
    const along = (t - 0.5) * 2 * D.spread;
    const x = D.x + CC.x * along - SD.x * 45;
    const z = D.z + CC.z * along - SD.z * 45;
    _dummy.rotation.set(0, angle, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.position.set(x, 2.6, z);
    _dummy.updateMatrix();
    wallIM.setMatrixAt(i, _dummy.matrix);
    _dummy.position.set(x, 3.8, z);
    _dummy.updateMatrix();
    railIM.setMatrixAt(i, _dummy.matrix);
  }
  wallIM.count = railIM.count = wallSegments;
  finalizeInstanced(wallIM);
  finalizeInstanced(railIM);

  // Quiosques - reduzido de 12 para 8
  const kioskCount = 8;
  const kioskGeo = new THREE.BoxGeometry(3.5, 2.5, 3.5);
  const kioskIM = makeInstanced(kioskGeo, matKiosk, kioskCount, false);
  const kRoofGeo = new THREE.ConeGeometry(2.8, 1.2, 4);
  const kRoofIM = makeInstanced(kRoofGeo, matKioskRoof, kioskCount, false);
  const kLampGeo = new THREE.SphereGeometry(0.2, 6, 4); // menos subdivisões
  const kLampIM = makeInstanced(kLampGeo, matKioskLamp, kioskCount, false);
  for (let i = 0; i < kioskCount; i++) {
    const t = (i / (kioskCount - 1) - 0.5) * 2 * 300;
    const x = D.x + CC.x * t - SD.x * 50;
    const z = D.z + CC.z * t - SD.z * 50;
    _dummy.position.set(x, 1.75, z);
    _dummy.scale.set(1, 1, 1);
    _dummy.rotation.set(0, Math.random() * 0.3, 0);
    _dummy.updateMatrix();
    kioskIM.setMatrixAt(i, _dummy.matrix);
    _dummy.position.set(x, 4.6, z);
    _dummy.rotation.set(0, Math.PI / 4, 0);
    _dummy.updateMatrix();
    kRoofIM.setMatrixAt(i, _dummy.matrix);
    _dummy.position.set(x, 4.0, z);
    _dummy.rotation.set(0, 0, 0);
    _dummy.updateMatrix();
    kLampIM.setMatrixAt(i, _dummy.matrix);
  }
  kioskIM.count = kRoofIM.count = kLampIM.count = kioskCount;
  finalizeInstanced(kioskIM);
  finalizeInstanced(kRoofIM);
  finalizeInstanced(kLampIM);

  // Palmeiras - REDUZIDO de 50 para 30
  const totalPalms = 30;
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 1, 6);
  const leafGeo = new THREE.SphereGeometry(1.8, 6, 3); // menos subdivisões
  const trunkIM = makeInstanced(trunkGeo, matTrunk, totalPalms, false);
  const leafIM = makeInstanced(leafGeo, matLeaf, totalPalms, false);
  let palmIdx = 0;
  
  // 18 na orla (era 30)
  for (let i = 0; i < 18; i++) {
    const t = (i / 17 - 0.5) * 2 * 320;
    const x = D.x + CC.x * t - SD.x * 30;
    const z = D.z + CC.z * t - SD.z * 30;
    const h = 5.0 + Math.random() * 2;
    _dummy.position.set(x, h / 2, z);
    _dummy.scale.set(1, h, 1);
    _dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
    _dummy.updateMatrix();
    trunkIM.setMatrixAt(palmIdx, _dummy.matrix);
    _dummy.position.set(x, h + 0.8, z);
    _dummy.scale.set(1 + Math.random() * 0.2, 1, 1 + Math.random() * 0.2);
    _dummy.updateMatrix();
    leafIM.setMatrixAt(palmIdx, _dummy.matrix);
    palmIdx++;
  }
  
  // 12 no calçadão (era 20)
  for (let i = 0; i < 12; i++) {
    const t = (i / 11 - 0.5) * 2 * 280;
    const x = D.x + CC.x * t - SD.x * 42;
    const z = D.z + CC.z * t - SD.z * 42;
    const h = 4.5 + Math.random();
    _dummy.position.set(x, h / 2, z);
    _dummy.scale.set(1, h, 1);
    _dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
    _dummy.updateMatrix();
    trunkIM.setMatrixAt(palmIdx, _dummy.matrix);
    _dummy.position.set(x, h + 0.8, z);
    _dummy.scale.set(1 + Math.random() * 0.2, 1, 1 + Math.random() * 0.2);
    _dummy.updateMatrix();
    leafIM.setMatrixAt(palmIdx, _dummy.matrix);
    palmIdx++;
  }
  trunkIM.count = leafIM.count = totalPalms;
  finalizeInstanced(trunkIM);
  finalizeInstanced(leafIM);

  // Postes - reduzido de 24 para 16
  const postCount = 16;
  const postGeo = new THREE.CylinderGeometry(0.1, 0.15, 5.5, 6);
  const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6);
  const lampGeo = new THREE.SphereGeometry(0.25, 8, 6); // menos subdivisões
  const postIM = makeInstanced(postGeo, matLampPost, postCount, false);
  const armIM = makeInstanced(armGeo, matLampPost, postCount, false);
  const lampIM = makeInstanced(lampGeo, matLampGlow, postCount, false);
  for (let i = 0; i < postCount; i++) {
    const t = (i / (postCount - 1) - 0.5) * D.spread * 1.0;
    const x = D.x + CC.x * t - SD.x * (D.inset - 5);
    const z = D.z + CC.z * t - SD.z * (D.inset - 5);
    _dummy.scale.set(1, 1, 1);
    _dummy.rotation.set(0, 0, 0);
    _dummy.position.set(x, 2.75, z);
    _dummy.updateMatrix();
    postIM.setMatrixAt(i, _dummy.matrix);
    _dummy.position.set(x, 5.5, z);
    _dummy.rotation.set(Math.PI / 2, 0, 0);
    _dummy.updateMatrix();
    armIM.setMatrixAt(i, _dummy.matrix);
    _dummy.position.set(x + CC.x * 0.9, 5.8, z + CC.z * 0.9);
    _dummy.rotation.set(0, 0, 0);
    _dummy.updateMatrix();
    lampIM.setMatrixAt(i, _dummy.matrix);
  }
  postIM.count = armIM.count = lampIM.count = postCount;
  finalizeInstanced(postIM);
  finalizeInstanced(armIM);
  finalizeInstanced(lampIM);

  // Rochas - mantidas (só 8)
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rockIM = makeInstanced(rockGeo, matRock, 8, false);
  for (let i = 0; i < 8; i++) {
    const t = (i / 7 - 0.5) * 80;
    const x = D.x + CC.x * t - SD.x * 20;
    const z = D.z + CC.z * t - SD.z * 20;
    const rockSize = 0.8 + Math.random() * 1.8;
    _dummy.position.set(x, 0.1 + rockSize * 0.25, z);
    _dummy.scale.set(rockSize, rockSize, rockSize);
    _dummy.rotation.set(Math.random(), Math.random(), Math.random());
    _dummy.updateMatrix();
    rockIM.setMatrixAt(i, _dummy.matrix);
  }
  rockIM.count = 8;
  finalizeInstanced(rockIM);

  // Redes de vôlei - mantidas (só 3)
  const postLGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 6);
  const netGeo = new THREE.BoxGeometry(6, 1.0, 0.05);
  const postLIM = makeInstanced(postLGeo, matDark, 6, false);
  const postRIM = makeInstanced(postLGeo, matDark, 6, false);
  const netIM = makeInstanced(netGeo, matNet, 3, false);
  for (let i = 0; i < 3; i++) {
    const t = (i / 2 - 0.5) * 120;
    const x = D.x + CC.x * t - SD.x * 70;
    const z = D.z + CC.z * t - SD.z * 70;
    _dummy.scale.set(1, 1, 1);
    _dummy.rotation.set(0, 0, 0);
    _dummy.position.set(x - CC.x * 3, 1.1, z - CC.z * 3);
    _dummy.updateMatrix();
    postLIM.setMatrixAt(i, _dummy.matrix);
    _dummy.position.set(x + CC.x * 3, 1.1, z + CC.z * 3);
    _dummy.updateMatrix();
    postRIM.setMatrixAt(i, _dummy.matrix);
    _dummy.position.set(x, 1.8, z);
    _dummy.rotation.set(0, angle, 0);
    _dummy.updateMatrix();
    netIM.setMatrixAt(i, _dummy.matrix);
  }
  postLIM.count = postRIM.count = 6;
  netIM.count = 3;
  finalizeInstanced(postLIM);
  finalizeInstanced(postRIM);
  finalizeInstanced(netIM);
}