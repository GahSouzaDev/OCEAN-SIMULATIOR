// js/world/visibility.js — CULLING POR DISTÂNCIA (histerese + tick leve)
import { state } from '../state.js';

const groups = [];
let timer = null;

// Registra um grupo para aparecer/sumir por distância do barco.
// showR < hideR cria histerese (evita flicker na borda).
export function registerVisibility(group, cx, cz, showR, hideR) {
  groups.push({ group, cx, cz, showR, hideR, on: group.visible !== false });
  if (timer === null) timer = setInterval(updateVisibility, 150);
  updateVisibility();
}

export function updateVisibility() {
  if (!state.boatRoot) return;
  const bx = state.boatRoot.position.x, bz = state.boatRoot.position.z;
  for (const g of groups) {
    const d = Math.hypot(bx - g.cx, bz - g.cz);
    if (!g.on && d < g.showR)      { g.group.visible = true;  g.on = true;  }
    else if (g.on && d > g.hideR)  { g.group.visible = false; g.on = false; }
  }
}