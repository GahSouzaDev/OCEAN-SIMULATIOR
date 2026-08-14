import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { state } from './state.js';
import { CONFIG } from './config.js';
import { seaUniforms } from './ocean/water-material.js';
import { initClouds, updateClouds, getCloudCoverage } from './clouds.js';

let sunLight, hemi, moonLight, boatSpotLight, boatFillLight;
let sunSprite, moonSprite, starGroup, starMat;
const sunDir2 = new THREE.Vector3(), moonDir = new THREE.Vector3();
const bgCol = new THREE.Color(), tmpC = new THREE.Color(), tmpC2 = new THREE.Color();

const NIGHT_C = new THREE.Color(0x0a0618);
const DAWN_C  = new THREE.Color(0xffd8a0);
const NOON_C  = new THREE.Color(0xa0d0e8);
const DUSK_C  = new THREE.Color(0xff8040);
const DEEP_N  = new THREE.Color(0x000820);
const DEEP_D  = new THREE.Color(0x002850);
const SCAT_N  = new THREE.Color(0x03205a);
const SCAT_D  = new THREE.Color(0x1870c8);

function radialTex(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(s => gr.addColorStop(s[0], s[1]));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function initSky() {
  const sky = new Sky(); sky.scale.setScalar(9000);
  state.scene.add(sky);
  state.sky = sky;
  const su = sky.material.uniforms;
  su['turbidity'].value = 4;
  su['rayleigh'].value = 2.0;
  su['mieCoefficient'].value = 0.006; 
  su['mieDirectionalG'].value = 0.85;

  sunLight = new THREE.DirectionalLight(0xfff0d0, 2.4);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -30; sunLight.shadow.camera.right = 30;
  sunLight.shadow.camera.top = 30; sunLight.shadow.camera.bottom = -30;
  sunLight.shadow.camera.near = 5; sunLight.shadow.camera.far = 420;
  sunLight.shadow.bias = -0.0005;
  state.scene.add(sunLight); state.scene.add(sunLight.target);

  hemi = new THREE.HemisphereLight(0xe0f0ff, 0x4a4838, 0.9);
  state.scene.add(hemi);

  moonLight = new THREE.DirectionalLight(0x8fa8ff, 0);
  state.scene.add(moonLight);

  // 💡 SPOTLIGHT FOCADO APENAS NO BARCO
  boatSpotLight = new THREE.SpotLight(0xffffff, 3.5, 15, Math.PI / 6, 0.5, 1);
  boatSpotLight.position.set(0, 8, 0);
  boatSpotLight.castShadow = false;
  state.scene.add(boatSpotLight);
  state.scene.add(boatSpotLight.target);
  boatSpotLight.target.position.set(0, 0, 0);

  boatFillLight = new THREE.PointLight(0xffffff, 1.8, 6, 2);
  boatFillLight.position.set(0, 2, 0);
  boatFillLight.castShadow = false;
  state.scene.add(boatFillLight);

  const glowTex = radialTex([
    [0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']
  ]);
  sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xfff0c0, blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true
  }));
  sunSprite.scale.set(50, 50, 1); state.scene.add(sunSprite);
  moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xcfd8ff, blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true, opacity: 0
  }));
  moonSprite.scale.set(26, 26, 1); state.scene.add(moonSprite);

  starGroup = new THREE.Group();
  {
    const n = 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = Math.random() * Math.PI * 2, u = Math.random() * 0.92 + 0.06, r = 380;
      pos[i * 3]     = Math.cos(t) * Math.sqrt(1 - u * u) * r;
      pos[i * 3 + 1] = u * r;
      pos[i * 3 + 2] = Math.sin(t) * Math.sqrt(1 - u * u) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starMat = new THREE.PointsMaterial({
      size: 1.6, sizeAttenuation: false, color: 0xffe4c8,
      transparent: true, opacity: 0, depthWrite: false
    });
    starGroup.add(new THREE.Points(g, starMat));
  }
  state.scene.add(starGroup);

  initClouds();
  return { sunLight, hemi, moonLight };
}

function skyColorAtHour(hour, out) {
  hour = ((hour % 24) + 24) % 24;
  if (hour < 5) out.copy(NIGHT_C);
  else if (hour < 7) out.copy(NIGHT_C).lerp(DAWN_C, (hour - 5) / 2);
  else if (hour < 9) out.copy(DAWN_C).lerp(NOON_C, (hour - 7) / 2);
  else if (hour < 17) out.copy(NOON_C);
  else if (hour < 20) {
    const t = (hour - 17) / 3;
    if (t < 0.5) out.copy(NOON_C).lerp(DUSK_C, t * 2);
    else out.copy(DUSK_C).lerp(NIGHT_C, (t - 0.5) * 2);
  } else out.copy(NIGHT_C);
}

function sunColorAtHour(hour, out) {
  hour = ((hour % 24) + 24) % 24;
  const noonWhite = new THREE.Color(0xfff8e8);
  const warmAmber = new THREE.Color(0xff9944);
  if (hour < 5 || hour > 20) out.copy(warmAmber).multiplyScalar(0.0);
  else if (hour < 7) out.copy(warmAmber).lerp(noonWhite, (hour - 5) / 4);
  else if (hour < 16) out.copy(noonWhite);
  else if (hour < 18.5) out.copy(noonWhite).lerp(warmAmber, (hour - 16) / 2.5);
  else if (hour < 20) {
    const t = (hour - 18.5) / 1.5;
    out.copy(warmAmber).multiplyScalar(1.0 - t);
  }
}

function warmthAtHour(hour) {
  hour = ((hour % 24) + 24) % 24;
  if (hour < 5 || hour > 20) return 0.0;
  if (hour < 7) return 0.8;
  if (hour < 9) return 0.8 - (hour - 7) * 0.35;
  if (hour < 15) return 0.1;
  if (hour < 18) return 0.1 + (hour - 15) * 0.3;
  return 1.0 - (hour - 18) * 0.5;
}

export function updateSky(cbLights) {
  if (CONFIG.autoSun) {
    CONFIG.time.hour = (CONFIG.time.hour + 0.016 * CONFIG.sunSpeed * 0.6) % 24;
    document.getElementById('sld-hour').value = CONFIG.time.hour;
    const h = Math.floor(CONFIG.time.hour), m = Math.floor((CONFIG.time.hour - h) * 60);
    document.getElementById('lbl-hour').textContent =
      String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }
  const hour = CONFIG.time.hour;
  const elev = Math.sin((hour - 6) / 12 * Math.PI) * 1.15;
  const az = (hour - 6) / 12 * Math.PI;
  const hz = Math.cos(elev);
  sunDir2.set(Math.cos(az) * hz, Math.sin(elev), -0.4 * hz).normalize();
  const trueSunElev = Math.sin((hour - 6) / 12 * Math.PI);
  
  const PLATEAU_ELEV = 0.608;
  const effectiveSunElev = trueSunElev >= 0 ? Math.min(trueSunElev, PLATEAU_ELEV) : trueSunElev;
  
  state.dayF = THREE.MathUtils.clamp((effectiveSunElev + 0.12) / 0.35, 0, 1);
  state.nightF = 1 - state.dayF;
  const warmth = warmthAtHour(hour);

  sunColorAtHour(hour, tmpC2);
  sunLight.color.copy(tmpC2);
  
  const cloudCoverage = getCloudCoverage();
  
  // ☁️ OFUSCAMENTO MAIS SUAVE DAS NUVENS (era 0.55, agora 0.35)
  // As nuvens ainda bloqueiam o sol, mas com menos intensidade
  const cloudShadowFactor = 1.0 - cloudCoverage * 0.35;
  
  sunLight.intensity = state.dayF * 2.4 * cloudShadowFactor + state.flash * 1.4;
  sunLight.position.copy(state.boatRoot.position).addScaledVector(sunDir2, 140);
  sunLight.target.position.copy(state.boatRoot.position);
  
  moonDir.set(-sunDir2.x, Math.max(0.35, -sunDir2.y * 0.7 + 0.3), -sunDir2.z).normalize();
  moonLight.position.copy(state.boatRoot.position).addScaledVector(moonDir, 100);
  moonLight.intensity = state.nightF * 0.55;
  
  const hemiCloudFactor = 1.0 - cloudCoverage * 0.3;
  hemi.intensity = (0.3 + state.dayF * 0.9 + state.flash * 1.2) * hemiCloudFactor;

  if (boatSpotLight) {
    boatSpotLight.position.copy(state.boatRoot.position);
    boatSpotLight.position.y += 8;
    boatSpotLight.target.position.copy(state.boatRoot.position);
    boatSpotLight.intensity = 3.5;
    boatSpotLight.color.setHex(0xffffff);
  }

  if (boatFillLight) {
    boatFillLight.position.copy(state.boatRoot.position);
    boatFillLight.position.y += 2;
    boatFillLight.intensity = 1.8;
    boatFillLight.color.setHex(0xffffff);
  }

  skyColorAtHour(hour, bgCol);
  if (CONFIG.weather.mode === 'STORM') bgCol.multiplyScalar(0.6);
  if (CONFIG.weather.mode === 'FOG') bgCol.lerp(tmpC.setHex(0xc8d8e0), 0.7);
  if (CONFIG.weather.mode === 'RAIN') bgCol.multiplyScalar(0.8);
  if (state.flash > 0.02) bgCol.lerp(tmpC.setHex(0xffd4a0), state.flash * 0.6);

  state.scene.background = bgCol;
  state.scene.fog.color.copy(bgCol);
  state.scene.fog.near = THREE.MathUtils.lerp(90, 200, state.dayF);
  state.scene.fog.far = THREE.MathUtils.lerp(1100, 1600, state.dayF);
  if (CONFIG.weather.mode === 'STORM') { state.scene.fog.near *= 0.4; state.scene.fog.far *= 0.55; }
  if (CONFIG.weather.mode === 'FOG')   { state.scene.fog.near = 10; state.scene.fog.far = 150; }
  if (CONFIG.weather.mode === 'RAIN')  { state.scene.fog.near *= 0.7; state.scene.fog.far *= 0.8; }

  sunSprite.position.copy(state.boatRoot.position).addScaledVector(sunDir2, 330);
  sunSprite.material.color.copy(tmpC2);
  const sunSpriteFade = THREE.MathUtils.clamp(
    THREE.MathUtils.smoothstep(trueSunElev, -0.5, 0.15), 0, 1
  );
  
  // ☀️ OPACIDADE DO SOL: ainda é afetada pelas nuvens, mas com limite mínimo
  // Assim o sol nunca desaparece completamente mesmo com nuvens densas
  const sunOpacityWithClouds = sunSpriteFade * 1.0 * cloudShadowFactor;
  const sunMinOpacity = sunSpriteFade * 0.55; // mínimo de 55% visível
  sunSprite.material.opacity = Math.max(sunOpacityWithClouds, sunMinOpacity);
  
  if (CONFIG.weather.mode === 'STORM') sunSprite.material.opacity *= 0.35;
  if (CONFIG.weather.mode === 'FOG') sunSprite.material.opacity *= 0.3;

  moonSprite.position.copy(state.boatRoot.position).addScaledVector(moonDir, 310);
  moonSprite.material.opacity = state.nightF * 0.9;
  starGroup.position.copy(state.boatRoot.position);
  starMat.opacity = THREE.MathUtils.clamp(-trueSunElev * 4, 0, 1);
  if (CONFIG.weather.mode === 'STORM') starMat.opacity *= 0.25;
  if (CONFIG.weather.mode === 'FOG') starMat.opacity *= 0.1;
  if (CONFIG.weather.mode === 'RAIN') starMat.opacity *= 0.5;
  state.sky.material.uniforms['sunPosition'].value.copy(sunDir2);

  const skyAtmosFade = THREE.MathUtils.clamp(
    THREE.MathUtils.smoothstep(trueSunElev, -0.5, 0.05), 0, 1
  );
  const su = state.sky.material.uniforms;
  su['mieCoefficient'].value = 0.006 * skyAtmosFade;
  su['rayleigh'].value = (2.8 - warmth * 1.6) * skyAtmosFade + 0.2 * (1 - skyAtmosFade);
  su['turbidity'].value = (3 + warmth * 8 + (CONFIG.weather.mode === 'STORM' ? 8 : 0)) *
    skyAtmosFade + 2.0 * (1 - skyAtmosFade);

  seaUniforms.uDeep.value.copy(DEEP_N).lerp(DEEP_D, state.dayF);
  seaUniforms.uScat.value.copy(SCAT_N).lerp(SCAT_D, state.dayF);
  seaUniforms.uSunDir.value.copy(sunDir2);
  
  // Reflexo do sol no mar também menos afetado pelas nuvens
  seaUniforms.uSunCol.value.copy(tmpC2)
    .multiplyScalar(sunSpriteFade * Math.max(effectiveSunElev, 0) * 0.85 * cloudShadowFactor);
  seaUniforms.uSkyRef.value.copy(bgCol);
  seaUniforms.uFogColor.value.copy(bgCol);
  seaUniforms.uFogNear.value = state.scene.fog.near;
  seaUniforms.uFogFar.value = state.scene.fog.far;
  seaUniforms.uSpecularPower.value = 200;
  seaUniforms.uSpecularIntensity.value = 0.03 + warmth * 0.02;

  updateClouds(0.016, sunDir2, tmpC2, bgCol);

  if (cbLights) {
    const navI = state.nightF > 0.35 ? 1 : 0;
    cbLights.navPort.intensity = navI * 0.8;
    cbLights.navStbd.intensity = navI * 0.8;
    cbLights.navStern.intensity = navI * 0.7;
  }
}