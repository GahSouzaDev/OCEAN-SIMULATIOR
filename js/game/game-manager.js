// js/game/game-manager.js — descoberta de região +驱动 do mundo (paralaxe/luzes)
import { state } from '../state.js';
import { getDiscoveryRegionAt, updateWorldFX } from '../world/world-map.js';
import { actx, masterFilter } from '../audio/audio-manager.js';
export const GAME_MODES = { FREE_ROAM:'free_roam', MISSION:'mission', BATTLE:'battle', SURVIVAL:'survival' };
let currentMode = GAME_MODES.FREE_ROAM;
export function getGameMode() { return currentMode; }
export function setGameMode(mode) { if (Object.values(GAME_MODES).includes(mode)) currentMode = mode; }
function note(f,t0,dur,type,vol,slideTo){
  if (!actx) return;
  const o=actx.createOscillator(), g=actx.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t0);
  if (slideTo) o.frequency.linearRampToValueAtTime(slideTo,t0+dur);
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.linearRampToValueAtTime(vol,t0+0.04);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g); g.connect(masterFilter); o.start(t0); o.stop(t0+dur+0.05);
}
function playRegionSting(mood){
  if (!actx || !state.audioOn) return;
  const t = actx.currentTime + 0.05;
  if (mood==='caicara'){ note(392,t,0.5,'triangle',0.20); note(494,t+0.13,0.5,'triangle',0.18); note(587,t+0.26,0.9,'triangle',0.16); }
  else if (mood==='urbano'){ note(98,t,1.3,'sawtooth',0.16); note(147,t+0.06,1.3,'sawtooth',0.12); }
  else if (mood==='mistico'){ note(220,t,2.2,'sine',0.18); note(311,t+0.18,2.0,'sine',0.10); note(1760,t+0.5,0.9,'sine',0.04); }
  else if (mood==='selva'){ note(660,t+0.1,0.6,'sine',0.12,590); note(440,t+0.5,0.7,'sine',0.10,415); }
  else if (mood==='perigo'){ note(55,t,2.0,'sawtooth',0.18); note(466,t+0.35,0.5,'triangle',0.09); note(494,t+0.35,0.5,'triangle',0.09); }
  else { note(294,t,1.6,'sine',0.11); note(440,t,1.6,'sine',0.07); note(588,t+0.12,1.4,'sine',0.05); }
}
let bannerBuilt=false, hideT=0;
function buildBanner(){
  bannerBuilt=true;
  const st=document.createElement('style');
  st.textContent=`
    #rb-top,#rb-bot{position:fixed;left:0;right:0;height:9vh;background:#000;z-index:60;
      pointer-events:none;transition:transform .7s cubic-bezier(.22,.9,.3,1);}
    #rb-top{top:0;transform:translateY(-100%);}
    #rb-bot{bottom:0;transform:translateY(100%);}
    #rb-name{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:61;
      font-family:'Oswald',sans-serif;font-size:34px;letter-spacing:14px;color:#e8f4f8;
      text-shadow:0 0 24px rgba(111,228,255,.35);opacity:0;transition:opacity .9s ease;
      pointer-events:none;white-space:nowrap;}
    #rb-name small{display:block;text-align:center;font-size:10px;letter-spacing:6px;
      color:rgba(232,244,248,.5);margin-top:6px;}
    .rb-show #rb-top{transform:translateY(0);} .rb-show #rb-bot{transform:translateY(0);}
    .rb-show #rb-name{opacity:1;}`;
  document.head.appendChild(st);
  const el=document.createElement('div');
  el.innerHTML=`<div id="rb-top"></div><div id="rb-bot"></div>
    <div id="rb-name"><span id="rb-txt"></span><small>MARÉ DE PERUÍBE</small></div>`;
  document.body.appendChild(el);
}
function showRegionBanner(name){
  if (!bannerBuilt) buildBanner();
  document.getElementById('rb-txt').textContent = name.toUpperCase();
  document.body.classList.add('rb-show');
  clearTimeout(hideT);
  hideT = setTimeout(()=>document.body.classList.remove('rb-show'), 4200);
}
let lastRegion=null, regionCd=0, bootT=0, pendingName=null, pendingMood=null;
export function updateGame(dt) {
  updateWorldFX(); // paralaxe da serra + luzes das cidades à noite
  regionCd -= dt;
  const p = state.boatRoot.position;
  const r = getDiscoveryRegionAt(p.x, p.z);
  if (r.id !== lastRegion) {
    if (lastRegion === null) { lastRegion=r.id; pendingName=r.name; pendingMood=r.mood; bootT=2.5; }
    else if (regionCd <= 0) { showRegionBanner(r.name); playRegionSting(r.mood); regionCd=20; lastRegion=r.id; }
    else lastRegion = r.id;
  }
  if (bootT > 0) {
    bootT -= dt;
    if (bootT <= 0 && pendingName) {
      showRegionBanner(pendingName); playRegionSting(pendingMood);
      pendingName=null; regionCd=12;
    }
  }
}