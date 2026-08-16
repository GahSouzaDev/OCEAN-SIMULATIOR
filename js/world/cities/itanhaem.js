// js/world/cities/itanhaem.js — COMPRIDA: Gaivota → Centro → Praia dos Sonhos
import * as THREE from 'three';
import { state } from '../../state.js';
import { CITY_DATA, makeBuildingMat, placeRowAlongCoast, placeBuilding, addPalm, CC, SD } from './city-shared.js';

export function buildItanhaem(worldFX) {
  const D = CITY_DATA.itanhaem;
  const D2 = CITY_DATA.mongagua; // para posicionar a plataforma entre as cidades

  // ============================================================
  // 🎨 MATERIAIS
  // ============================================================
  const matWhite = makeBuildingMat({ color: 0xf0ece0, roughness: 0.8 });
  worldFX.cityMats.push(matWhite);
  worldFX.round.push({ mat: matWhite, k: 0.3 });

  const matBeige = makeBuildingMat({ color: 0xd9c7b8, roughness: 0.8 });
  worldFX.cityMats.push(matBeige);

  const matTerracotta = makeBuildingMat({ color: 0xc98a6b, roughness: 0.85 });
  worldFX.cityMats.push(matTerracotta);

  const matBlue = makeBuildingMat({ color: 0x8fb8d9, roughness: 0.8 });
  worldFX.cityMats.push(matBlue);

  const matPink = makeBuildingMat({ color: 0xe8b4b4, roughness: 0.8 });
  worldFX.cityMats.push(matPink);

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
  // 🏙️ ORLA PRINCIPAL — fileiras de prédios
  // ============================================================
  placeRowAlongCoast({
    centerX: D.x, centerZ: D.z, n: D.n,
    hMin: D.hMin, hMax: D.hMax,
    spread: D.spread, inset: D.inset,
    mat: matWhite,
    colFn: () => new THREE.Color().setHSL(0.07, 0.08, 0.75)
  });

  placeRowAlongCoast({
    centerX: D.x, centerZ: D.z, n: 24,
    hMin: 5, hMax: 12,
    spread: D.spread * 0.95, inset: D.inset + 60,
    mat: matBeige,
    colFn: () => new THREE.Color().setHSL(0.08, 0.12, 0.70)
  });

  placeRowAlongCoast({
    centerX: D.x, centerZ: D.z, n: 28,
    hMin: 3, hMax: 8,
    spread: D.spread * 0.98, inset: D.inset + 110,
    mat: matTerracotta,
    colFn: () => new THREE.Color().setHSL(0.06, 0.10, 0.65)
  });

  placeRowAlongCoast({
    centerX: D.x, centerZ: D.z, n: 32,
    hMin: 2.5, hMax: 6,
    spread: D.spread * 1.0, inset: D.inset + 160,
    mat: matBlue,
    colFn: () => new THREE.Color().setHSL(0.07, 0.08, 0.70)
  });

  // Balneário Gaivota (ponta sul)
  placeRowAlongCoast({
    centerX: D.x - CC.x * 240, centerZ: D.z - CC.z * 240,
    n: 16, hMin: 3, hMax: 7,
    spread: 110, inset: 60,
    mat: matPink,
    colFn: () => new THREE.Color().setHSL(0.05, 0.15, 0.75)
  });

  // ============================================================
  // 🏢 PRÉDIOS INDIVIDUAIS (alguns com luzes)
  // ============================================================
  const buildingColors = [0xf5e6d3, 0xd9c7b8, 0xc9b8a8, 0xe8e0d0, 0xfce4d6, 0xd5c9b0, 0xf2d49b];

  for (let i = 0; i < 60; i++) {
    const t = (i / 59 - 0.5) * D.spread * 1.05;
    const inset = D.inset + 20 + Math.random() * 180;
    const x = D.x + CC.x * t - SD.x * inset;
    const z = D.z + CC.z * t - SD.z * inset;
    const w = 4 + Math.random() * 7;
    const h = 2.5 + Math.random() * 9;
    const d = 4 + Math.random() * 7;

    const useLit = h > 5 && Math.random() < 0.4;
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
  // ⛪ IGREJA MATRIZ — detalhada e iluminada
  // ============================================================
  const stoneM = new THREE.MeshStandardMaterial({ color: 0xd4cfc2, roughness: 0.9 });
  const roofChurchM = new THREE.MeshStandardMaterial({ color: 0x7a3a28, roughness: 0.85 });
  const darkWoodM = new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.9 });

  const church = new THREE.Mesh(new THREE.BoxGeometry(10, 9, 16), stoneM);
  church.position.set(47, 6.5, -80);
  church.rotation.y = Math.atan2(CC.x, CC.z);
  state.scene.add(church);

  const telh = new THREE.Mesh(new THREE.ConeGeometry(8, 5, 4), roofChurchM);
  telh.position.set(47, 13.5, -80);
  telh.rotation.y = Math.PI / 4;
  state.scene.add(telh);

  const torre = new THREE.Mesh(new THREE.BoxGeometry(4, 15, 4), stoneM);
  torre.position.set(47 + CC.x * 5, 9.5, -80 + CC.z * 5);
  state.scene.add(torre);

  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.5, 4), roofChurchM);
  towerRoof.position.set(47 + CC.x * 5, 18.5, -80 + CC.z * 5);
  towerRoof.rotation.y = Math.PI / 4;
  state.scene.add(towerRoof);

  const crossMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    emissive: 0xffffff,
    emissiveIntensity: 0.8
  });
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 0.2), crossMat);
  crossV.position.set(47 + CC.x * 5, 21, -80 + CC.z * 5);
  state.scene.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.2), crossMat);
  crossH.position.set(47 + CC.x * 5, 20.6, -80 + CC.z * 5);
  state.scene.add(crossH);

  // ============================================================
  // 🌉 PLATAFORMA DE PESCA (COMPARTILHADA ENTRE ITANHAÉM E MONGAGUÁ)
  // ============================================================
  const concreteM = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.95 });
  const concreteDarkM = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 });
  const metalM = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.6 });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d1,
    emissive: 0xffddaa,
    emissiveIntensity: 1.0
  });
  worldFX.round.push({ mat: lightMat, k: 1.0 });

  // Posição entre as duas cidades (média das coordenadas centrais)
  const platformCenterX = (D.x + D2.x) / 2;
  const platformCenterZ = (D.z + D2.z) / 2;

  // Ponto de início na areia (recuado)
  const pierStartX = platformCenterX - SD.x * 20;
  const pierStartZ = platformCenterZ - SD.z * 20;
  const pierLength = 180;          // comprimento total
  const pierDirX = SD.x;           // direção mar adentro
  const pierDirZ = SD.z;
  const pierAngle = Math.atan2(pierDirX, pierDirZ);
  const pierMidX = pierStartX + pierDirX * pierLength * 0.5;
  const pierMidZ = pierStartZ + pierDirZ * pierLength * 0.5;

  // Deck principal de concreto
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.6, pierLength), concreteM);
  deck.position.set(pierMidX, 2.3, pierMidZ);
  deck.rotation.y = pierAngle;
  state.scene.add(deck);

  // Plataforma final em "T" (mais larga)
  const endPlatform = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 10), concreteM);
  endPlatform.position.set(
    pierStartX + pierDirX * pierLength,
    2.3,
    pierStartZ + pierDirZ * pierLength
  );
  endPlatform.rotation.y = pierAngle;
  state.scene.add(endPlatform);

  // Guarda-corpo metálico (com corrimão duplo)
  for (const side of [-1, 1]) {
    const offsetX = CC.x * side * 2.7;
    const offsetZ = CC.z * side * 2.7;
    // Corrimão principal
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, pierLength), metalM);
    rail.position.set(pierMidX + offsetX, 2.9, pierMidZ + offsetZ);
    rail.rotation.y = pierAngle;
    state.scene.add(rail);
    // Corrimão inferior
    const lowerRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, pierLength), metalM);
    lowerRail.position.set(pierMidX + offsetX, 2.5, pierMidZ + offsetZ);
    lowerRail.rotation.y = pierAngle;
    state.scene.add(lowerRail);
  }

  // Pilares de concreto até o fundo do mar
  const postCount = Math.floor(pierLength / 4);
  const pileSpacing = pierLength / postCount;
  for (let i = 0; i <= postCount; i++) {
    const t = i / postCount;
    const px = pierStartX + pierDirX * t * pierLength;
    const pz = pierStartZ + pierDirZ * t * pierLength;
    for (const side of [-1, 1]) {
      const offX = CC.x * side * 2.5;
      const offZ = CC.z * side * 2.5;
      const pillarHeight = 16;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, pillarHeight, 8), concreteDarkM);
      pillar.position.set(px + offX, 2.3 - pillarHeight / 2, pz + offZ);
      state.scene.add(pillar);
    }

    // Luminárias a cada 2 pilares
    if (i % 2 === 0 && i < postCount) {
      const lampX = px + pierDirX * 0.4;
      const lampZ = pz + pierDirZ * 0.4;
      const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.5, 6), metalM);
      lampPost.position.set(lampX, 4.0, lampZ);
      state.scene.add(lampPost);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), lightMat);
      lamp.position.set(lampX, 5.8, lampZ);
      state.scene.add(lamp);
    }
  }

  // Abrigo central na plataforma
  const shelterRoofM = new THREE.MeshStandardMaterial({ color: 0x9c4a38, roughness: 0.85 });
  const shelterCenterX = pierStartX + pierDirX * (pierLength - 10);
  const shelterCenterZ = pierStartZ + pierDirZ * (pierLength - 10);
  const cornerHalf = 6.0;
  const cornerOffsets = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const [fx, rz] of cornerOffsets) {
    const cx = shelterCenterX + pierDirX * fx * cornerHalf + CC.x * rz * cornerHalf;
    const cz = shelterCenterZ + pierDirZ * fx * cornerHalf + CC.z * rz * cornerHalf;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 4.5, 8), metalM);
    post.position.set(cx, 4.2, cz);
    state.scene.add(post);
  }
  const shelterRoof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 8), shelterRoofM);
  shelterRoof.position.set(shelterCenterX, 6.3, shelterCenterZ);
  shelterRoof.rotation.y = pierAngle;
  state.scene.add(shelterRoof);

  // Pequeno farol no final da plataforma
  const lighthouseBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 4, 8), concreteDarkM);
  lighthouseBase.position.set(
    pierStartX + pierDirX * pierLength,
    2.3 + 2,
    pierStartZ + pierDirZ * pierLength
  );
  state.scene.add(lighthouseBase);
  const lighthouseTop = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 3, 8), metalM);
  lighthouseTop.position.set(
    pierStartX + pierDirX * pierLength,
    2.3 + 4 + 1.5,
    pierStartZ + pierDirZ * pierLength
  );
  state.scene.add(lighthouseTop);
  const lighthouseLight = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), lightMat);
  lighthouseLight.position.set(
    pierStartX + pierDirX * pierLength,
    2.3 + 4 + 3 + 0.5,
    pierStartZ + pierDirZ * pierLength
  );
  state.scene.add(lighthouseLight);

  // Escada de acesso na base (em terra)
  const stepM = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 0.8), stepM);
    step.position.set(
      pierStartX - SD.x * (2 + i),
      0.15 + i * 0.2,
      pierStartZ - SD.z * (2 + i)
    );
    step.rotation.y = pierAngle;
    state.scene.add(step);
  }

  // ============================================================
  // 🚤 BARCOS DE PESCA ao redor (afastados)
  // ============================================================
  const boatHullM = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 });
  const boatCabinM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 25 + Math.random() * 40;
    const bx = platformCenterX + Math.cos(angle) * dist;
    const bz = platformCenterZ + Math.sin(angle) * dist;
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
  // 🏖️ QUIOSQUES DE PRAIA (na entrada da plataforma)
  // ============================================================
  const kioskMat = new THREE.MeshStandardMaterial({ color: 0xc9a86c, roughness: 0.8 });
  const kioskRoofM = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const t = (i / 3 - 0.5) * 30;
    const x = platformCenterX + CC.x * t - SD.x * 40;
    const z = platformCenterZ + CC.z * t - SD.z * 40;
    placeBuilding(x, z, 3.5, 2.5, 3.5, Math.random() * 0.2, kioskMat);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3, 1.2, 4), kioskRoofM);
    roof.position.set(x, 4.5, z);
    roof.rotation.y = Math.PI / 4;
    state.scene.add(roof);
    const qLight = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), lightMat);
    qLight.position.set(x, 4.0, z);
    state.scene.add(qLight);
  }

  // ============================================================
  // 🌴 VEGETAÇÃO — palmeiras e coqueiros
  // ============================================================
  for (let i = 0; i < 25; i++) {
    const t = (i / 24 - 0.5) * 2 * 320;
    addPalm(D.x + CC.x * t - SD.x * 32, D.z + CC.z * t - SD.z * 32, 5.0 + Math.random() * 1.5);
  }
  for (let i = 0; i < 8; i++) {
    const t = (i / 7 - 0.5) * 50;
    addPalm(platformCenterX + CC.x * t - SD.x * 15, platformCenterZ + CC.z * t - SD.z * 15, 4.5 + Math.random());
  }

  // ============================================================
  // 🌃 POSTES DE ILUMINAÇÃO na orla
  // ============================================================
  const streetLampMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d1,
    emissive: 0xffddaa,
    emissiveIntensity: 0.95
  });
  worldFX.round.push({ mat: streetLampMat, k: 0.8 });
  const streetLampPostMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
  for (let i = 0; i < 24; i++) {
    const t = (i / 23 - 0.5) * D.spread * 0.98;
    const x = D.x + CC.x * t - SD.x * (D.inset - 8);
    const z = D.z + CC.z * t - SD.z * (D.inset - 8);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 5, 6), streetLampPostMat);
    post.position.set(x, 2.5, z);
    state.scene.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), streetLampMat);
    lamp.position.set(x + CC.x * 0.8, 5.2, z + CC.z * 0.8);
    state.scene.add(lamp);
  }

  // ============================================================
  // 🪨 ROCHAS COSTEIRAS — apenas na areia, sem flutuar
  // ============================================================
  const rockM = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1, flatShading: true });
  // Costão rochoso na base da plataforma
  const rockBaseX = platformCenterX - SD.x * 30;
  const rockBaseZ = platformCenterZ - SD.z * 30;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const dist = 2 + Math.random() * 6;
    const rockSize = 1.0 + Math.random() * 1.8;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rockSize, 0), rockM);
    rock.position.set(
      rockBaseX + CC.x * Math.cos(angle) * dist + SD.x * Math.sin(angle) * dist * 0.3,
      0.2 + rockSize * 0.3,
      rockBaseZ + CC.z * Math.cos(angle) * dist + SD.z * Math.sin(angle) * dist * 0.3
    );
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    state.scene.add(rock);
  }
  // Rochas isoladas na areia
  for (let i = 0; i < 5; i++) {
    const t = (i / 4 - 0.5) * 50;
    const x = platformCenterX + CC.x * t - SD.x * 40;
    const z = platformCenterZ + CC.z * t - SD.z * 40;
    const rockSize = 0.8 + Math.random() * 1.2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rockSize, 0), rockM);
    rock.position.set(x, 0.1 + rockSize * 0.25, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    state.scene.add(rock);
  }

  // ============================================================
  // 🏠 CASINHAS CAIÇARAS NA AREIA
  // ============================================================
  const woodHouseM = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.9 });
  const thatchRoofM = new THREE.MeshStandardMaterial({ color: 0x9c4a38, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    const t = (i / 5 - 0.5) * 120;
    const x = D.x + CC.x * t - SD.x * 18;
    const z = D.z + CC.z * t - SD.z * 18;
    placeBuilding(x, z, 3, 2.5, 3, Math.random() * 0.2, woodHouseM);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 4), thatchRoofM);
    roof.position.set(x, 4.0, z);
    roof.rotation.y = Math.PI / 4;
    state.scene.add(roof);
  }
}