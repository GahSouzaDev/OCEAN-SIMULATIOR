import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { state } from './state.js';

export function initScene() {
  const canvas = document.getElementById('app-canvas');
  state.renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, powerPreference: 'high-performance'
  });
  state.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  state.renderer.setSize(innerWidth, innerHeight);
  state.renderer.shadowMap.enabled = true;
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  // 🔆 EXPOSIÇÃO REDUZIDA (1.45 → 1.15) - Evita estouro geral
  state.renderer.toneMappingExposure = 1.15;

  state.scene = new THREE.Scene();
  state.scene.fog = new THREE.Fog(0x7a9bb8, 120, 1600);

  state.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 15000);
  state.camera.position.set(-14, 5, 10);

  state.composer = new EffectComposer(state.renderer);
  state.composer.addPass(new RenderPass(state.scene, state.camera));
  
  // 💡 BLOOM MAIS SUAVE - Evita glow excessivo
  state.bloomPass = new UnrealBloomPass(
    new THREE.Vector2(innerWidth, innerHeight), 0.25, 0.4, 0.88
  );
  state.composer.addPass(state.bloomPass);
  state.fxaaPass = new ShaderPass(FXAAShader);
  state.fxaaPass.uniforms['resolution'].value.set(
    1 / (innerWidth * state.renderer.getPixelRatio()),
    1 / (innerHeight * state.renderer.getPixelRatio())
  );
  state.composer.addPass(state.fxaaPass);

  state.boatRoot = new THREE.Group();
  state.tilt = new THREE.Group();
  state.boatRoot.add(state.tilt);
  state.scene.add(state.boatRoot);

  state.clock = new THREE.Clock();

  addEventListener('resize', onResize);
}

function onResize() {
  state.camera.aspect = innerWidth / innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(innerWidth, innerHeight);
  state.composer.setSize(innerWidth, innerHeight);
  const pr = state.renderer.getPixelRatio();
  state.fxaaPass.uniforms['resolution'].value.set(
    1 / (innerWidth * pr), 1 / (innerHeight * pr)
  );
}