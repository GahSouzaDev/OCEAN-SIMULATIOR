// Futuro: mapa fixo com regiões, ilhas, portos, perigos.
import * as THREE from 'three';
import { state } from '../state.js';

export const REGIONS = {
  coastal: { name: 'Costa', bounds: { x: [-500, 500], z: [-500, 500] } },
  open_sea: { name: 'Mar Aberto', bounds: { x: [-2000, 2000], z: [-2000, 2000] } },
  // TODO: adicionar ilhas, recifes, zonas de tempestade
};

export function initWorldMap() {
  // stub: nada ainda
}

export function getRegionAt(x, z) {
  // retorna a região atual baseado na posição
  return 'open_sea';
}