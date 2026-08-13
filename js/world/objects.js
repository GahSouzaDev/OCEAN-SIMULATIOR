import * as THREE from 'three';
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { waveHAt, waveNormalAt } from '../ocean/waves.js';

export let clouds = null, birds = null, buoyGroup = null, distantShip = null;

export function initObjects() {
  clouds = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const s = 30 + Math.random() * 70;
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false
    });
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.4), cloudMat);
    cloud.position.set(
      (Math.random() - 0.5) * 1400, 160 + Math.random() * 90, (Math.random() - 0.5) * 1400
    );
    cloud.rotation.x = -Math.PI / 2;
    cloud.userData.speed = 1.5 + Math.random() * 2.5;
    clouds.add(cloud);
  }
  state.scene.add(clouds);

  birds = new THREE.Group();
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const shape = new THREE.Shape();
    shape.moveTo(-0.6, 0); shape.lineTo(0, 0.25);
    shape.lineTo(0.6, 0); shape.lineTo(0, -0.05); shape.lineTo(-0.6, 0);
    const bird = new THREE.Mesh(new THREE.ShapeGeometry(shape), birdMat);
    bird.position.set(
      (Math.random() - 0.5) * 120 - 40, 22 + Math.random() * 10, (Math.random() - 0.5) * 120 - 60
    );
    bird.userData.phase = Math.random() * Math.PI * 2;
    bird.userData.radius = 30 + Math.random() * 40;
    birds.add(bird);
  }
  state.scene.add(birds);

  buoyGroup = new THREE.Group();
  const buoyMat = new THREE.MeshStandardMaterial({ color: 0xff8c1a, roughness: 0.6 });
  buoyGroup.add(new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 10), buoyMat));
  const buoyTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  buoyTop.position.y = 0.65; buoyGroup.add(buoyTop);
  buoyGroup.position.set(28, 0, -18);
  state.scene.add(buoyGroup);

  distantShip = new THREE.Group();
  const shipMat = new THREE.MeshBasicMaterial({ color: 0x1c1f22 });
  distantShip.add(new THREE.Mesh(new THREE.BoxGeometry(14, 6, 2.4), shipMat));
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 4, 8), shipMat);
  stack.position.set(-2, 5, 0); distantShip.add(stack);
  distantShip.position.set(-900, 4, -650); distantShip.scale.set(1.4, 1.4, 1.4);
  state.scene.add(distantShip);
}

export function updateObjects(dt) {
  clouds.children.forEach(c => {
    c.position.x += Math.cos(CONFIG.wind.direction) * state.windMul * c.userData.speed * dt * 4;
    c.position.z += Math.sin(CONFIG.wind.direction) * state.windMul * c.userData.speed * dt * 4;
    const rel = new THREE.Vector2(
      c.position.x - state.boatRoot.position.x,
      c.position.z - state.boatRoot.position.z
    );
    if (rel.length() > 900) {
      c.position.x = state.boatRoot.position.x - Math.cos(CONFIG.wind.direction) * 400;
      c.position.z = state.boatRoot.position.z - Math.sin(CONFIG.wind.direction) * 400;
    }
  });
  birds.children.forEach(b => {
    b.userData.phase += dt * 0.4;
    b.position.x = state.boatRoot.position.x + Math.cos(b.userData.phase) * b.userData.radius;
    b.position.z = state.boatRoot.position.z + Math.sin(b.userData.phase) * b.userData.radius - 40;
    b.position.y = 20 + Math.sin(state.simTime * 2 + b.userData.phase) * 2.2;
  });
  const bW = waveHAt(buoyGroup.position.x, buoyGroup.position.z);
  const bN = waveNormalAt(buoyGroup.position.x, buoyGroup.position.z);
  buoyGroup.position.y = bW + 0.35;
  buoyGroup.quaternion.slerp(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), bN), 0.05
  );
  distantShip.position.x += 0.6 * dt;
}