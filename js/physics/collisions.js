import * as THREE from 'three';
import { state } from '../state.js';
import { groundHeightAt, COLLIDERS, GATES, BOAT_PHYS, updateTide, tideM } from '../world/world-map.js';
import { applyDamage } from '../game/damage.js';
import { curBoat, currentBoatName } from '../boats/boat-manager.js';

let lastHit = 0;

export function updateCollisions(dt) {
  updateTide(dt);
  const cb = curBoat();
  if (!cb || !state.boatRoot) return;
  const spec = BOAT_PHYS[cb.name] || BOAT_PHYS.pilot;
  const bx = state.boatRoot.position.x, bz = state.boatRoot.position.z;
  
  const groundY = groundHeightAt(bx, bz) + tideM() * 0.5;
  const keelY = state.physics.y - spec.draft;
  
  const e = 2.0;
  const gx = (groundHeightAt(bx + e, bz) - groundHeightAt(bx - e, bz)) / (2 * e);
  const gz = (groundHeightAt(bx, bz + e) - groundHeightAt(bx, bz - e)) / (2 * e);
  
  state.groundSlopeX = gx;
  state.groundSlopeZ = gz;

  if (keelY < groundY) {
    const pen = groundY - keelY;
    if (!state.grounded && Math.abs(state.speed) > 1.5 && state.simTime - lastHit > 1) {
      lastHit = state.simTime;
      applyDamage(currentBoatName(), Math.abs(state.speed) * 2);
    }
    state.grounded = true;
    
    state.physics.y += pen;
    if (state.physics.vy < 0) state.physics.vy = 0;
    
    const speedMag = Math.hypot(state.speed, state.sideSpeed);
    // Areia: resistência alta quando parado, mas permite deslizar se vier rápido
    const sandDrag = 1.2 + 3.0 / (1.0 + speedMag * 0.3); 
    
    state.speed *= Math.exp(-dt * sandDrag);
    state.sideSpeed *= Math.exp(-dt * sandDrag);
    
    // Escorregar pela descida do terreno (gravidade na areia)
    const slideForceX = -gx * 9.81;
    const slideForceZ = -gz * 9.81;
    
    const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
    const rightX = Math.cos(state.heading), rightZ = -Math.sin(state.heading);
    
    state.speed += (slideForceX * fwdX + slideForceZ * fwdZ) * dt;
    state.sideSpeed += (slideForceX * rightX + slideForceZ * rightZ) * dt;
    
  } else {
    state.grounded = false;
  }

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