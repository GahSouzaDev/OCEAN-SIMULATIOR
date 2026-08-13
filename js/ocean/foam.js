import * as THREE from 'three';
import { state } from '../state.js';
import { waveHAt } from './waves.js';

export const foam = { geo: null, list: [], max: 1400 };

export function initFoam() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array(foam.max * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(
    new Float32Array(foam.max), 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(
    new Float32Array(foam.max), 1).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.ShaderMaterial({
    uniforms: { uBright: { value: 1 } },
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    vertexShader: `attribute float aSize,aAlpha; varying float vA;
      void main(){vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_PointSize=aSize*(240.0/max(1.0,-mv.z)); gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform float uBright; varying float vA;
      void main(){float d=length(gl_PointCoord-0.5); float core=smoothstep(0.5,0.0,d);
        float a=smoothstep(0.5,0.1,d)*vA; if(a<0.01) discard;
        vec3 col=mix(vec3(0.8,0.92,1.0),vec3(1.0,1.0,1.0),core)*uBright;
        gl_FragColor=vec4(col,a);}`
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false; p.renderOrder = 3;
  state.scene.add(p);
  foam.geo = g;
}

export function emitFoam(x, y, z, vx, vy, vz, life, size) {
  if (foam.list.length >= foam.max) return;
  foam.list.push({ x, y, z, vx, vy, vz, life: 0, max: life, size });
}