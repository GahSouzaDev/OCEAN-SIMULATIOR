import * as THREE from 'three';
import { state, b2l } from '../state.js';
import { waveHAt, waveHeightEnvelope, waveSprayFactor } from '../ocean/waves.js';

const _bowL = new THREE.Vector3();

export function applyBuoyancy(dt, currentBoat, emitSprayFn, playSplashFn) {
  const bx = state.boatRoot.position.x, bz = state.boatRoot.position.z;
  const c2 = Math.cos(state.heading), s2 = Math.sin(state.heading);
  const P = (lx, lz) => waveHAt(bx + lx * c2 + lz * s2, bz - lx * s2 + lz * c2);

  const zPivot = -0.88;
  const hPivot = P(0, zPivot), hBow = P(0, 3.2), hStern = P(0, -3.6);
  const hPort = P(-1.2, zPivot), hStbd = P(1.2, zPivot);

  const targetPitch = Math.atan2(hBow - hStern, 6.8);
  const draftOffset = currentBoat.name === 'pilot' ? -0.15 : -0.25;
  const targetY = hPivot + Math.sin(targetPitch) * (-zPivot) + 0.06 - draftOffset;
  const targetRoll = Math.atan2(hStbd - hPort, 2.4) - state.rudder * (Math.min(1, Math.abs(state.speed) / 6)) * 0.13;

  const springK = 12, dampingC = 4.5;
  const yError = targetY - state.physics.y;
  const yForce = yError * springK - state.physics.vy * dampingC;
  state.physics.vy += yForce * dt;
  state.physics.y += state.physics.vy * dt;

  const sternSub = waveHAt(bx - s2 * (-3.6), bz - c2 * (-3.6)) - (state.physics.y - 0.5);
  state.prevAirborne = state.airborne;
  const bowSubFn = () => P(0, 3.2) - state.physics.y;
  state.airborne = (bowSubFn() < 0 && sternSub < 0 &&
                    P(-1.2, 0) - state.physics.y < 0 &&
                    P(1.2, 0) - state.physics.y < 0);

  if (state.physics.y < targetY - 0.3 && state.physics.vy < -2) {
    const impact = Math.abs(state.physics.vy);
    state.physics.vy += impact * 0.4;
    b2l(0, 0.5, 3.9, _bowL);
    const waveLocalH = waveHeightEnvelope(_bowL.x, _bowL.z);
    const sprayScale = waveSprayFactor(waveLocalH);
    const n = Math.round((6 + Math.floor(impact * 4)) * sprayScale);
    if (emitSprayFn) {
      for (let i = 0; i < n; i++) {
        emitSprayFn(_bowL.x, _bowL.y, _bowL.z,
          (Math.random() - 0.5) * 2.8 * (1 + impact * 0.18),
          1.3 + Math.random() * impact * 0.8,
          (Math.random() - 0.5) * 2.8 * (1 + impact * 0.18),
          { size: (0.12 + Math.random() * 0.14) * (0.5 + sprayScale * 0.6),
            life: 0.6 + Math.random() * 0.5 + impact * 0.03 });
      }
    }
    if (impact > 2.5 && playSplashFn) playSplashFn(impact * 0.35 * sprayScale);
  }

  const pitchK = 8, pitchD = 3.2;
  const pitchError = targetPitch - state.physics.pitch;
  state.physics.pitchVel += (pitchError * pitchK - state.physics.pitchVel * pitchD) * dt;
  state.physics.pitch += state.physics.pitchVel * dt;

  const rollK = 8, rollD = 3.2;
  const rollError = targetRoll - state.physics.roll;
  state.physics.rollVel += (rollError * rollK - state.physics.rollVel * rollD) * dt;
  state.physics.roll += state.physics.rollVel * dt;

  state.boatRoot.position.y = state.physics.y;
  state.boatRoot.rotation.y = state.heading;
  state.tilt.rotation.x = -state.physics.pitch;
  state.tilt.rotation.z = state.physics.roll;
  state.boatRoot.updateMatrixWorld(true);
}