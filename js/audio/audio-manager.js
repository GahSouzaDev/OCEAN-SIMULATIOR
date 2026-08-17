import * as THREE from 'three';
import { state } from '../state.js';
import { waveHAt } from '../ocean/waves.js';

export let actx = null;
export let masterG = null, masterFilter = null;
export let boatPanner = null, windPanner = null, windPannerG = null;

export function initAudioManager() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  masterFilter = actx.createBiquadFilter();
  masterFilter.type = 'lowpass';
  masterFilter.frequency.value = 20000;
  masterG = actx.createGain();
  masterG.gain.value = 0;
  masterFilter.connect(masterG);
  masterG.connect(actx.destination);

  boatPanner = actx.createPanner();
  boatPanner.panningModel = 'HRTF';
  boatPanner.distanceModel = 'inverse';
  boatPanner.refDistance = 5;
  boatPanner.maxDistance = 200;
  boatPanner.rolloffFactor = 1.0;
  boatPanner.connect(masterFilter);

  windPanner = actx.createPanner();
  windPanner.panningModel = 'HRTF';
  windPanner.distanceModel = 'inverse';
  windPanner.refDistance = 5;
  windPanner.maxDistance = 40;
  windPanner.rolloffFactor = 1.5;
  windPanner.connect(masterFilter);

  windPannerG = actx.createGain();
  windPannerG.gain.value = 0.3;
  windPannerG.connect(windPanner);

  // Desbloquear áudio na primeira interação
  const unlock = () => {
    if (actx && actx.state === 'suspended') actx.resume();
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchstart', unlock);
}

export function toggleAudio() {
  if (!actx) initAudioManager();
  if (actx.state === 'suspended') actx.resume();
  state.audioOn = !state.audioOn;
  const sw = document.getElementById('sw-audio');
  if (sw) sw.classList.toggle('on', state.audioOn);
}

export function updateListener() {
  if (!actx) return;

  const t = actx.currentTime;
  const targetGain = state.audioOn ? 0.85 : 0;
  try {
    masterG.gain.cancelScheduledValues(t);
    masterG.gain.linearRampToValueAtTime(targetGain, t + 0.1);
  } catch (e) {}

  // --- Filtro subaquático automático ---
  const camPos = state.camera.position;
  const waterHeight = waveHAt(camPos.x, camPos.z);
  const underwater = camPos.y < waterHeight;
  const targetFreq = underwater ? 250 : 20000;

  try {
    masterFilter.frequency.linearRampToValueAtTime(targetFreq, t + 0.2);
  } catch (e) {}

  const l = actx.listener;
  const camDir = new THREE.Vector3();
  state.camera.getWorldDirection(camDir);

  if (l.positionX) {
    l.positionX.value = state.camera.position.x;
    l.positionY.value = state.camera.position.y;
    l.positionZ.value = state.camera.position.z;
    l.forwardX.value = camDir.x;
    l.forwardY.value = camDir.y;
    l.forwardZ.value = camDir.z;
    l.upX.value = state.camera.up.x;
    l.upY.value = state.camera.up.y;
    l.upZ.value = state.camera.up.z;
  } else {
    l.setPosition(state.camera.position.x, state.camera.position.y, state.camera.position.z);
    l.setOrientation(camDir.x, camDir.y, camDir.z,
      state.camera.up.x, state.camera.up.y, state.camera.up.z);
  }

  if (boatPanner) {
    if (boatPanner.positionX) {
      boatPanner.positionX.value = state.boatRoot.position.x;
      boatPanner.positionY.value = state.boatRoot.position.y;
      boatPanner.positionZ.value = state.boatRoot.position.z;
    } else {
      boatPanner.setPosition(
        state.boatRoot.position.x,
        state.boatRoot.position.y,
        state.boatRoot.position.z
      );
    }
  }

  if (windPanner) {
    if (windPanner.positionX) {
      windPanner.positionX.value = state.boatRoot.position.x;
      windPanner.positionY.value = state.boatRoot.position.y + 2;
      windPanner.positionZ.value = state.boatRoot.position.z;
    } else {
      windPanner.setPosition(
        state.boatRoot.position.x,
        state.boatRoot.position.y + 2,
        state.boatRoot.position.z
      );
    }
  }
}