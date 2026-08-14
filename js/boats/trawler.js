import * as THREE from 'three';
import { MATS, makeHelpers, hullShape, ringGeo, applySheer, sheer, jit } from './boat-base.js';

export function buildTrawler() {
  const T = new THREE.Group();
  const { add, box, cyl, rope } = makeHelpers(T, MATS.mRope);
  const DECK_Y = 0.60;
  let g;

  // ============================================================
  //  CASCO
  // ============================================================
  g = new THREE.ExtrudeGeometry(hullShape(0.99), { depth: 0.55, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 14 });
  g.rotateX(Math.PI / 2); add(g, MATS.mHull, 0, 0.16, 0);
  g = new THREE.ExtrudeGeometry(hullShape(1.015), { depth: 0.34, bevelEnabled: false, curveSegments: 14 });
  g.rotateX(Math.PI / 2); add(g, MATS.mHull2, jit(0.02), 0.24, jit(0.05), 0, jit(0.004));

  // 📉 FAIXA SUPERIOR DO CASCO REBAIXADA (antes: depth 0.40 em DECK_Y+0.02)
  // Agora conecta de verdade com o casco de baixo, sem vão
  g = new THREE.ExtrudeGeometry(hullShape(1.03), { depth: 0.34, bevelEnabled: false, curveSegments: 14 });
  g.rotateX(Math.PI / 2); add(g, MATS.mHull, 0, DECK_Y - 0.06, 0, 0, jit(0.004));

  // ============================================================
  //  ESTRUTURA ORIGINAL (mantida intacta)
  // ============================================================
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

  // 📉 BULWARK (muralha lateral) REBAIXADA - fecha o vão com o casco
  // Antes: altura 0.55 em DECK_Y (topo ~1.15) | Agora: altura 0.42 em DECK_Y-0.08 (topo ~0.94)
  g = ringGeo(1.05, 0.97, 0.42); applySheer(g, 0.42); add(g, MATS.mCream, 0, DECK_Y - 0.08, 0);
  // Capa superior da borda (acompanha o rebaixamento)
  g = ringGeo(1.07, 0.96, 0.08); applySheer(g, 0.08); add(g, MATS.mDark, 0, DECK_Y + 0.34, 0);

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

  // 📉 GUARDA-CORPO REBAIXADO - agora nasce em cima da nova borda (sem vão)
  for (const s of [-1, 1]) {
    let prev = null;
    for (let i = 0; i < 6; i++) {
      const z = -3.2 + i * 1.25 + jit(0.15);
      const x = s * sideX(z) * 0.985;
      const yb = DECK_Y + 0.34 + sheer(z);   // antes: DECK_Y + 0.55 + sheer(z)
      cyl(0.025, 0.025, 0.42, MATS.mDark, x, yb + 0.21, z, 6, 0, jit(0.05));
      const top = new THREE.Vector3(x, yb + 0.42, z);
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

  // Boias (cordas ajustadas para a nova altura da borda)
  function buoy(x, z, mat) {
    const y = DECK_Y + 0.32 + jit(0.05);
    add(new THREE.SphereGeometry(0.15, 8, 6), mat, x, y, z);
    rope(new THREE.Vector3(x, y + 0.12, z),
         new THREE.Vector3(x * 0.92, DECK_Y + 0.40 + sheer(z), z), MATS.mRope, 0.012);
  }
  buoy(1.36, -1.4, MATS.mRed);
  buoy(-1.34, 0.6, MATS.mYel);
  buoy(-1.30, -2.3, MATS.mRed);
  add(new THREE.TorusGeometry(0.28, 0.09, 8, 12), MATS.mMetal, 1.34, DECK_Y + 0.20, 0.9, 0, Math.PI / 2);
  rope(new THREE.Vector3(1.34, DECK_Y + 0.48, 0.9),
       new THREE.Vector3(1.28, DECK_Y + 0.42 + sheer(0.9), 0.9), MATS.mRope, 0.012);

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

  // ============================================================
  //  NOVOS DETALHES (REBAIXADOS + AMPLIADOS)
  // ============================================================

  // ---- MADEIRA LATERAL (colada no casco de baixo, não mexe) ----
  for (let z = -3.75; z < 3.75; z += 0.5) {
    const zz = z + jit(0.05);
    const x = sideX(zz) * 0.985;
    box(0.04, 0.08, 0.45, MATS.mWood,  x, DECK_Y - 0.06, zz, 0, 0, jit(0.02));
    box(0.04, 0.08, 0.45, MATS.mWood, -x, DECK_Y - 0.06, zz, 0, 0, jit(0.02));
  }
  for (let z = -3.15; z < -1.6; z += 0.35) {
    const zz = z + jit(0.04);
    const x = sideX(zz) * 1.0;
    box(0.05, 0.12, 0.30, MATS.mWood,  x, DECK_Y - 0.04, zz, 0, 0.05, jit(0.03));
    box(0.05, 0.12, 0.30, MATS.mWood, -x, DECK_Y - 0.04, zz, 0, -0.05, jit(0.03));
  }

  // 🆕 TRILHO DE PROTEÇÃO LATERAL (rub rail) - dá continuidade
  // visual entre o casco de baixo e a borda, matando a sensação de vão
  for (let z = -3.75; z < 3.75; z += 0.5) {
    const zz = z + jit(0.05);
    const x = sideX(zz) * 1.0;
    box(0.03, 0.05, 0.45, MATS.mDark,  x, DECK_Y + 0.16, zz, 0, 0, jit(0.02));
    box(0.03, 0.05, 0.45, MATS.mDark, -x, DECK_Y + 0.16, zz, 0, 0, jit(0.02));
  }

  // 🆕 FAIXA DE LINHA D'ÁGUA (boot top vermelho) - clássico de pesqueiro
  g = ringGeo(1.02, 0.99, 0.12); add(g, MATS.mRed, 0, 0.16, 0);

  // ---- JANELAS E PORTAS ----
  for (let s of [-1, 1]) {
    for (let z of [-0.2, 0.6, 1.4]) {
      box(0.04, 0.32, 0.40, MATS.mGlass, s * 0.84, DECK_Y + 0.58, z + 0.8);
    }
    box(0.04, 0.32, 0.28, MATS.mGlass, s * 0.84, DECK_Y + 0.58, -0.2);
  }
  box(0.04, 0.55, 0.30, MATS.mWood, 0, DECK_Y + 0.40, 1.75);

  // ---- TORRE DE COMANDO ----
  for (let s of [-1, 1]) {
    for (let t of [-1, 1]) {
      cyl(0.03, 0.03, 0.70, MATS.mDark, s * 0.65, DECK_Y + 1.20, t * 0.65 + 0.8, 6);
    }
  }
  box(1.40, 0.04, 1.40, MATS.mDark, 0, DECK_Y + 1.55, 0.8);
  for (let s of [-1, 1]) {
    for (let z of [-0.6, 0.6]) {
      cyl(0.015, 0.015, 0.35, MATS.mMetal, s * 0.70, DECK_Y + 1.55, z + 0.8, 4);
      rope(new THREE.Vector3(s * 0.70, DECK_Y + 1.55, z + 0.8),
           new THREE.Vector3(s * 0.70, DECK_Y + 1.90, z + 0.8), MATS.mRope, 0.012);
    }
  }

  // ---- CHAMINÉ E FUMAÇA ----
  cyl(0.12, 0.10, 0.90, MATS.mMetal, 0, DECK_Y + 1.80, 0.3, 12, 0.02);
  cyl(0.14, 0.12, 0.04, MATS.mDark, 0, DECK_Y + 2.25, 0.3, 12);
  const smokePuffs = [
    { r: 0.12, y: 2.45, x: 0.00, z: 0.30, o: 0.32 },
    { r: 0.16, y: 2.62, x: 0.04, z: 0.26, o: 0.24 },
    { r: 0.20, y: 2.80, x: 0.10, z: 0.20, o: 0.17 },
    { r: 0.24, y: 3.00, x: 0.18, z: 0.14, o: 0.10 },
  ];
  for (const p of smokePuffs) {
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xcfcfcf, transparent: true, opacity: p.o });
    add(new THREE.SphereGeometry(p.r, 8, 8), smokeMat, p.x, DECK_Y + p.y, p.z);
  }

  // ---- MASTROS E ANTENAS ----
  cyl(0.04, 0.04, 3.20, MATS.mDark, 0, DECK_Y + 1.60, 2.0, 6, 0.04);
  cyl(0.03, 0.03, 2.00, MATS.mDark, 0, DECK_Y + 1.00, -2.5, 6, 0.02);
  cyl(0.01, 0.01, 1.00, MATS.mMetal, 0.50, DECK_Y + 2.10, 1.8, 4);
  const flagMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
  add(new THREE.PlaneGeometry(0.25, 0.15), flagMat, 0.52, DECK_Y + 2.50, 1.8).rotation.y = -0.3;

  // ---- HOLOFOTES ----
  const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
  add(new THREE.CylinderGeometry(0.06, 0.10, 0.12, 8), spotMat, 0.70, DECK_Y + 1.60, 2.2, 0, 0.2);
  add(new THREE.CylinderGeometry(0.06, 0.10, 0.12, 8), spotMat, -0.70, DECK_Y + 1.60, 2.2, 0, -0.2);

  // ---- ÂNCORA E CORRENTE ----
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), MATS.mMetal, 0.90, DECK_Y + 0.10, -1.0, 0.1);
  add(new THREE.BoxGeometry(0.08, 0.02, 0.25), MATS.mMetal, 0.90, DECK_Y + 0.10, -1.17);
  add(new THREE.BoxGeometry(0.02, 0.15, 0.02), MATS.mMetal, 0.90, DECK_Y + 0.28, -1.17);
  add(new THREE.TorusGeometry(0.06, 0.015, 6, 8), MATS.mMetal, 0.90, DECK_Y + 0.02, -1.0, Math.PI/2);
  for (let i = 0; i < 6; i++) {
    const y = DECK_Y + 0.05 + i * 0.04;
    add(new THREE.TorusGeometry(0.03, 0.012, 4, 8), MATS.mMetal, 0.90, y, -1.0, Math.PI/2, 0, 0.3);
  }

  // ---- BOTE SALVA-VIDAS + LONA ----
  const lifeboatGroup = new THREE.Group();
  const boatMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.7 });
  const hullBoat = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.25, 0.08, 8), boatMat);
  hullBoat.rotation.x = Math.PI/2;
  lifeboatGroup.add(hullBoat);
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  for (let i = 0; i < 4; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.04), seatMat);
    plank.position.set(0, 0.06, -0.08 + i * 0.05);
    lifeboatGroup.add(plank);
  }
  const tarpMat = new THREE.MeshStandardMaterial({ color: 0x6b7568, roughness: 0.95 });
  const tarp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), tarpMat);
  tarp.scale.set(1.05, 0.35, 1.15);
  tarp.position.set(0, 0.075, 0);
  lifeboatGroup.add(tarp);
  for (let i = 0; i < 3; i++) {
    const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 4), MATS.mRope);
    tie.position.set(-0.16 + i * 0.16, 0.03, 0.21);
    tie.rotation.x = 0.5;
    lifeboatGroup.add(tie);
  }
  lifeboatGroup.position.set(-0.90, DECK_Y + 1.20, 0.3);
  lifeboatGroup.rotation.z = 0.1;
  T.add(lifeboatGroup);

  // ---- MAIS BOIAS ----
  buoy(1.30, 1.8, MATS.mYel);
  buoy(-1.20, -3.0, MATS.mRed);

  // ---- PNEUS DE PROTEÇÃO ----
  for (let s of [-1, 1]) {
    add(new THREE.TorusGeometry(0.12, 0.04, 6, 10), MATS.mDark, s * 1.10, DECK_Y + 0.05, -2.0, Math.PI/2);
    add(new THREE.TorusGeometry(0.12, 0.04, 6, 10), MATS.mDark, s * 1.10, DECK_Y + 0.05,  1.5, Math.PI/2);
  }

  // 🆕 BARRIS E CAIXOTE NO CONVÉS (mais vida ao pesqueiro)
  cyl(0.16, 0.16, 0.45, MATS.mWood, -0.90, DECK_Y + 0.22, 2.20, 10);
  cyl(0.16, 0.16, 0.45, MATS.mWood, -0.62, DECK_Y + 0.22, 2.45, 10);
  box(0.40, 0.30, 0.40, MATS.mWood, 0.95, DECK_Y + 0.15, 1.90, 0, 0.3);

  // ---- LUZ DE MASTRO ----
  add(new THREE.SphereGeometry(0.08, 10, 8), MATS.navWhtMat, 0, DECK_Y + 1.90, 2.0);
  const navMast = new THREE.PointLight(0xffffff, 0, 8, 2);
  navMast.position.set(0, DECK_Y + 1.92, 2.0);
  T.add(navMast);

  // ---- MANCHAS DE FERRUGEM NO COSTADO ----
  const rustMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a1c, transparent: true, opacity: 0.35, roughness: 1, metalness: 0
  });
  const rustSpots = [-3.0, -1.6, -0.4, 0.9, 2.1];
  for (const z of rustSpots) {
    for (const s of [-1, 1]) {
      const x = s * sideX(z) * 1.0;
      const h = 0.25 + Math.abs(jit(0.15));
      const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.05, h), rustMat);
      streak.position.set(x * 0.995, DECK_Y - 0.20 - h / 2, z + jit(0.1));
      streak.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      T.add(streak);
    }
  }

  // ============================================================
  //  SOMBRAS
  // ============================================================
  T.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // ============================================================
  //  RETORNO (EXATAMENTE IGUAL AO ORIGINAL)
  // ============================================================
  return {
    name: 'trawler',
    mass: 7500,
    pitchMOI: 45000,
    rollMOI: 12000,
    yawMOI: 80000,

    minTurnRadius: 12,
    radiusGrowth: 2.0,
    turnResponse: 2.5,
    waterDragRot: 0.25,
    rudderSpeed: 1.2,

    throttleResponseSpeed: 0.6,
    throttleDecaySpeed: 0.9,
    engineInertia: 3.5,

    maxThrust: 12000,
    dragLinear: 35,
    dragQuad: 10,
    frictionLat: 5.5,

    group: T,
    deckLight,
    boatLight,
    bulbMat,
    navPort,
    navStbd,
    navStern,
    deckPos: new THREE.Vector3(0, DECK_Y + 2.4, 1.55),
    propeller: propTrawler,
    motorPos: new THREE.Vector3(0, -0.7, -4.2),
    maxSpeed: 15
  };
}