import * as THREE from 'three';
import { MATS, makeHelpers, hullShape, jit } from './boat-base.js';

export function buildPilot() {
  const T = new THREE.Group();
  const { add, box, cyl } = makeHelpers(T, MATS.mRope);
  let g;

  // ============================================================
  //  CASCO ELEGANTE (mantido)
  // ============================================================
  g = new THREE.ExtrudeGeometry(hullShape(1), { 
    depth: 1.25, 
    bevelEnabled: true, 
    bevelThickness: 0.09, 
    bevelSize: 0.09, 
    bevelSegments: 2, 
    curveSegments: 14 
  });
  g.rotateX(Math.PI / 2);
  const hullMesh = new THREE.Mesh(g, MATS.pHull); 
  hullMesh.position.y = 0.5; 
  T.add(hullMesh);
  
  g = new THREE.ExtrudeGeometry(hullShape(0.92), { 
    depth: 0.09, 
    bevelEnabled: false, 
    curveSegments: 12 
  });
  g.rotateX(Math.PI / 2);
  const deckMesh = new THREE.Mesh(g, MATS.pDeck); 
  deckMesh.position.y = 0.53; 
  T.add(deckMesh);

  // ============================================================
  //  SUPERESTRUTURA PRINCIPAL
  // ============================================================
  box(1.9, 0.95, 2.6, MATS.pHull, 0, 1.0, 0.15);
  box(1.94, 0.28, 2.0, MATS.pGlass, 0, 1.18, 0.1);
  box(1.7, 0.5, 0.08, MATS.pGlass, 0, 1.42, 1.42, -0.32);
  box(2.0, 0.08, 2.8, MATS.pHull, 0, 1.52, 0.1);
  
  // Motor traseiro
  box(0.52, 0.62, 0.44, MATS.pDark, 0, 1.0, -4.05);
  box(0.14, 1.1, 0.2, MATS.pDark, 0, 0.28, -4.1);
  box(0.2, 0.5, 0.55, MATS.pDark, 0, -0.5, -4.12);
  
  // Antena principal
  cyl(0.015, 0.015, 1.1, MATS.pDark, 0.7, 2.1, -0.6, 6);
  cyl(0.03, 0.03, 0.42, MATS.pDark, 0, 1.77, 0.2);
  
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0x3a3a32 });
  add(new THREE.SphereGeometry(0.11, 12, 10), bulbMat, 0, 2.02, 0.2);
  
  // Luzes internas (desativadas por padrão)
  const deckLight = new THREE.PointLight(0xffc382, 0, 30, 1.5);
  deckLight.position.set(0, 3.0, 0.2); 
  deckLight.visible = false; 
  T.add(deckLight);
  
  const boatLight = new THREE.PointLight(0xffd4a0, 0, 15, 2);
  boatLight.position.set(0, 1.8, 0); 
  boatLight.visible = false; 
  T.add(boatLight);

  // ============================================================
  //  LUZES DE NAVEGAÇÃO
  // ============================================================
  function navPost(x, z, mat, lightCol) {
    cyl(0.022, 0.022, 0.5, MATS.pDark, x, 0.78, z, 6);
    add(new THREE.SphereGeometry(0.075, 10, 8), mat, x, 1.06, z);
    const pl = new THREE.PointLight(lightCol, 0, 4, 2);
    pl.position.set(x, 1.08, z); 
    T.add(pl);
    return pl;
  }
  
  const navPort = navPost(-1.02, -3.55, MATS.navRedMat, 0xff2020);
  const navStbd = navPost(1.02, -3.55, MATS.navGrnMat, 0x20ff60);
  add(new THREE.SphereGeometry(0.06, 10, 8), MATS.navWhtMat, 0, 0.98, -3.95);
  
  const navStern = new THREE.PointLight(0xfff2cc, 0, 4, 2);
  navStern.position.set(0, 1.0, -3.95); 
  T.add(navStern);
  
  add(new THREE.SphereGeometry(0.055, 10, 8), MATS.navWhtMat, 0, 1.68, 1.0);

  // ============================================================
  //  ESTRUTURA INFERIOR
  // ============================================================
  const keel = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.7, 6.0), 
    MATS.pKeel
  );
  keel.position.set(0, -0.4, -0.2); 
  T.add(keel);
  
  const motorBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.4, 0.6), 
    MATS.pDark
  );
  motorBlock.position.set(0, -0.2, -3.5); 
  T.add(motorBlock);
  
  const propPilot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), 
    MATS.mMetal
  );
  propPilot.position.set(0, -0.5, -3.9);
  propPilot.rotation.z = Math.PI / 2; 
  T.add(propPilot);

  // ============================================================
  //  ✨ DETALHES ELEGANTES - LANCHA MELHORADA
  // ============================================================

  // ---- JANELAS LATERAIS COM MOLDURA ----
  const windowFrameMat = new THREE.MeshStandardMaterial({ 
    color: 0x2a2a2a, 
    metalness: 0.8, 
    roughness: 0.3 
  });
  
  for (let s of [-1, 1]) {
    for (let z of [-0.8, 0.0, 0.8]) {
      // Moldura
      box(0.05, 0.32, 0.38, windowFrameMat, s * 0.92, 1.20, z + 0.15);
      // Vidro (ligeiramente menor)
      box(0.04, 0.28, 0.35, MATS.mGlass, s * 0.93, 1.20, z + 0.15);
    }
    box(0.05, 0.32, 0.33, windowFrameMat, s * 0.92, 1.20, 1.4);
    box(0.04, 0.28, 0.30, MATS.mGlass, s * 0.93, 1.20, 1.4);
  }
  
  // Porta lateral
  box(0.05, 0.52, 0.27, windowFrameMat, 0.94, 1.05, -0.6);
  box(0.04, 0.50, 0.25, MATS.mWood, 0.95, 1.05, -0.6);

  // ---- CONSOLE DE PILOTAGEM SOFISTICADO ----
  // Base do console
  box(0.8, 0.4, 0.6, MATS.pHull, 0, 1.1, -0.4);
  
  // Painel de instrumentos (tela preta)
  const instrumentMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
  box(0.75, 0.35, 0.02, instrumentMat, 0, 1.35, -0.3);
  
  // Volante de direção
  cyl(0.02, 0.02, 0.35, MATS.mMetal, 0.60, 1.35, -0.4, 6, 0, 0.1);
  add(new THREE.TorusGeometry(0.10, 0.015, 8, 16), MATS.mDark, 0.60, 1.55, -0.4, 0, 0.2);
  
  // Alavanca de aceleração
  cyl(0.015, 0.015, 0.25, MATS.mMetal, 0.85, 1.25, -0.3, 6);
  add(new THREE.SphereGeometry(0.04, 8, 8), MATS.pDark, 0.85, 1.40, -0.3);

  // ---- ASSENTOS CONFORTÁVEIS ----
  const seatCushionMat = new THREE.MeshStandardMaterial({ 
    color: 0xf5f5f0, 
    roughness: 0.8,
    metalness: 0.0 
  });
  
  for (let s of [-1, 1]) {
    // Base do assento
    box(0.38, 0.08, 0.38, MATS.pDark, s * 0.60, 0.95, -1.0);
    // Almofada do assento
    box(0.36, 0.06, 0.36, seatCushionMat, s * 0.60, 1.00, -1.0);
    // Encosto
    box(0.36, 0.35, 0.06, seatCushionMat, s * 0.60, 1.20, -1.15);
    box(0.38, 0.37, 0.08, MATS.pDark, s * 0.60, 1.20, -1.15);
  }

  // ---- MASTROS E ANTENAS ----
  cyl(0.025, 0.025, 2.20, MATS.pDark, 0, 2.0, -0.2, 6, 0.02);
  cyl(0.018, 0.018, 1.60, MATS.pDark, 0, 1.6, -2.8, 6, 0.02);
  
  // Antena de comunicação
  cyl(0.008, 0.008, 0.90, MATS.mMetal, 0.50, 2.1, -0.3, 4);
  
  // Bandeira
  const flagMat = new THREE.MeshBasicMaterial({ color: 0x0044ff });
  add(new THREE.PlaneGeometry(0.20, 0.12), flagMat, 0.52, 2.60, -0.2).rotation.y = -0.2;

  // ---- HOLOFOTES DE PROA ----
  const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
  add(new THREE.CylinderGeometry(0.04, 0.07, 0.08, 8), spotMat, 0.50, 1.70, 0.2, 0, 0.2);
  add(new THREE.CylinderGeometry(0.04, 0.07, 0.08, 8), spotMat, -0.50, 1.70, 0.2, 0, -0.2);

  // ---- PLATAFORMA DE MERGULHO (traseira) ----
  const platformMat = new THREE.MeshStandardMaterial({ 
    color: 0xd4a574, 
    roughness: 0.6 
  });
  box(1.6, 0.06, 0.8, platformMat, 0, 0.15, -4);
  


  // ---- ÂNCORA E SISTEMA DE AMARRAÇÃO ----
  // Suporte da âncora
  box(0.08, 0.04, 0.30, MATS.mMetal, 0.70, 0.80, -3.85);
  
  // Âncora estilizada
  add(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6), MATS.mMetal, 0.70, 0.80, -3.95, 0.1);
  add(new THREE.BoxGeometry(0.06, 0.015, 0.18), MATS.mMetal, 0.70, 0.80, -3.93);
  add(new THREE.BoxGeometry(0.015, 0.10, 0.015), MATS.mMetal, 0.70, 0.92, -3.93);
  
  // Corrente
  for (let i = 0; i < 5; i++) {
    const y = 0.78 + i * 0.025;
    add(new THREE.TorusGeometry(0.02, 0.008, 6, 8), MATS.mMetal, 0.70, y, -3.85, Math.PI/2, 0, 0.3);
  }

  // ---- DETALHES CROMADOS ----
  const chromeMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    metalness: 1.0, 
    roughness: 0.1 
  });
  
  // Trilhos de proa
  for (let s of [-1, 1]) {
    for (let z = -3.2; z < -1.; z += 0.7) {
      cyl(0.015, 0.015, 0.20, chromeMat, s * 0.95, 0.70, z, 6);
    }
  }
  
  // Puxadores de porta
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), chromeMat, 0.96, 1.05, -0.5);
  add(new THREE.SphereGeometry(0.02, 8, 8), chromeMat, 0.96, 1.05, -0.46);

  // ---- LUZ DE MASTRO ----
  add(new THREE.SphereGeometry(0.06, 10, 8), MATS.navWhtMat, 0, 2.40, -0.2);
  const navMast = new THREE.PointLight(0xffffff, 0, 6, 2);
  navMast.position.set(0, 2.42, -0.2);
  T.add(navMast);

  // ============================================================
  //  SOMBRAS
  // ============================================================
  T.traverse(o => { 
    if (o.isMesh) { 
      o.castShadow = true; 
      o.receiveShadow = true; 
    } 
  });

  // ============================================================
  //  RETORNO
  // ============================================================
  return {
    name: 'pilot',
    mass: 2200,
    pitchMOI: 8000,
    rollMOI: 2500,
    yawMOI: 8000,

    minTurnRadius: 8,
    radiusGrowth: 0.8,
    turnResponse: 5.0,
    waterDragRot: 0.25,
    rudderSpeed: 3.5,

    throttleResponseSpeed: 1.8,
    throttleDecaySpeed: 2.2,
    engineInertia: 0.8,

    maxThrust: 7500,
    dragLinear: 18,
    dragQuad: 6,
    frictionLat: 2.5,

    group: T,
    deckLight,
    boatLight,
    bulbMat,
    navPort,
    navStbd,
    navStern,
    deckPos: new THREE.Vector3(0, 3.0, 0.2),
    propeller: propPilot,
    motorPos: new THREE.Vector3(0, -0.5, -3.9),
    maxSpeed: 25
  };
}