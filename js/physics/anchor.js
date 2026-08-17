// js/physics/anchor.js — ÂNCORA: começa lançada (deployed) com corrente no tamanho certo
import * as THREE from 'three';
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { curBoat } from '../boats/boat-manager.js';
import * as WM from '../world/world-map.js';
import { actx, boatPanner } from '../audio/audio-manager.js';

export const anchor = {
  mode: 'deployed', // <--- começa lançada no fundo
  initialized: false,
  t: 0, depth: 7, seabedY: -7,
  pos: new THREE.Vector3(),
  mesh: null, stowed: null, chainSegs: [],
  el: null, btn: null, warnCd: 0,
  _waterSplashed: false
};
const DROP_T = 1.5, RET_T = 1.7, CHAIN_SEGS = 12;
const _bow = new THREE.Vector3(), _tmp = new THREE.Vector3(),
      _dir = new THREE.Vector3(), _mid = new THREE.Vector3(),
      UP = new THREE.Vector3(0, 1, 0);
const _pts = []; for (let i = 0; i <= CHAIN_SEGS; i++) _pts.push(new THREE.Vector3());

function seabedAt(x, z) {
  return typeof WM.groundHeightAt === 'function' ? WM.groundHeightAt(x, z) : -7;
}
function buildAnchorMesh() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.55, metalness: 0.6 });
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.75, 6), m); g.add(shank);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.024, 6, 10), m); ring.position.y = 0.44; g.add(ring);
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 6), m);
  stock.rotation.z = Math.PI / 2; stock.position.y = 0.3; g.add(stock);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.32, 6), m);
    arm.position.set(s * 0.09, -0.3, 0); arm.rotation.z = s * 0.7; g.add(arm);
    const fluke = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.32, 4), m);
    fluke.position.set(s * 0.18, -0.37, 0); fluke.rotation.z = s * 1.1; g.add(fluke);
  }
  return g;
}
export function isAnchored() { return anchor.mode === 'deployed' || anchor.mode === 'dropping'; }

// ============================================================
// 🔊 ÁUDIO — loops contínuos (corrente / guincho)
// ============================================================
let bufs = null;
let runSrc = null, runG = null, weighSrc = null, weighG = null;

function resonator(sr, freq, q) {
  const w = 2 * Math.PI * freq / sr;
  const r = Math.exp(-w / (2 * q));
  const c = 2 * r * Math.cos(w);
  const a2 = r * r;
  let y1 = 0, y2 = 0;
  return (x) => { const y = x + c * y1 - a2 * y2; y2 = y1; y1 = y; return y; };
}
function normalize(d, peak = 0.8) {
  let m = 0; for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i]));
  if (m > 0.0001) { const g = peak / m; for (let i = 0; i < d.length; i++) d[i] *= g; }
  return d;
}
function renderMetal(sr, dur, buildX, resSpec, rumbleHz, rumbleG) {
  const n = Math.floor(sr * dur);
  const x = buildX(n, sr);
  const out = new Float32Array(n);
  for (const [f, q, g] of resSpec) {
    const R = resonator(sr, f, q);
    for (let i = 0; i < n; i++) out[i] += R(x[i]) * g;
  }
  if (rumbleG > 0) {
    const a = Math.exp(-2 * Math.PI * rumbleHz / sr);
    let lp = 0;
    for (let i = 0; i < n; i++) { lp = lp * a + (1 - a) * Math.abs(x[i]); out[i] += (lp * 2 - 0.25) * rumbleG; }
  }
  const fi = Math.floor(sr * 0.02), fo = Math.floor(sr * 0.12);
  for (let i = 0; i < fi; i++) out[i] *= i / fi;
  for (let i = 0; i < fo; i++) out[n - 1 - i] *= i / fo;
  return normalize(out);
}
function toBuf(d) {
  const b = actx.createBuffer(1, d.length, actx.sampleRate);
  b.getChannelData(0).set(d);
  return b;
}
function renderBufs() {
  const sr = actx.sampleRate;
  bufs = {};
  bufs.run = toBuf(renderMetal(sr, 2.0, (n, sr2) => {
    const x = new Float32Array(n);
    let t = 0.04;
    const end = n / sr2 - 0.18;
    while (t < end) {
      const i = (t * sr2) | 0;
      const a = 0.6 + Math.random() * 0.6;
      x[i] += a * 0.3; if (i + 1 < n) x[i + 1] += a; if (i + 2 < n) x[i + 2] += a * 0.5;
      t += 1 / (13 + Math.random() * 4);
    }
    let nw = 0;
    for (let i = 0; i < n; i++) { nw = (nw + 0.2 * ((Math.random() * 2 - 1) * 0.03)) / 1.2; x[i] += nw; }
    return x;
  }, [[620, 26, 0.5], [980, 34, 0.38], [1560, 40, 0.26], [2400, 46, 0.14], [3600, 50, 0.06]], 140, 0.35));
  bufs.weigh = toBuf(renderMetal(sr, 1.7, (n, sr2) => {
    const x = new Float32Array(n);
    let t = 0.08;
    while (t < n / sr2 - 0.3) {
      const i0 = (t * sr2) | 0;
      x[i0] += 0.3; if (i0 + 1 < n) x[i0 + 1] += 1.0; if (i0 + 2 < n) x[i0 + 2] += 0.6;
      const len = Math.floor(sr2 * 0.09);
      for (let j = 0; j < len && i0 + j < n; j++)
        x[i0 + j] += (Math.random() * 2 - 1) * 0.22 * Math.exp(-j / (sr2 * 0.02));
      t += 0.42 + Math.random() * 0.06;
    }
    let ph = 0;
    for (let i = 0; i < n; i++) {
      ph += 2 * Math.PI * 46 / sr2;
      const saw = 2 * (ph / (2 * Math.PI) - Math.floor(ph / (2 * Math.PI) + 0.5));
      const am = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2.2 * i / sr2);
      x[i] += saw * 0.10 * am + (Math.random() * 2 - 1) * 0.02;
    }
    return x;
  }, [[340, 22, 0.6], [560, 26, 0.5], [900, 30, 0.28], [1400, 36, 0.14]], 90, 0.4));
}
function B() { if (!actx) return null; if (!bufs) renderBufs(); return bufs; }

function startRun() {
  const b = B();
  if (!b || runSrc || !state.audioOn || !boatPanner) return;
  runSrc = actx.createBufferSource(); runSrc.buffer = b.run; runSrc.loop = true;
  runSrc.playbackRate.value = 0.95 + Math.random() * 0.1;
  const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3000;
  runG = actx.createGain(); runG.gain.value = 0;
  runSrc.connect(f); f.connect(runG); runG.connect(boatPanner);
  runSrc.start();
  runG.gain.linearRampToValueAtTime(0.5, actx.currentTime + 0.06);
}
function stopRun() {
  if (!runSrc || !actx) return;
  const t = actx.currentTime;
  runG.gain.cancelScheduledValues(t);
  runG.gain.setValueAtTime(runG.gain.value, t);
  runG.gain.linearRampToValueAtTime(0.0001, t + 0.12);
  const s = runSrc; runSrc = null;
  try { s.stop(t + 0.18); } catch (e) {}
}
function startWeigh() {
  const b = B();
  if (!b || weighSrc || !state.audioOn || !boatPanner) return;
  weighSrc = actx.createBufferSource(); weighSrc.buffer = b.weigh; weighSrc.loop = true;
  weighSrc.playbackRate.value = 0.95 + Math.random() * 0.1;
  const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
  weighG = actx.createGain(); weighG.gain.value = 0;
  weighSrc.connect(f); f.connect(weighG); weighG.connect(boatPanner);
  weighSrc.start();
  weighG.gain.linearRampToValueAtTime(0.5, actx.currentTime + 0.1);
}
function stopWeigh() {
  if (!weighSrc || !actx) return;
  const t = actx.currentTime;
  weighG.gain.cancelScheduledValues(t);
  weighG.gain.setValueAtTime(weighG.gain.value, t);
  weighG.gain.linearRampToValueAtTime(0.0001, t + 0.15);
  const s = weighSrc; weighSrc = null;
  try { s.stop(t + 0.2); } catch (e) {}
}
function warnBeeps() {
  if (!actx || !state.audioOn || !boatPanner) return;
  if (actx.state === 'suspended') actx.resume();
  const t = actx.currentTime;
  for (let i = 0; i < 2; i++) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'square'; o.frequency.value = i ? 620 : 470;
    const t0 = t + i * 0.14;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.1, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    o.connect(g); g.connect(boatPanner);
    o.start(t0); o.stop(t0 + 0.14);
  }
}
export function tryThrottleWarn() {
  if (anchor.warnCd > 0) return;
  anchor.warnCd = 3;
  warnBeeps();
  if (anchor.el) {
    anchor.el.style.color = '#ff6b6b';
    setTimeout(() => { if (anchor.el) anchor.el.style.color = ''; }, 1500);
  }
  if (anchor.btn) {
    anchor.btn.classList.add('anchor-warn-pulse');
    setTimeout(() => anchor.btn && anchor.btn.classList.remove('anchor-warn-pulse'), 1500);
  }
}

// ---- Posiciona a âncora com base na posição atual do barco e profundidade ----
function computeAnchorDropPosition() {
  const bp = state.boatRoot.position;
  const fx = Math.sin(state.heading), fz = Math.cos(state.heading);
  // Distância inicial da âncora: proporcional à profundidade, mas limitada
  const depth = Math.max(3, Math.min(40, -seabedAt(bp.x, bp.z)));
  const scope = Math.min(depth * 2.5 + 2, 20); // comprimento da corrente
  anchor.pos.set(bp.x + fx * scope, 0, bp.z + fz * scope);
  anchor.seabedY = seabedAt(anchor.pos.x, anchor.pos.z) - 0.2;
  anchor.depth = Math.max(3, Math.min(40, -anchor.seabedY));
}

// 🔇 SEM ESTRALO: nenhum one-shot aqui.
export function toggleAnchor() {
  const bp = state.boatRoot.position;
  const d = seabedAt(bp.x, bp.z);
  if (anchor.mode === 'stowed') {
    if (d > -0.5 || d < -45) return;
    computeAnchorDropPosition();
    anchor._waterSplashed = false;
    anchor.mode = 'dropping'; anchor.t = 0;
  } else if (anchor.mode === 'deployed') {
    anchor.mode = 'retrieving'; anchor.t = 0;
  }
}

function injectButtonCSS() {
  if (document.getElementById('anchor-btn-style')) return;
  const css = `
    #btn-anchor{position:fixed;bottom:104px;right:16px;width:96px;padding:9px 0;
      background:rgba(6,16,22,.78);border:1px solid rgba(120,230,255,0.28);color:#d6f3fb;
      font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.2px;cursor:pointer;
      z-index:11;border-radius:2px;text-transform:uppercase;transition:all .2s ease;}
    #btn-anchor:hover{background:rgba(111,228,255,0.10);border-color:var(--hud-cyan);}
    #btn-anchor.anchor-deployed{border-color:#ff6b6b;color:#ffb4b4;background:rgba(80,10,15,.55);
      animation:anchorPulseRed 1.4s ease-in-out infinite;}
    @keyframes anchorPulseRed{
      0%,100%{box-shadow:0 0 0 rgba(255,107,107,0.3),inset 0 0 0 rgba(255,107,107,0.05);}
      50%{box-shadow:0 0 14px rgba(255,107,107,0.85),inset 0 0 8px rgba(255,107,107,0.25);}}
    #btn-anchor.anchor-busy{border-color:#ffb454;color:#ffd59a;background:rgba(60,40,10,.5);
      animation:anchorPulseAmber 0.9s ease-in-out infinite;}
    @keyframes anchorPulseAmber{0%,100%{opacity:.75;}50%{opacity:1;box-shadow:0 0 10px rgba(255,180,84,0.6);}}
    #btn-anchor.anchor-stowed{border-color:rgba(120,230,255,0.35);color:#a8e8f7;}
    #btn-anchor.anchor-warn-pulse{animation:anchorWarnFlash 0.25s ease-in-out 6 !important;}
    @keyframes anchorWarnFlash{
      0%,100%{background:rgba(80,10,15,.55);border-color:#ff6b6b;}
      50%{background:rgba(255,60,60,.85);border-color:#ff3030;}}
  `;
  const style = document.createElement('style');
  style.id = 'anchor-btn-style';
  style.textContent = css;
  document.head.appendChild(style);
}

export function initAnchor() {
  if (anchor.initialized) return;
  injectButtonCSS();
  anchor.mesh = buildAnchorMesh(); state.scene.add(anchor.mesh);
  anchor.stowed = buildAnchorMesh(); anchor.stowed.scale.setScalar(0.9); state.scene.add(anchor.stowed);
  const segGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 5, 1, true);
  const segMat = new THREE.MeshStandardMaterial({ color: 0x232323, roughness: 0.6, metalness: 0.7 });
  for (let i = 0; i < CHAIN_SEGS; i++) {
    const m = new THREE.Mesh(segGeo, segMat);
    m.visible = false;
    state.scene.add(m);
    anchor.chainSegs.push(m);
  }
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:82px;right:16px;color:#6fe4ff;font-family:"JetBrains Mono",monospace;font-size:9px;letter-spacing:1.5px;z-index:11;text-transform:uppercase;text-shadow:0 0 8px rgba(111,228,255,.4);text-align:center;width:96px;';
  document.body.appendChild(el); anchor.el = el;
  const btn = document.createElement('button');
  btn.id = 'btn-anchor';
  btn.textContent = '⚓ IÇAR ÂNCORA';
  btn.addEventListener('click', toggleAnchor);
  document.body.appendChild(btn); anchor.btn = btn;
  addEventListener('keydown', e => { if (e.code === 'KeyE' && !e.repeat) toggleAnchor(); });

  // ---- Posiciona a âncora já lançada com base no barco ----
  computeAnchorDropPosition();
  // Coloca a âncora diretamente no fundo, sem animação de queda
  anchor.mesh.position.set(anchor.pos.x, anchor.seabedY, anchor.pos.z);
  anchor.mesh.rotation.set(0.6, 2.0, 0.4);
  anchor.mesh.visible = true;
  anchor.stowed.visible = false;
  anchor.mode = 'deployed';
  anchor.t = 1; // já finalizada

  anchor.initialized = true;
}

function bowWorld(out) {
  const cb = curBoat();
  out.set(cb.name === 'pilot' ? 0.8 : 0.95, cb.name === 'pilot' ? 0.7 : 0.6, cb.name === 'pilot' ? 3.6 : 4.1);
  return state.tilt.localToWorld(out);
}
function updateChain(bow, aTop, visible) {
  const horiz = bow.distanceTo(aTop);
  const sag = Math.max(0.25, Math.min(anchor.depth * 0.35, 0.3 + horiz * 0.08));
  _mid.copy(bow).add(aTop).multiplyScalar(0.5);
  _mid.y = Math.min(bow.y, aTop.y) - sag;
  for (let i = 0; i <= CHAIN_SEGS; i++) {
    const t = i / CHAIN_SEGS, u = 1 - t;
    _pts[i].set(
      u * u * bow.x + 2 * u * t * _mid.x + t * t * aTop.x,
      u * u * bow.y + 2 * u * t * _mid.y + t * t * aTop.y,
      u * u * bow.z + 2 * u * t * _mid.z + t * t * aTop.z);
  }
  for (let i = 0; i < CHAIN_SEGS; i++) {
    const m = anchor.chainSegs[i];
    m.visible = visible;
    if (!visible) continue;
    _dir.subVectors(_pts[i + 1], _pts[i]);
    const len = _dir.length();
    m.position.copy(_pts[i]).addScaledVector(_dir, 0.5);
    if (len > 1e-5) { _dir.normalize(); m.quaternion.setFromUnitVectors(UP, _dir); }
    m.scale.set(1, Math.max(0.01, len), 1);
  }
}
function updateButtonState() {
  if (!anchor.btn) return;
  anchor.btn.classList.remove('anchor-deployed', 'anchor-busy', 'anchor-stowed');
  if (anchor.mode === 'stowed')          { anchor.btn.classList.add('anchor-stowed');   anchor.btn.textContent = '⚓ ÂNCORA'; }
  else if (anchor.mode === 'dropping')   { anchor.btn.classList.add('anchor-busy');     anchor.btn.textContent = '⚓ FUNDEANDO'; }
  else if (anchor.mode === 'deployed')   { anchor.btn.classList.add('anchor-deployed'); anchor.btn.textContent = '⚓ IÇAR ÂNCORA'; }
  else                                   { anchor.btn.classList.add('anchor-busy');     anchor.btn.textContent = '⚓ IÇANDO'; }
}

export function updateAnchor(dt) {
  const cb = curBoat();
  const bp = state.boatRoot.position;
  anchor.warnCd -= dt;
  const bow = bowWorld(_bow);
  const before = anchor.mode;
  let btnChanged = false;

  if (anchor.mode === 'stowed') {
    _tmp.set(cb.name === 'pilot' ? 0.8 : 0.95, cb.name === 'pilot' ? 0.75 : 0.8, cb.name === 'pilot' ? 3.4 : 3.5);
    state.tilt.localToWorld(_tmp);
    anchor.stowed.position.copy(_tmp);
    anchor.stowed.rotation.set(0.15, 0, 0);
    anchor.stowed.visible = true;
    anchor.mesh.visible = false;
    updateChain(bow, _tmp, false);
  } else {
    anchor.stowed.visible = false;
    anchor.mesh.visible = true;
    if (anchor.mode === 'dropping') {
      anchor.t += dt / DROP_T;
      if (anchor.t >= 1) { anchor.t = 1; anchor.mode = 'deployed'; btnChanged = true; }
      const k = anchor.t * anchor.t * (3 - 2 * anchor.t);
      anchor.mesh.position.set(
        THREE.MathUtils.lerp(bow.x, anchor.pos.x, k),
        THREE.MathUtils.lerp(bow.y - 0.4, anchor.seabedY, k),
        THREE.MathUtils.lerp(bow.z, anchor.pos.z, k));
      anchor.mesh.rotation.set(k * 0.6, k * 2.0, k * 0.4);
    } else if (anchor.mode === 'retrieving') {
      anchor.t += dt / RET_T;
      if (anchor.t >= 1) { anchor.t = 0; anchor.mode = 'stowed'; btnChanged = true; }
      const k = anchor.t * anchor.t * (3 - 2 * anchor.t);
      anchor.mesh.position.set(
        THREE.MathUtils.lerp(anchor.pos.x, bow.x, k),
        THREE.MathUtils.lerp(anchor.seabedY, bow.y - 0.4, k),
        THREE.MathUtils.lerp(anchor.pos.z, bow.z, k));
      anchor.mesh.rotation.set(0.6 * (1 - k), 2.0 * (1 - k), 0.4 * (1 - k));
    } else { // deployed
      const newSeabed = seabedAt(anchor.pos.x, anchor.pos.z) - 0.2;
      anchor.seabedY = THREE.MathUtils.lerp(anchor.seabedY, newSeabed, 0.1);
      anchor.mesh.position.set(anchor.pos.x, anchor.seabedY, anchor.pos.z);
      anchor.mesh.rotation.y += dt * 0.1;
      const dx = anchor.pos.x - bp.x, dz = anchor.pos.z - bp.z;
      const dist = Math.hypot(dx, dz);
      const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
      const rightX = Math.cos(state.heading), rightZ = -Math.sin(state.heading);
      const maxScope = anchor.depth * 3 + 5;
      if (dist > maxScope) {
        const drag = (dist - maxScope) * 0.4;
        anchor.pos.x += (dx / dist) * drag * dt;
        anchor.pos.z += (dz / dist) * drag * dt;
      } else if (dist > 2) {
        const pull = Math.min(4, (dist - 2) * 0.7);
        state.speed     += ((dx / dist) * fwdX + (dz / dist) * fwdZ) * pull * dt;
        state.sideSpeed += ((dx / dist) * rightX + (dz / dist) * rightZ) * pull * dt;
      }
      state.speed     *= Math.exp(-dt * 2.8);
      state.sideSpeed *= Math.exp(-dt * 2.8);
      const wA = CONFIG.wind.direction;
      const dAng = Math.atan2(Math.sin(wA - state.heading), Math.cos(wA - state.heading));
      state.physics.yawVel += dAng * 0.06 * dt;
    }
    updateChain(bow, anchor.mesh.position, true);
  }

  if (anchor.mode === 'dropping') startRun(); else if (before === 'dropping') stopRun();
  if (anchor.mode === 'retrieving') startWeigh(); else if (before === 'retrieving') stopWeigh();

  if (anchor.el) {
    anchor.el.textContent = '⚓ ' + (
      anchor.mode === 'stowed'     ? 'pronta [E]' :
      anchor.mode === 'dropping'   ? 'fundeando…' :
      anchor.mode === 'deployed'   ? 'no fundo [E]' : 'içando…');
  }
  if (btnChanged || !anchor.btn._lastMode || anchor.btn._lastMode !== anchor.mode) {
    updateButtonState();
    if (anchor.btn) anchor.btn._lastMode = anchor.mode;
  }
}