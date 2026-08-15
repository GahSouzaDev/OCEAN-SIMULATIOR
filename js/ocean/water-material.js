// js/ocean/water-material.js — shader da água + PRAIA VIVA (swash, espuma arredondada, areia molhada)
import * as THREE from 'three';
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { WAVES, AMP_SUM, glslLOD, M_DECL, glslH, glslC } from './waves.js';
import { bathyTextures, WORLD } from '../world/world-map.js';
const { bathyTex } = bathyTextures();
export const seaUniforms = {
  uPhase: { value: 0 }, uHeight: { value: 1 }, uChop: { value: 1 },
  uAmpTot: { value: AMP_SUM }, uOffset: { value: new THREE.Vector2() },
  uBoatLocal: { value: new THREE.Vector2() },
  uSunDir: { value: new THREE.Vector3(0, 1, 0) },
  uSunCol: { value: new THREE.Color(0xffffff) },
  uDeep: { value: new THREE.Color(0x002850) },
  uScat: { value: new THREE.Color(0x1870c8) },
  uSkyRef: { value: new THREE.Color(0xb0d8f0) },
  uFoamAmt: { value: 1 }, uTime2: { value: 0 },
  uDeck: { value: new THREE.Vector3() }, uDeckI: { value: 0 },
  uFogColor: { value: new THREE.Color() },
  uFogNear: { value: 120 }, uFogFar: { value: 1600 },
  uSpecularPower: { value: 200 }, uSpecularIntensity: { value: 0.035 },
  uBoatPos: { value: new THREE.Vector3() },
  uBoatHeading: { value: 0 }, uBoatSpeedN: { value: 0 },
  uBathy: { value: bathyTex },
  uWorldMin: { value: new THREE.Vector2(WORLD.minX, WORLD.minZ) },
  uWorldSize: { value: new THREE.Vector2(WORLD.sizeX, WORLD.sizeZ) }
};
export function createOceanMesh() {
  const seaMat = new THREE.ShaderMaterial({
    uniforms: seaUniforms,
    vertexShader: `
      uniform float uPhase,uHeight,uChop,uAmpTot;
      uniform vec2 uOffset,uBoatLocal,uWorldMin,uWorldSize;
      uniform sampler2D uBathy;
      varying vec3 vW,vN; varying float vCrest,vDamp,vSurf;
      ${M_DECL}
      float H(vec2 p){float h=0.,ph; ${glslH()} return h*uHeight;}
      vec2 CH(vec2 p){vec2 c=vec2(0.);float ph; ${glslC()} return c*uChop;}
      void main(){
        vec2 p=position.xz+uOffset;
        vec2 buv=clamp((p-uWorldMin)/uWorldSize,0.0,1.0);
        vec4 bt=texture2D(uBathy,buv);
        vDamp=bt.r; vSurf=bt.a;
        float damp=bt.r, swell=bt.g*1.5, rchop=bt.b*1.5;
        float dL=length(position.xz-uBoatLocal); ${glslLOD()}
        float h=H(p)*damp*swell;
        vec2 ch=CH(p)*(damp*rchop);
        float e=0.9;
        float hx=H(p+vec2(e,0.))*damp*swell, hz=H(p+vec2(0.,e))*damp*swell;
        vN=normalize(vec3((h-hx)/e,1.0,(h-hz)/e));
        vW=vec3(p.x+ch.x,h,p.y+ch.y);
        vCrest=h/max(0.25,uAmpTot*max(0.15,damp*swell));
        vec3 pos=vec3(position.x+ch.x,h,position.z+ch.y);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
      }`,
    fragmentShader: `
      uniform vec3 uSunDir,uSunCol,uDeep,uScat,uSkyRef,uFogColor,uDeck,uBoatPos;
      uniform float uFoamAmt,uTime2,uDeckI,uFogNear,uFogFar,uSpecularPower,uSpecularIntensity;
      uniform float uBoatHeading,uBoatSpeedN;
      varying vec3 vW,vN; varying float vCrest,vDamp,vSurf;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      void main(){
        vec3 n=normalize(vN);
        float dn=vnoise(vW.xz*0.45+uTime2*0.5)*0.45
          +vnoise(vW.xz*1.7+uTime2*0.6)*0.35
          +vnoise(vW.xz*4.3-uTime2*0.4)*0.2;
        n=normalize(n+vec3((dn-0.5)*0.32,0.0,(dn-0.5)*0.32));
        vec3 V=normalize(cameraPosition-vW);
        float fres=pow(1.0-max(dot(n,V),0.0),3.0);
        float shadowFactor=smoothstep(-0.2,0.7,vCrest);
        float ao=mix(0.82,1.1,shadowFactor);
        vec3 col=mix(uDeep,uScat*1.15,clamp(fres*0.85+0.18,0.,1.));
        col=mix(col,uSkyRef,fres*0.5);
        vec3 R=reflect(-uSunDir,n);
        float diff=max(dot(n,uSunDir),0.0);
        col+=uSunCol*diff*0.85;
        col+=uSunCol*pow(max(dot(R,V),0.0),uSpecularPower)*uSpecularIntensity;
        col+=uSunCol*pow(max(dot(R,V),0.0),14.0)*0.014;
        float subsurface=pow(max(dot(V,-uSunDir),0.0),3.0)*max(diff,0.0);
        col+=vec3(0.2,0.7,0.9)*subsurface*0.2;
        col*=ao;
        // espuma de crista + proximidade do casco
        float f=smoothstep(0.55,0.98,vCrest)*uFoamAmt;
        f*=0.55+0.45*vnoise(vW.xz*0.9+uTime2*0.25);
        vec3 toBoat=vW-uBoatPos;
        float bfx=sin(uBoatHeading),bfz=cos(uBoatHeading);
        float along=toBoat.x*bfx+toBoat.z*bfz;
        float lateral=abs(-toBoat.x*bfz+toBoat.z*bfx);
        float hullProx=(1.0-smoothstep(1.0,3.8,lateral))*(1.0-smoothstep(1.5,4.5,abs(along)));
        f=clamp(f+hullProx*0.35,0.,1.);
        // ============ PRAIA VIVA ============
        // quão "dentro" da zona de arrebentação estamos
        float shore=1.0-smoothstep(0.03,0.32,vDamp);
        // swash: língua de espuma que sobe e desce na areia
        float swash=0.5+0.5*sin(uTime2*1.5+vnoise(vW.xz*0.35)*6.2831+vW.x*0.02+vW.z*0.02);
        swash=swash*swash;
        float foamLine=shore*(0.30+0.70*swash);
        // borda ARREDONDADA da onda: linha contínua de espuma na água rasa
        float edge=smoothstep(0.0,0.05,vDamp)*(1.0-smoothstep(0.05,0.30,vDamp));
        foamLine=max(foamLine,edge*(0.55+0.45*swash));
        // quebra suave na arrebentação
        foamLine=max(foamLine,vSurf*(0.35+0.4*vnoise(vW.xz*1.3+uTime2*0.7)));
        // areia molhada sob filme d'água (mata o aspecto "seco")
        vec3 sandCol=vec3(0.60,0.53,0.38);
        sandCol*=0.72+0.28*vnoise(vW.xz*2.1);
        sandCol*=(uSunCol*0.7+vec3(0.3));
        sandCol*=0.75+0.25*(1.0-shore*0.4); // mais escura molhada
        float waterCover=smoothstep(0.0,0.22,vDamp);
        col=mix(sandCol,col,clamp(waterCover+f*0.4,0.,1.));
        f=clamp(f+foamLine*0.9*uFoamAmt,0.,1.);
        col=mix(col,vec3(0.93,0.96,0.99),f);
        if(uDeckI>0.001){
          vec3 Ld=uDeck-vW; float d2=dot(Ld,Ld); vec3 Ln=normalize(Ld);
          float att=uDeckI*8.0/(1.0+0.35*d2);
          float dif=max(dot(n,Ln),0.0);
          col+=vec3(1.0,0.75,0.45)*att*dif;
          vec3 Rd=reflect(-Ln,n);
          col+=vec3(1.0,0.8,0.5)*pow(max(dot(Rd,V),0.0),60.0)*att*0.5;
        }
        float fogF=smoothstep(uFogNear,uFogFar,distance(cameraPosition,vW));
        col=mix(col,uFogColor,fogF);
        gl_FragColor=vec4(col,1.0);
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