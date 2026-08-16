// js/world/streaming.js — CULLING POR DISTÂNCIA + GRUPOS ESTÁTICOS (CORRIGIDO: import THREE)
import * as THREE from 'three';
import { state } from '../state.js';

const groups = [];
let acc = 0;

export function registerCullGroup(group, x, z, showR, hideR) {
  // cidades são estáticas: congela a matrix mundial (economiza CPU)
  group.updateMatrix();
  group.matrixAutoUpdate = false;
  group.traverse(o => {
    if (o.isMesh) {
      o.updateMatrix();
      o.matrixAutoUpdate = false;
      o.frustumCulled = true;
    }
  });
  groups.push({ group, x, z, showR, hideR, on: group.visible !== false });
  updateStreaming(1);
}

export function updateStreaming(dt) {
  acc += dt;
  if (acc < 0.15) return;   // checa só ~6x por segundo
  acc = 0;
  if (!state.boatRoot) return;
  const bx = state.boatRoot.position.x, bz = state.boatRoot.position.z;
  for (const g of groups) {
    const d = Math.hypot(bx - g.x, bz - g.z);
    if (g.on && d > g.hideR)      { g.group.visible = false; g.on = false; }
    else if (!g.on && d < g.showR) { g.group.visible = true;  g.on = true;  }
  }
}

export function buildCityCulled(id, x, z, showR, hideR, buildFn, worldFX) {
  const g = new THREE.Group();
  g.name = 'city_' + id;
  const real = state.scene;
  state.scene = g;                 // durante o build, state.scene É o group da cidade
  try { buildFn(worldFX); }
  finally { state.scene = real; }  // sempre restaura
  real.add(g);
  registerCullGroup(g, x, z, showR, hideR);
  return g;
}