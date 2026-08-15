import * as THREE from 'three';
import { state } from '../state.js';
import { waveHAt } from './waves.js';
import { foam } from './foam.js';
import { spray, emitSpray } from './spray.js';

const MAX_TRAIL = 180, TRAIL_LIFE = 9;
const trail = []; let lastTrailPt = null;
export let wakeGeo, wakeMat2, wakeMesh;

const MAX_HISTORY = 200, HISTORY_LIFE = 14;
export const wakeHistory = [];
let lastHistoryPos = null;

const MAIN_WAKE_MAX = 200;
export let mainWakeGeo, mainWakeMat, mainWakeMesh;

const HULL_WAKE_MAX = 200;
export let hullWakeGeoL, hullWakeGeoR, hullWakeMat, hullWakeMeshL, hullWakeMeshR;

const BOW_V_PTS = 25;
export let bowWaveGeo, bowWaveMat, bowWaveMesh;

// ==========================================================
// 🌊💦 SPRAY DE CASCO — água cortada em volta de TODO o barco
// ==========================================================
let hullSprayAccum = 0;
let bowSprayAccum = 0;
let sternWashAccum = 0;

// 💦 PERÍMETRO INTEIRO (proa → laterais → popa), RENTE à linha d'água
function emitHullSpray() {
  const absSpeed = Math.abs(state.speed);
  if (absSpeed < 0.35 || !state.motorInWater) return;
  const spdN = Math.min(1, absSpeed / 10);

  const bx = state.boatRoot.position.x;
  const bz = state.boatRoot.position.z;
  const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
  const rightX = Math.cos(state.heading), rightZ = -Math.sin(state.heading);

  // ~40 part/s devagar → ~260 part/s rápido (MUITO mais denso)
  hullSprayAccum += (40 + spdN * 220) * 0.016;
  let count = Math.floor(hullSprayAccum);
  hullSprayAccum -= count;
  count = Math.min(count, 22);

  for (let i = 0; i < count; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const along = 4.0 - Math.random() * 8.2; // +4.0 proa → -4.2 popa (casco TODO)
    const taper = 1.0 - Math.max(0, along - 0.5) * 0.18 - Math.max(0, -along - 2.5) * 0.06;
    const halfW = Math.max(0.28, 1.2 * taper) + (Math.random() - 0.5) * 0.12;

    const px = bx + fwdX * along + rightX * side * halfW;
    const pz = bz + fwdZ * along + rightZ * side * halfW;
    const py = waveHAt(px, pz) + 0.04; // 💧 RENTE à água

    const isStern = along < -3.0; // popa borbulha mais (hélice)
    const out  = (0.5 + Math.random() * 1.2) * (0.4 + spdN * 1.2);
    const up   = (0.6 + Math.random() * 1.4) * (0.35 + spdN * 1.2) * (isStern ? 1.3 : 1.0);
    const back = absSpeed * (0.15 + Math.random() * 0.3);

    emitSpray(
      px, py, pz,
      rightX * side * out - fwdX * back,
      up,
      rightZ * side * out - fwdZ * back,
      { size: (0.07 + Math.random() * 0.10) * (0.6 + spdN * 0.8) * (isStern ? 1.25 : 1.0),
        life: 0.3 + Math.random() * 0.5 }
    );
  }

  // Aproveita o tick pra soltar também a lavagem da hélice
  emitSternWash();
}

// 💦 HÉLICE lavando água atrás da popa (borbulha até devagar)
function emitSternWash() {
  const absSpeed = Math.abs(state.speed);
  if (absSpeed < 0.5 || !state.motorInWater) return;
  const spdN = Math.min(1, absSpeed / 10);
  const thr = (state.throttle !== undefined) ? state.throttle : spdN;

  const bx = state.boatRoot.position.x;
  const bz = state.boatRoot.position.z;
  const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
  const rightX = Math.cos(state.heading), rightZ = -Math.sin(state.heading);

  sternWashAccum += (10 + (spdN * 0.5 + thr * 0.5) * 160) * 0.016;
  let count = Math.floor(sternWashAccum);
  sternWashAccum -= count;
  count = Math.min(count, 14);

  for (let i = 0; i < count; i++) {
    const lat = (Math.random() - 0.5) * 1.6;
    const behind = -4.2 - Math.random() * 1.4;
    const px = bx + fwdX * behind + rightX * lat;
    const pz = bz + fwdZ * behind + rightZ * lat;
    const py = waveHAt(px, pz) + 0.05;

    const back = absSpeed * (0.3 + Math.random() * 0.4) + 0.6;
    const out  = 0.3 + Math.random() * 0.9;
    const up   = (0.8 + Math.random() * 1.6) * (0.4 + thr);

    emitSpray(
      px, py, pz,
      rightX * lat * out - fwdX * back,
      up,
      rightZ * lat * out - fwdZ * back,
      { size: 0.08 + Math.random() * 0.12, life: 0.35 + Math.random() * 0.5 }
    );
  }
}

// 💦 LEQUE BRANCO na proa (o "V" de água cortada) — reforçado
function emitBowCutSpray() {
  const absSpeed = Math.abs(state.speed);
  if (absSpeed < 1.0 || !state.motorInWater) return;
  const spdN = Math.min(1, absSpeed / 10);

  const bx = state.boatRoot.position.x;
  const bz = state.boatRoot.position.z;
  const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
  const rightX = Math.cos(state.heading), rightZ = -Math.sin(state.heading);

  bowSprayAccum += (15 + spdN * 140) * 0.016;
  let count = Math.floor(bowSprayAccum);
  bowSprayAccum -= count;
  count = Math.min(count, 12);

  for (let i = 0; i < count; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const along = 4.2 - Math.random() * 2.2;
    const taper = 1.0 - Math.max(0, along - 0.5) * 0.18;
    const halfW = Math.max(0.2, 1.2 * taper) + Math.random() * 0.25;

    const px = bx + fwdX * along + rightX * side * halfW;
    const pz = bz + fwdZ * along + rightZ * side * halfW;
    const py = waveHAt(px, pz) + 0.06;

    const out = (1.2 + Math.random() * 2.0) * (0.5 + spdN);
    const up  = (1.0 + Math.random() * 2.0) * (0.4 + spdN);
    const fwd = absSpeed * (0.1 + Math.random() * 0.25);

    emitSpray(
      px, py, pz,
      rightX * side * out + fwdX * fwd,
      up,
      rightZ * side * out + fwdZ * fwd,
      { size: 0.08 + Math.random() * 0.12 * (0.5 + spdN),
        life: 0.35 + Math.random() * 0.5 }
    );
  }
}

// ==========================================================
// INIT
// ==========================================================
export function initWake() {
  wakeGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(MAX_TRAIL * 2 * 3);
    const aU = new Float32Array(MAX_TRAIL * 2);
    for (let i = 0; i < MAX_TRAIL; i++) { aU[i * 2] = -1; aU[i * 2 + 1] = 1; }
    const idx = [];
    for (let i = 0; i < MAX_TRAIL - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      idx.push(a, c, b, b, c, d);
    }
    wakeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    wakeGeo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
    wakeGeo.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(MAX_TRAIL * 2), 1).setUsage(THREE.DynamicDrawUsage));
    wakeGeo.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(MAX_TRAIL * 2), 1).setUsage(THREE.DynamicDrawUsage));
    wakeGeo.setIndex(idx);
  }
  wakeMat2 = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uBright: { value: 1 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute float aU,aA,aV; varying float vU,vA,vV;
      void main(){vU=aU;vA=aA;vV=aV; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float uT,uBright; varying float vU,vA,vV;
      void main(){float edge=smoothstep(1.0,0.2,abs(vU)); float core=exp(-vU*vU*10.0);
        float streak=0.72+0.28*sin(vV*90.0-uT*3.0+vU*4.0);
        float a=vA*(edge*0.5+core*0.85)*streak; if(a<0.012) discard;
        gl_FragColor=vec4(vec3(0.93,0.975,1.0)*uBright,a);}`
  });
  wakeMesh = new THREE.Mesh(wakeGeo, wakeMat2);
  wakeMesh.frustumCulled = false; wakeMesh.renderOrder = 2;
  state.scene.add(wakeMesh);

  mainWakeGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(MAIN_WAKE_MAX * 2 * 3);
    const aU = new Float32Array(MAIN_WAKE_MAX * 2);
    for (let i = 0; i < MAIN_WAKE_MAX; i++) { aU[i * 2] = -1; aU[i * 2 + 1] = 1; }
    const idx = [];
    for (let i = 0; i < MAIN_WAKE_MAX - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      idx.push(a, c, b, b, c, d);
    }
    mainWakeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    mainWakeGeo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
    mainWakeGeo.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(MAIN_WAKE_MAX * 2), 1).setUsage(THREE.DynamicDrawUsage));
    mainWakeGeo.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(MAIN_WAKE_MAX * 2), 1).setUsage(THREE.DynamicDrawUsage));
    mainWakeGeo.setIndex(idx);
  }
  mainWakeMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uBright: { value: 1 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute float aU,aA,aV; varying float vU,vA,vV;
      void main(){vU=aU;vA=aA;vV=aV; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float uT,uBright; varying float vU,vA,vV;
      void main(){float edge=smoothstep(1.0,0.0,abs(vU)); float core=exp(-vU*vU*3.0);
        float streak=0.6+0.4*sin(vV*30.0-uT*2.0+vU*2.0);
        float a=vA*(edge*0.5+core*0.7)*streak; if(a<0.015) discard;
        gl_FragColor=vec4(vec3(0.92,0.96,1.0)*uBright,a*0.75);}`
  });
  mainWakeMesh = new THREE.Mesh(mainWakeGeo, mainWakeMat);
  mainWakeMesh.frustumCulled = false; mainWakeMesh.renderOrder = 2;
  state.scene.add(mainWakeMesh);

  function createHullWakeGeometry(geo) {
    const pos = new Float32Array(HULL_WAKE_MAX * 2 * 3);
    const aU = new Float32Array(HULL_WAKE_MAX * 2);
    for (let i = 0; i < HULL_WAKE_MAX; i++) { aU[i * 2] = -1; aU[i * 2 + 1] = 1; }
    const idx = [];
    for (let i = 0; i < HULL_WAKE_MAX - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      idx.push(a, c, b, b, c, d);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
    geo.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(HULL_WAKE_MAX * 2), 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(HULL_WAKE_MAX * 2), 1).setUsage(THREE.DynamicDrawUsage));
    geo.setIndex(idx);
  }
  hullWakeGeoL = new THREE.BufferGeometry();
  hullWakeGeoR = new THREE.BufferGeometry();
  createHullWakeGeometry(hullWakeGeoL);
  createHullWakeGeometry(hullWakeGeoR);
  hullWakeMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute float aU,aA,aV; varying float vU,vA,vV;
      void main(){vU=aU;vA=aA;vV=aV; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float uT; varying float vU,vA,vV;
      void main(){float edge=smoothstep(1.0,0.0,abs(vU)); float a=vA*edge*0.7;
        if(a<0.02) discard; gl_FragColor=vec4(vec3(0.9,0.95,1.0),a);}`
  });
  hullWakeMeshL = new THREE.Mesh(hullWakeGeoL, hullWakeMat);
  hullWakeMeshR = new THREE.Mesh(hullWakeGeoR, hullWakeMat);
  hullWakeMeshL.frustumCulled = false; hullWakeMeshL.renderOrder = 2;
  hullWakeMeshR.frustumCulled = false; hullWakeMeshR.renderOrder = 2;
  state.scene.add(hullWakeMeshL);
  state.scene.add(hullWakeMeshR);

  bowWaveGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(BOW_V_PTS * 2 * 3);
    const aU = new Float32Array(BOW_V_PTS * 2);
    for (let i = 0; i < BOW_V_PTS; i++) { aU[i * 2] = -1; aU[i * 2 + 1] = 1; }
    const idx = [];
    for (let i = 0; i < BOW_V_PTS - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      idx.push(a, c, b, b, c, d);
    }
    bowWaveGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    bowWaveGeo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
    bowWaveGeo.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(BOW_V_PTS * 2), 1).setUsage(THREE.DynamicDrawUsage));
    bowWaveGeo.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(BOW_V_PTS * 2), 1).setUsage(THREE.DynamicDrawUsage));
    bowWaveGeo.setIndex(idx);
  }
  bowWaveMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uSpeed: { value: 0 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute float aU,aA,aV; varying float vU,vA,vV;
      void main(){vU=aU;vA=aA;vV=aV; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float uT,uSpeed; varying float vU,vA,vV;
      void main(){float edge=smoothstep(1.0,0.0,abs(vU)); float foam=edge*0.85;
        float turb=0.7+0.3*sin(vV*20.0+uT*4.0); float a=vA*foam*turb;
        if(a<0.02) discard; gl_FragColor=vec4(vec3(0.97,0.99,1.0),a);}`
  });
  bowWaveMesh = new THREE.Mesh(bowWaveGeo, bowWaveMat);
  bowWaveMesh.frustumCulled = false; bowWaveMesh.renderOrder = 2;
  state.tilt.add(bowWaveMesh);
}

export function recordWakePoint() {
  const bx = state.boatRoot.position.x, bz = state.boatRoot.position.z;
  const dist = lastHistoryPos ? Math.hypot(bx - lastHistoryPos.x, bz - lastHistoryPos.z) : 999;
  if (dist > 0.35 && Math.abs(state.speed) > 0.3) {
    wakeHistory.unshift({
      x: bx, z: bz, heading: state.heading,
      speed: Math.abs(state.speed), t: state.simTime
    });
    lastHistoryPos = { x: bx, z: bz };
    while (wakeHistory.length > MAX_HISTORY) wakeHistory.pop();
  }
  while (wakeHistory.length && state.simTime - wakeHistory[wakeHistory.length - 1].t > HISTORY_LIFE) {
    wakeHistory.pop();
  }

  if (!lastTrailPt || Math.hypot(bx - lastTrailPt.x, bz - lastTrailPt.z) > 0.55) {
    trail.unshift({ x: bx, z: bz, t: state.simTime });
    lastTrailPt = { x: bx, z: bz };
  }
  while (trail.length && (state.simTime - trail[trail.length - 1].t > TRAIL_LIFE || trail.length > MAX_TRAIL)) trail.pop();
}

export function updateMainWake() {
  const pos = mainWakeGeo.attributes.position.array;
  const aA = mainWakeGeo.attributes.aA.array;
  const aV = mainWakeGeo.attributes.aV.array;
  const n = Math.min(wakeHistory.length, MAIN_WAKE_MAX);
  for (let i = 0; i < n; i++) {
    const p = wakeHistory[i];
    const age = state.simTime - p.t;
    const lifeRatio = age / HISTORY_LIFE;
    const speedInfluence = age * p.speed * 0.04;
    const w = Math.min(2.5, 0.05 + age * 0.20 + age * age * 0.03 + speedInfluence);
    const perpX = Math.cos(p.heading);
    const perpZ = -Math.sin(p.heading);
    const y = waveHAt(p.x, p.z) + 0.05;
    pos[i * 6]     = p.x - perpX * w;
    pos[i * 6 + 1] = y;
    pos[i * 6 + 2] = p.z - perpZ * w;
    pos[i * 6 + 3] = p.x + perpX * w;
    pos[i * 6 + 4] = y;
    pos[i * 6 + 5] = p.z + perpZ * w;
    const speedFactor = THREE.MathUtils.smoothstep(p.speed, 0.3, 4.0);
    const ageFade = Math.pow(1 - lifeRatio, 1.3);
    const alpha = ageFade * speedFactor * 0.9;
    aA[i * 2] = alpha; aA[i * 2 + 1] = alpha;
    aV[i * 2] = lifeRatio; aV[i * 2 + 1] = lifeRatio;
  }
  for (let i = n; i < MAIN_WAKE_MAX; i++) { aA[i * 2] = 0; aA[i * 2 + 1] = 0; }
  mainWakeGeo.setDrawRange(0, Math.max(0, (n - 1) * 6));
  mainWakeGeo.attributes.position.needsUpdate = true;
  mainWakeGeo.attributes.aA.needsUpdate = true;
  mainWakeGeo.attributes.aV.needsUpdate = true;
  mainWakeMat.uniforms.uT.value = state.simTime;
}

export function updateHullWake() {
  const posL = hullWakeGeoL.attributes.position.array;
  const posR = hullWakeGeoR.attributes.position.array;
  const aAL = hullWakeGeoL.attributes.aA.array;
  const aAR = hullWakeGeoR.attributes.aA.array;
  const aVL = hullWakeGeoL.attributes.aV.array;
  const aVR = hullWakeGeoR.attributes.aV.array;
  const n = Math.min(wakeHistory.length, HULL_WAKE_MAX);
  const hullOffsetBase = 0.60;
  for (let i = 0; i < n; i++) {
    const p = wakeHistory[i];
    const age = state.simTime - p.t;
    const lifeRatio = age / HISTORY_LIFE;
    const speedInfluence = age * p.speed * 0.03;
    const lateralSpread = Math.min(5.5, age * 0.22 + age * age * 0.04 + speedInfluence);
    const currentOffset = Math.min(6.0, hullOffsetBase + lateralSpread);
    const w = Math.min(1.5, 0.08 + age * 0.15 + age * age * 0.02 + age * p.speed * 0.01);
    const fwdX = Math.sin(p.heading), fwdZ = Math.cos(p.heading);
    const rightX = fwdZ, rightZ = -fwdX;
    const y = waveHAt(p.x, p.z) + 0.04;
    const cxL = p.x - rightX * currentOffset, czL = p.z - rightZ * currentOffset;
    const cxR = p.x + rightX * currentOffset, czR = p.z + rightZ * currentOffset;
    posL[i * 6]     = cxL - rightX * w; posL[i * 6 + 1] = y; posL[i * 6 + 2] = czL - rightZ * w;
    posL[i * 6 + 3] = cxL + rightX * w; posL[i * 6 + 4] = y; posL[i * 6 + 5] = czL + rightZ * w;
    posR[i * 6]     = cxR - rightX * w; posR[i * 6 + 1] = y; posR[i * 6 + 2] = czR - rightZ * w;
    posR[i * 6 + 3] = cxR + rightX * w; posR[i * 6 + 4] = y; posR[i * 6 + 5] = czR + rightZ * w;
    const speedFactor = THREE.MathUtils.smoothstep(p.speed, 0.5, 4.0);
    const ageFade = Math.pow(1 - lifeRatio, 1.5);
    const alpha = ageFade * speedFactor * 0.7;
    aAL[i * 2] = alpha; aAL[i * 2 + 1] = alpha;
    aAR[i * 2] = alpha; aAR[i * 2 + 1] = alpha;
    aVL[i * 2] = lifeRatio; aVL[i * 2 + 1] = lifeRatio;
    aVR[i * 2] = lifeRatio; aVR[i * 2 + 1] = lifeRatio;
  }
  for (let i = n; i < HULL_WAKE_MAX; i++) {
    aAL[i * 2] = 0; aAL[i * 2 + 1] = 0;
    aAR[i * 2] = 0; aAR[i * 2 + 1] = 0;
  }
  hullWakeGeoL.setDrawRange(0, Math.max(0, (n - 1) * 6));
  hullWakeGeoR.setDrawRange(0, Math.max(0, (n - 1) * 6));
  hullWakeGeoL.attributes.position.needsUpdate = true;
  hullWakeGeoR.attributes.position.needsUpdate = true;
  hullWakeGeoL.attributes.aA.needsUpdate = true;
  hullWakeGeoR.attributes.aA.needsUpdate = true;
  hullWakeGeoL.attributes.aV.needsUpdate = true;
  hullWakeGeoR.attributes.aV.needsUpdate = true;
  hullWakeMat.uniforms.uT.value = state.simTime;

  // 🌊 SPRAY NAS LATERAIS + POPA (roda todo frame)
  emitHullSpray();
}

export function updateBowWave() {
  const spdN = Math.min(1, Math.abs(state.speed) / 6);
  const absSpeed = Math.abs(state.speed);
  const pos = bowWaveGeo.attributes.position.array;
  const aA = bowWaveGeo.attributes.aA.array;
  const aV = bowWaveGeo.attributes.aV.array;
  for (let i = 0; i < BOW_V_PTS; i++) {
    const t = i / (BOW_V_PTS - 1);
    const zOffset = 4.1 - t * 3.5;
    const w = t * 1.4 * Math.min(1, absSpeed * 0.25);
    const y = 0.15 + t * 0.4 * spdN;
    pos[i * 6]     = -w;  pos[i * 6 + 1] = y; pos[i * 6 + 2] = zOffset;
    pos[i * 6 + 3] =  w;  pos[i * 6 + 4] = y; pos[i * 6 + 5] = zOffset;
    const intensity = (1 - t * t) * spdN * 0.95;
    aA[i * 2] = intensity; aA[i * 2 + 1] = intensity;
    aV[i * 2] = t;         aV[i * 2 + 1] = t;
  }
  bowWaveGeo.attributes.position.needsUpdate = true;
  bowWaveGeo.attributes.aA.needsUpdate = true;
  bowWaveGeo.attributes.aV.needsUpdate = true;
  bowWaveMat.uniforms.uT.value = state.simTime;
  bowWaveMat.uniforms.uSpeed.value = spdN;

  // 🌊 LEQUE DE SPRAY NA PROA (roda todo frame)
  emitBowCutSpray();
}

export function updateTrailWake() {
  const pos = wakeGeo.attributes.position.array;
  const aA = wakeGeo.attributes.aA.array;
  const aV = wakeGeo.attributes.aV.array;
  const n = trail.length;
  const spdN = Math.min(1, Math.abs(state.speed) / 6);
  for (let i = 0; i < n; i++) {
    const p = trail[i];
    let tx, tz;
    if (i === 0 && n > 1) { tx = p.x - trail[1].x; tz = p.z - trail[1].z; }
    else if (i === n - 1) { tx = p.x - trail[i - 1].x; tz = p.z - trail[i - 1].z; }
    else { tx = trail[i - 1].x - trail[i + 1].x; tz = trail[i - 1].z - trail[i + 1].z; }
    const len = Math.hypot(tx, tz) || 1; tx /= len; tz /= len;
    const nx = -tz, nz = tx;
    const age = state.simTime - p.t;
    const w = Math.min(3.0, 0.03 + age * 0.22 + age * age * 0.04 + age * spdN * 0.3);
    const y = waveHAt(p.x, p.z) + 0.03;
    pos[i * 6]     = p.x + nx * w; pos[i * 6 + 1] = y; pos[i * 6 + 2] = p.z + nz * w;
    pos[i * 6 + 3] = p.x - nx * w; pos[i * 6 + 4] = y; pos[i * 6 + 5] = p.z - nz * w;
    let a = Math.pow(1 - age / TRAIL_LIFE, 1.4) *
            THREE.MathUtils.clamp(Math.abs(state.speed) / 5, 0, 1) * 0.85;
    a *= THREE.MathUtils.smoothstep(age, 0, 0.3);
    aA[i * 2] = a; aA[i * 2 + 1] = a;
    const vv = age / TRAIL_LIFE;
    aV[i * 2] = vv; aV[i * 2 + 1] = vv;
  }
  wakeGeo.setDrawRange(0, Math.max(0, (n - 1) * 6));
  wakeGeo.attributes.position.needsUpdate = true;
  wakeGeo.attributes.aA.needsUpdate = true;
  wakeGeo.attributes.aV.needsUpdate = true;
  wakeMat2.uniforms.uT.value = state.simTime;
}

export function updateParticleBuffers(dt) {
  const bright = THREE.MathUtils.clamp(
    0.35 + 0.65 * state.dayF + (state.deckOn ? 0.3 : 0), 0, 1.3
  );
  // foam
  {
    let wI = 0;
    const fp = foam.geo.attributes.position.array;
    const fs = foam.geo.attributes.aSize.array;
    const fa = foam.geo.attributes.aAlpha.array;
    for (let i = foam.list.length - 1; i >= 0; i--) {
      const p = foam.list[i];
      p.life += dt;
      if (p.life >= p.max) { foam.list[i] = foam.list[foam.list.length - 1]; foam.list.pop(); continue; }
      p.vx *= Math.pow(0.6, dt); p.vz *= Math.pow(0.6, dt);
      p.x += p.vx * dt; p.z += p.vz * dt;
      p.y = waveHAt(p.x, p.z) + 0.05;
      const t = p.life / p.max;
      fp[wI * 3] = p.x; fp[wI * 3 + 1] = p.y; fp[wI * 3 + 2] = p.z;
      fs[wI] = p.size * (1 + p.life * 0.7);
      fa[wI] = Math.min(1, p.life / 0.25) * (1 - t) *
               (0.5 + 0.5 * Math.sin(Math.min(1, t) * Math.PI)) * 0.85;
      wI++;
    }
    foam.geo.setDrawRange(0, wI);
    foam.geo.attributes.position.needsUpdate = true;
    foam.geo.attributes.aSize.needsUpdate = true;
    foam.geo.attributes.aAlpha.needsUpdate = true;
  }
  // spray
  {
    let sI = 0;
    const sp = spray.geo.attributes.position.array;
    const ss = spray.geo.attributes.aSize.array;
    const sa = spray.geo.attributes.aAlpha.array;
    for (let i = spray.list.length - 1; i >= 0; i--) {
      const p = spray.list[i];
      p.life += dt;
      p.vy -= 6.5 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.life >= p.max || p.y < waveHAt(p.x, p.z) - 0.15) {
        spray.list[i] = spray.list[spray.list.length - 1]; spray.list.pop(); continue;
      }
      const t = p.life / p.max;
      sp[sI * 3] = p.x; sp[sI * 3 + 1] = p.y; sp[sI * 3 + 2] = p.z;
      ss[sI] = p.size;
      sa[sI] = Math.min(1, p.life / 0.12) * (1 - t * t) * 0.95;
      sI++;
    }
    spray.geo.setDrawRange(0, sI);
    spray.geo.attributes.position.needsUpdate = true;
    spray.geo.attributes.aSize.needsUpdate = true;
    spray.geo.attributes.aAlpha.needsUpdate = true;
  }
  wakeMat2.uniforms.uBright.value = bright;
}