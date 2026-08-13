import { state } from '../state.js';

export function initKeyboard(callbacks) {
  addEventListener('keydown', e => {
    state.keys[e.code] = true;
    if (e.code === 'KeyM' && callbacks.toggleAudio) callbacks.toggleAudio();
    if (e.code === 'KeyC' && callbacks.cycleCamera) callbacks.cycleCamera();
    if (e.code === 'KeyL' && callbacks.setDeckLight) callbacks.setDeckLight();
    if (e.code === 'KeyB' && callbacks.toggleBoat) callbacks.toggleBoat();
    if (e.code === 'KeyH' && callbacks.startHorn) callbacks.startHorn();
  });
  addEventListener('keyup', e => {
    state.keys[e.code] = false;
    if (e.code === 'KeyH' && callbacks.stopHorn) callbacks.stopHorn();
  });
}