// js/audio/region-sting.js — assinatura sonora curta por lugar (baixa, 2–3s)
import { state } from '../state.js';
import { actx, masterFilter } from './audio-manager.js';
function note(f, t0, dur, type, vol, slideTo) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(masterFilter);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
export function playRegionSting(mood) {
  if (!actx || !state.audioOn) return;
  const t = actx.currentTime + 0.05;
  if (mood === 'caicara') {
    note(392, t, 0.5, 'triangle', 0.20);
    note(494, t+0.13, 0.5, 'triangle', 0.18);
    note(587, t+0.26, 0.9, 'triangle', 0.16);
  } else if (mood === 'urbano') {
    note(98,  t, 1.3, 'sawtooth', 0.16);
    note(147, t+0.06, 1.3, 'sawtooth', 0.12);
  } else if (mood === 'mistico') {
    note(220, t, 2.2, 'sine', 0.18);
    note(311, t+0.18, 2.0, 'sine', 0.10);
    note(1760, t+0.5, 0.9, 'sine', 0.04);
  } else if (mood === 'selva') {
    note(660, t+0.1, 0.6, 'sine', 0.12, 590);
    note(440, t+0.5, 0.7, 'sine', 0.10, 415);
  } else if (mood === 'perigo') {
    note(55, t, 2.0, 'sawtooth', 0.18);
    note(466, t+0.35, 0.5, 'triangle', 0.09);
    note(494, t+0.35, 0.5, 'triangle', 0.09);
  } else { // aberto
    note(294, t, 1.6, 'sine', 0.11);
    note(440, t, 1.6, 'sine', 0.07);
    note(588, t+0.12, 1.4, 'sine', 0.05);
  }
}