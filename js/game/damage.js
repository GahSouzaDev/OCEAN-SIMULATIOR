// Futuro: sistema de dano, destruição de barcos, HP.
import { state } from '../state.js';

const boatHP = new Map(); // boatId -> hp

export function initDamage() {
  // Inicializar HP para barcos destrutíveis
}

export function applyDamage(boatId, amount) {
  const current = boatHP.get(boatId) || 100;
  const next = Math.max(0, current - amount);
  boatHP.set(boatId, next);
  if (next <= 0) onBoatDestroyed(boatId);
}

function onBoatDestroyed(boatId) {
  // animação de naufrágio, spawn de destroços
  console.log(`Boat ${boatId} destroyed!`);
}

export function updateDamage(dt) {
  // reparo lento, dano por tempestade, etc.
}