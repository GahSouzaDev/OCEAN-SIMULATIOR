import * as THREE from 'three';
import { MATS, makeHelpers, hullShape, ringGeo, applySheer, sheer, jit } from './boat-base.js';

export function buildTrawler() {
  // ... (Todo o seu código de modelagem 3D permanece EXATAMENTE IGUAL)
  // ... (Copie desde 'const T = new THREE.Group();' até 'T.traverse(...)')
  const T = new THREE.Group();
  const { add, box, cyl, rope } = makeHelpers(T, MATS.mRope);
  const DECK_Y = 0.60;
  let g;

  g = new THREE.ExtrudeGeometry(hullShape(0.99), { depth: 0.55, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 14 });
  g.rotateX(Math.PI / 2); add(g, MATS.mHull, 0, 0.16, 0);
  g = new THREE.ExtrudeGeometry(hullShape(1.015), { depth: 0.34, bevelEnabled: false, curveSegments: 14 });
  g.rotateX(Math.PI / 2); add(g, MATS.mHull2, jit(0.02), 0.24, jit(0.05), 0, jit(0.004));
  g = new THREE.ExtrudeGeometry(hullShape(1.03), { depth: 0.40, bevelEnabled: false, curveSegments: 14 });
  g.rotateX(Math.PI / 2); add(g, MATS.mHull, 0, DECK_Y + 0.02, 0, 0, jit(0.004));

  box(0.16, 0.22, 7.4, MATS.mDark, 0, -0.42, -0.1);
  box(0.08, 0.7, 0.5, MATS.mDark, 0, -0.30, -4.05);
  box(0.05, 0.20, 0.70, MATS.mWood, 1.30, 0.35, -1.1, 0, jit(0.1), jit(0.06));
  box(0.05, 0.16, 0.55, MATS.mDark, -1.28, 0.28, 0.7, 0, jit(0.1), jit(0.08));
  box(0.05, 0.18, 0.60, MATS.mWood, -1.24, 0.42, -2.4, 0, jit(0.1), jit(0.05));
  g = new THREE.ExtrudeGeometry(hullShape(0.93), { depth: 0.07, bevelEnabled: false, curveSegments: 12 });
  g.rotateX(Math.PI / 2); add(g, MATS.mDeck, 0, DECK_Y, 0);
  for (let i = 0; i < 7; i++)
    box(0.025, 0.02, 5.0, MATS.mDark,
      -0.75 + i * 0.25 + jit(0.02), DECK_Y + 0.012, -0.3, 0, jit(0.01));

  box(1.5, 0.16, 1.5, MATS.mWood, 0, DECK_Y + 0.10, 3.1, 0.10);
  g = ringGeo(1.05, 0.97, 0.55); applySheer(g, 0.55); add(g, MATS.mCream, 0, DECK_Y, 0);
  g = ringGeo(1.07, 0.96, 0.08); applySheer(g, 0.08); add(g, MATS.mDark, 0, DECK_Y + 0.63, 0);
  box(0.14, 1.35, 0.34, MATS.mDark, 0, 1.45, 4.32, -0.16);
  box(1.66, 0.92, 1.85, MATS.mCream, 0, DECK_Y + 0.46, 0.8);
  box(0.09, 0.94, 0.09, MATS.mDark, 0.80, DECK_Y + 0.46, 1.68);
  box(0.09, 0.94, 0.09, MATS.mDark, -0.80, DECK_Y + 0.46, 1.68);
  box(0.09, 0.94, 0.09, MATS.mDark, 0.80, DECK_Y + 0.46, -0.08);
  box(0.09, 0.94, 0.09, MATS.mDark, -0.80, DECK_Y + 0.46, -0.08);
  box(1.90, 0.05, 2.10, MATS.mDark, 0, DECK_Y + 0.94, 0.8);
  box(1.84, 0.09, 2.02, MATS.mRed, 0, DECK_Y + 0.99, 0.8, -0.05);
  box(0.56, 0.44, 0.04, MATS.mDark, -0.40, DECK_Y + 0.62, 1.72, 0, jit(0.02));
  box(0.56, 0.44, 0.04, MATS.mDark, 0.40, DECK_Y + 0.62, 1.72, 0, jit(0.02));
  box(0.50, 0.38, 0.05, MATS.mGlass, -0.40, DECK_Y + 0.62, 1.745, 0, jit(0.02));
  box(0.50, 0.38, 0.05, MATS.mGlass, 0.40, DECK_Y + 0.62, 1.745, 0, jit(0.02));
  box(0.05, 0.36, 0.60, MATS.mGlass, 0.845, DECK_Y + 0.60, 0.9);
  box(0.05, 0.36, 0.60, MATS.mGlass, -0.845, DECK_Y + 0.60, 0.9);
  box(0.52, 0.78, 0.06, MATS.mWood, 0, DECK_Y + 0.42, -0.10);
  cyl(0.05, 0.07, 0.8, MATS.mMetal, 0.55, DECK_Y + 1.35, 0.5, 8, 0, 0, 0.07);
  cyl(0.03, 0.03, 0.42, MATS.mMetal, 0, DECK_Y + 1.22, 1.55);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0x3a3a32 });
  add(new THREE.SphereGeometry(0.11, 12, 10), bulbMat, 0, DECK_Y + 1.47, 1.55);
  const deckLight = new THREE.PointLight(0xffc382, 0, 30, 1.5);
  deckLight.position.set(0, DECK_Y + 2.4, 1.55); deckLight.visible = false; T.add(deckLight);
  const boatLight = new THREE.PointLight(0xffd4a0, 0, 15, 2);
  boatLight.position.set(0, DECK_Y + 1.2, 0); boatLight.visible = false; T.add(boatLight);
  cyl(0.05, 0.07, 2.4, MATS.mDark, 0, DECK_Y + 1.15, 2.35, 8, 0.06);
  cyl(0.035, 0.035, 1.5, MATS.mDark, 0, DECK_Y + 1.95, 2.35, 6, 0, 0, Math.PI / 2);
  cyl(0.04, 0.05, 2.6, MATS.mWood, 0, DECK_Y + 1.85, 1.3, 6, 1.15);
  rope(new THREE.Vector3(0, DECK_Y + 2.3, 2.35), new THREE.Vector3(0, 2.0, 4.35));
  rope(new THREE.Vector3(0, DECK_Y + 2.3, 2.35), new THREE.Vector3(-1.2, DECK_Y + 0.5, 0.2));
  rope(new THREE.Vector3(0, DECK_Y + 2.3, 2.35), new THREE.Vector3(1.2, DECK_Y + 0.5, 0.2));
  rope(new THREE.Vector3(0, DECK_Y + 1.32, 0.12), new THREE.Vector3(0, DECK_Y + 0.92, 0.10));
  add(new THREE.TorusGeometry(0.06, 0.018, 6, 10), MATS.mMetal, 0, DECK_Y + 0.85, 0.10, Math.PI / 2);

  function sideX(z) { return 1.30 - Math.max(0, z - 1.0) * 0.14 - Math.max(0, -z - 2.0) * 0.05; }
  for (const s of [-1, 1]) {
    let prev = null;
    for (let i = 0; i < 6; i++) {
      const z = -3.2 + i * 1.25 + jit(0.15);
      const x = s * sideX(z) * 0.985;
      const yb = DECK_Y + 0.55 + sheer(z);
      cyl(0.025, 0.025, 0.5, MATS.mDark, x, yb + 0.22, z, 6, 0, jit(0.05));
      const top = new THREE.Vector3(x, yb + 0.46, z);
      if (prev) rope(prev, top, MATS.mRope, 0.02);
      prev = top;
    }
  }

  box(0.30, 0.24, 0.20, MATS.mMetal, 0.55, DECK_Y + 0.12, -3.3);
  cyl(0.09, 0.09, 0.34, MATS.mMetal, 0.55, DECK_Y + 0.28, -3.3, 10, 0, 0, Math.PI / 2);
  cyl(0.02, 0.02, 0.30, MATS.mMetal, 0.72, DECK_Y + 0.30, -3.3, 6, 0, 0, 0.6);
  box(0.55, 0.40, 0.55, MATS.mWood, -0.62, DECK_Y + 0.20, -3.20, 0, 0.20);
  box(0.46, 0.32, 0.46, MATS.mRed, -0.58, DECK_Y + 0.56, -3.14, 0, -0.18);
  box(0.60, 0.42, 0.60, MATS.mWood, 0.62, DECK_Y + 0.21, -2.55, 0, 0.35);
  cyl(0.26, 0.22, 0.70, MATS.mWood, 0.62, DECK_Y + 0.35, -3.45, 10, 0.04, 0, 0.05);
  cyl(0.265, 0.265, 0.05, MATS.mMetal, 0.62, DECK_Y + 0.22, -3.45, 10);
  cyl(0.265, 0.265, 0.05, MATS.mMetal, 0.62, DECK_Y + 0.50, -3.45, 10);
  add(new THREE.IcosahedronGeometry(0.55, 0), MATS.mNet, -0.15, DECK_Y + 0.18, -3.55)
    .scale.set(1.2, 0.5, 1.1);
  add(new THREE.IcosahedronGeometry(0.40, 0), MATS.mNet, 0.35, DECK_Y + 0.14, -3.60)
    .scale.set(1.1, 0.45, 1.0);
  add(new THREE.IcosahedronGeometry(0.35, 0), MATS.mNet, -0.50, DECK_Y + 0.30, -3.60)
    .scale.set(1.0, 0.5, 0.9);
  box(0.06, 0.55, 0.90, MATS.mNet, -1.28, DECK_Y + 0.55, -1.9, 0, 0, 0.12);
  add(new THREE.TorusGeometry(0.22, 0.05, 6, 12), MATS.mRope, 0.30, DECK_Y + 0.06, -1.7, Math.PI / 2);
  add(new THREE.TorusGeometry(0.18, 0.045, 6, 12), MATS.mRope, -0.45, DECK_Y + 0.24, 3.0, Math.PI / 2, 0, 0.4);
  cyl(0.03, 0.03, 3.4, MATS.mWood, 0.98, DECK_Y + 0.07, -0.6, 6, Math.PI / 2 + jit(0.03), 0, jit(0.05));
  cyl(0.025, 0.025, 3.1, MATS.mWood, 0.88, DECK_Y + 0.12, -0.5, 6, Math.PI / 2 + jit(0.04), 0, jit(0.08));
  cyl(0.012, 0.012, 0.16, MATS.mMetal, 0.86, DECK_Y + 0.62, 0.35, 5, Math.PI / 2);
  add(new THREE.TorusGeometry(0.05, 0.014, 5, 8), MATS.mMetal, 0.88, DECK_Y + 0.55, 0.35);
  function buoy(x, z, mat) {
    const y = DECK_Y + 0.32 + jit(0.05);
    add(new THREE.SphereGeometry(0.15, 8, 6), mat, x, y, z);
    rope(new THREE.Vector3(x, y + 0.12, z),
         new THREE.Vector3(x * 0.92, DECK_Y + 0.6 + sheer(z), z), MATS.mRope, 0.012);
  }
  buoy(1.36, -1.4, MATS.mRed);
  buoy(-1.34, 0.6, MATS.mYel);
  buoy(-1.30, -2.3, MATS.mRed);
  add(new THREE.TorusGeometry(0.28, 0.09, 8, 12), MATS.mMetal, 1.34, DECK_Y + 0.20, 0.9, 0, Math.PI / 2);
  rope(new THREE.Vector3(1.34, DECK_Y + 0.48, 0.9),
       new THREE.Vector3(1.28, DECK_Y + 0.62 + sheer(0.9), 0.9), MATS.mRope, 0.012);
  function navPost(x, z, mat, lightCol) {
    cyl(0.022, 0.022, 0.5, MATS.mDark, x, DECK_Y + 0.28, z, 6);
    add(new THREE.SphereGeometry(0.075, 10, 8), mat, x, DECK_Y + 0.56, z);
    const pl = new THREE.PointLight(lightCol, 0, 4, 2);
    pl.position.set(x, DECK_Y + 0.58, z); T.add(pl);
    return pl;
  }
  const navPort = navPost(-1.02, -3.55, MATS.navRedMat, 0xff2020);
  const navStbd = navPost(1.02, -3.55, MATS.navGrnMat, 0x20ff60);
  add(new THREE.SphereGeometry(0.06, 10, 8), MATS.navWhtMat, 0, DECK_Y + 0.5, -3.9);
  const navStern = new THREE.PointLight(0xfff2cc, 0, 4, 2);
  navStern.position.set(0, DECK_Y + 0.52, -3.9); T.add(navStern);
  const keel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 6.5), MATS.mKeel);
  keel.position.set(0, -0.6, -0.3); T.add(keel);
  const motorBlock = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.8), MATS.mDark);
  motorBlock.position.set(0, -0.3, -3.8); T.add(motorBlock);
  const propTrawler = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), MATS.mMetal);
  propTrawler.position.set(0, -0.7, -4.2);
  propTrawler.rotation.z = Math.PI / 2; T.add(propTrawler);

  T.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // ===== O GIGANTE DOS MARES =====
  return {
    name: 'trawler',
    mass: 7500,
    pitchMOI: 45000,
    rollMOI: 12000,
    yawMOI: 80000,
    
    // 🎯 SISTEMA DE RAIO DE GIRO
    minTurnRadius: 15,
    radiusGrowth: 2.0,
    turnResponse: 2.5,
    waterDragRot: 0.25,
    
    // BARRA DO LEME
    rudderSpeed: 1.2,
    
    // 🎯 SISTEMA DE ACELERADOR (Motor Diesel Pesado)
    throttleResponseSpeed: 0.6,    // LENTO pra acelerar (motor diesel grande)
    throttleDecaySpeed: 0.9,       // Um pouco mais rápido pra desacelerar
    engineInertia: 3.5,            // Turbo lag alto, motor demora pra responder
    
    maxThrust: 12000,
    dragLinear: 35,
    dragQuad: 10,
    frictionLat: 5.5,
    
    group: T, deckLight, boatLight, bulbMat,
    navPort, navStbd, navStern,
    deckPos: new THREE.Vector3(0, DECK_Y + 2.4, 1.55),
    propeller: propTrawler,
    motorPos: new THREE.Vector3(0, -0.7, -4.2),
    maxSpeed: 15
  };
}