// js/main.js
import * as THREE from 'three';
import { state, b2l } from './state.js';
import { CONFIG, TIME_PRESETS } from './config.js';
import { initScene } from './scene.js';
import { createOceanMesh, updateOceanUniforms, seaUniforms } from './ocean/water-material.js';
import { waveHAt, waveHeightEnvelope, waveSprayFactor } from './ocean/waves.js';
import { initSky, updateSky } from './sky.js';
import { initWeather, updateRain, updateLightning, maybeSpawnLightning, setWeather } from './weather.js';
import { initObjects, updateObjects } from './world/objects.js';
import { updateStreaming } from './world/streaming.js';
import { initBoatManager, curBoat, setBoat, setDeckLight } from './boats/boat-manager.js';
import { updateHullPhysics } from './physics/hull-physics.js';
import { applyBuoyancy } from './physics/buoyancy.js';
import { updateCollisions } from './physics/collisions.js';
import { initAnchor, updateAnchor } from './physics/anchor.js';
import { initFoam, emitFoam } from './ocean/foam.js';
import { initSpray, emitSpray } from './ocean/spray.js';
import { initWake, recordWakePoint, updateMainWake, updateHullWake, updateBowWave, updateTrailWake, updateParticleBuffers } from './ocean/wake.js';
import { initInput, updateThrottleFromMouse, updateRudderFromMouse, updateRudderVisual } from './controls/input-manager.js';
import { updateCamera, cycleCamera, updateCamLabel } from './camera-helper.js';
import { initAudioManager, toggleAudio, updateListener } from './audio/audio-manager.js';
import { initAmbient, updateAmbient } from './audio/ambient.js';
import { initEngineSound, updateEngineSound } from './audio/engine-sound.js';
import {
  playSplashSound,
  playReentrySound,
  playClickSound,
  playClickSound3D,
  startHorn,
  stopHorn,
  thunderSnd
} from './audio/effects.js';
import { updateHUD, bindSliders } from './ui/hud.js';
import { runLoadingScreen } from './ui/loading.js';
import { initWorldMap } from './world/world-map.js';
import { initUnderwater, updateUnderwater } from './world/underwater.js';
import { initDamage, updateDamage } from './game/damage.js';
import { setGameMode, updateGame } from './game/game-manager.js';

const _bowTip = new THREE.Vector3(), _bowPortS = new THREE.Vector3(), _bowStbdS = new THREE.Vector3();
let prevBowSub = -1, bowMistAcc = 0, sideMistAccP = 0, sideMistAccS = 0;

function localToWorldBoat(lx, ly, lz, out) {
  out.set(lx, ly, lz);
  return state.tilt.localToWorld(out);
}

function updateBowSpray(dt, spdN, fwdX, fwdZ, rightX, rightZ) {
  localToWorldBoat(0, 0.18, 4.15, _bowTip);
  localToWorldBoat(-0.62, 0.14, 3.55, _bowPortS);
  localToWorldBoat(0.62, 0.14, 3.55, _bowStbdS);
  const bowSub = waveHAt(_bowTip.x, _bowTip.z) - _bowTip.y;
  const portSub = waveHAt(_bowPortS.x, _bowPortS.z) - _bowPortS.y;
  const stbdSub = waveHAt(_bowStbdS.x, _bowStbdS.z) - _bowStbdS.y;
  const waveLocalH = waveHeightEnvelope(_bowTip.x, _bowTip.z);
  const sprayScale = waveSprayFactor(waveLocalH);
  const absSpeed = Math.abs(state.speed);
  const fwdSign = state.speed >= 0 ? 1 : -1;

  if (bowSub > 0 && absSpeed > 0.5 && sprayScale > 0.03) {
    const rate = (bowSub * 10 + absSpeed * 2.8) * state.foamMul * (0.4 + spdN * 0.7) * sprayScale;
    bowMistAcc += rate * dt;
    while (bowMistAcc >= 1) {
      bowMistAcc--;
      const sSpread = (Math.random() - 0.5);
      const upKick = 0.7 + Math.random() * 1.2 + bowSub * 1.6 * sprayScale;
      emitSpray(
        _bowTip.x + rightX * sSpread * 0.5, _bowTip.y + 0.12, _bowTip.z + rightZ * sSpread * 0.5,
        fwdX * absSpeed * 0.35 * fwdSign + rightX * sSpread * absSpeed * 0.3 + (Math.random() - 0.5) * 0.4,
        upKick,
        fwdZ * absSpeed * 0.35 * fwdSign + rightZ * sSpread * absSpeed * 0.3 + (Math.random() - 0.5) * 0.4,
        { size: (0.10 + Math.random() * 0.10 + bowSub * 0.12) * sprayScale, life: 0.55 + Math.random() * 0.45 }
      );
    }
  } else {
    bowMistAcc = Math.min(bowMistAcc, 0);
  }

  if (prevBowSub <= 0 && bowSub > 0 && absSpeed > 1.0 && sprayScale > 0.05) {
    const impactPower = THREE.MathUtils.clamp(absSpeed * 0.5 + Math.abs(state.physics.vy) * 0.8, 0.5, 7);
    const n = Math.round((15 + impactPower * 9) * sprayScale);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2, spd = 1.0 + Math.random() * impactPower * 0.9;
      const lRight = Math.cos(ang) * 0.8, lFwd = Math.sin(ang) * 0.8;
      emitSpray(
        _bowTip.x + rightX * lRight * 0.25 + fwdX * lFwd * 0.25, _bowTip.y + 0.06,
        _bowTip.z + rightZ * lRight * 0.25 + fwdZ * lFwd * 0.25,
        fwdX * (absSpeed * 0.25 * fwdSign + lFwd * spd) + rightX * lRight * spd,
        1.3 + Math.random() * impactPower * 0.8,
        fwdZ * (absSpeed * 0.25 * fwdSign + lFwd * spd) + rightZ * lRight * spd,
        { size: (0.14 + Math.random() * 0.14) * (0.6 + sprayScale * 0.5),
          life: 0.7 + Math.random() * 0.5 + impactPower * 0.03 }
      );
    }
    playSplashSound(impactPower * 0.35 * sprayScale);
  }

  if (prevBowSub > 0 && bowSub <= 0 && absSpeed > 0.5 && sprayScale > 0.04) {
    const n = Math.round((8 + Math.random() * 8) * sprayScale);
    for (let i = 0; i < n; i++) {
      emitSpray(
        _bowTip.x + rightX * (Math.random() - 0.5) * 0.5, _bowTip.y + 0.08,
        _bowTip.z + rightZ * (Math.random() - 0.5) * 0.5,
        fwdX * absSpeed * 0.4 * fwdSign + (Math.random() - 0.5) * 0.5,
        0.5 + Math.random() * 0.8,
        fwdZ * absSpeed * 0.4 * fwdSign + (Math.random() - 0.5) * 0.5,
        { size: (0.10 + Math.random() * 0.08) * sprayScale, life: 0.5 + Math.random() * 0.35 }
      );
    }
  }

  const turnBoost = 1 + Math.abs(state.rudder) * spdN * 1.8;

  if (portSub > 0 && absSpeed > 1.5 && sprayScale > 0.04) {
    const rate = (portSub * 8 + (absSpeed - 1.4) * 2.2) * state.foamMul * turnBoost * sprayScale;
    sideMistAccP += rate * dt;
    while (sideMistAccP >= 1) {
      sideMistAccP--;
      emitSpray(
        _bowPortS.x, _bowPortS.y + 0.06, _bowPortS.z,
        fwdX * absSpeed * 0.35 * fwdSign - rightX * (absSpeed * 0.25 + 0.5),
        0.6 + Math.random() * 1.1,
        fwdZ * absSpeed * 0.35 * fwdSign - rightZ * (absSpeed * 0.25 + 0.5),
        { size: (0.10 + Math.random() * 0.08) * sprayScale, life: 0.45 + Math.random() * 0.35 }
      );
    }
  } else {
    sideMistAccP = Math.min(sideMistAccP, 0);
  }

  if (stbdSub > 0 && absSpeed > 1.5 && sprayScale > 0.04) {
    const rate = (stbdSub * 8 + (absSpeed - 1.4) * 2.2) * state.foamMul * turnBoost * sprayScale;
    sideMistAccS += rate * dt;
    while (sideMistAccS >= 1) {
      sideMistAccS--;
      emitSpray(
        _bowStbdS.x, _bowStbdS.y + 0.06, _bowStbdS.z,
        fwdX * absSpeed * 0.35 * fwdSign + rightX * (absSpeed * 0.25 + 0.5),
        0.6 + Math.random() * 1.1,
        fwdZ * absSpeed * 0.35 * fwdSign + rightZ * (absSpeed * 0.25 + 0.5),
        { size: (0.10 + Math.random() * 0.08) * sprayScale, life: 0.45 + Math.random() * 0.35 }
      );
    }
  } else {
    sideMistAccS = Math.min(sideMistAccS, 0);
  }

  prevBowSub = bowSub;
}

function toggleDeckLight() {
  const newState = !state.deckOn;
  setDeckLight(newState, null);
  playClickSound3D();
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(state.clock.getDelta(), 0.05);
  state.simTime += dt;
  state.wavePhase += dt * state.waveSMul;
  const cb = curBoat();
  updateSky({ navPort: cb.navPort, navStbd: cb.navStbd, navStern: cb.navStern });
  updateRain(dt);
  updateLightning(dt);
  maybeSpawnLightning(dt, thunderSnd);
  state.flash *= Math.exp(-dt * 6);
  updateOceanUniforms();
  const spdN = updateHullPhysics(dt, cb, {
    onReentry: (impact, pos) => {
      playReentrySound(impact);
      const n = Math.round(5 + impact * 3);
      for (let i = 0; i < n; i++) {
        emitSpray(pos.x, pos.y, pos.z,
          (Math.random() - 0.5) * 2, 1.0 + Math.random() * 1.5, (Math.random() - 0.5) * 2,
          { size: 0.15 + Math.random() * 0.1, life: 0.4 + Math.random() * 0.3 });
      }
    }
  });
  updateAnchor(dt);
  updateStreaming(dt);
  recordWakePoint();
  const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
  const rightX = fwdZ, rightZ = -fwdX;
  const _emit2 = new THREE.Vector3();
  b2l(0, -0.5, -4.45, _emit2);
  const rate = (1.8 + Math.abs(state.speed) * 8) * state.foamMul;
  let foamAccLocal = 0;
  foamAccLocal += rate * dt;
  while (foamAccLocal >= 1) {
    foamAccLocal--;
    const lat = (Math.random() - 0.5) * 0.7;
    const vx = fwdX * (state.speed * 0.1 - Math.abs(state.speed) * 0.45 - Math.random() * 0.4) +
      rightX * (state.rudder * 0.5 * spdN + (Math.random() - 0.5) * 0.4);
    const vz = fwdZ * (state.speed * 0.1 - Math.abs(state.speed) * 0.45 - Math.random() * 0.4) +
      rightZ * (state.rudder * 0.5 * spdN + (Math.random() - 0.5) * 0.4);
    emitFoam(_emit2.x + rightX * lat, _emit2.y + 0.05, _emit2.z + rightZ * lat,
      vx, 0, vz, 2.2 + Math.random() * 2, 0.28 + Math.random() * 0.35);
  }
  updateBowSpray(dt, spdN, fwdX, fwdZ, rightX, rightZ);
  applyBuoyancy(dt, cb, emitSpray, playSplashSound);
  updateTrailWake();
  updateMainWake();
  updateHullWake();
  updateBowWave();
  updateParticleBuffers(dt);
  const dp = cb.deckPos;
  b2l(dp.x, dp.y, dp.z, seaUniforms.uDeck.value);
  seaUniforms.uDeckI.value = state.deckOn ? (0.35 + 1.05 * state.nightF) : 0;
  updateRudderVisual();
  updateCamera(dt);
  updateListener();
  updateAmbient(dt);
  updateEngineSound(dt, cb);
  updateObjects(dt);
  updateUnderwater(dt);
  updateCollisions(dt);
  updateDamage(dt);
  updateGame(dt);
  if (state.sky) state.sky.position.copy(state.boatRoot.position);
  state.composer.render();
  updateHUD(dt);
}

function bindUI() {
  bindSliders();
  document.querySelectorAll('.hbtn[data-time]').forEach(btn => {
    btn.addEventListener('click', () => {
      CONFIG.time.hour = TIME_PRESETS[btn.dataset.time];
      document.getElementById('sld-hour').value = CONFIG.time.hour;
      const h = Math.floor(CONFIG.time.hour), m = Math.floor((CONFIG.time.hour - h) * 60);
      document.getElementById('lbl-hour').textContent =
        String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
      document.querySelectorAll('.hbtn[data-time]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.querySelectorAll('.hbtn.weather').forEach(btn => {
    btn.addEventListener('click', () => setWeather(btn.dataset.weather));
  });
  document.getElementById('btn-auto-sun').addEventListener('click', () => {
    CONFIG.autoSun = !CONFIG.autoSun;
    const btn = document.getElementById('btn-auto-sun');
    btn.textContent = CONFIG.autoSun ? '☀ AUTO SUN ON' : '☀ AUTO SUN OFF';
    btn.classList.toggle('sun-active', CONFIG.autoSun);
  });
  document.getElementById('btn-deck-light').addEventListener('click', toggleDeckLight);
  const hornBtn = document.getElementById('btn-horn');
  if (hornBtn) {
    hornBtn.addEventListener('mousedown', () => startHorn());
    hornBtn.addEventListener('mouseup', () => stopHorn());
    hornBtn.addEventListener('mouseleave', () => stopHorn());
    hornBtn.addEventListener('touchstart', e => { e.preventDefault(); startHorn(); });
    hornBtn.addEventListener('touchend', e => { e.preventDefault(); stopHorn(); });
  }
  document.querySelectorAll('.hbtn.boat').forEach(btn => {
    btn.addEventListener('click', () => setBoat(btn.dataset.boat));
  });
  document.getElementById('btn-cam-cycle').addEventListener('click', cycleCamera);
  document.getElementById('sw-audio').addEventListener('click', toggleAudio);
}

function boot() {
  initScene();
  const sea = createOceanMesh();
  state.scene.add(sea);
  initSky();
  initWeather();
  initObjects();
  initBoatManager();
  initFoam();
  initSpray();
  initWake();

  // --- Inicializa o mapa-mundo e a âncora DEPOIS que o barco estiver posicionado ---
  setTimeout(() => {
    initWorldMap();
    initAnchor();   // <--- AGORA AQUI (começa ancorado)
  }, 50);

  initUnderwater();
  initDamage();
  // initAnchor();   // <--- REMOVIDO DAQUI
  initInput({
    toggleAudio,
    setDeckLight: toggleDeckLight,
    toggleBoat: () => {
      const cur = document.querySelector('.hbtn.boat.active');
      setBoat(cur && cur.dataset.boat === 'trawler' ? 'pilot' : 'trawler');
    },
    startHorn, stopHorn,
    cycleCamera,
    updateThrottle: (clientY) => { state.throttleTarget = updateThrottleFromMouse(clientY); },
    updateRudder: (clientX) => {
      state.rudder = THREE.MathUtils.clamp(updateRudderFromMouse(clientX), -1, 1);
      updateRudderVisual();
    },
    updateRudderVisual,
    playClick: playClickSound
  });
  setWeather('MODERATE');
  setBoat('trawler');
  setDeckLight(false, null);
  updateCamLabel();
  updateRudderVisual();
  initAudioManager();
  initAmbient();
  initEngineSound();
  bindUI();
  runLoadingScreen(() => animate());
}
boot();