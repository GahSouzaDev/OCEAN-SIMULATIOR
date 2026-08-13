import * as THREE from 'three';
import { state, b2lFull } from '../state.js';
import { waveHAt, waveGradient, waveWaterVelocity } from '../ocean/waves.js';
import { CONFIG } from '../config.js';

const _motorWorld = new THREE.Vector3();

export function updateHullPhysics(dt, currentBoat, callbacks = {}) {
  const keys = state.keys;
  const throttleInc = (keys.KeyW || keys.ArrowUp) ? 1 : 0;
  const throttleDec = (keys.KeyS || keys.ArrowDown) ? 1 : 0;
  if (throttleInc) state.throttleTarget = Math.min(1, state.throttleTarget + dt * 0.8);
  if (throttleDec) state.throttleTarget = Math.max(0, state.throttleTarget - dt * 0.8);
  state.throttle = THREE.MathUtils.lerp(state.throttle, state.throttleTarget, dt * 5);
  document.getElementById('throttle-fill').style.height = (state.throttle * 100) + '%';

  const motorLocal = currentBoat.motorPos || new THREE.Vector3(0, -0.7, -4.2);
  b2lFull(motorLocal.x, motorLocal.y, motorLocal.z, _motorWorld);
  const motorSub = waveHAt(_motorWorld.x, _motorWorld.z) - _motorWorld.y;
  const nowInWater = motorSub >= 0;

  if (!state.motorInWater && nowInWater && callbacks.onReentry) {
    const impact = Math.max(0.5, Math.abs(state.physics.vy) * 0.5 + Math.abs(state.speed) * 0.2);
    callbacks.onReentry(impact, _motorWorld);
  }
  state.motorInWater = nowInWater;
  state.prevMotorSub = motorSub;

  if (state.reentryCooldown > 0) state.reentryCooldown -= dt;

  // --- CÁLCULO DAS FORÇAS DA ONDA ---
  const bx = state.boatRoot.position.x;
  const bz = state.boatRoot.position.z;

  // 1. Gradiente da superfície
  const grad = waveGradient(bx, bz);
  const gradMag = Math.sqrt(grad.dx * grad.dx + grad.dz * grad.dz);

  // 2. Velocidade da água (corrente)
  const waterVel = waveWaterVelocity(bx, bz, state.wavePhase);
  const waterSpeed = Math.sqrt(waterVel.vx * waterVel.vx + waterVel.vz * waterVel.vz);

  // 3. Aceleração devido à inclinação (gravidade tangencial)
  let accSlopeX = 0, accSlopeZ = 0;
  if (gradMag > 0.001) {
    const slopeAccel = state.slopeGravity * state.slopeFactor * gradMag;
    const normX = -grad.dx / gradMag;
    const normZ = -grad.dz / gradMag;
    accSlopeX = slopeAccel * normX;
    accSlopeZ = slopeAccel * normZ;
  }

  // 4. Arrasto da corrente (diferença entre velocidade do barco e da água)
  const boatVx = state.speed * Math.sin(state.heading) + state.sideSpeed * Math.cos(state.heading);
  const boatVz = state.speed * Math.cos(state.heading) - state.sideSpeed * Math.sin(state.heading);

  const dvx = boatVx - waterVel.vx;
  const dvz = boatVz - waterVel.vz;
  const dragAccX = -state.waveDragCoeff * dvx;
  const dragAccZ = -state.waveDragCoeff * dvz;

  // Aceleração total adicional
  const extraAccX = accSlopeX + dragAccX;
  const extraAccZ = accSlopeZ + dragAccZ;

  // Projetar nas direções longitudinal e lateral
  const fwdX = Math.sin(state.heading);
  const fwdZ = Math.cos(state.heading);
  const rightX = fwdZ;
  const rightZ = -fwdX;

  const accLong = extraAccX * fwdX + extraAccZ * fwdZ;
  const accLat  = extraAccX * rightX + extraAccZ * rightZ;

  // ---- FIM DAS FORÇAS DA ONDA ----

  // Controle do motor
  let effectiveThrottle = state.throttle;
  let canTurn = true;
  if (!state.motorInWater) {
    effectiveThrottle = state.throttle * 0.05;
    canTurn = false;
  }

  // Entrada do leme
  const rudIn = (keys.KeyA || keys.ArrowLeft) ? 1 : (keys.KeyD || keys.ArrowRight) ? -1 : 0;
  if (canTurn) {
    state.rudder += rudIn * dt * 1.8;
    state.rudder = THREE.MathUtils.clamp(state.rudder, -1, 1);
  } else {
    // mantém posição fora d'água (já corrigido)
  }

  // Velocidade máxima
  const maxSpd = currentBoat.maxSpeed || 12;
  const motorAcc = effectiveThrottle * 6.0;

  // Atualizar velocidade longitudinal (motor + aceleração da onda + atrito)
  const friction = state.motorInWater ? 0.15 : 0.01;
  const totalAccLong = motorAcc + accLong;
  state.speed += (totalAccLong - friction * state.speed) * dt;
  state.speed = THREE.MathUtils.clamp(state.speed, -maxSpd * 0.3, maxSpd);

  // Atualizar velocidade lateral (deriva)
  if (!state.sideSpeed) state.sideSpeed = 0;
  const sideFriction = 0.25;
  state.sideSpeed += (accLat - sideFriction * state.sideSpeed) * dt;
  state.sideSpeed = THREE.MathUtils.clamp(state.sideSpeed, -3, 3);

  // Propeller visual
  if (currentBoat.propeller) {
    currentBoat.propeller.rotation.z += state.throttle * 50 * dt;
  }

  // Virada
  const spdN = Math.min(1, Math.abs(state.speed) / 6);
  const turnSpeed = state.rudder * (0.3 + 0.7 * spdN) * 0.95 * (state.speed >= 0 ? 1 : -1);
  state.heading += turnSpeed * dt;

  // Movimento (inclui deriva)
  const moveX = (Math.sin(state.heading) * state.speed + Math.cos(state.heading) * state.sideSpeed) * dt;
  const moveZ = (Math.cos(state.heading) * state.speed - Math.sin(state.heading) * state.sideSpeed) * dt;
  state.boatRoot.position.x += moveX;
  state.boatRoot.position.z += moveZ;

  // Vento (arrasto adicional)
  const wp = state.windMul * 0.14 * dt;
  state.boatRoot.position.x += Math.cos(CONFIG.wind.direction) * wp;
  state.boatRoot.position.z += Math.sin(CONFIG.wind.direction) * wp;

  return spdN;
}