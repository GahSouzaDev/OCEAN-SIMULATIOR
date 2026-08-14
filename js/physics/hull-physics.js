import * as THREE from 'three';
import { state, b2lFull } from '../state.js';
import { waveHAt, waveGradient, waveWaterVelocity } from '../ocean/waves.js';
import { CONFIG } from '../config.js';

const _motorWorld = new THREE.Vector3();

export function updateHullPhysics(dt, currentBoat, callbacks = {}) {
  const keys = state.keys;
  
  const throttleInc = (keys.KeyW || keys.ArrowUp) ? 1 : 0;
  const throttleDec = (keys.KeyS || keys.ArrowDown) ? 1 : 0;
  
  const throttleResponseSpeed = currentBoat.throttleResponseSpeed || 0.8;
  const throttleDecaySpeed = currentBoat.throttleDecaySpeed || 1.2;
  
  if (throttleInc) {
    state.throttleTarget = Math.min(1, state.throttleTarget + dt * throttleResponseSpeed);
  }
  if (throttleDec) {
    state.throttleTarget = Math.max(0, state.throttleTarget - dt * throttleDecaySpeed);
  }
  
  const engineInertia = currentBoat.engineInertia || 2.0;
  const engineResponseRate = 1.0 / engineInertia;
  const lerpFactor = 1 - Math.exp(-dt * engineResponseRate * 3.0);
  state.throttle += (state.throttleTarget - state.throttle) * lerpFactor;
  
  const throttleUI = document.getElementById('throttle-fill');
  if (throttleUI) throttleUI.style.height = (state.throttle * 100) + '%';

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

  const boatMass = currentBoat.mass || 2500;
  const gravity = 9.81;
  
  const bx = state.boatRoot.position.x;
  const bz = state.boatRoot.position.z;

  const grad = waveGradient(bx, bz);
  
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

  // ==========================================================
  // 🎯 SISTEMA DE DOMINÂNCIA DO MOTOR SOBRE AS ONDAS 🎯
  // ==========================================================
  // Quando o motor está forte, ele "vence" a gravidade da onda
  // evitando que o barco deslize para trás ao subir ondas
  
  // Quanto o motor domina (0 = fraco, 1 = potência total)
  const motorDominance = effectiveThrottle * effectiveThrottle;
  
  // Reduz o efeito da inclinação da onda quando motor forte
  // Com throttle=0: 100% do efeito | throttle=1: apenas 25% do efeito
  const slopeEffectiveness = 1.0 - motorDominance * 0.75;
  
  const forceSlopeX = -gravity * grad.dx * boatMass * slopeEffectiveness;
  const forceSlopeZ = -gravity * grad.dz * boatMass * slopeEffectiveness;
  
  // 🎯 CLIMBING BOOST: força extra ao subir ondas com motor
  // Detecta se o barco está "subindo" a onda (gradiente contra direção)
  const climbDot = -(grad.dx * fwdX + grad.dz * fwdZ); // positivo = subindo
  const climbBoostStrength = Math.max(0, climbDot) * motorDominance * maxThrust * 0.6;
  const forceClimbX = climbBoostStrength * fwdX;
  const forceClimbZ = climbBoostStrength * fwdZ;

  // 🎯 WAVE PUSH REDUZIDO (era 120, agora 40)
  // Onda empurra menos o barco - motor domina
  const wVel = waveWaterVelocity(bx, bz, state.wavePhase);
  const wavePushFactor = 40;
  const forceWavePushX = wVel.vx * wavePushFactor * (1.0 - motorDominance * 0.7);
  const forceWavePushZ = wVel.vz * wavePushFactor * (1.0 - motorDominance * 0.7);

  const totalFx = forceSlopeX + forceDragX + forceMotorX + forceClimbX + forceWavePushX;
  const totalFz = forceSlopeZ + forceDragZ + forceMotorZ + forceClimbZ + forceWavePushZ;

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

  const rudIn = (keys.KeyA || keys.ArrowLeft) ? 1 : (keys.KeyD || keys.ArrowRight) ? -1 : 0;
  
  if (canTurn && rudIn !== 0) {
    const rudderSpeed = currentBoat.rudderSpeed || 3.5;
    state.rudder += rudIn * rudderSpeed * dt;
    state.rudder = THREE.MathUtils.clamp(state.rudder, -1, 1);
  }

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

  const moveX = (Math.sin(state.heading) * state.speed + Math.cos(state.heading) * state.sideSpeed) * dt;
  const moveZ = (Math.cos(state.heading) * state.speed - Math.sin(state.heading) * state.sideSpeed) * dt;
  
  state.boatRoot.position.x += moveX;
  state.boatRoot.position.z += moveZ;

  const wp = state.windMul * 0.14 * dt;
  state.boatRoot.position.x += Math.cos(CONFIG.wind.direction) * wp;
  state.boatRoot.position.z += Math.sin(CONFIG.wind.direction) * wp;

  if (currentBoat.propeller) {
    currentBoat.propeller.rotation.z += state.throttle * 50 * dt;
  }

  return spdN;
}