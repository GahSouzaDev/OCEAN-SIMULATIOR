// js/boats/boat-manager.js
import { state } from '../state.js';
import { buildTrawler } from './trawler.js';
import { buildPilot } from './pilot.js';

export const boats = { trawler: buildTrawler(), pilot: buildPilot() };

// variável INTERNA com nome diferente da função exportada
let _currentBoatName = 'trawler';

export function curBoat() { return boats[_currentBoatName]; }
export function currentBoatName() { return _currentBoatName; }

export function initBoatManager() {
  state.tilt.add(boats.trawler.group, boats.pilot.group);
}

export function setBoat(name) {
  if (!boats[name]) return;
  _currentBoatName = name;
  boats.trawler.group.visible = (name === 'trawler');
  boats.pilot.group.visible   = (name === 'pilot');
  document.querySelectorAll('.hbtn.boat')
    .forEach(b => b.classList.toggle('active', b.dataset.boat === name));
}

export function setDeckLight(on, onClickSnd) {
  state.deckOn = on;
  for (const k of ['trawler', 'pilot']) {
    const b = boats[k];
    b.deckLight.visible = on;
    b.deckLight.intensity = on ? 8.0 : 0;
    if (b.boatLight) {
      b.boatLight.visible = on;
      b.boatLight.intensity = on ? 4.0 : 0;
    }
    b.bulbMat.color.setHex(on ? 0xffffcc : 0x3a3a32);
  }
  const btn = document.getElementById('btn-deck-light');
  if (btn) {
    btn.textContent = on ? '💡 LUZ DO CONVÉS: ON' : '💡 LUZ DO CONVÉS: OFF';
    btn.classList.toggle('sun-active', on);
  }
  if (onClickSnd) onClickSnd();
}