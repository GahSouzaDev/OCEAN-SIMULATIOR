import { state } from '../state.js';

// Stub preparado para futuro: ler gamepad e aplicar em throttle/rudder.
export function pollGamepad() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of gamepads) {
    if (!gp) continue;
    // Exemplo de mapeamento:
    // axis 1 (left stick Y) -> throttle
    // axis 0 (left stick X) -> rudder
    // state.throttleTarget = (1 - gp.axes[1]) / 2;
    // state.rudder = -gp.axes[0];
    break;
  }
}