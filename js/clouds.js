// js/clouds.js — NUVENS VOLUMÉTRICAS 2.5D
// Auto-sombra na direção do sol, prata nas bordas (silver lining),
// gradiente de espessura, aquecimento no amanhecer/entardecer.
// getCloudCoverage() mantém a MESMA matemática (contrato com weather.js).
import * as THREE from 'three';
import { state } from './state.js';
import { CONFIG, WEATHERS } from './config.js';

let cloudPlane, cloudMaterial;
const cloudOffset = new THREE.Vector2(0, 0);
const CLOUD_HEIGHT = 130;

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
  const cloudGeo = new THREE.PlaneGeometry(9000, 9000, 1, 1);
  cloudGeo.rotateX(-Math.PI / 2);

  cloudMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime:     { value: 0 },
      uOffset:   { value: new THREE.Vector2() },
      uCoverage: { value: 0.45 },
      uSunDir:   { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color(1, 1, 1) },
      uSkyColor: { value: new THREE.Color(0.6, 0.8, 0.95) },
      uDayF:     { value: 1 },
      uOpacity:  { value: 1 }
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uTime, uCoverage, uDayF, uOpacity;
      uniform vec2 uOffset;
      uniform vec3 uSunDir, uSunColor, uSkyColor;
      varying vec2 vUv;
      varying vec3 vWorld;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = p * 2.03 + vec2(19.7, 7.3);
          a *= 0.5;
        }
        return v;
      }

      float densityAt(vec2 p) {
        vec2 warp = vec2(fbm(p * 1.6 + vec2(2.3, 9.1)), fbm(p * 1.6 + vec2(8.1, 3.7)));
        float base = fbm(p + warp * 0.65 + vec2(uTime * 0.0042, uTime * 0.0026));
        float thr = 0.62 - uCoverage * 0.5;
        float d = smoothstep(thr, thr + 0.30, base);
        return d * d * (3.0 - 2.0 * d);
      }

      void main() {
        vec2 p = (vWorld.xz + uOffset) * 0.0011;
        float d = densityAt(p);

        // ── auto-sombra: amostra deslocada na direção do sol ──
        vec3 sd = normalize(uSunDir + vec3(0.0, 0.001, 0.0));
        vec2 sunXZ = sd.xz / max(sd.y, 0.18);
        float dSun = densityAt(p + sunXZ * 0.028);
        float shadow = clamp(1.0 - max(dSun - d, 0.0) * 3.2, 0.22, 1.0);

        // ── fase: prata na borda olhando pro sol ──
        vec3 viewDir = normalize(vWorld - cameraPosition);
        float mu = dot(viewDir, sd);
        float silver = pow(max(mu, 0.0), 7.0);

        float sunH = clamp(uSunDir.y, 0.0, 1.0);
        float warm = pow(1.0 - clamp(uSunDir.y, 0.0, 1.0), 2.0) * step(0.0, uSunDir.y);

        vec3 bright = mix(vec3(0.98, 0.97, 0.95), uSunColor * 1.2, warm * 0.8);
        vec3 darkBase = mix(vec3(0.30, 0.32, 0.40), vec3(0.06, 0.08, 0.15), 1.0 - uDayF);
        float thick = smoothstep(0.10, 0.85, d);
        vec3 cCol = mix(bright, darkBase, thick * 0.6);
        cCol *= shadow;
        cCol += uSunColor * silver * (0.35 + 0.65 * uDayF) * 0.7 * shadow;
        cCol = mix(cCol, uSkyColor * 0.9, 0.16);
        // lua: contorno frio sutil à noite
        cCol += vec3(0.10, 0.13, 0.20) * (1.0 - uDayF) * thick * 0.4;

        // ── bordas suaves ──
        float dist = length(vUv - 0.5) * 2.0;
        float edgeFade = 1.0 - smoothstep(0.60, 0.98, dist);
        float nightFade = mix(0.16, 1.0, uDayF);
        float alpha = d * edgeFade * uOpacity * nightFade;

        vec3 finalColor = mix(uSkyColor, cCol, clamp(d * 1.6, 0.0, 1.0));
        gl_FragColor = vec4(finalColor, alpha * 0.93);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  cloudPlane = new THREE.Mesh(cloudGeo, cloudMaterial);
  cloudPlane.position.y = CLOUD_HEIGHT;
  cloudPlane.renderOrder = 999;
  cloudPlane.frustumCulled = false;
  state.scene.add(cloudPlane);
  return cloudPlane;
}

export function updateClouds(dt, sunDir, sunColor, skyColor) {
  if (!cloudPlane) return;
  const windSpeed = state.windMul * 6.0;
  const windDir = CONFIG.wind.direction;
  cloudOffset.x += Math.cos(windDir) * windSpeed * dt;
  cloudOffset.y += Math.sin(windDir) * windSpeed * dt;

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