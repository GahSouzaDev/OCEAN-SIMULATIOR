// js/world/regions.js — regiões de descoberta + personalidade do mar
export const OPEN_REGION = { id:'aberto', name:'Mar Aberto', mood:'aberto', x:0, z:2000, r:1, swell:1.15, chop:1.1, tint:[0.85,1.0,1.15] };
export const REGIONS = [
  { id:'barrauna',  name:'Barra do Una',            mood:'selva',   x:-1100, z:470, r:260, swell:0.80, chop:0.80, tint:[0.55,0.95,0.75] },
  { id:'guarau',    name:'Guarau',                  mood:'selva',   x: -960, z:380, r:160, swell:0.85, chop:0.85, tint:[0.55,0.95,0.75] },
  { id:'reserva',   name:'Lagoas da Reserva',       mood:'selva',   x: -560, z: 80, r:140, swell:0.90, chop:0.90, tint:[0.60,0.95,0.80] },
  { id:'peruibe',   name:'Peruíbe',                 mood:'caicara', x: -740, z:220, r:200, swell:1.00, chop:1.00, tint:[1,1,1] },
  { id:'pedra',     name:'Pedra da Serpente',       mood:'mistico', x: -790, z:280, r:150, swell:1.05, chop:1.10, tint:[0.80,0.90,1.00] },
  { id:'costao',    name:'Ilha do Costão',          mood:'mistico', x: -760, z:330, r:120, swell:1.10, chop:1.10, tint:[0.70,0.85,0.95] },
  { id:'itanhaem',  name:'Itanhaém',                mood:'caicara', x: -450, z: 60, r:180, swell:1.00, chop:1.00, tint:[1,1,1] },
  { id:'mongagua',  name:'Mongaguá',                mood:'caicara', x: -290, z:-20, r:140, swell:0.95, chop:0.95, tint:[1,1,1] },
  { id:'praiag',    name:'Praia Grande',            mood:'urbano',  x:  -60, z:-120,r:160, swell:1.00, chop:1.00, tint:[0.9,0.95,0.95] },
  { id:'santos',    name:'Baía de Santos',          mood:'urbano',  x:   90, z:-160,r:200, swell:0.70, chop:0.70, tint:[0.75,0.85,0.85] },
  { id:'guaruja',   name:'Guarujá',                 mood:'urbano',  x:  300, z:-140,r:160, swell:0.80, chop:0.85, tint:[0.8,0.9,0.9] },
  { id:'queimada',  name:'Ilha da Queimada Grande', mood:'perigo',  x: -680, z:700, r:260, swell:1.35, chop:1.25, tint:[0.40,0.50,0.60] },
  { id:'lajeconc',  name:'Laje da Conceição',       mood:'perigo',  x: -430, z:260, r:120, swell:1.15, chop:1.15, tint:[0.60,0.80,0.90] },
  { id:'lajesantos',name:'Laje de Santos',          mood:'aberto',  x:  350, z:250, r:140, swell:1.20, chop:1.10, tint:[0.80,1.00,1.20] },
  { id:'alcatrazes',name:'Alcatrazes',              mood:'mistico', x:  900, z:420, r:220, swell:1.25, chop:1.20, tint:[0.50,0.70,0.90] },
];
function sstep(a,b,x){ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); }
export function getDiscoveryRegionAt(x,z){
  for (const r of REGIONS) if (Math.hypot(x-r.x,z-r.z)<r.r) return r;
  return OPEN_REGION;
}
export function regionWaveAt(x,z){
  let best=null, bw=0;
  for (const r of REGIONS){
    const d=Math.hypot(x-r.x,z-r.z);
    const w=1-sstep(r.r*0.72,r.r,d);
    if (w>bw){ bw=w; best=r; }
  }
  if (!best) return { swell:OPEN_REGION.swell, chop:OPEN_REGION.chop, tint:OPEN_REGION.tint };
  const o=OPEN_REGION;
  return {
    swell: o.swell+(best.swell-o.swell)*bw,
    chop:  o.chop +(best.chop -o.chop )*bw,
    tint:  [0,1,2].map(i=> o.tint[i]+(best.tint[i]-o.tint[i])*bw)
  };
}