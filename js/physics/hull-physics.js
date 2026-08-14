import * as THREE from 'three';
import { state, b2lFull } from '../state.js';
import { waveHAt, waveGradient, waveWaterVelocity } from '../ocean/waves.js';
import { CONFIG } from '../config.js';

const _motorWorld = new THREE.Vector3();

export function updateHullPhysics(dt, currentBoat, callbacks = {}) {
  const keys = state.keys;
  
  // ==========================================================
  // 🎯 SISTEMA DE ACELERADOR COM INÉRCIA DO MOTOR 🎯
  // ==========================================================
  // Similar ao sistema de giro:
  // - throttleResponseSpeed: quão rápido o acelerador vai de 0 a 100%
  // - engineInertia: tempo de resposta do motor (turbo lag, inércia)
  // - throttleDecaySpeed: quão rápido o acelerador volta (pode ser diferente)
  // ==========================================================
  
  const throttleInc = (keys.KeyW || keys.ArrowUp) ? 1 : 0;
  const throttleDec = (keys.KeyS || keys.ArrowDown) ? 1 : 0;
  
  // VELOCIDADE DE RESPOSTA DO ACELERADOR (configurável por barco)
  const throttleResponseSpeed = currentBoat.throttleResponseSpeed || 0.8;
  const throttleDecaySpeed = currentBoat.throttleDecaySpeed || 1.2;
  
  // Atualiza o target baseado no input
  if (throttleInc) {
    state.throttleTarget = Math.min(1, state.throttleTarget + dt * throttleResponseSpeed);
  }
  if (throttleDec) {
    state.throttleTarget = Math.max(0, state.throttleTarget - dt * throttleDecaySpeed);
  }
  
  // INÉRCIA DO MOTOR (engineInertia controla o tempo de resposta)
  // Motor diesel grande (Trawler): inércia alta = turbo lag, resposta lenta
  // Motor pequeno (Pilot): inércia baixa = resposta rápida
  const engineInertia = currentBoat.engineInertia || 2.0; // segundos
  const engineResponseRate = 1.0 / engineInertia;
  
  // Lerp suave baseado na inércia do motor
  const lerpFactor = 1 - Math.exp(-dt * engineResponseRate * 3.0);
  state.throttle += (state.throttleTarget - state.throttle) * lerpFactor;
  
  const throttleUI = document.getElementById('throttle-fill');
  if (throttleUI) throttleUI.style.height = (state.throttle * 100) + '%';

  // --- SUBMERSÃO DO MOTOR ---
  const motorLocal = currentBoat.motorPos || new THREE.Vector3(0, -0.7, -4.2);
  b2lFull(motorLocal.x, motorLocal.y, motorLocal.z, _motorWorld);
  const motorSub = waveHAt(_motorWorld.x, _motorWorld.z) - _motorWorld.y;
  const nowInWater = motorSub >= 0;

  if (!state.motorInWater && nowInWater) {
    const impactSpeedLoss = Math.abs(state.physics.vy) * 0.15;
    state.speed *= Math.max(0.6, 1.0 - impactSpeedLoss);
    
    if (callbacks.onReentry) {
      const impact = Math.max(0.5, Math.abs(state.physics.vy) * 0.5 + Math.abs(state.speed) * 0.2);
      callbacks.onReentry(impact, _motorWorld);
    }
  }
  state.motorInWater = nowInWater;
  state.prevMotorSub = motorSub;
  if (state.reentryCooldown > 0) state.reentryCooldown -= dt;

  // ==========================================================
  // FÍSICA DE TRANSLAÇÃO
  // ==========================================================
  const boatMass = currentBoat.mass || 2500;
  const gravity = 9.81;
  
  const bx = state.boatRoot.position.x;
  const bz = state.boatRoot.position.z;

  const grad = waveGradient(bx, bz);
  const forceSlopeX = -gravity * grad.dx * boatMass;
  const forceSlopeZ = -gravity * grad.dz * boatMass;

  const fwdX = Math.sin(state.heading);
  const fwdZ = Math.cos(state.heading);
  const rightX = Math.cos(state.heading);
  const rightZ = -Math.sin(state.heading);

  const vx = state.speed * fwdX + state.sideSpeed * rightX;
  const vz = state.speed * fwdZ + state.sideSpeed * rightZ;
  const speedMag = Math.sqrt(vx * vx + vz * vz);

  const dragLinear = currentBoat.dragLinear || state.waveDragCoeff;
  const dragQuad = currentBoat.dragQuad || state.waveDragQuadratic;
  const dragForceMag = dragLinear + dragQuad * speedMag;
  
  const forceDragX = -dragForceMag * vx;
  const forceDragZ = -dragForceMag * vz;

  const maxThrust = currentBoat.maxThrust || 8000; 
  let effectiveThrottle = state.throttle;
  let canTurn = true;
  
  if (!state.motorInWater) {
    effectiveThrottle *= 0.05;
    canTurn = false;
  }

  const motorForce = effectiveThrottle * maxThrust;
  const forceMotorX = motorForce * fwdX;
  const forceMotorZ = motorForce * fwdZ;

  const wVel = waveWaterVelocity(bx, bz, state.wavePhase);
  const wavePushFactor = 120; 
  const forceWavePushX = wVel.vx * wavePushFactor;
  const forceWavePushZ = wVel.vz * wavePushFactor;

  const totalFx = forceSlopeX + forceDragX + forceMotorX + forceWavePushX;
  const totalFz = forceSlopeZ + forceDragZ + forceMotorZ + forceWavePushZ;

  const ax = totalFx / boatMass;
  const az = totalFz / boatMass;

  state.speed += (ax * fwdX + az * fwdZ) * dt;
  state.sideSpeed += (ax * rightX + az * rightZ) * dt;

  const frictionLong = currentBoat.frictionLong || 0.08;
  const frictionLat = currentBoat.frictionLat || 3.5; 
  
  state.speed *= Math.exp(-frictionLong * dt);
  state.sideSpeed *= Math.exp(-frictionLat * dt);

  const maxSpd = currentBoat.maxSpeed || 18;
  state.speed = THREE.MathUtils.clamp(state.speed, -maxSpd * 0.3, maxSpd);
  state.sideSpeed = THREE.MathUtils.clamp(state.sideSpeed, -2, 2);

  // ==========================================================
  // CONTROLE DO LEME
  // ==========================================================
  const rudIn = (keys.KeyA || keys.ArrowLeft) ? 1 : (keys.KeyD || keys.ArrowRight) ? -1 : 0;
  
  if (canTurn && rudIn !== 0) {
    const rudderSpeed = currentBoat.rudderSpeed || 3.5;
    state.rudder += rudIn * rudderSpeed * dt;
    state.rudder = THREE.MathUtils.clamp(state.rudder, -1, 1);
  }

  // ==========================================================
  // 🎯 SISTEMA DE RAIO DE GIRO
  // ==========================================================
  const yawMOI = currentBoat.yawMOI || 18000;
  const minTurnRadius = currentBoat.minTurnRadius || 12;
  const spdN = Math.min(1, Math.abs(state.speed) / 8);

  const rudderEffectiveness = state.rudder 
    * (0.2 + 0.8 * spdN) 
    * (state.speed >= 0 ? 1 : -1);

  const absSpeed = Math.abs(state.speed);
  const minSpeedForTurn = 0.5;
  
  let targetYawVel = 0;
  if (absSpeed > minSpeedForTurn) {
    const radiusGrowthFactor = currentBoat.radiusGrowth || 1.5;
    const effectiveRadius = minTurnRadius + (absSpeed * absSpeed) * radiusGrowthFactor * 0.05;
    targetYawVel = (absSpeed / effectiveRadius) * rudderEffectiveness;
  }

  const turnResponseRate = (currentBoat.turnResponse || 3.0);
  const responseTime = (yawMOI / 10000) * 0.8 + 0.4;
  const lerpFactorYaw = 1 - Math.exp(-(dt * turnResponseRate) / responseTime);
  
  state.physics.yawVel += (targetYawVel - state.physics.yawVel) * lerpFactorYaw;

  const waterDrag = currentBoat.waterDragRot || 0.4;
  state.physics.yawVel *= Math.exp(-waterDrag * dt * (1 - Math.abs(state.rudder)));
  
  if (state.airborne) {
    state.physics.yawVel *= 0.98;
  }

  state.heading += state.physics.yawVel * dt;

  // --- MOVIMENTO GLOBAL ---
  const moveX = (Math.sin(state.heading) * state.speed + Math.cos(state.heading) * state.sideSpeed) * dt;
  const moveZ = (Math.cos(state.heading) * state.speed - Math.sin(state.heading) * state.sideSpeed) * dt;
  
  state.boatRoot.position.x += moveX;
  state.boatRoot.position.z += moveZ;

  // --- DERIVA DO VENTO ---
  const wp = state.windMul * 0.14 * dt;
  state.boatRoot.position.x += Math.cos(CONFIG.wind.direction) * wp;
  state.boatRoot.position.z += Math.sin(CONFIG.wind.direction) * wp;

  if (currentBoat.propeller) {
    currentBoat.propeller.rotation.z += state.throttle * 50 * dt;
  }

  return spdN;
}