import * as THREE from 'three';
import { MATS, makeHelpers, hullShape } from './boat-base.js';

export function buildPilot() {
  // ... (Todo o seu código de modelagem 3D permanece EXATAMENTE IGUAL)
  // ... (Copie desde 'const T = new THREE.Group();' até 'T.traverse(...)')
  const T = new THREE.Group();
  const { add, box, cyl } = makeHelpers(T, MATS.mRope);
  let g;
  g = new THREE.ExtrudeGeometry(hullShape(1), { depth: 1.25, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.09, bevelSegments: 2, curveSegments: 14 });
  g.rotateX(Math.PI / 2);
  const hullMesh = new THREE.Mesh(g, MATS.pHull); hullMesh.position.y = 0.5; T.add(hullMesh);
  g = new THREE.ExtrudeGeometry(hullShape(0.92), { depth: 0.09, bevelEnabled: false, curveSegments: 12 });
  g.rotateX(Math.PI / 2);
  const deckMesh = new THREE.Mesh(g, MATS.pDeck); deckMesh.position.y = 0.53; T.add(deckMesh);
  box(1.9, 0.95, 2.6, MATS.pHull, 0, 1.0, 0.15);
  box(1.94, 0.28, 2.0, MATS.pGlass, 0, 1.18, 0.1);
  box(1.7, 0.5, 0.08, MATS.pGlass, 0, 1.42, 1.42, -0.32);
  box(2.0, 0.08, 2.8, MATS.pHull, 0, 1.52, 0.1);
  box(0.52, 0.62, 0.44, MATS.pDark, 0, 1.0, -4.05);
  box(0.14, 1.1, 0.2, MATS.pDark, 0, 0.28, -4.1);
  box(0.2, 0.5, 0.55, MATS.pDark, 0, -0.5, -4.12);
  cyl(0.015, 0.015, 1.1, MATS.pDark, 0.7, 2.1, -0.6, 6);
  cyl(0.03, 0.03, 0.42, MATS.pDark, 0, 1.77, 0.2);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0x3a3a32 });
  add(new THREE.SphereGeometry(0.11, 12, 10), bulbMat, 0, 2.02, 0.2);
  const deckLight = new THREE.PointLight(0xffc382, 0, 30, 1.5);
  deckLight.position.set(0, 3.0, 0.2); deckLight.visible = false; T.add(deckLight);
  const boatLight = new THREE.PointLight(0xffd4a0, 0, 15, 2);
  boatLight.position.set(0, 1.8, 0); boatLight.visible = false; T.add(boatLight);
  function navPost(x, z, mat, lightCol) {
    cyl(0.022, 0.022, 0.5, MATS.pDark, x, 0.78, z, 6);
    add(new THREE.SphereGeometry(0.075, 10, 8), mat, x, 1.06, z);
    const pl = new THREE.PointLight(lightCol, 0, 4, 2);
    pl.position.set(x, 1.08, z); T.add(pl);
    return pl;
  }
  const navPort = navPost(-1.02, -3.55, MATS.navRedMat, 0xff2020);
  const navStbd = navPost(1.02, -3.55, MATS.navGrnMat, 0x20ff60);
  add(new THREE.SphereGeometry(0.06, 10, 8), MATS.navWhtMat, 0, 0.98, -3.95);
  const navStern = new THREE.PointLight(0xfff2cc, 0, 4, 2);
  navStern.position.set(0, 1.0, -3.95); T.add(navStern);
  add(new THREE.SphereGeometry(0.055, 10, 8), MATS.navWhtMat, 0, 1.68, 1.0);
  const keel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 6.0), MATS.pKeel);
  keel.position.set(0, -0.4, -0.2); T.add(keel);
  const motorBlock = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.6), MATS.pDark);
  motorBlock.position.set(0, -0.2, -3.5); T.add(motorBlock);
  const propPilot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), MATS.mMetal);
  propPilot.position.set(0, -0.5, -3.9);
  propPilot.rotation.z = Math.PI / 2; T.add(propPilot);

  T.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // ===== A LANCHA ÁGIL =====
  return {
    name: 'pilot',
    mass: 2200,
    pitchMOI: 8000,
    rollMOI: 2500,
    yawMOI: 8000,
    
    // 🎯 SISTEMA DE RAIO DE GIRO
    minTurnRadius: 8,
    radiusGrowth: 0.8,
    turnResponse: 5.0,
    waterDragRot: 0.6,
    
    // BARRA DO LEME
    rudderSpeed: 3.5,
    
    // 🎯 SISTEMA DE ACELERADOR (Motor Gasolina Esportivo)
    throttleResponseSpeed: 1.8,    // RÁPIDO pra acelerar (motor leve)
    throttleDecaySpeed: 2.2,       // Desaceleração rápida
    engineInertia: 0.8,            // Resposta imediata, sem turbo lag
    
    maxThrust: 7500,
    dragLinear: 18,
    dragQuad: 6,
    frictionLat: 2.5,
    
    group: T, deckLight, boatLight, bulbMat,
    navPort, navStbd, navStern,
    deckPos: new THREE.Vector3(0, 3.0, 0.2),
    propeller: propPilot,
    motorPos: new THREE.Vector3(0, -0.5, -3.9),
    maxSpeed: 25
  };
}