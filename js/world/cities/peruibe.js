// js/world/cities/peruibe.js — prédio redondo: mais baixo, recuado da praia (usando direção da costa)
import * as THREE from 'three';
import { state } from '../../state.js';
import { CITY_DATA, makeBuildingMat, placeRowAlongCoast, placeBuilding, CC, SD } from './city-shared.js';

export function buildPeruibe(worldFX) {
  const D = CITY_DATA.peruibe;
  const mat = makeBuildingMat();
  worldFX.cityMats.push(mat);

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
  // 🏢 EDIFÍCIO SERRA DOS ITATIS — o redondo branco (RECUADO DA PRAIA)
  // ============================================================
  const rm = new THREE.MeshStandardMaterial({
    color: 0xf2f0e8,
    roughness: 0.6,
    emissive: 0xffe9c0,
    emissiveIntensity: 0
  });
  worldFX.round.push({ mat: rm, k: 0.12 });

  const radius = 30;
  const height = 55;
  const baseY = 2;

  // ✅ Posição recuada: desloca para dentro do continente (direção contrária ao mar)
  const inlandOffset = 120; // metros para trás da orla
  const buildingX = -840 - SD.x * inlandOffset;
  const buildingZ = 330 - SD.z * inlandOffset;

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.03, height, 64), rm);
  tower.position.set(buildingX, baseY + height / 2, buildingZ);
  state.scene.add(tower);

  // Topo plano com parapeito
  const parapet = new THREE.Mesh(
    new THREE.TorusGeometry(radius - 0.5, 0.6, 8, 64),
    rm
  );
  parapet.rotation.x = Math.PI / 2;
  parapet.position.set(buildingX, baseY + height, buildingZ);
  state.scene.add(parapet);

  // Cobertura plana (laje)
  const roof = new THREE.Mesh(
    new THREE.CircleGeometry(radius - 0.3, 64),
    new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.9 })
  );
  roof.rotation.x = -Math.PI / 2;
  roof.position.set(buildingX, baseY + height, buildingZ);
  state.scene.add(roof);

  // Heliponto
  const helipad = new THREE.Mesh(
    new THREE.CircleGeometry(6, 32),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 })
  );
  helipad.rotation.x = -Math.PI / 2;
  helipad.position.set(buildingX, baseY + height + 0.1, buildingZ);
  state.scene.add(helipad);

  const hMark = new THREE.Mesh(
    new THREE.RingGeometry(5.5, 6, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  hMark.rotation.x = -Math.PI / 2;
  hMark.position.set(buildingX, baseY + height + 0.15, buildingZ);
  state.scene.add(hMark);

  // Caixa d'água e antena
  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 3.5, 6, 20),
    new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.5 })
  );
  tank.position.set(buildingX, baseY + height + 3, buildingZ);
  state.scene.add(tank);

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 })
  );
  antenna.position.set(buildingX, baseY + height + 12, buildingZ);
  state.scene.add(antenna);

  // ============================================================
  // 🔩 ESTRUTURA EXTERNA — pilares verticais e janelas até a base
  // ============================================================
  const pillarCount = 36;
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xe0ddd0, roughness: 0.5 });
  for (let i = 0; i < pillarCount; i++) {
    const angle = (i / pillarCount) * Math.PI * 2;
    const px = buildingX + Math.cos(angle) * (radius - 1.0);
    const pz = buildingZ + Math.sin(angle) * (radius - 1.0);
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, height - 2, 0.9),
      pillarMat
    );
    pillar.position.set(px, baseY + height / 2, pz);
    pillar.rotation.y = angle;
    state.scene.add(pillar);
  }

  // Faixas horizontais (sacadas/varandas) — começam desde a base
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0x1c2a33,
    emissive: 0xffd9a0,
    emissiveIntensity: 0.1
  });
  worldFX.round.push({ mat: bandMat, k: 0.9 });

  const bandCount = 22;
  const bandSpacing = (height - 4) / bandCount;
  for (let i = 0; i <= bandCount; i++) {
    const y = baseY + 2 + i * bandSpacing;
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(radius + 0.25, 0.3, 8, 96),
      bandMat
    );
    band.rotation.x = Math.PI / 2;
    band.position.set(buildingX, y, buildingZ);
    state.scene.add(band);
  }

  // Janelas (cilindro transparente simulando vidro)
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x87ceeb,
    roughness: 0.1,
    metalness: 0.4,
    transparent: true,
    opacity: 0.6
  });
  const windowCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(radius - 0.4, radius - 0.4, height - 4, 32),
    windowMat
  );
  windowCylinder.position.set(buildingX, baseY + height / 2, buildingZ);
  state.scene.add(windowCylinder);

  // Base alargada (podium)
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(radius + 4, radius + 4.5, 8, 48),
    new THREE.MeshStandardMaterial({ color: 0xd8d5c8, roughness: 0.7 })
  );
  base.position.set(buildingX, baseY - 1, buildingZ);
  state.scene.add(base);

  // ============================================================
  // 🏠 CASINHAS CAIÇARAS NA PRAIA
  // ============================================================
  const woodM = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.9 });
  const roofM = new THREE.MeshStandardMaterial({ color: 0x9c4a38, roughness: 0.85 });

  for (let i = 0; i < 8; i++) {
    const t = (i / 7 - 0.5) * 200;
    const x = D.x + CC.x * t - SD.x * 35;
    const z = D.z + CC.z * t - SD.z * 35;
    placeBuilding(x, z, 4, 3.2, 4, Math.random() * 0.3, woodM);
    const r = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.5, 4), roofM);
    r.position.set(x, 6.3, z);
    r.rotation.y = Math.PI / 4;
    state.scene.add(r);
  }

  // ============================================================
  // 🏝️ ILHA DO COSTÃO — BEM AFASTADA DO LITORAL
  // ============================================================
  const rockM = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1, flatShading: true });
  const islandCenterX = -650;
  const islandCenterZ = -500;
  const islandRocks = 16;

  const islandBase = new THREE.Mesh(
    new THREE.DodecahedronGeometry(25, 1),
    new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.9, flatShading: true })
  );
  islandBase.position.set(islandCenterX, -3, islandCenterZ);
  islandBase.scale.set(1.4, 0.7, 1.4);
  state.scene.add(islandBase);

  for (let i = 0; i < islandRocks; i++) {
    const angle = (i / islandRocks) * Math.PI * 2;
    const dist = 10 + Math.random() * 18;
    const x = islandCenterX + Math.cos(angle) * dist;
    const z = islandCenterZ + Math.sin(angle) * dist;
    const rockSize = 7 + Math.random() * 12;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rockSize, 0), rockM);
    rock.position.set(x, (rockSize * 0.45) + Math.random() * 4, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    state.scene.add(rock);
  }

  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 15;
    const x = islandCenterX + Math.cos(angle) * dist;
    const z = islandCenterZ + Math.sin(angle) * dist;
    const rockSize = 2 + Math.random() * 6;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rockSize, 0), rockM);
    rock.position.set(x, rockSize * 0.3, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    state.scene.add(rock);
  }

  // ============================================================
  // 🌴 VEGETAÇÃO — coqueiros na orla (com tronco curvo)
  // ============================================================
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 0.7 });

  for (let i = 0; i < 12; i++) {
    const t = (i / 11 - 0.5) * 240;
    const x = D.x + CC.x * t - SD.x * 20;
    const z = D.z + CC.z * t - SD.z * 20;
    const trunkHeight = 4 + Math.random() * 3;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, trunkHeight, 6), trunkMat);
    trunk.position.set(x, trunkHeight / 2, z);
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.rotation.x = (Math.random() - 0.5) * 0.1;
    state.scene.add(trunk);

    const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.8 + Math.random(), 6, 4), leafMat);
    leaves.position.set(x, trunkHeight + 0.8, z);
    state.scene.add(leaves);
  }

  // ============================================================
  // 🅿️ ESTACIONAMENTO AO REDOR DO PRÉDIO (agora recuado)
  // ============================================================
  const asphalt = new THREE.Mesh(
    new THREE.CircleGeometry(radius + 8, 32),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 })
  );
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.set(buildingX, 0.05, buildingZ);
  state.scene.add(asphalt);
}