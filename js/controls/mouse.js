import { state } from '../state.js';
import { CAM_NAMES } from '../config.js';

export function initMouse(callbacks) {
  const canvas = document.getElementById('app-canvas');
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('mousedown', e => {
    if (e.button === 2 || (e.button === 0 && state.camMode === 1)) {
      state.dragging = true;
      state.lastMX = e.clientX;
      state.lastMY = e.clientY;
    }
  });
  addEventListener('mouseup', () => {
    state.dragging = false;
    state.mouseDown2 = false;
    state.rudderDragging = false;
  });
  addEventListener('mousemove', e => {
    if (state.dragging) {
      state.orbitYaw -= (e.clientX - state.lastMX) * 0.005;
      state.orbitPitch = Math.max(-1.2, Math.min(1.5,
        state.orbitPitch + (e.clientY - state.lastMY) * 0.004));
      state.lastMX = e.clientX;
      state.lastMY = e.clientY;
    }
    if (state.mouseDown2 && callbacks.updateThrottle) callbacks.updateThrottle(e.clientY);
    if (state.rudderDragging && callbacks.updateRudder) callbacks.updateRudder(e.clientX);
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (state.camMode === 0)
      state.chaseDist = Math.max(6, Math.min(22, state.chaseDist + e.deltaY * 0.01));
    else
      state.orbitDist = Math.max(3, Math.min(80, state.orbitDist + e.deltaY * 0.012));
  }, { passive: false });

  // Throttle / Rudder bars
  const throttleBar = document.getElementById('throttle-bar');
  throttleBar.addEventListener('mousedown', e => {
    state.mouseDown2 = true;
    if (callbacks.updateThrottle) callbacks.updateThrottle(e.clientY);
  });

  const rudderBar = document.getElementById('rudder-bar');
  rudderBar.addEventListener('mousedown', e => {
    state.rudderDragging = true;
    if (callbacks.updateRudder) callbacks.updateRudder(e.clientX);
  });
}