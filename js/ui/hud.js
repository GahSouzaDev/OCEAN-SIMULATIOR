import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { AMP_SUM } from '../ocean/waves.js';

let hudT = 0;

function fmtTime(h) {
  const hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

export function updateHUD(dt) {
  hudT += dt;
  if (hudT < 0.15) return;
  hudT = 0;
  document.getElementById('ro-wind').textContent =
    Math.max(0, state.windMul * 11 + Math.sin(state.simTime * 0.3) * 1.5 * state.windMul).toFixed(0) + ' kn';
  document.getElementById('ro-waveheight').textContent =
    (AMP_SUM * state.waveHMul * 1.4).toFixed(1) + ' m';
  document.getElementById('ro-wavespeed').textContent = state.waveSMul.toFixed(1) + 'x';
  document.getElementById('ro-boatspeed').textContent =
    (Math.abs(state.speed) * 1.944).toFixed(1) + ' kn';
  document.getElementById('ro-time').textContent = fmtTime(CONFIG.time.hour);
  document.getElementById('ro-weather').textContent = CONFIG.weather.mode;
  const hdg = ((state.heading * 180 / Math.PI) % 360 + 360) % 360;
  document.getElementById('ro-heading').textContent =
    'HDG ' + String(Math.round(hdg)).padStart(3, '0') + '°';
}

export function bindSliders() {
  function bind(id, vid, fn, fmt) {
    const el = document.getElementById(id), vl = document.getElementById(vid);
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      fn(v);
      if (vl) vl.textContent = fmt(v);
    });
  }
  bind('sld-amp', 'lbl-amp', v => state.waveHMul = v, v => v.toFixed(1) + 'x');
  bind('sld-speed', 'lbl-speed', v => state.waveSMul = v, v => v.toFixed(1) + 'x');
  bind('sld-wind', 'lbl-wind', v => state.windMul = v, v => v.toFixed(1) + 'x');
  bind('sld-foam', 'lbl-foam', v => state.foamMul = v, v => v.toFixed(1) + 'x');
  bind('sld-hour', 'lbl-hour', v => { CONFIG.time.hour = v; }, v => {
    const h = Math.floor(v), m = Math.floor((v - h) * 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  });
  bind('sld-sun-speed', 'lbl-sun-speed', v => CONFIG.sunSpeed = v, v => v.toFixed(2) + 'x');
}