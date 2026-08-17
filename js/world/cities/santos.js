// js/world/cities/santos.js — INSTANCED MESHES (estilo Praia Grande)
import * as THREE from 'three';
import { state } from '../../state.js';
import { CITY_DATA, CC, SD } from './city-shared.js';

// ============ HELPERS ============
const _dummy = new THREE.Object3D();
const _col = new THREE.Color();

function makeInstanced(geo, mat, count, addColors = true) {
  const im = new THREE.InstancedMesh(geo, mat, count);
  if (addColors) im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  im.count = 0;
  return im;
}

function setDummy(x, y, z, sx, sy, sz, rx, ry, rz) {
  _dummy.position.set(x, y, z);
  _dummy.scale.set(sx, sy, sz);
  _dummy.rotation.set(rx || 0, ry || 0, rz || 0);
  _dummy.updateMatrix();
  return _dummy.matrix;
}

export function buildSantos(worldFX) {
  const D = CITY_DATA.santos;
  const caisAngle = Math.atan2(CC.x, CC.z);
  const seaAngle = Math.atan2(SD.x, SD.z);

  // ============================================================
  // 🎨 MATERIAIS (iguais aos de Praia Grande)
  // ============================================================
  const matWhite = new THREE.MeshStandardMaterial({ color: 0xf8f8f5, roughness: 0.65, metalness: 0.05 });
  worldFX.cityMats.push(matWhite);

  const matWhiteLit = new THREE.MeshStandardMaterial({ 
    color: 0xfcfcfc, roughness: 0.6, emissive: 0xffeebb, emissiveIntensity: 0.4 
  });
  worldFX.cityMats.push(matWhiteLit);
  worldFX.round.push({ mat: matWhiteLit, k: 0.8 });

  const matGlass = new THREE.MeshStandardMaterial({ 
    color: 0xaaccdd, roughness: 0.15, metalness: 0.5, transparent: true, opacity: 0.7,
    emissive: 0x88aacc, emissiveIntensity: 0.3
  });
  worldFX.cityMats.push(matGlass);
  worldFX.round.push({ mat: matGlass, k: 0.6 });

  const matBalcony = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
  const matConcrete = new THREE.MeshStandardMaterial({ color: 0xb5b0a6, roughness: 0.95 });
  const matTrunk = new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.9 });
  const matLeaf = new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 0.7 });

  // Materiais do porto (mantidos)
  const portConcrete = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.9 });
  const portDark = new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.8 });
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xe8b833, roughness: 0.5, metalness: 0.3 });
  const craneMatDark = new THREE.MeshStandardMaterial({ color: 0xb8892a, roughness: 0.5, metalness: 0.3 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.6, metalness: 0.4 });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffdd88, emissiveIntensity: 1.1 });
  worldFX.round.push({ mat: windowMat, k: 0.95 });

  const containerColors = [
    new THREE.MeshStandardMaterial({ color: 0xb23a2a, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x2a5ab2, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0xd4a833, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x33a854, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0xd85f2a, roughness: 0.75 })
  ];

  // ============================================================
  // 🏙️ EDIFÍCIOS DA ORLA — estilo Praia Grande (InstancedMesh)
  // ============================================================
  const bldGeo = new THREE.BoxGeometry(1, 1, 1);

  // Fileira 1 — prédios brancos/bege na orla
  const row1Count = 30;
  const row1 = makeInstanced(bldGeo, matWhite, row1Count);
  for (let i = 0; i < row1Count; i++) {
    const t = (i + 0.5) / row1Count - 0.5;
    const along = t * 2 * D.spread;
    const x = D.x + CC.x * along - SD.x * D.inset + (Math.random() - 0.5) * 8;
    const z = D.z + CC.z * along - SD.z * D.inset + (Math.random() - 0.5) * 8;
    const center = 1 - Math.abs(t) * 1.2;
    const h = D.hMin + (D.hMax - D.hMin) * Math.pow(Math.random(), 0.8) * (0.5 + 0.5 * center);
    _col.setHSL(0.1, 0.05, 0.78 + Math.random() * 0.08);
    row1.setMatrixAt(i, setDummy(x, h / 2 + 2, z, 8, h, 8, 0, caisAngle, 0));
    row1.setColorAt(i, _col);
  }
  row1.count = row1Count;
  row1.instanceMatrix.needsUpdate = true;
  row1.instanceColor.needsUpdate = true;
  state.scene.add(row1);

  // Fileira 2 — prédios iluminados
  const row2Count = 22;
  const row2 = makeInstanced(bldGeo, matWhiteLit, row2Count);
  for (let i = 0; i < row2Count; i++) {
    const t = (i + 0.5) / row2Count - 0.5;
    const along = t * 2 * (D.spread * 0.92);
    const x = D.x + CC.x * along - SD.x * (D.inset + 60) + (Math.random() - 0.5) * 10;
    const z = D.z + CC.z * along - SD.z * (D.inset + 60) + (Math.random() - 0.5) * 10;
    const center = 1 - Math.abs(t) * 1.2;
    const h = 20 + (38 - 20) * Math.pow(Math.random(), 0.9) * (0.5 + 0.5 * center);
    _col.setHSL(0.1, 0.06, 0.75 + Math.random() * 0.08);
    row2.setMatrixAt(i, setDummy(x, h / 2 + 2, z, 9, h, 9, 0, caisAngle, 0));
    row2.setColorAt(i, _col);
  }
  row2.count = row2Count;
  row2.instanceMatrix.needsUpdate = true;
  row2.instanceColor.needsUpdate = true;
  state.scene.add(row2);

  // Fileira 3 — torres de vidro
  const row3Count = 25;
  const row3 = makeInstanced(bldGeo, matGlass, row3Count);
  for (let i = 0; i < row3Count; i++) {
    const t = (i + 0.5) / row3Count - 0.5;
    const along = t * 2 * (D.spread * 0.95);
    const x = D.x + CC.x * along - SD.x * (D.inset + 110) + (Math.random() - 0.5) * 12;
    const z = D.z + CC.z * along - SD.z * (D.inset + 110) + (Math.random() - 0.5) * 12;
    const center = 1 - Math.abs(t) * 1.2;
    const h = 30 + (55 - 30) * Math.pow(Math.random(), 0.85) * (0.5 + 0.5 * center);
    _col.setHSL(0.55 + Math.random() * 0.05, 0.3, 0.6);
    row3.setMatrixAt(i, setDummy(x, h / 2 + 2, z, 10, h, 10, 0, caisAngle, 0));
    row3.setColorAt(i, _col);
  }
  row3.count = row3Count;
  row3.instanceMatrix.needsUpdate = true;
  row3.instanceColor.needsUpdate = true;
  state.scene.add(row3);

  // Fileira 4 — prédios recuados
  const row4Count = 28;
  const row4 = makeInstanced(bldGeo, matWhite, row4Count);
  for (let i = 0; i < row4Count; i++) {
    const t = (i + 0.5) / row4Count - 0.5;
    const along = t * 2 * (D.spread * 0.98);
    const x = D.x + CC.x * along - SD.x * (D.inset + 170) + (Math.random() - 0.5) * 12;
    const z = D.z + CC.z * along - SD.z * (D.inset + 170) + (Math.random() - 0.5) * 12;
    const center = 1 - Math.abs(t) * 1.2;
    const h = 25 + (45 - 25) * Math.pow(Math.random(), 0.9) * (0.5 + 0.5 * center);
    _col.setHSL(0.1, 0.05, 0.7 + Math.random() * 0.08);
    row4.setMatrixAt(i, setDummy(x, h / 2 + 2, z, 8, h, 8, 0, caisAngle, 0));
    row4.setColorAt(i, _col);
  }
  row4.count = row4Count;
  row4.instanceMatrix.needsUpdate = true;
  row4.instanceColor.needsUpdate = true;
  state.scene.add(row4);

  // ============================================================
  // 🏢 TORRES INDIVIDUAIS (12 torres com sacadas — mantidas)
  // ============================================================
  const towerPositions = [];
  for (let i = 0; i < 12; i++) {
    const t = (i / 11 - 0.5) * D.spread * 0.9;
    const inset = D.inset + 30 + Math.random() * 200;
    const x = D.x + CC.x * t - SD.x * inset;
    const z = D.z + CC.z * t - SD.z * inset;
    const height = 30 + Math.random() * 30;
    towerPositions.push({ x, z, height });
  }

  const towerIM = makeInstanced(bldGeo, matWhite, 12);
  towerPositions.forEach((tp, i) => {
    towerIM.setMatrixAt(i, setDummy(tp.x, tp.height / 2 + 2, tp.z, 10, tp.height, 10, 0, 0, 0));
  });
  towerIM.count = 12;
  towerIM.instanceMatrix.needsUpdate = true;
  state.scene.add(towerIM);

  // Sacadas
  const balconyGeo = new THREE.BoxGeometry(10.6, 0.4, 10.6);
  const balconyIM = makeInstanced(balconyGeo, matBalcony, 200, false);
  let bIdx = 0;
  towerPositions.forEach(tp => {
    const bands = Math.floor(tp.height / 3);
    for (let j = 0; j < bands && bIdx < 200; j++) {
      balconyIM.setMatrixAt(bIdx++, setDummy(tp.x, 2 + j * 3 + 1.5, tp.z, 1, 1, 1, 0, 0, 0));
    }
  });
  balconyIM.count = bIdx;
  balconyIM.instanceMatrix.needsUpdate = true;
  state.scene.add(balconyIM);

  // Coroas
  const crownGeo = new THREE.BoxGeometry(12, 2, 12);
  const crownIM = makeInstanced(crownGeo, matDark, 12, false);
  towerPositions.forEach((tp, i) => {
    crownIM.setMatrixAt(i, setDummy(tp.x, tp.height + 3, tp.z, 1, 1, 1, 0, 0, 0));
  });
  crownIM.count = 12;
  crownIM.instanceMatrix.needsUpdate = true;
  state.scene.add(crownIM);

  // ============================================================
  // 🌴 JARDIM DA PRAIA (4 fileiras × 30 palmeiras = 120)
  // ============================================================
  const totalPalms = 120;
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 1, 6);
  const leafGeo = new THREE.SphereGeometry(1.8, 6, 4);
  const trunkIM = makeInstanced(trunkGeo, matTrunk, totalPalms, false);
  const leafIM = makeInstanced(leafGeo, matLeaf, totalPalms, false);
  let palmIdx = 0;
  for (let row = 0; row < 4; row++) {
    const inset = 28 + row * 6;
    for (let i = 0; i < 30; i++) {
      const t = (i / 29 - 0.5) * 2 * 160;
      const x = D.x + CC.x * t - SD.x * inset;
      const z = D.z + CC.z * t - SD.z * inset;
      const h = 5.5 + Math.random();
      trunkIM.setMatrixAt(palmIdx, setDummy(x, h / 2, z, 1, h, 1, 0, Math.random() * Math.PI * 2, 0));
      leafIM.setMatrixAt(palmIdx, setDummy(x, h + 0.8, z, 1 + Math.random() * 0.2, 1, 1 + Math.random() * 0.2, 0, 0, 0));
      palmIdx++;
    }
  }
  trunkIM.count = leafIM.count = totalPalms;
  trunkIM.instanceMatrix.needsUpdate = true;
  leafIM.instanceMatrix.needsUpdate = true;
  state.scene.add(trunkIM);
  state.scene.add(leafIM);

  // ============================================================
  // 🚢 PORTO DE SANTOS — cais, molhes, farol, boias, defensas
  // ============================================================
  const caisStartX = 1550, caisStartZ = -620;
  const caisLength = 460, caisWidth = 30;
  const pt = (along, depth) => ({
    x: caisStartX + CC.x * along - SD.x * depth,
    z: caisStartZ + CC.z * along - SD.z * depth
  });

  // Canal de navegação com molhes
  const channelWidth = 60, molhoLength = 80;
  const molhoStartX = 1700, molhoStartZ = -680;
  const molhoDirX = SD.x, molhoDirZ = SD.z;

  const molheGeo = new THREE.BoxGeometry(molhoLength, 2.5, 12);
  const molheIM = makeInstanced(molheGeo, portDark, 2, false);
  molheIM.setMatrixAt(0, setDummy(
    molhoStartX - CC.x * (channelWidth / 2 + 6), 1.25, molhoStartZ - CC.z * (channelWidth / 2 + 6),
    1, 1, 1, 0, Math.atan2(molhoDirX, molhoDirZ), 0));
  molheIM.setMatrixAt(1, setDummy(
    molhoStartX + CC.x * (channelWidth / 2 + 6), 1.25, molhoStartZ + CC.z * (channelWidth / 2 + 6),
    1, 1, 1, 0, Math.atan2(molhoDirX, molhoDirZ), 0));
  molheIM.count = 2;
  molheIM.instanceMatrix.needsUpdate = true;
  state.scene.add(molheIM);

  // Farol
  const farolTip = {
    x: molhoStartX - CC.x * (channelWidth / 2 + 6) + molhoDirX * molhoLength,
    z: molhoStartZ - CC.z * (channelWidth / 2 + 6) + molhoDirZ * molhoLength
  };
  const lighthouseBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 8, 8), portConcrete);
  lighthouseBase.position.set(farolTip.x, 4, farolTip.z);
  state.scene.add(lighthouseBase);
  const lighthouseTop = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 4, 8), portDark);
  lighthouseTop.position.set(farolTip.x, 10, farolTip.z);
  state.scene.add(lighthouseTop);
  const lighthouseLight = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffdd66, emissiveIntensity: 1.5 }));
  lighthouseLight.position.set(farolTip.x, 12, farolTip.z);
  state.scene.add(lighthouseLight);

  // Boias
  const buoyRedMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, emissive: 0xff3333, emissiveIntensity: 0.35 });
  const buoyGreenMat = new THREE.MeshStandardMaterial({ color: 0x1f9e46, emissive: 0x33ff77, emissiveIntensity: 0.35 });
  const buoyGeo = new THREE.ConeGeometry(0.8, 1.8, 8);
  const buoyRedIM = makeInstanced(buoyGeo, buoyRedMat, 6, false);
  const buoyGreenIM = makeInstanced(buoyGeo, buoyGreenMat, 6, false);
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const bx = molhoStartX + molhoDirX * t * (molhoLength + 40);
    const bz = molhoStartZ + molhoDirZ * t * (molhoLength + 40);
    buoyRedIM.setMatrixAt(i, setDummy(
      bx - CC.x * (channelWidth / 2 + 2), 0.7, bz - CC.z * (channelWidth / 2 + 2), 1, 1, 1, 0, 0, 0));
    buoyGreenIM.setMatrixAt(i, setDummy(
      bx + CC.x * (channelWidth / 2 + 2), 0.7, bz + CC.z * (channelWidth / 2 + 2), 1, 1, 1, 0, 0, 0));
  }
  buoyRedIM.count = buoyGreenIM.count = 6;
  buoyRedIM.instanceMatrix.needsUpdate = true;
  buoyGreenIM.instanceMatrix.needsUpdate = true;
  state.scene.add(buoyRedIM);
  state.scene.add(buoyGreenIM);

  // Cais principal
  const caisMidX = caisStartX + CC.x * caisLength * 0.5;
  const caisMidZ = caisStartZ + CC.z * caisLength * 0.5;
  const cais = new THREE.Mesh(new THREE.BoxGeometry(caisLength, 1.5, caisWidth), portConcrete);
  cais.position.set(caisMidX, 1.6, caisMidZ);
  cais.rotation.y = caisAngle;
  state.scene.add(cais);

  // Trilho
  const rail = new THREE.Mesh(new THREE.BoxGeometry(caisLength + 10, 0.25, 2), railMat);
  rail.position.set(caisMidX, 2.4, caisMidZ);
  rail.rotation.y = caisAngle;
  state.scene.add(rail);

  // Defensas
  const fenderMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });
  const fenderGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
  const fenderIM = makeInstanced(fenderGeo, fenderMat, 21, false);
  for (let i = 0; i <= 20; i++) {
    const p = pt((i / 20) * caisLength, -1.5 - caisWidth / 2);
    fenderIM.setMatrixAt(i, setDummy(p.x, 2, p.z, 1, 1, 1, 0, caisAngle, Math.PI / 2));
  }
  fenderIM.count = 21;
  fenderIM.instanceMatrix.needsUpdate = true;
  state.scene.add(fenderIM);

  // ============================================================
  // 🏗️ PORTÊINERES (8 guindastes STS) — tudo instanciado
  // ============================================================
  const craneAlongPositions = [15, 65, 115, 165, 260, 310, 360, 410];
  const legH = 34, gaugeSea = 3, gaugeLand = 15, legSpan = 9;

  const craneLegGeo = new THREE.CylinderGeometry(1.1, 1.5, legH, 8);
  const craneLegIM = makeInstanced(craneLegGeo, craneMat, 32, false);
  const braceGeo = new THREE.BoxGeometry(0.4, legH * 0.7, 0.4);
  const braceIM = makeInstanced(braceGeo, craneMatDark, 32, false);
  const seaTopGeo = new THREE.BoxGeometry(legSpan + 2, 1.6, 1.6);
  const seaTopIM = makeInstanced(seaTopGeo, craneMat, 8, false);
  const landTopGeo = new THREE.BoxGeometry(legSpan + 2, 1.6, 1.6);
  const landTopIM = makeInstanced(landTopGeo, craneMat, 8, false);
  const crossSpan = gaugeLand + gaugeSea;
  const crossGeo = new THREE.BoxGeometry(1.4, 1.4, crossSpan + 2);
  const crossIM = makeInstanced(crossGeo, craneMatDark, 16, false);
  const boomSea = 34;
  const boomSeaGeo = new THREE.BoxGeometry(1.6, 1.6, boomSea);
  const boomSeaIM = makeInstanced(boomSeaGeo, craneMat, 8, false);
  const boomLand = 14;
  const boomLandGeo = new THREE.BoxGeometry(1.6, 1.6, boomLand);
  const boomLandIM = makeInstanced(boomLandGeo, craneMatDark, 8, false);
  const machineGeo = new THREE.BoxGeometry(6, 3, 5);
  const machineIM = makeInstanced(machineGeo, portDark, 8, false);
  const trolleyGeo = new THREE.BoxGeometry(2.4, 1, 2.4);
  const trolleyIM = makeInstanced(trolleyGeo, portDark, 8, false);
  const cableLen = 14;
  const cableGeo = new THREE.CylinderGeometry(0.08, 0.08, cableLen, 4);
  const cableIM = makeInstanced(cableGeo, railMat, 8, false);
  const spreaderGeo = new THREE.BoxGeometry(6.3, 0.6, 2.6);
  const spreaderIM = makeInstanced(spreaderGeo, craneMatDark, 8, false);
  const hangContGeo = new THREE.BoxGeometry(6.1, 2.5, 2.4);
  const hangContIM = makeInstanced(hangContGeo, containerColors[0], 8);

  craneAlongPositions.forEach((along, gi) => {
    const legPts = [
      pt(along - legSpan / 2, -gaugeSea), pt(along + legSpan / 2, -gaugeSea),
      pt(along - legSpan / 2, gaugeLand), pt(along + legSpan / 2, gaugeLand)
    ];
    legPts.forEach((p, li) => {
      const idx = gi * 4 + li;
      craneLegIM.setMatrixAt(idx, setDummy(p.x, legH / 2, p.z, 1, 1, 1, 0, 0, 0));
      braceIM.setMatrixAt(idx, setDummy(p.x, legH * 0.45, p.z, 1, 1, 1, 0.35, 0, 0));
    });

    const seaMid = pt(along, -gaugeSea);
    const landMid = pt(along, gaugeLand);

    seaTopIM.setMatrixAt(gi, setDummy(seaMid.x, legH, seaMid.z, 1, 1, 1, 0, caisAngle, 0));
    landTopIM.setMatrixAt(gi, setDummy(landMid.x, legH, landMid.z, 1, 1, 1, 0, caisAngle, 0));

    const crossPL = pt(along - legSpan / 2, (gaugeLand - gaugeSea) / 2);
    const crossPR = pt(along + legSpan / 2, (gaugeLand - gaugeSea) / 2);
    crossIM.setMatrixAt(gi * 2, setDummy(crossPL.x, legH, crossPL.z, 1, 1, 1, 0, seaAngle, 0));
    crossIM.setMatrixAt(gi * 2 + 1, setDummy(crossPR.x, legH, crossPR.z, 1, 1, 1, 0, seaAngle, 0));

    const boomSeaEnd = pt(along, -gaugeSea - boomSea);
    boomSeaIM.setMatrixAt(gi, setDummy(
      (seaMid.x + boomSeaEnd.x) / 2, legH, (seaMid.z + boomSeaEnd.z) / 2,
      1, 1, 1, 0, seaAngle, 0));

    const boomLandEnd = pt(along, gaugeLand + boomLand);
    boomLandIM.setMatrixAt(gi, setDummy(
      (landMid.x + boomLandEnd.x) / 2, legH, (landMid.z + boomLandEnd.z) / 2,
      1, 1, 1, 0, seaAngle, 0));

    machineIM.setMatrixAt(gi, setDummy(landMid.x, legH + 2.2, landMid.z, 1, 1, 1, 0, 0, 0));

    const trolleyT = 0.55 + (along % 40) / 200;
    const trolleyPos = pt(along, -gaugeSea - boomSea * trolleyT);
    trolleyIM.setMatrixAt(gi, setDummy(trolleyPos.x, legH - 0.5, trolleyPos.z, 1, 1, 1, 0, 0, 0));
    cableIM.setMatrixAt(gi, setDummy(trolleyPos.x, legH - 0.5 - cableLen / 2, trolleyPos.z, 1, 1, 1, 0, 0, 0));
    spreaderIM.setMatrixAt(gi, setDummy(trolleyPos.x, legH - 1 - cableLen, trolleyPos.z, 1, 1, 1, 0, caisAngle, 0));
    hangContIM.setMatrixAt(gi, setDummy(trolleyPos.x, legH - 2.5 - cableLen, trolleyPos.z, 1, 1, 1, 0, caisAngle, 0));
    _col.setHSL(Math.random(), 0.6, 0.5);
    hangContIM.setColorAt(gi, _col);
  });

  [craneLegIM, braceIM, seaTopIM, landTopIM, crossIM, boomSeaIM, boomLandIM, machineIM, trolleyIM, cableIM, spreaderIM].forEach(im => {
    im.count = im.instanceMatrix.count;
    im.instanceMatrix.needsUpdate = true;
    state.scene.add(im);
  });
  hangContIM.count = 8;
  hangContIM.instanceMatrix.needsUpdate = true;
  hangContIM.instanceColor.needsUpdate = true;
  state.scene.add(hangContIM);

  // ============================================================
  // 📦 PÁTIO DE CONTÊINERES
  // ============================================================
  const contL = 6.1, contW = 2.44, gapAlong = 1.0, gapDepth = 0.6;
  const contGeo = new THREE.BoxGeometry(contL, 2.6, contW);

  const yardBlocks = [
    { alongStart: 10, alongLen: 100, depthStart: 22, depthLen: 68, stackH: 4, colorSeed: 0 },
    { alongStart: 10, alongLen: 100, depthStart: 100, depthLen: 68, stackH: 3, colorSeed: 2 },
    { alongStart: 140, alongLen: 100, depthStart: 22, depthLen: 68, stackH: 5, colorSeed: 1 },
    { alongStart: 140, alongLen: 100, depthStart: 100, depthLen: 68, stackH: 3, colorSeed: 3 },
    { alongStart: 270, alongLen: 90, depthStart: 22, depthLen: 68, stackH: 4, colorSeed: 4 },
    { alongStart: 270, alongLen: 90, depthStart: 100, depthLen: 68, stackH: 4, colorSeed: 0 },
    { alongStart: 380, alongLen: 70, depthStart: 22, depthLen: 68, stackH: 3, colorSeed: 2 },
    { alongStart: 380, alongLen: 70, depthStart: 100, depthLen: 68, stackH: 5, colorSeed: 1 }
  ];

  let totalContainers = 0;
  yardBlocks.forEach(b => {
    const cols = Math.max(1, Math.floor(b.alongLen / (contL + gapAlong)));
    const rows = Math.max(1, Math.floor(b.depthLen / (contW + gapDepth)));
    totalContainers += cols * rows * b.stackH;
  });

  const yardContIM = makeInstanced(contGeo, containerColors[0], totalContainers);
  let contIdx = 0;
  yardBlocks.forEach(b => {
    const cols = Math.max(1, Math.floor(b.alongLen / (contL + gapAlong)));
    const rows = Math.max(1, Math.floor(b.depthLen / (contW + gapDepth)));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const along = b.alongStart + c * (contL + gapAlong) + contL / 2;
        const depth = b.depthStart + r * (contW + gapDepth) + contW / 2;
        const p = pt(along, depth);
        const matIdx = (r + c + b.colorSeed) % containerColors.length;
        _col.set(containerColors[matIdx].color);
        for (let h = 0; h < b.stackH; h++) {
          yardContIM.setMatrixAt(contIdx, setDummy(p.x, h * 2.6 + 1.3, p.z, 1, 1, 1, 0, caisAngle, 0));
          yardContIM.setColorAt(contIdx, _col);
          contIdx++;
        }
      }
    }
  });
  yardContIM.count = contIdx;
  yardContIM.instanceMatrix.needsUpdate = true;
  yardContIM.instanceColor.needsUpdate = true;
  state.scene.add(yardContIM);

  // ============================================================
  // 🏗️ RTGs (4 guindastes de pátio)
  // ============================================================
  const rtgPositions = [
    { along: 60, depth: 60, spanAlong: 90 },
    { along: 190, depth: 60, spanAlong: 90 },
    { along: 315, depth: 60, spanAlong: 80 },
    { along: 415, depth: 60, spanAlong: 60 }
  ];
  const rtgLegH = 15, rtgHalfDepth = 10;
  const rtgLegGeo = new THREE.CylinderGeometry(0.45, 0.55, rtgLegH, 6);
  const rtgLegIM = makeInstanced(rtgLegGeo, craneMatDark, 16, false);
  const rtgBeamGeo = new THREE.BoxGeometry(1, 1, 1);
  const rtgBeamIM = makeInstanced(rtgBeamGeo, craneMatDark, 8, false);
  const rtgCrossGeo = new THREE.BoxGeometry(1, 1, 1);
  const rtgCrossIM = makeInstanced(rtgCrossGeo, craneMat, 4, false);

  let rtgLegIdx = 0, rtgBeamIdx = 0, rtgCrossIdx = 0;
  rtgPositions.forEach(rtg => {
    const legPts = [
      pt(rtg.along - rtg.spanAlong / 2, rtg.depth - rtgHalfDepth),
      pt(rtg.along + rtg.spanAlong / 2, rtg.depth - rtgHalfDepth),
      pt(rtg.along - rtg.spanAlong / 2, rtg.depth + rtgHalfDepth),
      pt(rtg.along + rtg.spanAlong / 2, rtg.depth + rtgHalfDepth)
    ];
    legPts.forEach(p => {
      rtgLegIM.setMatrixAt(rtgLegIdx++, setDummy(p.x, rtgLegH / 2, p.z, 1, 1, 1, 0, 0, 0));
    });
    const m1 = pt(rtg.along, rtg.depth - rtgHalfDepth);
    const m2 = pt(rtg.along, rtg.depth + rtgHalfDepth);
    rtgBeamIM.setMatrixAt(rtgBeamIdx++, setDummy(m1.x, rtgLegH, m1.z, rtg.spanAlong + 2, 1, 1, 0, caisAngle, 0));
    rtgBeamIM.setMatrixAt(rtgBeamIdx++, setDummy(m2.x, rtgLegH, m2.z, rtg.spanAlong + 2, 1, 1, 0, caisAngle, 0));
    const mc = pt(rtg.along, rtg.depth);
    rtgCrossIM.setMatrixAt(rtgCrossIdx++, setDummy(mc.x, rtgLegH, mc.z, 1, 1, rtgHalfDepth * 2 + 2, 0, seaAngle, 0));
  });
  rtgLegIM.count = rtgLegIdx; rtgBeamIM.count = rtgBeamIdx; rtgCrossIM.count = rtgCrossIdx;
  [rtgLegIM, rtgBeamIM, rtgCrossIM].forEach(im => {
    im.instanceMatrix.needsUpdate = true;
    state.scene.add(im);
  });

  // ============================================================
  // 🏭 ARMAZÉNS PORTUÁRIOS (6)
  // ============================================================
  const warehouseGeo = new THREE.BoxGeometry(34, 13, 20);
  const warehouseIM = makeInstanced(warehouseGeo, portDark, 6, false);
  const warehouseRoofGeo = new THREE.BoxGeometry(36, 0.5, 22);
  const warehouseRoofMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
  const warehouseRoofIM = makeInstanced(warehouseRoofGeo, warehouseRoofMat, 6, false);
  for (let i = 0; i < 6; i++) {
    const along = 40 + i * 65;
    const p = pt(along, 200);
    warehouseIM.setMatrixAt(i, setDummy(p.x, 6.5, p.z, 1, 1, 1, 0, caisAngle, 0));
    warehouseRoofIM.setMatrixAt(i, setDummy(p.x, 13.3, p.z, 1, 1, 1, 0, caisAngle, 0));
  }
  warehouseIM.count = warehouseRoofIM.count = 6;
  warehouseIM.instanceMatrix.needsUpdate = true;
  warehouseRoofIM.instanceMatrix.needsUpdate = true;
  state.scene.add(warehouseIM);
  state.scene.add(warehouseRoofIM);

  // ============================================================
  // 🚤 REBOCADOR NO CANAL
  // ============================================================
  const tugX = molhoStartX + molhoDirX * 30;
  const tugZ = molhoStartZ + molhoDirZ * 30;
  const tugHullMat = new THREE.MeshStandardMaterial({ color: 0xb5342a, roughness: 0.7 });
  const tugCabinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const tugHull = new THREE.Mesh(new THREE.BoxGeometry(9, 3, 4), tugHullMat);
  tugHull.position.set(tugX, 1.5, tugZ);
  tugHull.rotation.y = Math.atan2(molhoDirX, molhoDirZ);
  state.scene.add(tugHull);
  const tugCabin = new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 3), tugCabinMat);
  tugCabin.position.set(tugX, 4.3, tugZ);
  tugCabin.rotation.y = Math.atan2(molhoDirX, molhoDirZ);
  state.scene.add(tugCabin);

  // ============================================================
  // 🚢 TERMINAL DE BALSAS (para Guarujá)
  // ============================================================
  const ferryTerminal = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 20), portConcrete);
  ferryTerminal.position.set(1800, 1.5, -745);
  ferryTerminal.rotation.y = caisAngle;
  state.scene.add(ferryTerminal);

  const ferryRoofMat = new THREE.MeshStandardMaterial({ color: 0x7a3a28, roughness: 0.85 });
  const ferryRoof = new THREE.Mesh(new THREE.BoxGeometry(34, 0.5, 24), ferryRoofMat);
  ferryRoof.position.set(1800, 3.5, -745);
  ferryRoof.rotation.y = caisAngle;
  state.scene.add(ferryRoof);

  const pillarGeo = new THREE.CylinderGeometry(0.4, 0.5, 3, 8);
  const pillarIM = makeInstanced(pillarGeo, portDark, 4, false);
  let pIdx = 0;
  for (const [fx, rz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const px = 1800 + CC.x * fx * 12;
    const pz = -745 + CC.z * rz * 8;
    pillarIM.setMatrixAt(pIdx++, setDummy(px, 1.5, pz, 1, 1, 1, 0, 0, 0));
  }
  pillarIM.count = 4;
  pillarIM.instanceMatrix.needsUpdate = true;
  state.scene.add(pillarIM);

  const ferryHullMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
  const ferryDeckMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const ferryHull = new THREE.Mesh(new THREE.BoxGeometry(25, 2, 10), ferryHullMat);
  ferryHull.position.set(1830, 1.2, -735);
  ferryHull.rotation.y = caisAngle;
  state.scene.add(ferryHull);
  const ferryDeck = new THREE.Mesh(new THREE.BoxGeometry(23, 0.5, 8), ferryDeckMat);
  ferryDeck.position.set(1830, 2.5, -735);
  ferryDeck.rotation.y = caisAngle;
  state.scene.add(ferryDeck);

  // ============================================================
  // 🏖️ QUIOSQUES DA PRAIA (14)
  // ============================================================
  const qMat = new THREE.MeshStandardMaterial({ color: 0xe8dfc4, roughness: 0.8, emissive: 0xffddaa, emissiveIntensity: 0 });
  worldFX.cityMats.push(qMat);
  worldFX.round.push({ mat: qMat, k: 0.3 });
  const qRoofMat = new THREE.MeshStandardMaterial({ color: 0x9c4a38, roughness: 0.85 });
  const qLampMat = new THREE.MeshStandardMaterial({ color: 0xfff5d1, emissive: 0xffddaa, emissiveIntensity: 0.8 });
  worldFX.round.push({ mat: qLampMat, k: 0.9 });

  const kioskGeo = new THREE.BoxGeometry(3.5, 2.5, 3.5);
  const kioskRoofGeo = new THREE.ConeGeometry(2.8, 1.2, 4);
  const kioskLampGeo = new THREE.SphereGeometry(0.2, 6, 6);
  const kioskIM = makeInstanced(kioskGeo, qMat, 14, false);
  const kioskRoofIM = makeInstanced(kioskRoofGeo, qRoofMat, 14, false);
  const kioskLampIM = makeInstanced(kioskLampGeo, qLampMat, 14, false);
  for (let i = 0; i < 14; i++) {
    const t = (i / 13 - 0.5) * 2 * 300;
    const x = D.x + CC.x * t - SD.x * 50;
    const z = D.z + CC.z * t - SD.z * 50;
    kioskIM.setMatrixAt(i, setDummy(x, 1.75, z, 1, 1, 1, 0, Math.random() * 0.3, 0));
    kioskRoofIM.setMatrixAt(i, setDummy(x, 4.6, z, 1, 1, 1, 0, Math.PI / 4, 0));
    kioskLampIM.setMatrixAt(i, setDummy(x, 4.0, z, 1, 1, 1, 0, 0, 0));
  }
  kioskIM.count = kioskRoofIM.count = kioskLampIM.count = 14;
  [kioskIM, kioskRoofIM, kioskLampIM].forEach(im => {
    im.instanceMatrix.needsUpdate = true;
    state.scene.add(im);
  });

  // ============================================================
  // 🌃 ILUMINAÇÃO PÚBLICA (30 postes)
  // ============================================================
  const streetLampMat = new THREE.MeshStandardMaterial({ color: 0xfff5d1, emissive: 0xffddaa, emissiveIntensity: 0.95 });
  worldFX.round.push({ mat: streetLampMat, k: 0.85 });
  const streetLampPostMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });

  const postGeo = new THREE.CylinderGeometry(0.1, 0.15, 5.5, 6);
  const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6);
  const lampGeo = new THREE.SphereGeometry(0.25, 8, 8);
  const postIM = makeInstanced(postGeo, streetLampPostMat, 30, false);
  const armIM = makeInstanced(armGeo, streetLampPostMat, 30, false);
  const lampIM = makeInstanced(lampGeo, streetLampMat, 30, false);
  for (let i = 0; i < 30; i++) {
    const t = (i / 29 - 0.5) * D.spread * 1.0;
    const x = D.x + CC.x * t - SD.x * (D.inset - 5);
    const z = D.z + CC.z * t - SD.z * (D.inset - 5);
    postIM.setMatrixAt(i, setDummy(x, 2.75, z, 1, 1, 1, 0, 0, 0));
    armIM.setMatrixAt(i, setDummy(x, 5.5, z, 1, 1, 1, Math.PI / 2, 0, 0));
    lampIM.setMatrixAt(i, setDummy(x + CC.x * 0.9, 5.8, z + CC.z * 0.9, 1, 1, 1, 0, 0, 0));
  }
  postIM.count = armIM.count = lampIM.count = 30;
  [postIM, armIM, lampIM].forEach(im => {
    im.instanceMatrix.needsUpdate = true;
    state.scene.add(im);
  });

  // ============================================================
  // 🪨 ROCHAS DECORATIVAS (6)
  // ============================================================
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1, flatShading: true });
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rockIM = makeInstanced(rockGeo, rockMat, 6, false);
  for (let i = 0; i < 6; i++) {
    const t = (i / 5 - 0.5) * 80;
    const x = D.x + CC.x * t - SD.x * 20;
    const z = D.z + CC.z * t - SD.z * 20;
    const rockSize = 0.8 + Math.random() * 1.8;
    rockIM.setMatrixAt(i, setDummy(x, 0.1 + rockSize * 0.25, z, rockSize, rockSize, rockSize, Math.random(), Math.random(), Math.random()));
  }
  rockIM.count = 6;
  rockIM.instanceMatrix.needsUpdate = true;
  state.scene.add(rockIM);
}