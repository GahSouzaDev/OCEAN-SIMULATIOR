import * as THREE from 'three';
import { state } from './state.js';
import { CONFIG, WEATHERS } from './config.js';

let cloudPlane, cloudMaterial;
const cloudOffset = new THREE.Vector2(0, 0);

// ==========================================================
// 🌥️ SISTEMA DE NUVENS PROCEDURAIS
// ==========================================================
// Nuvens geradas em tempo real via shader (fbm noise)
// - Se movem com o vento
// - Bloqueiam a luz do sol quando passam sobre o barco
// - Criam sombras dinâmicas no mar
// ==========================================================

// Noise em JS para calcular cobertura de nuvens na posição do barco
function cloudNoise(x, z) {
  let v = 0;
  v += Math.sin(x * 0.008 + z * 0.012) * 0.5;
  v += Math.sin(x * 0.019 - z * 0.014) * 0.3;
  v += Math.sin(x * 0.037 + z * 0.041) * 0.2;
  v += Math.sin(x * 0.073 + z * 0.081) * 0.15;
  v += Math.sin(x * 0.15 + z * 0.13) * 0.08;
  return v;
}

export function getCloudCoverage() {
  const x = state.boatRoot.position.x + cloudOffset.x;
  const z = state.boatRoot.position.z + cloudOffset.y;
  
  const noise = cloudNoise(x, z);
  const weatherCoverage = (WEATHERS[CONFIG.weather.mode] || WEATHERS.MODERATE).cloudCoverage || 0.4;
  
  const threshold = 0.3 - weatherCoverage * 0.6;
  let coverage = Math.max(0, Math.min(1, (noise - threshold) * 1.5));
  
  // Smoothstep pra suavizar as bordas da nuvem
  coverage = coverage * coverage * (3 - 2 * coverage);
  
  return coverage;
}

export function initClouds() {
  const cloudGeo = new THREE.PlaneGeometry(4000, 4000, 1, 1);
  cloudGeo.rotateX(-Math.PI / 2);
  
  cloudMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOffset: { value: new THREE.Vector2(0, 0) },
      uCoverage: { value: 0.4 },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color(0xffffff) },
      uSkyColor: { value: new THREE.Color(0x87ceeb) },
      uOpacity: { value: 1.0 },
      uDayF: { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uOffset;
      uniform float uCoverage;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uSkyColor;
      uniform float uOpacity;
      uniform float uDayF;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i), b = hash(i + vec2(1,0));
        float c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
        for(int i = 0; i < 6; i++) {
          v += a * noise(p);
          p = rot * p * 2.0;
          a *= 0.5;
        }
        return v;
      }
      void main() {
        vec2 p = (vWorldPos.xz + uOffset) * 0.0015;
        p += uTime * 0.015;
        
        float n = fbm(p);
        float n2 = fbm(p * 1.7 + vec2(1.5, 3.2) + uTime * 0.008);
        
        // Combina duas camadas de nuvens
        float combined = n * 0.7 + n2 * 0.3;
        
        // Threshold baseado no clima
        float threshold = 0.48 - uCoverage * 0.38;
        float cloud = smoothstep(threshold, threshold + 0.22, combined);
        
        // Iluminação das nuvens
        float sunFactor = max(dot(vec3(0,1,0), normalize(uSunDir)), 0.0);
        vec3 brightCloud = vec3(1.0, 0.98, 0.96);
        vec3 darkCloud = vec3(0.45, 0.48, 0.55);
        vec3 cloudColor = mix(darkCloud, brightCloud, sunFactor * 0.65 + 0.35);
        
        // Adiciona toque quente do sol
        cloudColor = mix(cloudColor, uSunColor * 1.2, sunFactor * 0.2);
        
        // Fade nas bordas pra não ficar quadrado
        float dist = length(vUv - 0.5) * 2.0;
        float edgeFade = 1.0 - smoothstep(0.55, 0.95, dist);
        
        // Opacidade reduzida à noite
        float nightFade = mix(0.15, 1.0, uDayF);
        float alpha = cloud * edgeFade * uOpacity * nightFade;
        
        vec3 finalColor = mix(uSkyColor, cloudColor, cloud);
        
        gl_FragColor = vec4(finalColor, alpha * 0.88);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  
  cloudPlane = new THREE.Mesh(cloudGeo, cloudMaterial);
  cloudPlane.position.y = 280;
  cloudPlane.renderOrder = 999;
  state.scene.add(cloudPlane);
  
  return cloudPlane;
}

export function updateClouds(dt, sunDir, sunColor, skyColor) {
  if (!cloudPlane) return;
  
  // Move com o vento
  const windSpeed = state.windMul * 6.0;
  const windDir = CONFIG.wind.direction;
  cloudOffset.x += Math.cos(windDir) * windSpeed * dt;
  cloudOffset.y += Math.sin(windDir) * windSpeed * dt;
  
  // Segue o barco
  cloudPlane.position.x = state.boatRoot.position.x;
  cloudPlane.position.z = state.boatRoot.position.z;
  
  cloudMaterial.uniforms.uTime.value = state.simTime;
  cloudMaterial.uniforms.uOffset.value.copy(cloudOffset);
  cloudMaterial.uniforms.uSunDir.value.copy(sunDir);
  cloudMaterial.uniforms.uSunColor.value.copy(sunColor);
  cloudMaterial.uniforms.uSkyColor.value.copy(skyColor);
  cloudMaterial.uniforms.uDayF.value = state.dayF;
  
  const weatherCoverage = (WEATHERS[CONFIG.weather.mode] || WEATHERS.MODERATE).cloudCoverage || 0.4;
  cloudMaterial.uniforms.uCoverage.value = weatherCoverage;
}