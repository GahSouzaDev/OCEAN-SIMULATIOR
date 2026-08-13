import * as THREE from 'three';
import { state } from './state.js';
import { CONFIG, WEATHERS } from './config.js';
import { waveHAt } from './ocean/waves.js';

export let lightningGroup;
export let lightningBolts = [];
let nextFlash = 6;
export let rainGeo, rainMesh;
const RAIN_COUNT = 2000;
const rainVel = new Float32Array(RAIN_COUNT * 3);

export function initWeather() {
  lightningGroup = new THREE.Group();
  state.scene.add(lightningGroup);

  rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(RAIN_COUNT * 3);
  for (let i = 0; i < RAIN_COUNT; i++) {
    rainPos[i * 3]     = (Math.random() - 0.5) * 200;
    rainPos[i * 3 + 1] = Math.random() * 100 + 20;
    rainPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
    rainVel[i * 3]     = 0;
    rainVel[i * 3 + 1] = -15 - Math.random() * 5;
    rainVel[i * 3 + 2] = 0;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3).setUsage(THREE.DynamicDrawUsage));
  const rainMat2 = new THREE.PointsMaterial({
    color: 0xaaccff, size: 0.15, transparent: true, opacity: 0.6
  });
  rainMesh = new THREE.Points(rainGeo, rainMat2);
  rainMesh.visible = false;
  state.scene.add(rainMesh);
}

function createLightningBolt(start, end, segments = 8) {
  const points = [];
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length(); dir.normalize();
  const perp1 = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
  const perp2 = new THREE.Vector3().crossVectors(dir, perp1);
  points.push(start.clone());
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const next = start.clone().add(dir.clone().multiplyScalar(t * length));
    next.add(perp1.clone().multiplyScalar((Math.random() * 2 - 1) * 1.5));
    next.add(perp2.clone().multiplyScalar((Math.random() * 2 - 1) * 1.5));
    points.push(next);
  }
  points.push(end.clone());
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
  return new THREE.Line(geo, mat);
}

export function spawnLightning(bx, bz) {
  const start = new THREE.Vector3(
    bx + (Math.random() - 0.5) * 100, 80 + Math.random() * 40,
    bz + (Math.random() - 0.5) * 100
  );
  const end = new THREE.Vector3(
    start.x + (Math.random() - 0.5) * 20,
    waveHAt(start.x, start.z),
    start.z + (Math.random() - 0.5) * 20
  );
  const bolt = createLightningBolt(start, end, 12);
  const light = new THREE.PointLight(0xffffff, 3, 200);
  light.position.copy(start);
  lightningGroup.add(bolt); lightningGroup.add(light);
  lightningBolts.push({ bolt, light, life: 0, maxLife: 0.3 });
  state.flash = 1;
}

export function updateLightning(dt) {
  for (let i = lightningBolts.length - 1; i >= 0; i--) {
    const lb = lightningBolts[i];
    lb.life += dt;
    if (lb.life >= lb.maxLife) {
      lightningGroup.remove(lb.bolt); lightningGroup.remove(lb.light);
      lightningBolts.splice(i, 1);
    } else {
      const fade = 1 - lb.life / lb.maxLife;
      lb.bolt.material.opacity = fade;
      lb.light.intensity = 3 * fade;
    }
  }
}

export function maybeSpawnLightning(dt, thunderFn) {
  if (CONFIG.weather.mode !== 'STORM') return;
  nextFlash -= dt;
  if (nextFlash <= 0) {
    spawnLightning(state.boatRoot.position.x, state.boatRoot.position.z);
    nextFlash = 5 + Math.random() * 9;
    if (thunderFn) thunderFn();
  }
}

export function updateRain(dt) {
  const active = (CONFIG.weather.mode === 'RAIN' || CONFIG.weather.mode === 'STORM');
  rainMesh.visible = active;
  if (!active) return;
  const pos = rainGeo.attributes.position.array;
  const bx = state.boatRoot.position.x, bz = state.boatRoot.position.z;
  for (let i = 0; i < RAIN_COUNT; i++) {
    pos[i * 3]     += rainVel[i * 3]     * dt;
    pos[i * 3 + 1] += rainVel[i * 3 + 1] * dt;
    pos[i * 3 + 2] += rainVel[i * 3 + 2] * dt;
    if (pos[i * 3 + 1] < waveHAt(pos[i * 3], pos[i * 3 + 2])) {
      pos[i * 3]     = bx + (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = Math.random() * 100 + 20;
      pos[i * 3 + 2] = bz + (Math.random() - 0.5) * 200;
    }
  }
  rainGeo.attributes.position.needsUpdate = true;
}

export function setWeather(name) {
  CONFIG.weather.mode = name;
  const w = WEATHERS[name];
  state.waveHMul = w.wave; state.windMul = w.wind; state.foamMul = w.foam;
  document.getElementById('sld-amp').value = w.wave;
  document.getElementById('lbl-amp').textContent = w.wave.toFixed(1) + 'x';
  document.getElementById('sld-wind').value = w.wind;
  document.getElementById('lbl-wind').textContent = w.wind.toFixed(1) + 'x';
  document.getElementById('sld-foam').value = w.foam;
  document.getElementById('lbl-foam').textContent = w.foam.toFixed(1) + 'x';
  document.querySelectorAll('.hbtn.weather')
    .forEach(b => b.classList.toggle('active', b.dataset.weather === name));
}