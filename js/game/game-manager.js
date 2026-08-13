// Futuro: state machine de modos de jogo (Free roam, Missão, Batalha, Sobrevivência).
export const GAME_MODES = {
  FREE_ROAM: 'free_roam',
  MISSION: 'mission',
  BATTLE: 'battle',
  SURVIVAL: 'survival'
};

let currentMode = GAME_MODES.FREE_ROAM;

export function getGameMode() { return currentMode; }
export function setGameMode(mode) {
  if (Object.values(GAME_MODES).includes(mode)) currentMode = mode;
}

export function updateGame(dt) {
  // lógica específica por modo aqui
}