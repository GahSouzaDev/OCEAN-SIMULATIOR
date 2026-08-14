export const CONFIG = {
  ocean: { size: 3000, segments: 512 },
  wind: { direction: 0.6, strength: 1.0 },
  weather: { mode: 'MODERATE' },
  time: { hour: 6.5 },
  debug: false,
  audio: { enabled: true },
  autoSun: true,
  sunSpeed: 0.10
};

export const WEATHERS = {
  CALM:     { wave: 0.35, wind: 0.3, foam: 0.5, cloudCoverage: 0.25 },
  MODERATE: { wave: 1.0,  wind: 1.0, foam: 1.0, cloudCoverage: 0.45 },
  STORM:    { wave: 1.9,  wind: 1.8, foam: 1.6, cloudCoverage: 0.85 },
  FOG:      { wave: 0.5,  wind: 0.5, foam: 0.8, cloudCoverage: 0.70 },
  RAIN:     { wave: 1.2,  wind: 1.3, foam: 1.2, cloudCoverage: 0.75 }
};

export const TIME_PRESETS = {
  morning: 6.5, noon: 12, afternoon: 15.5, sunset: 19.5, night: 22
};

export const CAM_NAMES = ['CHASE','ORBIT','CINEMATIC','TOP','UNDERWATER'];