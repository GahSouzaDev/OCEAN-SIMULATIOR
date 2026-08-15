import * as THREE from 'three';
import { state } from './state.js';
import { CONFIG, WEATHERS } from './config.js';

let cloudPlane, cloudMaterial;
const cloudOffset = new THREE.Vector2(0, 0);

// ==========================================================
// 🌥️ SISTEMA DE NUVENS PROCEDURAIS MELHORADO (2D) - VERSÃO BAIXA
// ==========================================================
// - Altura reduzida para sobrevoar por baixo (sensação de volume)
// - Escala de ruído aumentada para nuvens maiores e mais imponentes
// - Gradiente de espessura escurecendo as partes mais densas (base)
// - Plano maior para evitar que as bordas apareçam no horizonte
// ==========================================================

const CLOUD_HEIGHT = 120; // Altura bem mais baixa (antes 220)

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
  
  coverage = coverage * coverage * (3 - 2 * coverage);
  
  return coverage;
}

export function initClouds() {
  // Aumentamos o tamanho do plano para 8000x8000. Como as nuvens estão mais baixas,
  // elas precisam cobrir mais área para não vermos o "fim" do plano no horizonte.
  const cloudGeo = new THREE.PlaneGeometry(8000, 8000, 1, 1);
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

      // ---------- FUNÇÕES DE RUÍDO ----------
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
        for (int i = 0; i < 6; i++) {
          v += a * noise(p);
          p = rot * p * 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        // Escala aumentada para que as nuvens pareçam maiores e mais imponentes vistas de perto
        vec2 p = (vWorldPos.xz + uOffset) * 0.0025;
        p += uTime * 0.012;

        // Três camadas de FBM com velocidades diferentes
        float n1 = fbm(p);
        float n2 = fbm(p * 1.5 + vec2(1.5, 3.2) + uTime * 0.006);
        float n3 = fbm(p * 2.5 + vec2(2.1, 1.3) + uTime * 0.004);

        // Combinação ponderada
        float combined = n1 * 0.50 + n2 * 0.35 + n3 * 0.15;

        // Threshold baseado na cobertura do clima (ajustado para nuvens mais densas)
        float threshold = 0.40 - uCoverage * 0.45;
        float cloud = smoothstep(threshold, threshold + 0.25, combined);

        // ---------- ILUMINAÇÃO SOLAR ----------
        vec3 sunDir = normalize(uSunDir);
        float sunFactor = max(dot(vec3(0.0, 1.0, 0.0), sunDir), 0.0);

        // Cores das nuvens (ajustadas para ficarem mais escuras e pesadas)
        vec3 brightCloud = vec3(0.95, 0.93, 0.90);
        vec3 darkCloud = vec3(0.30, 0.32, 0.40);

        // Simulação de gradiente vertical: escurece as partes mais densas da nuvem,
        // simulando a base escura e volumosa de nuvens baixas.
        float thicknessGrad = smoothstep(0.2, 0.8, combined);
        brightCloud = mix(brightCloud, darkCloud, thicknessGrad * 0.4);

        vec3 cloudColor = mix(darkCloud, brightCloud, sunFactor * 0.65 + 0.35);

        // Toque quente do sol ao amanhecer/entardecer
        cloudColor = mix(cloudColor, uSunColor * 1.2, sunFactor * 0.3);

        // ---------- BORDAS SUAVES ----------
        float dist = length(vUv - 0.5) * 2.0;
        // Fade mais longo pois o plano agora é maior (8000)
        float edgeFade = 1.0 - smoothstep(0.65, 1.0, dist);

        // ---------- OPACIDADE ----------
        float nightFade = mix(0.15, 1.0, uDayF);
        float alpha = cloud * edgeFade * uOpacity * nightFade;

        vec3 finalColor = mix(uSkyColor, cloudColor, cloud);

        gl_FragColor = vec4(finalColor, alpha * 0.90); // opacidade levemente aumentada para parecer mais denso
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  
  cloudPlane = new THREE.Mesh(cloudGeo, cloudMaterial);
  cloudPlane.position.y = CLOUD_HEIGHT; // Altura das nuvens reduzida
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
  
  // Atualiza uniforms
  cloudMaterial.uniforms.uTime.value = state.simTime;
  cloudMaterial.uniforms.uOffset.value.copy(cloudOffset);
  cloudMaterial.uniforms.uSunDir.value.copy(sunDir);
  cloudMaterial.uniforms.uSunColor.value.copy(sunColor);
  cloudMaterial.uniforms.uSkyColor.value.copy(skyColor);
  cloudMaterial.uniforms.uDayF.value = state.dayF;
  
  const weatherCoverage = (WEATHERS[CONFIG.weather.mode] || WEATHERS.MODERATE).cloudCoverage || 0.4;
  cloudMaterial.uniforms.uCoverage.value = weatherCoverage;
}