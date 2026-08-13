import { state } from '../state.js';
import { actx, masterFilter, boatPanner, windPanner, windPannerG } from './audio-manager.js';

let seaF, seaG, seaSrc;
let windF, windG, windHPFilter, windSrc;

export function initAmbient() {
  if (!actx) return;
  const buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }

  seaSrc = actx.createBufferSource(); seaSrc.buffer = buf; seaSrc.loop = true;
  seaF = actx.createBiquadFilter(); seaF.type = 'lowpass'; seaF.frequency.value = 300;
  seaG = actx.createGain(); seaG.gain.value = 0.1;
  seaSrc.connect(seaF); seaF.connect(seaG); seaG.connect(masterFilter); seaSrc.start();

  windSrc = actx.createBufferSource(); windSrc.buffer = buf; windSrc.loop = true;
  windF = actx.createBiquadFilter(); windF.type = 'bandpass'; windF.frequency.value = 750; windF.Q.value = 0.8;
  windG = actx.createGain(); windG.gain.value = 0;
  windHPFilter = actx.createBiquadFilter(); windHPFilter.type = 'highpass'; windHPFilter.frequency.value = 200;
  windSrc.connect(windF); windF.connect(windHPFilter);
  windHPFilter.connect(windG);
  windG.connect(masterFilter);
  windG.connect(windPannerG);
  windSrc.start();
}

export function updateAmbient(dt) {
  if (!actx || !state.audioOn) return;
  const t = actx.currentTime;
  seaF.frequency.value = 220 + state.waveHMul * state.windMul * 260;
  seaG.gain.value = 0.08 + state.waveHMul * 0.09 + state.flash * 0.08;
  const baseWindVol = state.windMul * state.windMul * 0.03 * (0.75 + 0.25 * Math.sin(state.simTime * 0.9));
  if (state.camMode !== 4) {
    windG.gain.linearRampToValueAtTime(baseWindVol, t + 0.1);
    if (windPannerG) windPannerG.gain.linearRampToValueAtTime(baseWindVol * 0.6, t + 0.1);
  }
}

export function getAmbientNodes() { return { windG, windHPFilter }; }