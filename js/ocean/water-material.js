// js/ocean/water-material.js — TRANSPARÊNCIA CORIGIDA (horizonte opaco + profundidade escura)
// O problema: no horizonte a água ficava transparente demais (via "através").
// Solução: quanto mais fundo, mais opaco + mais escuro. Horizonte sempre opaco.
// Vertex shader e updateOceanUniforms 100% preservados (física intacta).
import * as THREE from 'three';
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { WAVES, AMP_SUM, glslLOD, M_DECL, glslH, glslC } from './waves.js';
import { bathyTextures, WORLD } from '../world/world-map.js';

const { bathyTex, tintTex } = bathyTextures();

// ══════════════════════════════════════════════════════════════════
// 🖼️ TEXTURAS DOS ASSETS
// ══════════════════════════════════════════════════════════════════
function fallbackCanvas(r, g, b, grain) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(64, 64);
  for (let i = 0; i < 64 * 64; i++) {
    const n = (Math.random() - 0.5) * grain;
    img.data[i * 4]     = Math.max(0, Math.min(255, r + n));
    img.data[i * 4 + 1] = Math.max(0, Math.min(255, g + n));
    img.data[i * 4 + 2] = Math.max(0, Math.min(255, b + n));
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const loader = new THREE.TextureLoader();
function loadTex(path, fb) {
  loader.load(path, img => { fb.image = img; fb.needsUpdate = true; }, undefined, () => {});
  fb.wrapS = fb.wrapT = THREE.RepeatWrapping;
  fb.anisotropy = 8;
  fb.colorSpace = THREE.SRGBColorSpace;
  return fb;
}
function loadLin(path, fb) {
  loader.load(path, img => { fb.image = img; fb.needsUpdate = true; }, undefined, () => {});
  fb.wrapS = fb.wrapT = THREE.RepeatWrapping;
  fb.anisotropy = 8;
  return fb;
}

const A = 'assets/';
const sandDiffTex = loadTex(A + 'sand_diff_1k-CM4n0Z7n.jpg', fallbackCanvas(214, 190, 145, 34));
const sandNormTex = loadLin(A + 'sand_norm_1k-ChJ1a3sd.jpg', fallbackCanvas(128, 128, 255, 8));
const sandDispTex = loadLin(A + 'sand_disp_1k-Bx-DMuZi.jpg', fallbackCanvas(200, 200, 200, 30));
const rockDiffTex = loadTex(A + 'rocky_diff_1k-R3DfSYQU.jpg', fallbackCanvas(96, 92, 84, 30));
const rockNormTex = loadLin(A + 'rocky_norm_1k-BlzvPLuU.jpg', fallbackCanvas(128, 128, 255, 8));
const rockDispTex = loadLin(A + 'rocky_disp_1k-DBEZ7YGj.jpg', fallbackCanvas(180, 180, 180, 30));
const foam2Tex = loadLin(A + 'foam2-B6vBNkcWas.jpg', fallbackCanvas(120, 120, 120, 120));
const foam3Tex = loadLin(A + 'foam3-CyaGqCrv.jpg', fallbackCanvas(110, 110, 110, 110));
const foam4Tex = loadLin(A + 'foam4-XPoWFsfC.jpg', fallbackCanvas(100, 100, 100, 100));

// ══════════════════════════════════════════════════════════════════
// 🗺️ TEXTURA DE PROFUNDIDADE
// ══════════════════════════════════════════════════════════════════
function bakeDepthTexture() {
  const N = 256;
  const data = new Uint8Array(N * N * 4);
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
const depthTex = bakeDepthTexture();

// ══════════════════════════════════════════════════════════════════
// 🎛️ UNIFORMS
// ══════════════════════════════════════════════════════════════════
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
  uWorldSize: { value: new THREE.Vector2(WORLD.sizeX, WORLD.sizeZ) },
  uTint:      { value: tintTex },
  uDepthT:    { value: depthTex },
  uSandDiff:  { value: sandDiffTex }, uSandNorm: { value: sandNormTex }, uSandDisp: { value: sandDispTex },
  uRockDiff:  { value: rockDiffTex }, uRockNorm: { value: rockNormTex }, uRockDisp: { value: rockDispTex },
  uFoam2:     { value: foam2Tex }, uFoam3: { value: foam3Tex }, uFoam4: { value: foam4Tex },
  uWind:      { value: 1 },
  uOpacity:   { value: 0.92 }
};

// ══════════════════════════════════════════════════════════════════
// 🏗️ MESH
// ══════════════════════════════════════════════════════════════════
export function createOceanMesh() {
  // ──────── VERTEX SHADER: 100% ORIGINAL ────────
  const VS = `
    uniform float uPhase,uHeight,uChop,uAmpTot;
    uniform vec2 uOffset,uBoatLocal,uWorldMin,uWorldSize;
    uniform sampler2D uBathy;
    varying vec3 vW,vN; varying float vCrest,vDamp,vSurf;
    varying vec2 vBuv;
    ${M_DECL}
    float H(vec2 p){float h=0.,ph; ${glslH()} return h*uHeight;}
    vec2 CH(vec2 p){vec2 c=vec2(0.);float ph; ${glslC()} return c*uChop;}
    void main(){
      vec2 p=position.xz+uOffset;
      vec2 buv=clamp((p-uWorldMin)/uWorldSize,0.0,1.0);
      vBuv = buv;
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
    }`;

  // ──────── FRAGMENT SHADER — correção do horizonte + profundidade escura ────────
  const FS = `
    precision highp float;
    uniform vec3 uSunDir,uSunCol,uDeep,uScat,uSkyRef,uFogColor,uDeck,uBoatPos;
    uniform float uFoamAmt,uTime2,uDeckI,uFogNear,uFogFar,uSpecularPower,uSpecularIntensity;
    uniform float uBoatHeading,uBoatSpeedN,uWind,uOpacity;
    uniform sampler2D uBathy,uTint;
    uniform sampler2D uSandDiff,uSandNorm,uSandDisp;
    uniform sampler2D uRockDiff,uRockNorm,uRockDisp;
    uniform sampler2D uFoam2,uFoam3,uFoam4;
    varying vec3 vW,vN; varying float vCrest,vDamp,vSurf;
    varying vec2 vBuv;

    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    float fbm3(vec2 p){float v=0.,a=0.5;for(int i=0;i<3;i++){v+=a*vnoise(p);p*=2.07;a*=0.5;}return v;}

    float voro(vec2 p,float t){
      vec2 i=floor(p),f=fract(p); float md=8.0;
      for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
        vec2 g=vec2(float(x),float(y));
        vec2 o=vec2(hash(i+g),hash(i+g+7.7));
        o=0.5+0.5*sin(t*0.7+6.2831*o);
        md=min(md,length(g+o-f));
      }
      return md;
    }
    float caustic(vec2 p,float t){
      float c1=voro(p,t);
      float c2=voro(p*1.6+3.7,-t*0.8);
      return pow(clamp(1.0-min(c1,c2)*1.7,0.0,1.0),2.0);
    }

    // reconstrói profundidade a partir do damp (0 praia → 1 fundo)
    // quanto maior damp, mais raso; quanto menor, mais fundo
    float depthFromDamp(float d){
      float x = 1.0 - d;
      return mix(32.0, 0.0, smoothstep(0.0, 1.0, x*x));
    }

    vec3 perturbNormal(vec3 N, vec2 uv, sampler2D nmap, float strength){
      vec3 nm = texture2D(nmap, uv).xyz * 2.0 - 1.0;
      vec3 q1 = dFdx(vW);
      vec3 q2 = dFdy(vW);
      vec2 st1 = dFdx(uv);
      vec2 st2 = dFdy(uv);
      vec3 S = normalize(q1 * st2.y - q2 * st1.y);
      vec3 T = normalize(-q1 * st2.x + q2 * st1.x);
      vec3 pert = (S * nm.x + T * nm.y) * strength;
      return normalize(N + pert + vec3(0.0, nm.z * 0.6, 0.0));
    }

    void main(){
      vec2 wp2 = vW.xz;
      float t2 = uTime2;
      float sunUp = max(uSunDir.y, 0.0);
      float dayAmt = clamp(length(uSunCol) * 4.0 + 0.05, 0.0, 1.0);

      // ════════ 🌊 normal da superfície ════════
      vec3 n = normalize(vN);
      float rippleAmp = (0.25 + 0.75 * uWind) * 0.55;
      float n1  = fbm3(wp2 * 0.55 + vec2(t2 * 0.35, t2 * 0.21));
      float n1x = fbm3((wp2 + vec2(0.4, 0.0)) * 0.55 + vec2(t2 * 0.35, t2 * 0.21));
      float n1z = fbm3((wp2 + vec2(0.0, 0.4)) * 0.55 + vec2(t2 * 0.35, t2 * 0.21));
      vec2 grad = vec2(n1x - n1, n1z - n1) * 2.4;
      grad += (vec2(vnoise(wp2 * 2.31 + vec2(0.4, 0.0)), vnoise(wp2 * 2.31 + vec2(0.0, 0.4)))
              - vnoise(wp2 * 2.31)) * 0.7;
      n = normalize(n + vec3(grad.x, 0.0, grad.y) * rippleAmp);

      vec3 V = normalize(cameraPosition - vW);
      float NdV = max(dot(n, V), 0.0);

      // ════════ 📏 profundidade local ════════
      float depth = depthFromDamp(vDamp);
      vec3 tint = texture2D(uTint, vBuv).rgb;

      // ════════ 🏖️ FUNDO VISÍVEL (só aparece no raso) ════════
      vec3 sandC = texture2D(uSandDiff, wp2 * 0.16).rgb;
      sandC = mix(sandC, texture2D(uSandDiff, wp2 * 0.045).rgb, 0.45);
      vec3 rockC = texture2D(uRockDiff, wp2 * 0.09).rgb;
      rockC = mix(rockC, texture2D(uRockDiff, wp2 * 0.22).rgb, 0.4);
      float nMix = fbm3(wp2 * 0.05);
      float rockMix = smoothstep(3.5, 9.0, depth + (nMix - 0.5) * 5.0);
      vec3 bottom = mix(sandC, rockC, rockMix);
      float disp = mix(texture2D(uSandDisp, wp2 * 0.16).r,
                       texture2D(uRockDisp, wp2 * 0.09).r, rockMix);
      bottom *= 0.62 + 0.58 * disp;
      bottom *= tint;

      vec3 nBottom = rockMix > 0.5
        ? perturbNormal(vec3(0.0, 1.0, 0.0), wp2 * 0.09, uRockNorm, 0.35)
        : perturbNormal(vec3(0.0, 1.0, 0.0), wp2 * 0.16, uSandNorm, 0.25);
      float bottomLit = clamp(dot(nBottom, normalize(uSunDir + vec3(0.0, 0.4, 0.0))), 0.15, 1.0);
      bottom *= bottomLit;

      vec3 sunC = uSunCol + vec3(0.05, 0.08, 0.12) * dayAmt;
      bottom *= sunC * 1.2 + vec3(0.10, 0.13, 0.17) * (0.35 + 0.65 * dayAmt);
      float caus = caustic(wp2 * 0.30, t2 * 0.9)
                 * exp(-max(depth, 0.0) * 0.28) * sunUp;
      bottom += uSunCol * caus * 0.9 * (1.0 - rockMix * 0.55);

      // ════════ 💧 corpo d'água: Beer–Lambert + scatter ════════
      vec3 T = exp(-max(depth, 0.0) * vec3(0.50, 0.13, 0.09) * 0.5);
      vec3 deepScatter = uScat * (0.28 + 0.55 * sunUp) + uDeep * 0.25;
      vec3 col = mix(deepScatter, bottom, clamp(T, 0.0, 1.0));
      col = mix(col, uDeep, smoothstep(18.0, 45.0, depth) * 0.55);

      // ════════ 🕳️ ABISMO: escurecimento progressivo em profundidade ════════
      //    Quanto mais fundo, mais a água escurece pra quase preto.
      //    Isso mata o efeito "transparente no horizonte" naturalmente,
      //    porque o horizonte é fundo. Fossas viram manchas muito escuras.
      vec3 abyssColor = vec3(0.005, 0.012, 0.022);     // quase preto azulado
      float abyssMix  = smoothstep(35.0, 180.0, depth); // começa 35m, total 180m
      col = mix(col, abyssColor, abyssMix * 0.82);
      // fossas (> 180m) ficam praticamente pretas — mistério visual
      float trenchMix = smoothstep(180.0, 225.0, depth);
      col = mix(col, abyssColor * 0.4, trenchMix * 0.9);

      // subsurface scattering
      float sss = pow(max(dot(V, -uSunDir), 0.0), 3.0) * sunUp;
      col += vec3(0.14, 0.52, 0.62) * sss * (0.35 + vCrest * 0.65) * dayAmt * 0.55 * (1.0 - abyssMix);

      // ════════ 🪞 Fresnel + reflexo do céu ════════
      float fres = 0.02 + 0.98 * pow(1.0 - NdV, 5.0);
      vec3 R = reflect(-V, n);
      vec3 skyR = uSkyRef * (0.7 + 0.6 * clamp(R.y * 2.5, 0.0, 1.0));
      float sunAz = pow(max(dot(normalize(vec3(R.x, 0.0, R.z) + vec3(0.0001)),
                                normalize(vec3(uSunDir.x, 0.0, uSunDir.z) + vec3(0.0001))), 0.0), 3.0);
      skyR += uSunCol * sunAz * (1.0 - clamp(R.y * 4.0, 0.0, 1.0)) * 0.28;
      col = mix(col, skyR, clamp(fres, 0.0, 1.0) * 0.85);

      // glitter do sol (some no abismo)
      float sp1 = pow(max(dot(R, uSunDir), 0.0), uSpecularPower);
      float sp2 = pow(max(dot(R, uSunDir), 0.0), 16.0);
      col += uSunCol * (sp1 * uSpecularIntensity * 4.0 + sp2 * 0.012) * (1.0 - abyssMix);

      // ════════ 🫧 ESPUMA ════════
      float fCrest = smoothstep(0.55, 0.98, vCrest) * uFoamAmt;
      float fmask = texture2D(uFoam3, wp2 * 0.22 + vec2(t2 * 0.030, t2 * 0.017)).r * 0.6
                  + texture2D(uFoam2, wp2 * 0.55 - vec2(t2 * 0.050, 0.0)).r * 0.4;
      fCrest *= 0.35 + 0.85 * fmask;

      vec3 toBoat = vW - uBoatPos;
      float bfx = sin(uBoatHeading), bfz = cos(uBoatHeading);
      float along = toBoat.x * bfx + toBoat.z * bfz;
      float lateral = abs(-toBoat.x * bfz + toBoat.z * bfx);
      float hullProx = (1.0 - smoothstep(1.0, 3.8, lateral))
                     * (1.0 - smoothstep(1.5, 4.5, abs(along)));
      hullProx *= smoothstep(0.03, 0.4, abs(uBoatSpeedN));
      float fHull = hullProx * 0.45;

      float shore = 1.0 - smoothstep(0.03, 0.32, vDamp);
      float swash = 0.5 + 0.5 * sin(t2 * 1.5
                                   + vnoise(wp2 * 0.35) * 6.2831
                                   + wp2.x * 0.02 + wp2.y * 0.02);
      swash = swash * swash;
      float foamLine = shore * (0.30 + 0.70 * swash);
      float edge = smoothstep(0.0, 0.05, vDamp) * (1.0 - smoothstep(0.05, 0.30, vDamp));
      foamLine = max(foamLine, edge * (0.55 + 0.45 * swash));
      foamLine = max(foamLine, vSurf * (0.35 + 0.4 * vnoise(wp2 * 1.3 + t2 * 0.7)));
      foamLine *= 0.4 + 0.8 * texture2D(uFoam4, wp2 * 0.13 + vec2(t2 * 0.02, t2 * 0.012)).r;
      float fShore = foamLine * 0.9 * uFoamAmt;

      float f = clamp(fCrest + fHull + fShore, 0.0, 1.0);
      vec3 foamCol = vec3(0.92, 0.95, 0.98) * (0.55 + 0.5 * sunUp)
                   + uSunCol * 0.25 + uSkyRef * 0.15;
      col = mix(col, foamCol, f);

      // areia molhada (só onde é raso)
      vec3 sandLit = sandC * (sunC * 1.15 + vec3(0.12, 0.14, 0.16))
                   * (0.72 + 0.28 * vnoise(wp2 * 2.1));
      float waterCover = smoothstep(0.0, 0.22, vDamp);
      col = mix(sandLit * 0.82, col, clamp(waterCover + f * 0.3, 0.0, 1.0));

      // AO de crista
      float shadowFactor = smoothstep(-0.2, 0.7, vCrest);
      float ao = mix(0.82, 1.1, shadowFactor);
      col *= ao;

      // luz do convés
      if (uDeckI > 0.001) {
        vec3 Ld = uDeck - vW; float d2 = dot(Ld, Ld); vec3 Ln = normalize(Ld);
        float att = uDeckI * 8.0 / (1.0 + 0.35 * d2);
        float dif = max(dot(n, Ln), 0.0);
        col += vec3(1.0, 0.75, 0.45) * att * dif;
        vec3 Rd = reflect(-Ln, n);
        col += vec3(1.0, 0.8, 0.5) * pow(max(dot(Rd, V), 0.0), 60.0) * att * 0.5;
      }

      // fog
      float fogF = smoothstep(uFogNear, uFogFar, distance(cameraPosition, vW));
      col = mix(col, uFogColor, fogF);

      // ════════ 💎 TRANSPARÊNCIA CORIGIDA ════════
      // RASO:     transparente (vê areia e fundo)
      // FUNDO:    opaco + escuro (oceano profundo)
      // HORIZONTE: sempre opaco (distância + profundidade grandes)
      //
      // Fatores:
      //   • depthAlpha: 0.55 (raso, 0m) → 1.0 (fundo, 40m+)
      //   • viewAlpha:  0.75 (reto) → 0.98 (oblíquo/horizonte)
      //   • distAlpha:  0.85 (perto) → 1.0 (longe, > 800m)
      //   • foam sempre opaca

      float distFromCam = distance(cameraPosition.xz, vW.xz);
      float depthAlpha = mix(0.55, 1.0, smoothstep(2.0, 45.0, depth));
      float viewAlpha  = mix(0.78, 1.0, fres);
      float distAlpha  = smoothstep(200.0, 900.0, distFromCam);

      // quanto mais fundo OU mais longe, mais opaco
      float alpha = mix(viewAlpha, 1.0, max(depthAlpha - 0.55, 0.0) * 2.0);
      alpha = mix(alpha, 1.0, distAlpha * 0.85);

      // horizonte sempre opaco (garante que não "veja através")
      float horizonFactor = smoothstep(0.45, 0.92, distAlpha);
      alpha = mix(alpha, 1.0, horizonFactor);

      // abismo sempre opaco
      alpha = mix(alpha, 1.0, abyssMix);

      // espuma sempre opaca
      alpha = mix(alpha, 1.0, f * 0.95);

      alpha *= uOpacity;
      alpha = clamp(alpha, 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
    }`;

  const seaMat = new THREE.ShaderMaterial({
    uniforms: seaUniforms,
    vertexShader: VS,
    fragmentShader: FS,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    extensions: { derivatives: true }
  });

  const seaGeo = new THREE.PlaneGeometry(
    CONFIG.ocean.size, CONFIG.ocean.size,
    CONFIG.ocean.segments, CONFIG.ocean.segments
  );
  seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.renderOrder = 5;
  state.sea = sea;
  return sea;
}

// ══════════════════════════════════════════════════════════════════
// 🔄 updateOceanUniforms — 100% ORIGINAL
// ══════════════════════════════════════════════════════════════════
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
  seaUniforms.uWind.value = state.windMul;
}