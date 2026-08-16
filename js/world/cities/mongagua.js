// js/world/cities/mongagua.js — porto pesqueiro médio (sem passarela longa)
import * as THREE from 'three';
import { state } from '../../state.js';
import { CITY_DATA, makeBuildingMat, placeRowAlongCoast, placeBuilding, addPalm, CC, SD } from './city-shared.js';

export function buildMongagua(worldFX) {
  const D = CITY_DATA.mongagua;

  // ============================================================
  // 🎨 MATERIAIS
  // ============================================================
  const matWhite = makeBuildingMat({ color: 0xf0ece0, roughness: 0.8 });
  worldFX.cityMats.push(matWhite);
  worldFX.round.push({ mat: matWhite, k: 0.3 });

  const matBeige = makeBuildingMat({ color: 0xd9c7b8, roughness: 0.8 });
  worldFX.cityMats.push(matBeige);

  const matBlue = makeBuildingMat({ color: 0x8fb8d9, roughness: 0.8 });
  worldFX.cityMats.push(matBlue);

  const matTerracotta = makeBuildingMat({ color: 0xc98a6b, roughness: 0.85 });
  worldFX.cityMats.push(matTerracotta);

  const matGreen = makeBuildingMat({ color: 0xa8c9a0, roughness: 0.8 });
  worldFX.cityMats.push(matGreen);

  const matYellow = makeBuildingMat({ color: 0xf2d49b, roughness: 0.8 });
  worldFX.cityMats.push(matYellow);

  const matLit = makeBuildingMat({
    color: 0x555555,
    emissive: 0xffddaa,
    emissiveIntensity: 0.5,
    roughness: 0.6
  });
  worldFX.cityMats.push(matLit);
  worldFX.round.push({ mat: matLit, k: 0.7 });

  // ============================================================
  // 🏙️ ORLA E BAIRROS
  // ============================================================
  placeRowAlongCoast({
    centerX: D.x, centerZ: D.z, n: D.n,
    hMin: D.hMin, hMax: D.hMax,
    spread: D.spread, inset: D.inset,
    mat: matWhite,
    colFn: () => new THREE.Color().setHSL(0.07, 0.08, 0.75)
  });

  placeRowAlongCoast({
    centerX: D.x, centerZ: D.z, n: 26,
    hMin: 5, hMax: 12,
    spread: D.spread * 0.95, inset: D.inset + 60,
    mat: matBeige,
    colFn: () => new THREE.Color().setHSL(0.08, 0.12, 0.70)
  });

  placeRowAlongCoast({
    centerX: D.x, centerZ: D.z, n: 30,
    hMin: 3, hMax: 8,
    spread: D.spread * 1.0, inset: D.inset + 120,
    mat: matBlue,
    colFn: () => new THREE.Color().setHSL(0.06, 0.10, 0.65)
  });

  placeRowAlongCoast({
    centerX: D.x, centerZ: D.z, n: 34,
    hMin: 2.5, hMax: 6,
    spread: D.spread * 1.05, inset: D.inset + 180,
    mat: matTerracotta,
    colFn: () => new THREE.Color().setHSL(0.07, 0.08, 0.70)
  });

  // ============================================================
  // 🏢 PRÉDIOS INDIVIDUAIS (alguns com luzes)
  // ============================================================
  const buildingColors = [0xf5e6d3, 0xd9c7b8, 0xc9b8a8, 0xe8e0d0, 0xfce4d6, 0xd5c9b0, 0xf2d49b];
  for (let i = 0; i < 50; i++) {
    const t = (i / 49 - 0.5) * D.spread * 1.05;
    const inset = D.inset + 20 + Math.random() * 200;
    const x = D.x + CC.x * t - SD.x * inset;
    const z = D.z + CC.z * t - SD.z * inset;
    const w = 4 + Math.random() * 7;
    const h = 2.5 + Math.random() * 9;
    const d = 4 + Math.random() * 7;

    const useLit = h > 5 && Math.random() < 0.35;
    let bMat;
    if (useLit) {
      bMat = makeBuildingMat({
        color: 0x555555,
        emissive: 0xffddaa,
        emissiveIntensity: 0.4 + Math.random() * 0.3,
        roughness: 0.6
      });
      worldFX.round.push({ mat: bMat, k: 0.5 });
    } else {
      const col = new THREE.Color(buildingColors[Math.floor(Math.random() * buildingColors.length)]);
      bMat = makeBuildingMat({ color: col, roughness: 0.85 });
    }
    worldFX.cityMats.push(bMat);
    placeBuilding(x, z, w, h, d, Math.random() * 0.4, bMat);
  }

  // ============================================================
  // ⚓ CAIS DE ATRACAÇÃO (curto, para barcos de pesca)
  // ============================================================
  const concreteM = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.95 });
  const concreteDarkM = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 });
  const metalM = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.6 });

  const dockStartX = D.x + SD.x * 25;
  const dockStartZ = D.z + SD.z * 25;
  const dockLength = 35; // comprimento curto
  const dockDirX = SD.x, dockDirZ = SD.z;
  const dockAngle = Math.atan2(dockDirX, dockDirZ);
  const dockMidX = dockStartX + dockDirX * dockLength * 0.5;
  const dockMidZ = dockStartZ + dockDirZ * dockLength * 0.5;

  const dock = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, dockLength), concreteM);
  dock.position.set(dockMidX, 1.8, dockMidZ);
  dock.rotation.y = dockAngle;
  state.scene.add(dock);

  // Guarda-corpo
  for (const side of [-1, 1]) {
    const offsetX = CC.x * side * 2.2;
    const offsetZ = CC.z * side * 2.2;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, dockLength), metalM);
    rail.position.set(dockMidX + offsetX, 2.3, dockMidZ + offsetZ);
    rail.rotation.y = dockAngle;
    state.scene.add(rail);
  }

  // Pilares
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const px = dockStartX + dockDirX * t * dockLength;
    const pz = dockStartZ + dockDirZ * t * dockLength;
    for (const side of [-1, 1]) {
      const offX = CC.x * side * 2.0;
      const offZ = CC.z * side * 2.0;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 14, 6), concreteDarkM);
      pillar.position.set(px + offX, -5.0, pz + offZ);
      state.scene.add(pillar);
    }
  }

  // Galpões de pesca (armazéns)
  const warehouseM = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.7 });
  const warehouseRoofM = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });

  const warehousePositions = [
    { x: D.x - CC.x * 50 - SD.x * 60, z: D.z - CC.z * 50 - SD.z * 60, rot: Math.atan2(CC.x, CC.z) },
    { x: D.x + CC.x * 50 - SD.x * 60, z: D.z + CC.z * 50 - SD.z * 60, rot: Math.atan2(CC.x, CC.z) },
    { x: D.x - SD.x * 100, z: D.z - SD.z * 100, rot: Math.atan2(CC.x, CC.z) },
    { x: D.x + CC.x * 70 - SD.x * 100, z: D.z + CC.z * 70 - SD.z * 100, rot: Math.atan2(CC.x, CC.z) }
  ];

  for (const wp of warehousePositions) {
    const wh = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 16), warehouseM);
    wh.position.set(wp.x, 4.0, wp.z);
    wh.rotation.y = wp.rot;
    state.scene.add(wh);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(13, 0.6, 17), warehouseRoofM);
    roof.position.set(wp.x, 7.8, wp.z);
    roof.rotation.y = wp.rot;
    state.scene.add(roof);
  }

  // Barcos de pesca atracados ou próximos
  const boatHullM = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 });
  const boatCabinM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * 30;
    const bx = dockStartX + Math.cos(angle) * dist;
    const bz = dockStartZ + Math.sin(angle) * dist;
    const boat = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 1.8), boatHullM);
    boat.position.set(bx, 0.5, bz);
    boat.rotation.y = Math.random() * Math.PI;
    state.scene.add(boat);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.5), boatCabinM);
    cabin.position.set(bx, 1.4, bz);
    cabin.rotation.y = boat.rotation.y;
    state.scene.add(cabin);
  }

  // ============================================================
  // 🏖️ PRAÇA CENTRAL com coreto
  // ============================================================
  const coretoM = new THREE.MeshStandardMaterial({ color: 0xe8dfc4, roughness: 0.7 });
  const coretoRoofM = new THREE.MeshStandardMaterial({ color: 0x7a3a28, roughness: 0.85 });
  const coreto = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 4.0, 12), coretoM);
  coreto.position.set(D.x - CC.x * 30 - SD.x * 80, 3.2, D.z - CC.z * 30 - SD.z * 80);
  state.scene.add(coreto);

  const telhC = new THREE.Mesh(new THREE.ConeGeometry(3.5, 2.5, 12), coretoRoofM);
  telhC.position.copy(coreto.position);
  telhC.position.y = 6.5;
  state.scene.add(telhC);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const px = coreto.position.x + Math.cos(a) * 2.5;
    const pz = coreto.position.z + Math.sin(a) * 2.5;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.0, 6), coretoM);
    pillar.position.set(px, 3.0, pz);
    state.scene.add(pillar);
  }

  // ============================================================
  // 🌴 VEGETAÇÃO
  // ============================================================
  for (let i = 0; i < 20; i++) {
    const t = (i / 19 - 0.5) * 2 * D.spread;
    addPalm(D.x + CC.x * t - SD.x * 25, D.z + CC.z * t - SD.z * 25, 5.0 + Math.random() * 1.5);
  }

  // ============================================================
  // 🌃 POSTES DE ILUMINAÇÃO NA ORLA
  // ============================================================
  const streetLampMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d1,
    emissive: 0xffddaa,
    emissiveIntensity: 0.9
  });
  worldFX.round.push({ mat: streetLampMat, k: 0.8 });
  const streetLampPostMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
  for (let i = 0; i < 22; i++) {
    const t = (i / 21 - 0.5) * D.spread * 0.98;
    const x = D.x + CC.x * t - SD.x * (D.inset - 5);
    const z = D.z + CC.z * t - SD.z * (D.inset - 5);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 5, 6), streetLampPostMat);
    post.position.set(x, 2.5, z);
    state.scene.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), streetLampMat);
    lamp.position.set(x + CC.x * 0.8, 5.2, z + CC.z * 0.8);
    state.scene.add(lamp);
  }

  // ============================================================
  // 🪨 ROCHAS COSTEIRAS (na areia, sem flutuar)
  // ============================================================
  const rockM = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1, flatShading: true });
  for (let i = 0; i < 8; i++) {
    const t = (i / 7 - 0.5) * 60;
    const x = D.x + CC.x * t - SD.x * 20;
    const z = D.z + CC.z * t - SD.z * 20;
    const rockSize = 0.8 + Math.random() * 1.8;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rockSize, 0), rockM);
    rock.position.set(x, 0.1 + rockSize * 0.25, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    state.scene.add(rock);
  }

  // ============================================================
  // 🏠 CASINHAS DE PESCADORES (na areia)
  // ============================================================
  const woodHouseM = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.9 });
  const thatchRoofM = new THREE.MeshStandardMaterial({ color: 0x9c4a38, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    const t = (i / 5 - 0.5) * 140;
    const x = D.x + CC.x * t - SD.x * 15;
    const z = D.z + CC.z * t - SD.z * 15;
    placeBuilding(x, z, 3, 2.5, 3, Math.random() * 0.2, woodHouseM);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 4), thatchRoofM);
    roof.position.set(x, 4.0, z);
    roof.rotation.y = Math.PI / 4;
    state.scene.add(roof);
  }
}