import * as THREE from 'three';
import { state, b2l } from '../state.js';
import { waveHAt, waveHeightEnvelope, waveSprayFactor, waveAccelVertical } from '../ocean/waves.js';

const _bowL = new THREE.Vector3();

export function applyBuoyancy(dt, currentBoat, emitSprayFn, playSplashFn) {
  const bx = state.boatRoot.position.x, bz = state.boatRoot.position.z;
  const c2 = Math.cos(state.heading), s2 = Math.sin(state.heading);
  const P = (lx, lz) => waveHAt(bx + lx * c2 + lz * s2, bz - lx * s2 + lz * c2);

  const waterAccel = waveAccelVertical(bx, bz, state.wavePhase);
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

  // ==========================================================
  // 1. HEAVE - Rigidez Adaptativa (Sem Quicadinhas)
  // ==========================================================
  const baseK = 35000 * weightMod;
  const springK = baseK * massFactor;
  const criticalDamping = 2 * Math.sqrt(springK * boatMass);
  const dampingC = criticalDamping * 0.92;
  
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

  // ==========================================================
  // 💥 PANCADA NA ÁGUA — EXPLOSÃO MASSIVA (muito mais partículas, gigantes)
  // ==========================================================
  if (state.physics.y < targetY - 0.15 && state.physics.vy < -1.2) {
    const impact = Math.abs(state.physics.vy);
    const slammingForce = impact * 3500;
    state.physics.vy -= (slammingForce / boatMass) * dt * 2;
    
    b2l(0, 0.5, 3.9, _bowL);
    const waveLocalH = waveHeightEnvelope(_bowL.x, _bowL.z);
    const sprayScale = Math.max(0.7, waveSprayFactor(waveLocalH));

    const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
    const rightX = Math.cos(state.heading), rightZ = -Math.sin(state.heading);

    // 💥 EXPLOSÃO GIGANTE: até 750 partículas MASSIVAS
    const n = Math.min(750, Math.round((120 + impact * 40) * sprayScale));
    if (emitSprayFn) {
      for (let i = 0; i < n; i++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const along = 4.8 - Math.random() * 5.5;  // coroa: proa → popa
        const lat = side * (0.25 + Math.random() * 2.0);
        const px = bx + fwdX * along + rightX * lat;
        const pz = bz + fwdZ * along + rightZ * lat;
        const py = waveHAt(px, pz) + 0.15;

        // água explode violentamente pra fora e pra cima
        const out = (2.5 + Math.random() * 4.5) * (0.7 + impact * 0.45);
        const up  = 4.5 + Math.random() * (4.5 + impact * 2.5);

        emitSprayFn(px, py, pz,
          rightX * side * out + (Math.random() - 0.5) * 3.5,
          up,
          rightZ * side * out + (Math.random() - 0.5) * 3.5,
          { size: (0.55 + Math.random() * 0.75) * (0.8 + sprayScale * 0.9) * (1 + impact * 0.18),
            life: 1.2 + Math.random() * 1.2 + impact * 0.15 });
      }

      // 🌊 JATO CENTRAL EXTRA na proa — coluna d'água vertical
      const centralJet = Math.min(120, Math.round(30 + impact * 18));
      for (let i = 0; i < centralJet; i++) {
        const along = 3.6 + Math.random() * 1.8;
        const lat = (Math.random() - 0.5) * 1.2;
        const px = bx + fwdX * along + rightX * lat;
        const pz = bz + fwdZ * along + rightZ * lat;
        const py = waveHAt(px, pz) + 0.2;
        const up = 6.0 + Math.random() * (5.0 + impact * 3.0);
        const out = (Math.random() - 0.5) * 2.5;
        emitSprayFn(px, py, pz,
          rightX * out + (Math.random() - 0.5) * 1.5,
          up,
          rightZ * out + (Math.random() - 0.5) * 1.5,
          { size: (0.70 + Math.random() * 0.90) * (0.9 + impact * 0.20),
            life: 1.4 + Math.random() * 1.5 + impact * 0.20 });
      }
    }
    if (impact > 1.5 && playSplashFn) playSplashFn(impact * 0.6 * sprayScale);
  }

  // ==========================================================
  // 2. PITCH - Suave e Pesado
  // ==========================================================
  const pitchK = 55000 * massFactor;
  const pitchD = 2 * Math.sqrt(pitchK * pitchMOI) * 0.9;
  const pitchError = targetPitch - state.physics.pitch;
  const pitchTorque = pitchError * pitchK - state.physics.pitchVel * pitchD;
  state.physics.pitchVel += (pitchTorque / pitchMOI) * dt;
  state.physics.pitch += state.physics.pitchVel * dt;

  // ==========================================================
  // 3. ROLL - Suave e Pesado
  // ==========================================================
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