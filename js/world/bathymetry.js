// js/world/bathymetry.js — profundidade assada em textura (CPU+GPU leem o mesmo mar)
import * as THREE from 'three';
import { depthAt } from './world-map.js';
import { regionWaveAt } from './regions.js';
export const WORLD = { minX:-1700, minZ:-700, sizeX:3200, sizeZ:2200 };
const N = 256;
const cpu = new Float32Array(N*N*4); // damp, swell, chop, surf
let bathyTex=null, tintTex=null;
function sstep(a,b,x){ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); }
function bake(){
  const d8 = new Uint8Array(N*N*4), t8 = new Uint8Array(N*N*3);
  for (let j=0;j<N;j++) for (let i=0;i<N;i++){
    const x = WORLD.minX + (i/(N-1))*WORLD.sizeX;
    const z = WORLD.minZ + (j/(N-1))*WORLD.sizeZ;
    const d = depthAt(x,z);
    const damp = sstep(0.4, 4.5, d);                    // praia mata a onda
    const surf = Math.exp(-((d-1.6)*(d-1.6))/1.1);      // faixa de quebra
    const rw = regionWaveAt(x,z);
    const k=(j*N+i)*4;
    cpu[k]=damp; cpu[k+1]=rw.swell; cpu[k+2]=rw.chop; cpu[k+3]=surf;
    d8[k]=damp*255; d8[k+1]=Math.min(255,rw.swell/1.5*255);
    d8[k+2]=Math.min(255,rw.chop/1.5*255); d8[k+3]=surf*255;
    const t=(j*N+i)*3;
    t8[t]=Math.min(255,rw.tint[0]/1.5*255);
    t8[t+1]=Math.min(255,rw.tint[1]/1.5*255);
    t8[t+2]=Math.min(255,rw.tint[2]/1.5*255);
  }
  bathyTex = new THREE.DataTexture(d8,N,N,THREE.RGBAFormat);
  bathyTex.magFilter=bathyTex.minFilter=THREE.LinearFilter;
  bathyTex.needsUpdate=true;
  tintTex = new THREE.DataTexture(t8,N,N,THREE.RGBFormat);
  tintTex.magFilter=tintTex.minFilter=THREE.LinearFilter;
  tintTex.needsUpdate=true;
}
bake();
export function bathyTextures(){ return { bathyTex, tintTex }; }
export function sampleBathy(x,z){
  const i=Math.min(N-1,Math.max(0,Math.round((x-WORLD.minX)/WORLD.sizeX*(N-1))));
  const j=Math.min(N-1,Math.max(0,Math.round((z-WORLD.minZ)/WORLD.sizeZ*(N-1))));
  const k=(j*N+i)*4;
  return { damp:cpu[k], swell:cpu[k+1], chop:cpu[k+2], surf:cpu[k+3] };
}