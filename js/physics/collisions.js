// js/physics/collisions.js — AREIA FÍSICA: encalha só quando o casco toca
import * as THREE from 'three';
import { state } from '../state.js';
import { groundHeightAt, COLLIDERS, GATES, BOAT_PHYS, updateTide, tideM } from '../world/world-map.js';
import { applyDamage } from '../game/damage.js';
import { curBoat, currentBoatName } from '../boats/boat-manager.js';
let grounded = false, lastHit = 0;
export function updateCollisions(dt) {
  updateTide(dt);
  const cb = curBoat();
  if (!cb || !state.boatRoot) return;
  const spec = BOAT_PHYS[cb.name] || BOAT_PHYS.pilot;
  const bx = state.boatRoot.position.x, bz = state.boatRoot.position.z;
  // ---------- ENCALHE POR CONTATO REAL ----------
  const ground = groundHeightAt(bx, bz) + tideM() * 0.5;
  const keel = state.physics.y - spec.draft;
  if (keel < ground) {
    const pen = ground - keel;
    if (!grounded && Math.abs(state.speed) > 1.5 && state.simTime - lastHit > 1) {
      lastHit = state.simTime;
      applyDamage(currentBoatName(), Math.abs(state.speed) * 2);
    }
    grounded = true;
    state.physics.y += pen;                 // apoia na areia
    if (state.physics.vy < 0) state.physics.vy = 0;
    if (state.speed >= 0) state.speed *= Math.exp(-dt * 3.5);   // areia segura a proa
    else state.speed *= Math.exp(-dt * 0.6);                    // ré livre pra escapar
    state.sideSpeed *= Math.exp(-dt * 3);
    // desliza pro mar (descida do terreno)
    const e = 2.0;
    const gx = (groundHeightAt(bx + e, bz) - groundHeightAt(bx - e, bz)) / (2 * e);
    const gz = (groundHeightAt(bx, bz + e) - groundHeightAt(bx, bz - e)) / (2 * e);
    const gl = Math.hypot(gx, gz) || 1;
    state.boatRoot.position.x += (-gx / gl) * dt * 1.2;
    state.boatRoot.position.z += (-gz / gl) * dt * 1.2;
  } else grounded = false;
  // ---------- ILHAS / LAJES / PILARES (mola suave) ----------
  const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
  const rightX = Math.cos(state.heading), rightZ = -Math.sin(state.heading);
  for (const c of COLLIDERS) {
    const dx = bx - c.x, dz = bz - c.z;
    const d = Math.hypot(dx, dz), min = c.r + spec.radius;
    if (d < min && d > 0.001) {
      const nx = dx / d, nz = dz / d, pen2 = min - d;
      const a = pen2 * 6.0;
      state.speed += (nx * fwdX + nz * fwdZ) * a * dt;
      state.sideSpeed += (nx * rightX + nz * rightZ) * a * dt;
      state.speed *= Math.exp(-dt * 0.8 * pen2);
      const impact = Math.abs(state.speed);
      if (impact > 2.5 && state.simTime - lastHit > 1) {
        lastHit = state.simTime;
        applyDamage(currentBoatName(), impact * 1.5);
      }
      if (pen2 > spec.radius) {
        state.boatRoot.position.x += nx * (pen2 - spec.radius);
        state.boatRoot.position.z += nz * (pen2 - spec.radius);
      }
    }
  }
  // ---------- PORTÕES (ponte de madeira) ----------
  for (const gt of GATES) {
    const dx = bx - gt.x, dz = bz - gt.z, d = Math.hypot(dx, dz);
    if (d < gt.r && !gt.open(cb, spec, tideM())) {
      const nx = dx / (d || 1), nz = dz / (d || 1);
      state.speed += (nx * fwdX + nz * fwdZ) * 6.0 * dt;
      state.sideSpeed += (nx * rightX + nz * rightZ) * 6.0 * dt;
      state.speed *= Math.exp(-dt * 3);
    }
  }
}