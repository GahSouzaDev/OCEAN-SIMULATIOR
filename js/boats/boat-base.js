import * as THREE from 'three';

let _seed = 987654321;
export function rnd() {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
}
export function jit(a) { return (rnd() * 2 - 1) * a; }

export function plankTexture(base, tones, seam, patches) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  const rows = 8, rh = 256 / rows;
  for (let r = 0; r < rows; r++) {
    g.globalAlpha = 0.45 + rnd() * 0.55;
    g.fillStyle = tones[Math.floor(rnd() * tones.length)];
    g.fillRect(0, r * rh, 256, rh);
    g.globalAlpha = 1;
    g.fillStyle = seam; g.fillRect(0, r * rh, 256, 2);
    const jn = 1 + Math.floor(rnd() * 3);
    for (let j = 0; j < jn; j++) g.fillRect(rnd() * 256, r * rh, 2, rh);
  }
  for (let i = 0; i < patches; i++) {
    g.fillStyle = rnd() < 0.5 ? seam : tones[Math.floor(rnd() * tones.length)];
    g.globalAlpha = 0.2 + rnd() * 0.35;
    g.fillRect(rnd() * 256, rnd() * 256, 6 + rnd() * 30, 3 + rnd() * 9);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function traceHull(t, s) {
  t.moveTo(0, 4.5 * s);
  t.quadraticCurveTo(1.0 * s, 3.0 * s, 1.25 * s, 1.0 * s);
  t.quadraticCurveTo(1.32 * s, -1.0 * s, 1.15 * s, -3.2 * s);
  t.quadraticCurveTo(1.1 * s, -3.85 * s, 0.6 * s, -3.95 * s);
  t.lineTo(-0.6 * s, -3.95 * s);
  t.quadraticCurveTo(-1.1 * s, -3.85 * s, -1.15 * s, -3.2 * s);
  t.quadraticCurveTo(-1.32 * s, -1.0 * s, -1.25 * s, 1.0 * s);
  t.quadraticCurveTo(-1.0 * s, 3.0 * s, 0, 4.5 * s);
}
export function hullShape(s) {
  const p = new THREE.Shape(); traceHull(p, s); return p;
}
export function hullHole(s) {
  const p = new THREE.Path(); traceHull(p, s); return p;
}

export function sheer(z) {
  return Math.min(0.9, Math.max(0, z - 0.8) * 0.30 + Math.max(0, -z - 2.6) * 0.10);
}
export function applySheer(geo, h) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), z = p.getZ(i);
    p.setY(i, y + sheer(z) * (1 + y / h));
  }
  p.needsUpdate = true; geo.computeVertexNormals();
}
export function ringGeo(so, sh, h) {
  const s = hullShape(so); s.holes.push(hullHole(sh));
  const gg = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 14 });
  gg.rotateX(Math.PI / 2); return gg;
}

export function makeHelpers(T, mRope) {
  function add(geo, mat, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    T.add(m); return m;
  }
  function box(w, h, d, mat, x, y, z, rx, ry, rz) {
    return add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz);
  }
  function cyl(rt, rb, h, mat, x, y, z, seg, rx, ry, rz) {
    return add(new THREE.CylinderGeometry(rt, rb, h, seg || 8), mat, x, y, z, rx, ry, rz);
  }
  function rope(a, b, mat, r) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r || 0.015, r || 0.015, len, 5),
      mat || mRope
    );
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    T.add(m); return m;
  }
  return { add, box, cyl, rope };
}

// Materiais
const texHull  = plankTexture('#2e403e', ['#2a3b39', '#344744', '#273735', '#314341'], '#141d1b', 18);
const texCream = plankTexture('#d8c9a6', ['#cfc09c', '#e0d2b0', '#c2b28e', '#d5c6a2'], '#8f8266', 16);
const texWood  = plankTexture('#8a6a48', ['#7d5f40', '#96754f', '#6f5236', '#8a6a48'], '#43301f', 12);
const texDeck  = plankTexture('#7d5f40', ['#75583c', '#86684a', '#6f5236', '#7d5f40'], '#43301f', 10);
texHull.repeat.set(2, 1.4); texCream.repeat.set(1.6, 1);
texWood.repeat.set(1.4, 1); texDeck.repeat.set(2.2, 3);

export const MATS = {
  mHull: new THREE.MeshStandardMaterial({ map: texHull, roughness: 0.92 }),
  mHull2: new THREE.MeshStandardMaterial({ map: texHull, color: 0xb9c4c2, roughness: 0.92 }),
  mCream: new THREE.MeshStandardMaterial({ map: texCream, roughness: 0.85 }),
  mWood: new THREE.MeshStandardMaterial({ map: texWood, roughness: 0.88 }),
  mDeck: new THREE.MeshStandardMaterial({ map: texDeck, roughness: 0.92 }),
  mDark: new THREE.MeshStandardMaterial({ color: 0x4a3527, roughness: 0.9 }),
  mRed: new THREE.MeshStandardMaterial({ color: 0x9c4a38, roughness: 0.85 }),
  mYel: new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.85 }),
  mMetal: new THREE.MeshStandardMaterial({ color: 0x2e2a26, roughness: 0.85, metalness: 0.2 }),
  mRope: new THREE.MeshStandardMaterial({ color: 0xb09a6a, roughness: 0.95 }),
  mNet: new THREE.MeshStandardMaterial({ color: 0x5d6b52, roughness: 0.95 }),
  mGlass: new THREE.MeshStandardMaterial({ color: 0x0b1418, roughness: 0.4, metalness: 0.1 }),
  mKeel: new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.95 }),
  pHull: new THREE.MeshStandardMaterial({ color: 0xf2f5f8, roughness: 0.45, metalness: 0.08 }),
  pDeck: new THREE.MeshStandardMaterial({ color: 0xdde3ea, roughness: 0.6 }),
  pDark: new THREE.MeshStandardMaterial({ color: 0x1c2126, roughness: 0.5, metalness: 0.3 }),
  pGlass: new THREE.MeshStandardMaterial({ color: 0x0d1b24, roughness: 0.12, metalness: 0.4 }),
  pKeel: new THREE.MeshStandardMaterial({ color: 0x8a1418, roughness: 0.7 }),
  navRedMat: new THREE.MeshBasicMaterial({ color: 0xff2a2a }),
  navGrnMat: new THREE.MeshBasicMaterial({ color: 0x2aff70 }),
  navWhtMat: new THREE.MeshBasicMaterial({ color: 0xfff6d8 })
};