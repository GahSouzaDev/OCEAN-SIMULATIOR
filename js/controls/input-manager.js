import { initKeyboard } from './keyboard.js';
import { initMouse } from './mouse.js';
import { pollGamepad } from './gamepad.js';

export function initInput(callbacks) {
  initKeyboard(callbacks);
  initMouse(callbacks);
}

export function updateInput() {
  pollGamepad();
}

export function updateThrottleFromMouse(clientY) {
  const rect = document.getElementById('throttle-bar').getBoundingClientRect();
  const ratio = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  return ratio;
}

export function updateRudderFromMouse(clientX) {
  const rect = document.getElementById('rudder-bar').getBoundingClientRect();
  const ratio = (clientX - rect.left) / rect.width;
  return -(ratio - 0.5) * 2;
}

export function updateRudderVisual() {
  const rudderFill = document.getElementById('rudder-fill');
  if (!rudderFill) return;
  // importa state inline (evita circular import)
  import('../state.js').then(m => {
    const state = m.state;
    const pct = Math.abs(state.rudder) * 50;
    rudderFill.style.width = pct + '%';
    rudderFill.style.left = (state.rudder >= 0 ? (50 - pct) : 50) + '%';
  });
}