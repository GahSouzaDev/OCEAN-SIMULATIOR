// Estado global compartilhado (single source of truth).
import * as THREE from 'three';

export const state = {
  simTime: 0,
  wavePhase: 0,
  waveHMul: 1,
  waveSMul: 1,
  windMul: 1,
  foamMul: 1,

  heading: 0,
  speed: 0,
  sideSpeed: 0,
  rudder: 0,
  throttle: 0,
  throttleTarget: 0,
  airborne: false,
  prevAirborne: false,
  prevMotorSub: 1.0,
  motorInWater: true,
  
  // Adicionamos yawVel para a inércia de curva!
  physics: { 
    y: 0, vy: 0, 
    pitch: 0, pitchVel: 0, 
    roll: 0, rollVel: 0,
    yawVel: 0 
  },

  dayF: 1, nightF: 0, flash: 0,
  deckOn: false,

  camMode: 1,
  orbitYaw: Math.PI,
  orbitPitch: 0.38,
  orbitDist: 13,
  chaseDist: 10,

  keys: {},
  dragging: false,
  lastMX: 0,
  lastMY: 0,
  mouseDown2: false,
  rudderDragging: false,

  audioOn: true,
  reentryCooldown: 0,

  waveDragCoeff: 25.0,          
  waveDragQuadratic: 8.0,       
  slopeGravity: 9.81,
  slopeFactor: 1.0,             
  waveNormalBoost: 0.3,

  scene: null, camera: null, renderer: null, composer: null,
  bloomPass: null, fxaaPass: null, boatRoot: null, tilt: null,
  sea: null, sky: null, clock: null
};

export function b2l(lx, ly, lz, out) {
  const c = Math.cos(state.heading), s = Math.sin(state.heading);
  out.set(
    state.boatRoot.position.x + lx * c + lz * s,
    state.boatRoot.position.y + ly,
    state.boatRoot.position.z - lx * s + lz * c
  );
  return out;
}

export function b2lFull(lx, ly, lz, out) {
  const cp = Math.cos(-state.physics.pitch), sp = Math.sin(-state.physics.pitch);
  const y1 = ly * cp - lz * sp;
  const z1 = ly * sp + lz * cp;
  const x1 = lx;
  const cr = Math.cos(state.physics.roll), sr = Math.sin(state.physics.roll);
  const x2 = x1 * cr - y1 * sr;
  const y2 = x1 * sr + y1 * cr;
  const z2 = z1;
  const ch = Math.cos(state.heading), sh = Math.sin(state.heading);
  const x3 = x2 * ch + z2 * sh;
  const z3 = -x2 * sh + z2 * ch;
  out.set(
    state.boatRoot.position.x + x3,
    state.boatRoot.position.y + y2,
    state.boatRoot.position.z + z3
  );
  return out;
}