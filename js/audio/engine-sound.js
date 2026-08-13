import * as THREE from 'three';
import { state, b2lFull } from '../state.js';
import { waveHAt } from '../ocean/waves.js';
import { actx, masterFilter, boatPanner } from './audio-manager.js';

let engOsc, engSub, engG, engineLPFilter;
let hullSrc, hullF, hullG;
let hullWaterSrc, hullWaterBP, hullWaterHP, hullWaterG, hullWaterBrillianceG;

const HULL_WATER_MAX_GAIN = 0.18;
const HULL_WATER_MIN_SPEED = 0.5;
const HULL_WATER_MAX_SPEED = 8.0;
const HULL_WATER_LOW_FREQ = 300;
const HULL_WATER_HIGH_FREQ = 1500;
const HULL_WATER_BRILLIANCE = 3200;

const _motorWorld = new THREE.Vector3();

export function initEngineSound() {
  if (!actx) return;
  engOsc = actx.createOscillator(); engOsc.type = 'sawtooth'; engOsc.frequency.value = 45;
  engSub = actx.createOscillator(); engSub.type = 'square'; engSub.frequency.value = 22;
  engG = actx.createGain(); engG.gain.value = 0;
  engineLPFilter = actx.createBiquadFilter();
  engineLPFilter.type = 'lowpass'; engineLPFilter.frequency.value = 420;
  const engMerger = actx.createGain();
  engOsc.connect(engMerger); engSub.connect(engMerger);
  engMerger.connect(engineLPFilter); engineLPFilter.connect(engG);
  engG.connect(boatPanner);
  engOsc.start(); engSub.start();

  const hullBuf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
  const hullData = hullBuf.getChannelData(0);
  let hullLast = 0;
  for (let i = 0; i < hullData.length; i++) {
    const w = Math.random() * 2 - 1;
    hullLast = (hullLast + 0.005 * w) / 1.005;
    hullData[i] = hullLast * 10;
  }
  hullSrc = actx.createBufferSource(); hullSrc.buffer = hullBuf; hullSrc.loop = true;
  hullF = actx.createBiquadFilter(); hullF.type = 'lowpass'; hullF.frequency.value = 120;
  hullG = actx.createGain(); hullG.gain.value = 0;
  hullSrc.connect(hullF); hullF.connect(hullG); hullG.connect(boatPanner);
  hullSrc.start();

  const hullWaterBuf = actx.createBuffer(1, actx.sampleRate * 3, actx.sampleRate);
  const hullWaterData = hullWaterBuf.getChannelData(0);
  let hwLast = 0;
  for (let i = 0; i < hullWaterData.length; i++) {
    const w = Math.random() * 2 - 1;
    hwLast = (hwLast + 0.01 * w) / 1.01;
    hullWaterData[i] = hwLast * 8;
  }
  hullWaterSrc = actx.createBufferSource(); hullWaterSrc.buffer = hullWaterBuf; hullWaterSrc.loop = true;
  hullWaterBP = actx.createBiquadFilter(); hullWaterBP.type = 'bandpass'; hullWaterBP.frequency.value = 800; hullWaterBP.Q.value = 1.2;
  hullWaterHP = actx.createBiquadFilter(); hullWaterHP.type = 'highpass'; hullWaterHP.frequency.value = HULL_WATER_BRILLIANCE; hullWaterHP.Q.value = 0.8;
  hullWaterG = actx.createGain(); hullWaterG.gain.value = 0;
  hullWaterBrillianceG = actx.createGain(); hullWaterBrillianceG.gain.value = 0;
  hullWaterSrc.connect(hullWaterBP); hullWaterBP.connect(hullWaterG); hullWaterG.connect(boatPanner);
  hullWaterSrc.connect(hullWaterHP); hullWaterHP.connect(hullWaterBrillianceG); hullWaterBrillianceG.connect(boatPanner);
  hullWaterSrc.start();
}

export function updateEngineSound(dt, currentBoat) {
  if (!actx || !state.audioOn || !currentBoat) return;
  const t = actx.currentTime;
  const motorLocal = currentBoat.motorPos || new THREE.Vector3(0, -0.7, -4.2);
  b2lFull(motorLocal.x, motorLocal.y, motorLocal.z, _motorWorld);
  const motorSubAudio = waveHAt(_motorWorld.x, _motorWorld.z) - _motorWorld.y;
  const waterFactor = THREE.MathUtils.clamp(motorSubAudio / 5 + 0.5, 0, 1);
  const th = state.throttle;

  const freqInWater = 40 + th * 50;
  const freqOutOfWater = 55 + th * 40;
  const baseFreq = THREE.MathUtils.lerp(freqOutOfWater, freqInWater, waterFactor);
  const subFreq = baseFreq * 0.5;
  const engineVol = THREE.MathUtils.lerp(0.20, 0.18, waterFactor);
  const filterFreq = THREE.MathUtils.lerp(650, 350, waterFactor);

  engOsc.frequency.linearRampToValueAtTime(baseFreq, t + 0.08);
  engSub.frequency.linearRampToValueAtTime(subFreq, t + 0.08);
  engineLPFilter.frequency.linearRampToValueAtTime(filterFreq, t + 0.08);
  engG.gain.linearRampToValueAtTime(engineVol, t + 0.08);

  const spdN = Math.min(1, Math.abs(state.speed) / 12);
  const absSpeed = Math.abs(state.speed);

  if (hullWaterG && hullWaterBP && hullWaterBrillianceG && hullWaterHP) {
    let hullWaterVol = 0;
    if (waterFactor > 0.1 && absSpeed > HULL_WATER_MIN_SPEED) {
      const speedFactor = THREE.MathUtils.smoothstep(absSpeed, HULL_WATER_MIN_SPEED, HULL_WATER_MAX_SPEED);
      hullWaterVol = HULL_WATER_MAX_GAIN * speedFactor * waterFactor;
    }
    hullWaterG.gain.linearRampToValueAtTime(hullWaterVol, t + 0.15);
    const brillianceVol = hullWaterVol * 0.4;
    hullWaterBrillianceG.gain.linearRampToValueAtTime(brillianceVol, t + 0.15);
    const bpFreq = HULL_WATER_LOW_FREQ + (HULL_WATER_HIGH_FREQ - HULL_WATER_LOW_FREQ) * spdN;
    hullWaterBP.frequency.linearRampToValueAtTime(bpFreq, t + 0.2);
    const hpFreq = HULL_WATER_BRILLIANCE + spdN * 800;
    hullWaterHP.frequency.linearRampToValueAtTime(hpFreq, t + 0.2);
    const modFreq = bpFreq + Math.sin(state.simTime * 2.3) * 50;
    hullWaterBP.frequency.linearRampToValueAtTime(modFreq, t + 0.05);
  }

  if (hullG && hullF) {
    if (!state.airborne && Math.abs(state.speed) > 0.5) {
      const hullVol = Math.min(0.25, spdN * 0.3 + Math.abs(state.physics.vy) * 0.05);
      hullG.gain.linearRampToValueAtTime(hullVol, t + 0.1);
      hullF.frequency.linearRampToValueAtTime(80 + spdN * 150, t + 0.1);
    } else {
      hullG.gain.linearRampToValueAtTime(0, t + 0.2);
    }
  }
}