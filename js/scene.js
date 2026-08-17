// js/scene.js — CORRIGIDO: restaura boatRoot + tilt (boat-manager depende deles)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { state } from './state.js';

export function initScene() {
  const canvas = document.getElementById('app-canvas');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  // Ajuste do fog: distâncias menores para melhor performance e transição suave
  scene.fog = new THREE.Fog(0x7a9bb8, 80, 1200); // antes: 120, 1600

  const camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 0.1, 6000
  );
  camera.position.set(-14, 5, 10);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.25, 0.4, 0.88
  );
  composer.addPass(bloom);

  const fxaa = new ShaderPass(FXAAShader);
  composer.addPass(fxaa);

  state.boatRoot = new THREE.Group();
  state.tilt = new THREE.Group();
  state.boatRoot.add(state.tilt);
  scene.add(state.boatRoot);

  state.renderer = renderer;
  state.scene = scene;
  state.camera = camera;
  state.composer = composer;
  state.bloomPass = bloom;
  state.fxaaPass = fxaa;
  state.clock = new THREE.Clock();

  function applySize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const pr = renderer.getPixelRatio();
    fxaa.material.uniforms['resolution'].value.set(1 / (w * pr), 1 / (h * pr));
  }
  applySize();
  window.addEventListener('resize', applySize);

  return { renderer, scene, camera, composer };
}