// js/world/cities/peruibe.js — prédio redondo: mais baixo, recuado da praia (usando direção da costa)
// ⚡ VERSÃO ULTRA-OTIMIZADA: merge manual de geometrias + zero dependências externas
import * as THREE from 'three';
import { state } from '../../state.js';
import { CITY_DATA, makeBuildingMat, placeRowAlongCoast, placeBuilding, CC, SD } from './city-shared.js';

// ============================================================
// ⚡ FUNÇÃO DE MERGE INLINE (substitui BufferGeometryUtils)
// Mescla múltiplas geometrias estáticas em uma só, eliminando draw calls
// ============================================================
function mergeGeometries(geometries) {
  const positions = [];
  const normals = [];
  const uvs = [];

  for (const geo of geometries) {
    // Converte geometrias indexadas em não-indexadas (evita conflitos de índices)
    const nonIndexed = geo.index !== null ? geo.toNonIndexed() : geo;

    const pos = nonIndexed.attributes.position.array;
    positions.push(...pos);

    if (nonIndexed.attributes.normal) {
      normals.push(...nonIndexed.attributes.normal.array);
    }

    if (nonIndexed.attributes.uv) {
      uvs.push(...nonIndexed.attributes.uv.array);
    }

    // Libera memória da geometria temporária
    if (geo !== nonIndexed) nonIndexed.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length > 0) merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  if (uvs.length > 0) merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  merged.computeBoundingSphere();
  return merged;
}

export function buildPeruibe(worldFX) {
  const D = CITY_DATA.peruibe;
  const mat = makeBuildingMat();
  worldFX.cityMats.push(mat);

  const dummy = new THREE.Object3D();

  // ============================================================
  // 🏙️ ORLA PRINCIPAL — prédios baixos/médios ao longo da praia
  // ============================================================
  placeRowAlongCoast({
    centerX: D.x, centerZ: D.z, n: D.n,
    hMin: D.hMin, hMax: D.hMax,
    spread: D.spread, inset: D.inset, mat,
    colFn: () => new THREE.Color().setHSL(0.08, 0.08 + Math.random() * 0.08, 0.65 + Math.random() * 0.15)
  });

  // Segunda fileira, mais alta e recuada (centro)
  placeRowAlongCoast({
    centerX: D.x, centerZ: D.z, n: 14,
    hMin: 5, hMax: 12,
    spread: D.spread * 0.75, inset: D.inset + 70, mat,
    colFn: () => new THREE.Color().setHSL(0.09, 0.10, 0.70)
  });

  // Alguns prédios altos no centro (espalhados)
  const tallM = makeBuildingMat();
  tallM.color.setHSL(0.08, 0.15, 0.6);
  worldFX.cityMats.push(tallM);
  for (let i = 0; i < 6; i++) {
    const t = (i / 5 - 0.5) * D.spread * 0.6;
    const x = D.x + CC.x * t - SD.x * (D.inset + 120);
    const z = D.z + CC.z * t - SD.z * (D.inset + 120);
    const h = 15 + Math.random() * 15;
    placeBuilding(x, z, 6, h, 6, Math.random() * 0.3, tallM);
  }

  // ============================================================
  // 🏢 EDIFÍCIO SERRA DOS ITATIS — GEOMETRIAS MESCLADAS!
  // ⚡ De ~15 meshes → 1 mesh único (todos elementos estáticos)
  // ============================================================
  const rm = new THREE.MeshStandardMaterial({
    color: 0xf2f0e8,
    roughness: 0.6,
    emissive: 0xffe9c0,
    emissiveIntensity: 0.35
  });
  worldFX.round.push({ mat: rm, k: 0.12 });

  const radius = 30;
  const height = 55;
  const baseY = 2;

  const inlandOffset = 120;
  const buildingX = -840 - SD.x * inlandOffset;
  const buildingZ = 330 - SD.z * inlandOffset;

  // ⚡ MESCLAR TODAS AS GEOMETRIAS ESTÁTICAS DO PRÉDIO EM UMA SÓ
  const staticGeometries = [];

  // Torre principal — 16 segmentos é suficiente para um cilindro à distância
  const towerGeo = new THREE.CylinderGeometry(radius, radius * 1.03, height, 16);
  towerGeo.translate(buildingX, baseY + height / 2, buildingZ);
  staticGeometries.push(towerGeo);

  // Parapeito (anel no topo)
  const parapetGeo = new THREE.TorusGeometry(radius - 0.5, 0.6, 4, 16);
  parapetGeo.rotateX(Math.PI / 2);
  parapetGeo.translate(buildingX, baseY + height, buildingZ);
  staticGeometries.push(parapetGeo);

  // Cobertura (laje)
  const roofGeo = new THREE.CircleGeometry(radius - 0.3, 16);
  roofGeo.rotateX(-Math.PI / 2);
  roofGeo.translate(buildingX, baseY + height, buildingZ);
  staticGeometries.push(roofGeo);

  // Heliponto
  const helipadGeo = new THREE.CircleGeometry(6, 12);
  helipadGeo.rotateX(-Math.PI / 2);
  helipadGeo.translate(buildingX, baseY + height + 0.1, buildingZ);
  staticGeometries.push(helipadGeo);

  // Ring do heliponto (letra H)
  const hMarkGeo = new THREE.RingGeometry(5.5, 6, 12);
  hMarkGeo.rotateX(-Math.PI / 2);
  hMarkGeo.translate(buildingX, baseY + height + 0.15, buildingZ);
  staticGeometries.push(hMarkGeo);

  // Caixa d'água
  const tankGeo = new THREE.CylinderGeometry(3.5, 3.5, 6, 8);
  tankGeo.translate(buildingX, baseY + height + 3, buildingZ);
  staticGeometries.push(tankGeo);

  // Antena
  const antennaGeo = new THREE.CylinderGeometry(0.3, 0.3, 12, 4);
  antennaGeo.translate(buildingX, baseY + height + 12, buildingZ);
  staticGeometries.push(antennaGeo);

  // Base alargada (podium)
  const baseGeo = new THREE.CylinderGeometry(radius + 4, radius + 4.5, 8, 16);
  baseGeo.translate(buildingX, baseY - 1, buildingZ);
  staticGeometries.push(baseGeo);

  // ⚡ MESCLAR TUDO EM UMA ÚNICA GEOMETRIA
  const mergedBuildingGeo = mergeGeometries(staticGeometries);
  const mergedBuilding = new THREE.Mesh(mergedBuildingGeo, rm);
  state.scene.add(mergedBuilding);

  // ============================================================
  // 🔩 PILARES VERTICAIS ⚡ INSTANCIADOS (1 draw call)
  // ============================================================
  const pillarCount = 20;
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xe0ddd0, roughness: 0.5 });
  const pillarGeo = new THREE.BoxGeometry(0.9, height - 2, 0.9);
  const pillarInstanced = new THREE.InstancedMesh(pillarGeo, pillarMat, pillarCount);

  for (let i = 0; i < pillarCount; i++) {
    const angle = (i / pillarCount) * Math.PI * 2;
    const px = buildingX + Math.cos(angle) * (radius - 1.0);
    const pz = buildingZ + Math.sin(angle) * (radius - 1.0);
    dummy.position.set(px, baseY + height / 2, pz);
    dummy.rotation.set(0, angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    pillarInstanced.setMatrixAt(i, dummy.matrix);
  }
  pillarInstanced.instanceMatrix.needsUpdate = true;
  state.scene.add(pillarInstanced);

  // ============================================================
  // FAIXAS HORIZONTAIS ⚡ INSTANCIADAS (1 draw call)
  // ============================================================
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0x1c2a33,
    emissive: 0xffd9a0,
    emissiveIntensity: 0.1
  });
  worldFX.round.push({ mat: bandMat, k: 0.9 });

  const bandCount = 12;
  const bandSpacing = (height - 4) / bandCount;
  const bandGeo = new THREE.TorusGeometry(radius + 0.25, 0.3, 4, 16);
  const bandInstanced = new THREE.InstancedMesh(bandGeo, bandMat, bandCount + 1);

  for (let i = 0; i <= bandCount; i++) {
    const y = baseY + 2 + i * bandSpacing;
    dummy.position.set(buildingX, y, buildingZ);
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bandInstanced.setMatrixAt(i, dummy.matrix);
  }
  bandInstanced.instanceMatrix.needsUpdate = true;
  state.scene.add(bandInstanced);

  // ============================================================
  // 🏠 CASINHAS CAIÇARAS ⚡ INSTANCIADAS
  // ============================================================
  const woodM = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.9 });
  const roofM = new THREE.MeshStandardMaterial({ color: 0x9c4a38, roughness: 0.85 });

  const houseCount = 6;
  const houseGeo = new THREE.BoxGeometry(4, 3.2, 4);
  const houseRoofGeo = new THREE.ConeGeometry(3.2, 1.5, 4);

  const houseInstanced = new THREE.InstancedMesh(houseGeo, woodM, houseCount);
  const roofInstanced = new THREE.InstancedMesh(houseRoofGeo, roofM, houseCount);

  for (let i = 0; i < houseCount; i++) {
    const t = (i / (houseCount - 1) - 0.5) * 200;
    const x = D.x + CC.x * t - SD.x * 35;
    const z = D.z + CC.z * t - SD.z * 35;

    dummy.position.set(x, 1.6, z);
    dummy.rotation.set(0, Math.random() * 0.3, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    houseInstanced.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, 4.85, z);
    dummy.rotation.set(0, Math.PI / 4, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    roofInstanced.setMatrixAt(i, dummy.matrix);
  }

  houseInstanced.instanceMatrix.needsUpdate = true;
  roofInstanced.instanceMatrix.needsUpdate = true;
  state.scene.add(houseInstanced);
  state.scene.add(roofInstanced);

  // ============================================================
  // 🏝️ ILHA DO COSTÃO ⚡ INSTANCIADA
  // ============================================================
  const rockM = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1, flatShading: true });
  const islandCenterX = -650;
  const islandCenterZ = -500;

  const islandBase = new THREE.Mesh(
    new THREE.DodecahedronGeometry(25, 0),
    new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.9, flatShading: true })
  );
  islandBase.position.set(islandCenterX, -3, islandCenterZ);
  islandBase.scale.set(1.4, 0.7, 1.4);
  state.scene.add(islandBase);

  const rockGeo = new THREE.DodecahedronGeometry(1, 0);

  // Rochas principais
  const mainRocksCount = 8;
  const mainRockInstanced = new THREE.InstancedMesh(rockGeo, rockM, mainRocksCount);

  for (let i = 0; i < mainRocksCount; i++) {
    const angle = (i / mainRocksCount) * Math.PI * 2;
    const dist = 10 + Math.random() * 18;
    const x = islandCenterX + Math.cos(angle) * dist;
    const z = islandCenterZ + Math.sin(angle) * dist;
    const rockSize = 7 + Math.random() * 12;

    dummy.position.set(x, (rockSize * 0.45) + Math.random() * 4, z);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.scale.set(rockSize, rockSize, rockSize);
    dummy.updateMatrix();
    mainRockInstanced.setMatrixAt(i, dummy.matrix);
  }
  mainRockInstanced.instanceMatrix.needsUpdate = true;
  state.scene.add(mainRockInstanced);

  // Rochas pequenas
  const smallRocksCount = 6;
  const smallRockInstanced = new THREE.InstancedMesh(rockGeo, rockM, smallRocksCount);

  for (let i = 0; i < smallRocksCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 15;
    const x = islandCenterX + Math.cos(angle) * dist;
    const z = islandCenterZ + Math.sin(angle) * dist;
    const rockSize = 2 + Math.random() * 6;

    dummy.position.set(x, rockSize * 0.3, z);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.scale.set(rockSize, rockSize, rockSize);
    dummy.updateMatrix();
    smallRockInstanced.setMatrixAt(i, dummy.matrix);
  }
  smallRockInstanced.instanceMatrix.needsUpdate = true;
  state.scene.add(smallRockInstanced);

  // ============================================================
  // 🌴 COQUEIROS ⚡ INSTANCIADOS
  // ============================================================
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 0.7 });

  const palmCount = 8;
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 1, 5);
  const leafGeo = new THREE.SphereGeometry(1, 5, 3);

  const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, palmCount);
  const leafInstanced = new THREE.InstancedMesh(leafGeo, leafMat, palmCount);

  for (let i = 0; i < palmCount; i++) {
    const t = (i / (palmCount - 1) - 0.5) * 240;
    const x = D.x + CC.x * t - SD.x * 20;
    const z = D.z + CC.z * t - SD.z * 20;
    const trunkHeight = 4 + Math.random() * 3;
    const leafSize = 1.8 + Math.random();

    dummy.position.set(x, trunkHeight / 2, z);
    dummy.rotation.set((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.15);
    dummy.scale.set(1, trunkHeight, 1);
    dummy.updateMatrix();
    trunkInstanced.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, trunkHeight + 0.8, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(leafSize, leafSize, leafSize);
    dummy.updateMatrix();
    leafInstanced.setMatrixAt(i, dummy.matrix);
  }

  trunkInstanced.instanceMatrix.needsUpdate = true;
  leafInstanced.instanceMatrix.needsUpdate = true;
  state.scene.add(trunkInstanced);
  state.scene.add(leafInstanced);

  // ============================================================
  // 🅿️ ESTACIONAMENTO AO REDOR DO PRÉDIO
  // ============================================================
  const asphalt = new THREE.Mesh(
    new THREE.CircleGeometry(radius + 8, 12),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 })
  );
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.set(buildingX, 0.05, buildingZ);
  state.scene.add(asphalt);
}