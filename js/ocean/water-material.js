import * as THREE from 'three';
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { WAVES, AMP_SUM, glslLOD, M_DECL, glslH, glslC } from './waves.js';

export const seaUniforms = {
  uPhase: { value: 0 }, uHeight: { value: 1 }, uChop: { value: 1 },
  uAmpTot: { value: AMP_SUM }, uOffset: { value: new THREE.Vector2() },
  uBoatLocal: { value: new THREE.Vector2() },
  uSunDir: { value: new THREE.Vector3(0, 1, 0) },
  uSunCol: { value: new THREE.Color(0xffffff) },
  uDeep: { value: new THREE.Color(0x00183a) },
  uScat: { value: new THREE.Color(0x0a52a8) },
  uSkyRef: { value: new THREE.Color(0x8fc3ea) },
  uFoamAmt: { value: 1 }, uTime2: { value: 0 },
  uDeck: { value: new THREE.Vector3() }, uDeckI: { value: 0 },
  uFogColor: { value: new THREE.Color() },
  uFogNear: { value: 120 }, uFogFar: { value: 1600 },
  uSpecularPower: { value: 256 }, uSpecularIntensity: { value: 0.025 },
  uBoatPos: { value: new THREE.Vector3() },
  uBoatHeading: { value: 0 }, uBoatSpeedN: { value: 0 }
};

export function createOceanMesh() {
  const seaMat = new THREE.ShaderMaterial({
    uniforms: seaUniforms,
    vertexShader: `
      uniform float uPhase,uHeight,uChop,uAmpTot;
      uniform vec2 uOffset,uBoatLocal;
      varying vec3 vW,vN; varying float vCrest;
      ${M_DECL}
      float H(vec2 p){float h=0.,ph;
${glslH()}
        return h*uHeight;}
      vec2 CH(vec2 p){vec2 c=vec2(0.);float ph;
${glslC()}
        return c*uChop;}
      void main(){
        vec2 p=position.xz+uOffset;
        float dL=length(position.xz-uBoatLocal);
${glslLOD()}
        float h=H(p); vec2 ch=CH(p);
        float e=0.9;
        float hx=H(p+vec2(e,0.)), hz=H(p+vec2(0.,e));
        vN=normalize(vec3((h-hx)/e,1.0,(h-hz)/e));
        vW=vec3(p.x+ch.x,h,p.y+ch.y);
        vCrest=h/max(0.25,uAmpTot);
        vec3 pos=vec3(position.x+ch.x,h,position.z+ch.y);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
      }`,
    fragmentShader: `
      uniform vec3 uSunDir,uSunCol,uDeep,uScat,uSkyRef,uFogColor,uDeck,uBoatPos;
      uniform float uFoamAmt,uTime2,uDeckI,uFogNear,uFogFar,uSpecularPower,uSpecularIntensity;
      uniform float uBoatHeading,uBoatSpeedN;
      varying vec3 vW,vN; varying float vCrest;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec3 n=normalize(vN);
        float dn=vnoise(vW.xz*0.45+uTime2*0.5)*0.45
                +vnoise(vW.xz*1.7+uTime2*0.6)*0.35
                +vnoise(vW.xz*4.3-uTime2*0.4)*0.2;
        n=normalize(n+vec3((dn-0.5)*0.32,0.0,(dn-0.5)*0.32));
        vec3 V=normalize(cameraPosition-vW);
        float fres=pow(1.0-max(dot(n,V),0.0),3.0);
        float shadowFactor = smoothstep(-0.4, 0.6, vCrest);
        float ao = mix(0.55, 1.05, shadowFactor);
        vec3 col = mix(uDeep * 0.95, uScat * 1.15, clamp(fres * 0.85 + 0.12, 0., 1.));
        col = mix(col, uSkyRef, fres * 0.45);
        vec3 R = reflect(-uSunDir, n);
        float diff = max(dot(n, uSunDir), 0.0);
        col += uSunCol * diff * 0.55;
        col += uSunCol * pow(max(dot(R, V), 0.0), uSpecularPower) * uSpecularIntensity;
        col += uSunCol * pow(max(dot(R, V), 0.0), 18.0) * 0.006;
        col *= ao;
        float f = smoothstep(0.55, 0.98, vCrest) * uFoamAmt;
        f *= 0.55 + 0.45 * vnoise(vW.xz * 0.9 + uTime2 * 0.25);
        vec3 toBoat = vW - uBoatPos;
        float boatFwdX = sin(uBoatHeading), boatFwdZ = cos(uBoatHeading);
        float along = toBoat.x * boatFwdX + toBoat.z * boatFwdZ;
        float lateral = abs(-toBoat.x * boatFwdZ + toBoat.z * boatFwdX);
        float hullProx = (1.0 - smoothstep(1.0, 3.8, lateral)) * (1.0 - smoothstep(1.5, 4.5, abs(along)));
        f = clamp(f + hullProx * 0.35, 0., 1.);
        col = mix(col, vec3(0.93, 0.97, 1.0), clamp(f, 0., 1.));
        if(uDeckI > 0.001){
          vec3 Ld = uDeck - vW; float d2 = dot(Ld, Ld); vec3 Ln = normalize(Ld);
          float att = uDeckI * 8.0 / (1.0 + 0.35 * d2);
          float dif = max(dot(n, Ln), 0.0);
          col += vec3(1.0, 0.75, 0.45) * att * dif;
          vec3 Rd = reflect(-Ln, n);
          col += vec3(1.0, 0.8, 0.5) * pow(max(dot(Rd, V), 0.0), 60.0) * att * 0.5;
        }
        float fogF = smoothstep(uFogNear, uFogFar, distance(cameraPosition, vW));
        col = mix(col, uFogColor, fogF);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const seaGeo = new THREE.PlaneGeometry(CONFIG.ocean.size, CONFIG.ocean.size,
    CONFIG.ocean.segments, CONFIG.ocean.segments);
  seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, seaMat);
  state.sea = sea;
  return sea;
}

export function updateOceanUniforms() {
  const cell = CONFIG.ocean.size / CONFIG.ocean.segments;
  state.sea.position.x = Math.floor(state.boatRoot.position.x / cell) * cell;
  state.sea.position.z = Math.floor(state.boatRoot.position.z / cell) * cell;
  seaUniforms.uOffset.value.set(state.sea.position.x, state.sea.position.z);
  seaUniforms.uBoatLocal.value.set(
    state.boatRoot.position.x - state.sea.position.x,
    state.boatRoot.position.z - state.sea.position.z
  );
  seaUniforms.uPhase.value = state.wavePhase;
  seaUniforms.uHeight.value = state.waveHMul;
  seaUniforms.uChop.value = state.windMul;
  seaUniforms.uAmpTot.value = Math.max(0.25, AMP_SUM * state.waveHMul);
  seaUniforms.uFoamAmt.value = state.foamMul;
  seaUniforms.uTime2.value = state.simTime;
  seaUniforms.uBoatPos.value.copy(state.boatRoot.position);
  seaUniforms.uBoatHeading.value = state.heading;
  seaUniforms.uBoatSpeedN.value = Math.min(1, Math.abs(state.speed) / 12);
}