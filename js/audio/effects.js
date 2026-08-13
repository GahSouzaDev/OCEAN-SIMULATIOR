import { state } from '../state.js';
import { actx, masterFilter, boatPanner } from './audio-manager.js';
import { currentBoatName } from '../boats/boat-manager.js';

let hornOsc = null, hornG = null, hornLPF = null, hornActive = false;

function ensureAudio() {
  if (!actx) return false;
  if (actx.state === 'suspended') actx.resume();
  return true;
}

export function playSplashSound(intensity) {
  if (!ensureAudio() || !state.audioOn || !boatPanner) return;
  const now = actx.currentTime;
  const vol = Math.min(intensity, 2.0) * 0.5;
  const dur = 0.15 + vol * 0.2;
  const buf = actx.createBuffer(1, Math.floor(actx.sampleRate * dur), actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++)
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (actx.sampleRate * 0.03));
  const src = actx.createBufferSource(); src.buffer = buf;
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800 + vol * 400;
  const g = actx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol, now + 0.003);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(lp); lp.connect(g); g.connect(boatPanner);
  src.start(now); src.stop(now + dur);
}

export function playReentrySound(intensity) {
  if (!ensureAudio() || !state.audioOn || !boatPanner || state.reentryCooldown > 0) return;
  state.reentryCooldown = 0.3;
  const now = actx.currentTime;
  const vol = Math.min(intensity, 1.5) * 0.9;
  const dur = 0.35;
  const buf = actx.createBuffer(1, Math.floor(actx.sampleRate * dur), actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / actx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10) * 1.0;
  }
  const src = actx.createBufferSource(); src.buffer = buf;
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
  const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 250; bp.Q.value = 1.5;
  const g = actx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(lp); lp.connect(bp); bp.connect(g); g.connect(boatPanner);
  src.start(now); src.stop(now + dur);
}

// --- Clique simples (original, conectado ao master) ---
export function playClickSound() {
  if (!ensureAudio() || !state.audioOn) return;
  const now = actx.currentTime;
  const dur = 0.04;
  const buf = actx.createBuffer(1, Math.floor(actx.sampleRate * dur), actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / actx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.7;
  }
  const src = actx.createBufferSource(); src.buffer = buf;
  const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
  const g = actx.createGain();
  g.gain.setValueAtTime(0.35, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(hp); hp.connect(g); g.connect(masterFilter);
  src.start(now); src.stop(now + dur);
}

// --- Clique 3D (mesmo som, mas conectado ao boatPanner) ---
export function playClickSound3D() {
  if (!ensureAudio() || !state.audioOn || !boatPanner) return;
  const now = actx.currentTime;
  const dur = 0.04;
  const buf = actx.createBuffer(1, Math.floor(actx.sampleRate * dur), actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / actx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.7;
  }
  const src = actx.createBufferSource(); src.buffer = buf;
  const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
  const g = actx.createGain();
  g.gain.setValueAtTime(0.35, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(hp); hp.connect(g); g.connect(boatPanner);
  src.start(now); src.stop(now + dur);
}

// --- (as demais funções permanecem iguais) ---
export function playDeckLightSound(isOn) {
  if (!ensureAudio() || !state.audioOn || !boatPanner) return;
  const now = actx.currentTime;
  const dur = isOn ? 0.12 : 0.08;

  const buf = actx.createBuffer(1, Math.floor(actx.sampleRate * dur), actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / actx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 45) * 1.0;
  }
  const src = actx.createBufferSource(); src.buffer = buf;
  const bp = actx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = isOn ? 700 : 1300;
  bp.Q.value = 2.0;
  const g = actx.createGain();
  g.gain.setValueAtTime(isOn ? 0.7 : 0.5, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(bp); bp.connect(g); g.connect(boatPanner);
  src.start(now); src.stop(now + dur);

  if (isOn) {
    const osc = actx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    const og = actx.createGain();
    og.gain.setValueAtTime(0, now);
    og.gain.linearRampToValueAtTime(0.2, now + 0.02);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(og); og.connect(boatPanner);
    osc.start(now); osc.stop(now + 0.35);

    const osc2 = actx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2200, now);
    osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.1);
    const og2 = actx.createGain();
    og2.gain.setValueAtTime(0, now);
    og2.gain.linearRampToValueAtTime(0.1, now + 0.01);
    og2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc2.connect(og2); og2.connect(boatPanner);
    osc2.start(now); osc2.stop(now + 0.12);
  }
}

export function startHorn() {
  if (!ensureAudio() || !state.audioOn || hornActive || !boatPanner) return;
  hornActive = true;
  const now = actx.currentTime;
  hornOsc = actx.createOscillator();
  hornOsc.type = 'sawtooth';
  const freq = currentBoatName() === 'trawler' ? 85 : 120;
  hornOsc.frequency.value = freq;
  const hornOsc2 = actx.createOscillator();
  hornOsc2.type = 'triangle';
  hornOsc2.frequency.value = freq * 0.5;
  hornLPF = actx.createBiquadFilter();
  hornLPF.type = 'lowpass'; hornLPF.frequency.value = 450; hornLPF.Q.value = 2;
  hornG = actx.createGain();
  hornG.gain.setValueAtTime(0, now);
  hornG.gain.linearRampToValueAtTime(0.35, now + 0.15);
  const merger = actx.createGain();
  hornOsc.connect(merger); hornOsc2.connect(merger);
  merger.connect(hornLPF); hornLPF.connect(hornG); hornG.connect(boatPanner);
  hornOsc.start(); hornOsc2.start();
  hornOsc._partner = hornOsc2;
}

export function stopHorn() {
  if (!hornActive || !hornOsc || !hornG || !actx) return;
  const now = actx.currentTime;
  hornG.gain.cancelScheduledValues(now);
  hornG.gain.setValueAtTime(hornG.gain.value, now);
  hornG.gain.linearRampToValueAtTime(0, now + 0.3);
  try {
    hornOsc.stop(now + 0.35);
    if (hornOsc._partner) hornOsc._partner.stop(now + 0.35);
  } catch (e) {}
  hornActive = false;
  hornOsc = null; hornG = null; hornLPF = null;
}

export function thunderSnd() {
  if (!ensureAudio() || !state.audioOn) return;
  const s = actx.createBufferSource();
  const b = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  s.buffer = b;
  const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 140;
  const g = actx.createGain();
  g.gain.setValueAtTime(0.7, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.8);
  s.connect(f); f.connect(g); g.connect(masterFilter); s.start();
}