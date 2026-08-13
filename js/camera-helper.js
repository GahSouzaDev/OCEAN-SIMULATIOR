import * as THREE from 'three';
import { state } from './state.js';
import { CAM_NAMES } from './config.js';

const camPos = new THREE.Vector3(0, 5, -12);
const camTgt = new THREE.Vector3();

export function updateCamLabel() {
  const btn = document.getElementById('btn-cam-cycle');
  if (btn) btn.textContent = CAM_NAMES[state.camMode] + ' CAMERA';
}

export function cycleCamera() {
  state.camMode = (state.camMode + 1) % CAM_NAMES.length;
  updateCamLabel();
}

export function updateCamera(dt) {
  const bp = state.boatRoot.position;
  const k = 1 - Math.exp(-dt * 4);

  if (state.camMode === 0) {
    state.orbitYaw = Math.PI;
    const fx = Math.sin(state.heading), fz = Math.cos(state.heading);
    camPos.lerp(new THREE.Vector3(
      bp.x - fx * state.chaseDist,
      bp.y + 3.4 + state.chaseDist * 0.18,
      bp.z - fz * state.chaseDist
    ), k);
    camTgt.lerp(new THREE.Vector3(bp.x, bp.y + 1.3, bp.z), k);
  } else if (state.camMode === 1) {
    const cp = Math.cos(state.orbitPitch), r = state.orbitDist;
    camPos.lerp(new THREE.Vector3(
      bp.x + Math.sin(state.orbitYaw) * cp * r,
      bp.y + 1.5 + Math.sin(state.orbitPitch) * r,
      bp.z + Math.cos(state.orbitYaw) * cp * r
    ), k);
    camTgt.lerp(new THREE.Vector3(bp.x, bp.y + 1, bp.z), k);
  } else if (state.camMode === 2) {
    state.orbitYaw += dt * 0.12;
    const cp = Math.cos(state.orbitPitch), r = state.orbitDist;
    camPos.lerp(new THREE.Vector3(
      bp.x + Math.sin(state.orbitYaw) * cp * r,
      bp.y + 1.5 + Math.sin(state.orbitPitch) * r,
      bp.z + Math.cos(state.orbitYaw) * cp * r
    ), k);
    camTgt.lerp(new THREE.Vector3(bp.x, bp.y + 1, bp.z), k);
  } else if (state.camMode === 3) {
    camPos.lerp(new THREE.Vector3(bp.x, bp.y + 50, bp.z), k);
    camTgt.lerp(new THREE.Vector3(bp.x, bp.y, bp.z), k);
  } else if (state.camMode === 4) {
    camPos.lerp(new THREE.Vector3(bp.x, bp.y - 3, bp.z - 8), k);
    camTgt.lerp(new THREE.Vector3(bp.x, bp.y, bp.z), k);
  }
  state.camera.position.copy(camPos);
  state.camera.lookAt(camTgt);
}