import * as THREE from 'three';
import { state, b2l } from '../state.js';
import { waveHAt, waveHeightEnvelope, waveSprayFactor, waveAccelVertical } from '../ocean/waves.js';

const _bowL = new THREE.Vector3();

export function applyBuoyancy(dt, currentBoat, emitSprayFn, playSplashFn) {
  const bx = state.boatRoot.position.x, bz = state.boatRoot.position.z;
  const c2 = Math.cos(state.heading), s2 = Math.sin(state.heading);
  const P = (lx, lz) => waveHAt(bx + lx * c2 + lz * s2, bz - lx * s2 + lz * c2);

  const waterAccel = waveAccelVertical(bx, bz, state.wavePhase);
  
  // 🎯 weightMod mais suave (evita oscilações bruscas)
  // Antes: 1.0 - waveNormalBoost * (waterAccel / 9.81)
  // Agora: clampado entre 0.6 e 1.2 para evitar efeitos extremos
  const rawWeightMod = 1.0 - state.waveNormalBoost * (waterAccel / 9.81);
  const weightMod = THREE.MathUtils.clamp(rawWeightMod, 0.6, 1.2);

  const boatMass = currentBoat.mass || 2500;
  const massFactor = boatMass / 2500;
  
  const pitchMOI = currentBoat.pitchMOI || (4000 * massFactor);
  const rollMOI  = currentBoat.rollMOI  || (1200 * massFactor);

  const zPivot = -0.88;
  const hPivot = P(0, zPivot), hBow = P(0, 3.2), hStern = P(0, -3.6);
  const hPort = P(-1.2, zPivot), hStbd = P(1.2, zPivot);

  const targetPitch = Math.atan2(hBow - hStern, 6.8);
  const draftOffset = currentBoat.name === 'pilot' ? -0.15 : -0.25;
  const targetY = hPivot + Math.sin(targetPitch) * (-zPivot) + 0.06 - draftOffset;
  const targetRoll = Math.atan2(hStbd - hPort, 2.4) - state.rudder * (Math.min(1, Math.abs(state.speed) / 6)) * 0.13;

  // 🎯 HEAVE: Rigidez e amortecimento mais suaves (menos "mola")
  // Rigidez base reduzida para evitar micro-quicadinhas
  const baseK = 35000 * weightMod;
  const springK = baseK * massFactor;
  const criticalDamping = 2 * Math.sqrt(springK * boatMass);
  const dampingC = criticalDamping * 0.92; // Amortecimento mais próximo do crítico
  
  const yError = targetY - state.physics.y;
  const yForce = yError * springK - state.physics.vy * dampingC;
  const yAccel = yForce / boatMass;
  
  state.physics.vy += yAccel * dt;
  state.physics.y += state.physics.vy * dt;

  const sternSub = waveHAt(bx - s2 * (-3.6), bz - c2 * (-3.6)) - (state.physics.y - 0.5);
  state.prevAirborne = state.airborne;
  const bowSubFn = () => P(0, 3.2) - state.physics.y;
  state.airborne = (bowSubFn() < 0 && sternSub < 0 &&
                    P(-1.2, 0) - state.physics.y < 0 &&
                    P(1.2, 0) - state.physics.y < 0);

  if (state.physics.y < targetY - 0.3 && state.physics.vy < -2) {
    const impact = Math.abs(state.physics.vy);
    const slammingForce = impact * 3500;
    state.physics.vy -= (slammingForce / boatMass) * dt * 2;
    
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

  // 🎯 PITCH: Amortecimento mais forte (menos oscilação)
  const pitchK = 55000 * massFactor;
  const pitchD = 2 * Math.sqrt(pitchK * pitchMOI) * 0.9;
  const pitchError = targetPitch - state.physics.pitch;
  const pitchTorque = pitchError * pitchK - state.physics.pitchVel * pitchD;
  state.physics.pitchVel += (pitchTorque / pitchMOI) * dt;
  state.physics.pitch += state.physics.pitchVel * dt;

  // 🎯 ROLL: Amortecimento mais forte (menos oscilação)
  const rollK = 55000 * massFactor;
  const rollD = 2 * Math.sqrt(rollK * rollMOI) * 0.9;
  const rollError = targetRoll - state.physics.roll;
  const rollTorque = rollError * rollK - state.physics.rollVel * rollD;
  state.physics.rollVel += (rollTorque / rollMOI) * dt;
  state.physics.roll += state.physics.rollVel * dt;

  state.tilt.rotation.x = -state.physics.pitch;
  state.tilt.rotation.z = state.physics.roll;

  state.boatRoot.position.y = state.physics.y;
  state.boatRoot.rotation.y = state.heading;
  state.boatRoot.updateMatrixWorld(true);
}