import * as THREE from 'three';
import { state, b2l } from '../state.js';
import { waveHAt, waveHeightEnvelope, waveSprayFactor, waveAccelVertical } from '../ocean/waves.js';

const _bowL = new THREE.Vector3();
let lastSplashTime = -999;
let impactAccum = 0;

export function applyBuoyancy(dt, currentBoat, emitSprayFn, playSplashFn) {
  const bx = state.boatRoot.position.x, bz = state.boatRoot.position.z;
  const c2 = Math.cos(state.heading), s2 = Math.sin(state.heading);
  const P = (lx, lz) => waveHAt(bx + lx * c2 + lz * s2, bz - lx * s2 + lz * c2);

  const boatMass = currentBoat.mass || 2500;
  const massFactor = boatMass / 2500;

  const pitchMOI = currentBoat.pitchMOI || (4000 * massFactor);
  const rollMOI  = currentBoat.rollMOI  || (1200 * massFactor);

  let targetPitch = 0;
  let targetRoll = 0;
  let targetY = state.physics.y;
  let applyHeave = true;
  let weightMod = 1.0;

  if (state.grounded) {
      // ============================================================
      //  ENCOSTADO NA AREIA / ILHA — inclinação segue o terreno
      // ============================================================
      // Convenção (mesma de hull-physics.js):
      //   fwd   = (sin(heading), cos(heading))   → proa
      //   right = (cos(heading), -sin(heading))  → estibordo (direita)
      //
      // O gradiente (gx, gz) aponta para onde o terreno SOBE.
      // Se o terreno sobe para frente (slopeFwd > 0), a proa deve subir → pitch > 0.
      // Se o terreno sobe para a direita (slopeRight > 0), o lado direito sobe → roll > 0.
      //
      // Depois:
      //   state.tilt.rotation.x = -pitch   → pitch > 0 inclina proa p/ cima (conv. Three.js)
      //   state.tilt.rotation.z =  roll    → roll  > 0 inclina direita p/ cima
      //
      // Sem os negativos que estavam invertendo tudo!
      const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
      const rightX = Math.cos(state.heading), rightZ = -Math.sin(state.heading);
      const gx = state.groundSlopeX || 0;
      const gz = state.groundSlopeZ || 0;
      
      const slopeFwd   = gx * fwdX   + gz * fwdZ;
      const slopeRight = gx * rightX  + gz * rightZ;
      
      // Fator de aderência ao terreno (0..1): barco grande não copia 100% a ladeira
      const grip = 0.85;
      targetPitch = Math.atan2(slopeFwd   * grip, 1.0);
      targetRoll  = Math.atan2(slopeRight * grip, 1.0);
      
      applyHeave = false;
      state.airborne = false;
      state.prevAirborne = false;
  } else {
      const waterAccel = waveAccelVertical(bx, bz, state.wavePhase);
      const rawWeightMod = 1.0 - state.waveNormalBoost * (waterAccel / 9.81);
      weightMod = THREE.MathUtils.clamp(rawWeightMod, 0.6, 1.2);

      const zPivot = -0.88;
      const hPivot = P(0, zPivot), hBow = P(0, 3.2), hStern = P(0, -3.6);
      const hPort = P(-1.2, zPivot), hStbd = P(1.2, zPivot);

      targetPitch = Math.atan2(hBow - hStern, 6.8);
      const draftOffset = currentBoat.name === 'pilot' ? -0.15 : -0.25;
      targetY = hPivot + Math.sin(targetPitch) * (-zPivot) + 0.06 - draftOffset;
      targetRoll = Math.atan2(hStbd - hPort, 2.4) - state.rudder * (Math.min(1, Math.abs(state.speed) / 6)) * 0.13;

      const sternSub = waveHAt(bx - s2 * (-3.6), bz - c2 * (-3.6)) - (state.physics.y - 0.5);
      state.prevAirborne = state.airborne;
      const bowSubFn = () => P(0, 3.2) - state.physics.y;
      state.airborne = (bowSubFn() < 0 && sternSub < 0 &&
                        P(-1.2, 0) - state.physics.y < 0 &&
                        P(1.2, 0) - state.physics.y < 0);
  }

  if (applyHeave) {
      const baseK = 35000 * weightMod;
      const springK = baseK * massFactor;
      const criticalDamping = 2 * Math.sqrt(springK * boatMass);
      const dampingC = criticalDamping * 0.92;

      const yError = targetY - state.physics.y;
      const yForce = yError * springK - state.physics.vy * dampingC;
      const yAccel = yForce / boatMass;

      state.physics.vy += yAccel * dt;
      state.physics.y += state.physics.vy * dt;
  } else {
      state.physics.vy *= Math.exp(-dt * 10.0);
  }

  if (!state.grounded) {
      const dropDistance = targetY - state.physics.y;
      const fallSpeed    = Math.abs(state.physics.vy);
      const isHardImpact = dropDistance > 0.08 && state.physics.vy < -0.6;
      const isSlamming   = dropDistance > 0.20 && state.physics.vy < -1.5;
      const isReentry    = state.prevAirborne && !state.airborne && fallSpeed > 0.8;

      if (isHardImpact || isSlamming || isReentry) {
        const timeSinceLast = state.simTime - lastSplashTime;
        if (timeSinceLast >= 0.15 && emitSprayFn) {
          lastSplashTime = state.simTime;

          const impact = Math.min(8, fallSpeed + dropDistance * 2);
          const slammingForce = impact * 2800;
          state.physics.vy -= (slammingForce / boatMass) * dt * 2;

          b2l(0, 0.5, 3.9, _bowL);
          const waveLocalH = waveHeightEnvelope(_bowL.x, _bowL.z);
          const sprayScale = Math.max(0.6, waveSprayFactor(waveLocalH));

          const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
          const rightX = Math.cos(state.heading), rightZ = -Math.sin(state.heading);

          impactAccum += (25 + impact * 18) * sprayScale;
          const n = Math.min(180, Math.floor(impactAccum));
          impactAccum -= n;

          for (let i = 0; i < n; i++) {
            const side  = Math.random() < 0.5 ? -1 : 1;
            const along = 4.5 - Math.random() * 5.0;
            const lat   = side * (0.20 + Math.random() * 1.6);
            const px = bx + fwdX * along + rightX * lat;
            const pz = bz + fwdZ * along + rightZ * lat;
            const py = waveHAt(px, pz) + 0.10;

            const out  = (1.8 + Math.random() * 3.0) * (0.6 + impact * 0.3);
            const up   = (1.7 + Math.random() * 2.5) * (0.45 + impact * 0.30);
            const back = Math.abs(state.speed) * (0.15 + Math.random() * 0.25);

            emitSprayFn(px, py, pz,
              rightX * side * out + (Math.random() - 0.5) * 1.5 - fwdX * back,
              up,
              rightZ * side * out + (Math.random() - 0.5) * 1.5 - fwdZ * back,
              {
                size: (0.20 + Math.random() * 0.28) * (0.7 + impact * 0.08),
                life: 0.7 + Math.random() * 0.7 + impact * 0.08
              }
            );
          }

          if (isSlamming || isReentry) {
            const jetCount = Math.min(60, Math.floor(15 + impact * 10));
            for (let i = 0; i < jetCount; i++) {
              const along = 3.4 + Math.random() * 1.5;
              const lat   = (Math.random() - 0.5) * 1.0;
              const px = bx + fwdX * along + rightX * lat;
              const pz = bz + fwdZ * along + rightZ * lat;
              const py = waveHAt(px, pz) + 0.15;
              const up = 2.8 + Math.random() * (2.8 + impact * 1.6);
              const out = (Math.random() - 0.5) * 1.5;
              emitSprayFn(px, py, pz,
                rightX * out + (Math.random() - 0.5) * 0.8,
                up,
                rightZ * out + (Math.random() - 0.5) * 0.8,
                {
                  size: (0.24 + Math.random() * 0.32) * (0.8 + impact * 0.10),
                  life: 0.9 + Math.random() * 0.9 + impact * 0.12
                }
              );
            }
          }

          if (impact > 1.0 && playSplashFn) playSplashFn(impact * 0.5 * sprayScale);

          const foamN = Math.floor(6 + impact * 3);
          for (let i = 0; i < foamN; i++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = Math.random() * 2.5;
            const fx = bx + Math.cos(ang) * dist;
            const fz = bz + Math.sin(ang) * dist;
            emitSprayFn(fx, waveHAt(fx, fz) + 0.08, fz,
              (Math.random() - 0.5) * 0.4, 0.15, (Math.random() - 0.5) * 0.4,
              { size: 0.14 + Math.random() * 0.12, life: 0.6 + Math.random() * 0.4 }
            );
          }
        }
      } else {
        if (impactAccum > 0) impactAccum = Math.max(0, impactAccum - dt * 30);
      }
  }

  // ============================================================
  //  Aplicação das rotações — molas suaves
  // ============================================================
  const pitchK = 55000 * massFactor;
  const pitchD = 2 * Math.sqrt(pitchK * pitchMOI) * 0.9;
  const pitchError = targetPitch - state.physics.pitch;
  const pitchTorque = pitchError * pitchK - state.physics.pitchVel * pitchD;
  state.physics.pitchVel += (pitchTorque / pitchMOI) * dt;
  state.physics.pitch += state.physics.pitchVel * dt;

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