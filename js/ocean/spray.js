import * as THREE from 'three';
import { state } from '../state.js';
import { waveHAt } from './waves.js';

export const spray = { geo: null, list: [], max: 6000 };

export function initSpray() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array(spray.max * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(
    new Float32Array(spray.max), 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(
    new Float32Array(spray.max), 1).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.ShaderMaterial({
    uniforms: { uBright: { value: 1.0 } },
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    vertexShader: `attribute float aSize,aAlpha; varying float vA;
      void main(){vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_PointSize=aSize*(300.0/max(1.0,-mv.z)); gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform float uBright; varying float vA;
      void main(){float d=length(gl_PointCoord-0.5); float core=smoothstep(0.5,0.0,d);
        float a=smoothstep(0.5,0.12,d)*vA; if(a<0.01) discard;
        vec3 col=mix(vec3(0.78,0.90,0.98),vec3(1.0),core)*uBright;
        gl_FragColor=vec4(col,a);}`
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false; p.renderOrder = 3;
  state.scene.add(p);
  spray.geo = g;
}

export function emitSpray(x, y, z, vx, vy, vz, opts) {
  if (spray.list.length >= spray.max) return;
  const o = opts || {};
  spray.list.push({
    x, y, z, vx, vy, vz, life: 0,
    max: (o.life !== undefined) ? o.life : (0.9 + Math.random() * 0.5),
    size: (o.size !== undefined) ? o.size : (0.07 + Math.random() * 0.06)
  });
}