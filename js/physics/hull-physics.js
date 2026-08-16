// js/physics/hull-physics.js — RÉ + freio + trava de âncora + aviso de voz
import * as THREE from 'three';
import { state, b2lFull } from '../state.js';
import { waveHAt, waveGradient, waveWaterVelocity } from '../ocean/waves.js';
import { CONFIG } from '../config.js';
import { isAnchored, tryThrottleWarn } from './anchor.js';
const _motorWorld = new THREE.Vector3();

function ensureZeroLine() {
  if (document.getElementById('throttle-zero')) return;
  const bar = document.getElementById('throttle-bar');
  if (!bar) return;
  const z = document.createElement('div');
  z.id = 'throttle-zero';
  z.style.cssText = 'position:absolute;left:0;right:0;bottom:20%;height:1px;background:rgba(111,228,255,0.6);z-index:2;';
  bar.appendChild(z);
}

export function updateHullPhysics(dt, currentBoat, callbacks = {}) {
  const keys = state.keys;
  ensureZeroLine();
  const throttleInc = (keys.KeyW || keys.ArrowUp) ? 1 : 0;
  const throttleDec = (keys.KeyS || keys.ArrowDown) ? 1 : 0;
  const throttleResponseSpeed = currentBoat.throttleResponseSpeed || 0.8;
  const throttleDecaySpeed = currentBoat.throttleDecaySpeed || 1.2;
  const anchored = isAnchored();

  if (throttleInc) {
    if (anchored) tryThrottleWarn();               // 🔊 voz: "içe a âncora"
    else state.throttleTarget = Math.min(1, state.throttleTarget + dt * throttleResponseSpeed);
  }
  if (throttleDec) {
    // freia até zero; com a barra zerada, entra em RÉ até 1/4
    state.throttleTarget = Math.max(-0.25, state.throttleTarget - dt * throttleDecaySpeed);
  } else if (state.throttleTarget < 0) {
    state.throttleTarget = Math.min(0, state.throttleTarget + dt * throttleDecaySpeed * 2.5);
  }
  if (anchored) state.throttleTarget = Math.min(state.throttleTarget, 0); // fundeado: motor cortado

  const engineInertia = currentBoat.engineInertia || 2.0;
  const lerpFactor = 1 - Math.exp(-dt * (1.0 / engineInertia) * 3.0);
  state.throttle += (state.throttleTarget - state.throttle) * lerpFactor;

  const throttleUI = document.getElementById('throttle-fill');
  if (throttleUI) {
    const th = state.throttle;
    if (th >= 0) { throttleUI.style.bottom = '20%'; throttleUI.style.height = (th * 80) + '%'; }
    else { const h = -th * 80; throttleUI.style.bottom = (20 - h) + '%'; throttleUI.style.height = h + '%'; }
  }

  const motorLocal = currentBoat.motorPos || new THREE.Vector3(0, -0.7, -4.2);
  b2lFull(motorLocal.x, motorLocal.y, motorLocal.z, _motorWorld);
  const motorSub = waveHAt(_motorWorld.x, _motorWorld.z) - _motorWorld.y;
  const nowInWater = motorSub >= 0;
  if (!state.motorInWater && nowInWater) {
    state.speed *= Math.max(0.6, 1.0 - Math.abs(state.physics.vy) * 0.15);
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
  const bx = state.boatRoot.position.x, bz = state.boatRoot.position.z;
  const grad = waveGradient(bx, bz);
  const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
  const rightX = Math.cos(state.heading), rightZ = -Math.sin(state.heading);
  const vx = state.speed * fwdX + state.sideSpeed * rightX;
  const vz = state.speed * fwdZ + state.sideSpeed * rightZ;
  const speedMag = Math.sqrt(vx * vx + vz * vz);
  const dragLinear = currentBoat.dragLinear || state.waveDragCoeff;
  const dragQuad = currentBoat.dragQuad || state.waveDragQuadratic;
  const dragForceMag = dragLinear + dragQuad * speedMag;
  const forceDragX = -dragForceMag * vx, forceDragZ = -dragForceMag * vz;
  const maxThrust = currentBoat.maxThrust || 8000;
  let effectiveThrottle = state.throttle;
  let canTurn = true;
  if (!state.motorInWater) { effectiveThrottle *= 0.05; canTurn = false; }
  if (anchored) effectiveThrottle = 0;
  const motorForce = effectiveThrottle * maxThrust;
  const forceMotorX = motorForce * fwdX, forceMotorZ = motorForce * fwdZ;
  const motorDominance = effectiveThrottle * effectiveThrottle;
  const slopeEffectiveness = 1.0 - motorDominance * 0.75;
  const forceSlopeX = -gravity * grad.dx * boatMass * slopeEffectiveness;
  const forceSlopeZ = -gravity * grad.dz * boatMass * slopeEffectiveness;
  const climbDot = -(grad.dx * fwdX + grad.dz * fwdZ);
  const climbBoostStrength = Math.max(0, climbDot) * motorDominance * maxThrust * 0.6;
  const forceClimbX = climbBoostStrength * fwdX, forceClimbZ = climbBoostStrength * fwdZ;
  const wVel = waveWaterVelocity(bx, bz, state.wavePhase);
  const wavePushFactor = 40;
  const forceWavePushX = wVel.vx * wavePushFactor * (1.0 - motorDominance * 0.7);
  const forceWavePushZ = wVel.vz * wavePushFactor * (1.0 - motorDominance * 0.7);
  const totalFx = forceSlopeX + forceDragX + forceMotorX + forceClimbX + forceWavePushX;
  const totalFz = forceSlopeZ + forceDragZ + forceMotorZ + forceClimbZ + forceWavePushZ;
  state.speed += (totalFx / boatMass * fwdX + totalFz / boatMass * fwdZ) * dt;
  state.sideSpeed += (totalFx / boatMass * rightX + totalFz / boatMass * rightZ) * dt;
  state.speed *= Math.exp(-(currentBoat.frictionLong || 0.08) * dt);
  state.sideSpeed *= Math.exp(-(currentBoat.frictionLat || 3.5) * dt);
  const maxSpd = currentBoat.maxSpeed || 18;
  state.speed = THREE.MathUtils.clamp(state.speed, -maxSpd * 0.3, maxSpd);
  state.sideSpeed = THREE.MathUtils.clamp(state.sideSpeed, -2, 2);

  const rudIn = (keys.KeyA || keys.ArrowLeft) ? 1 : (keys.KeyD || keys.ArrowRight) ? -1 : 0;
  if (canTurn && rudIn !== 0) {
    state.rudder += rudIn * (currentBoat.rudderSpeed || 3.5) * dt;
    state.rudder = THREE.MathUtils.clamp(state.rudder, -1, 1);
  }
  const yawMOI = currentBoat.yawMOI || 18000;
  const minTurnRadius = currentBoat.minTurnRadius || 12;
  const spdN = Math.min(1, Math.abs(state.speed) / 8);
  const rudderEffectiveness = state.rudder * (0.2 + 0.8 * spdN) * (state.speed >= 0 ? 1 : -1);
  const absSpeed = Math.abs(state.speed);
  let targetYawVel = 0;
  if (absSpeed > 0.5) {
    const effectiveRadius = minTurnRadius + (absSpeed * absSpeed) * (currentBoat.radiusGrowth || 1.5) * 0.05;
    targetYawVel = (absSpeed / effectiveRadius) * rudderEffectiveness;
  }
  const responseTime = (yawMOI / 10000) * 0.8 + 0.4;
  state.physics.yawVel += (targetYawVel - state.physics.yawVel) * (1 - Math.exp(-(dt * (currentBoat.turnResponse || 3.0)) / responseTime));
  state.physics.yawVel *= Math.exp(-(currentBoat.waterDragRot || 0.4) * dt * (1 - Math.abs(state.rudder)));
  if (state.airborne) state.physics.yawVel *= 0.98;
  state.heading += state.physics.yawVel * dt;
  state.boatRoot.position.x += (fwdX * state.speed + rightX * state.sideSpeed) * dt;
  state.boatRoot.position.z += (fwdZ * state.speed + rightZ * state.sideSpeed) * dt;
  const wp = state.windMul * 0.14 * dt;
  state.boatRoot.position.x += Math.cos(CONFIG.wind.direction) * wp;
  state.boatRoot.position.z += Math.sin(CONFIG.wind.direction) * wp;
  if (currentBoat.propeller) currentBoat.propeller.rotation.z += state.throttle * 50 * dt;
  return spdN;
}