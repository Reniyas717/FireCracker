/**
 * ThemeConfigs — data-driven sky theme definitions.
 * Each theme defines the visual feel of the background.
 */

export const THEME_IDS = {
  DIWALI_NIGHT: 'diwali_night',
  LAKESIDE: 'lakeside',
  DESERT: 'desert',
  SNOWY_MOUNTAINS: 'snowy_mountains',
  OCEAN_BEACH: 'ocean_beach',
};

export const THEMES = {
  [THEME_IDS.DIWALI_NIGHT]: {
    id: THEME_IDS.DIWALI_NIGHT,
    name: 'Diwali Night',
    description: 'Classic Indian festival night sky with city skyline',
    sky: {
      gradient: [
        { stop: 0, color: '#0a0a1a' },
        { stop: 0.3, color: '#0d0d2b' },
        { stop: 0.6, color: '#111133' },
        { stop: 1, color: '#1a1a2e' },
      ],
    },
    stars: { count: 200, color: 'rgba(220, 225, 255, VAR_ALPHA)' },
    moon: { visible: true, size: 20, glowColor: 'rgba(200, 210, 240, VAR_ALPHA)' },
    skyline: {
      type: 'city',
      baseY: 0.88,
      color: '#08080f',
      glowColor: 'rgba(255, 180, 80, 0.08)',
      tallChance: 0.08,
      tallHeight: { min: 30, max: 80 },
      mediumChance: 0.15,
      mediumHeight: { min: 15, max: 25 },
      smallVariation: 12,
    },
    waterReflection: false,
    ambientOverlay: null,
  },

  [THEME_IDS.LAKESIDE]: {
    id: THEME_IDS.LAKESIDE,
    name: 'Lakeside',
    description: 'Peaceful lakeside with tree silhouettes and water reflection',
    sky: {
      gradient: [
        { stop: 0, color: '#050818' },
        { stop: 0.3, color: '#0a1028' },
        { stop: 0.6, color: '#0f1535' },
        { stop: 1, color: '#131a3a' },
      ],
    },
    stars: { count: 250, color: 'rgba(200, 215, 255, VAR_ALPHA)' },
    moon: { visible: true, size: 25, glowColor: 'rgba(180, 200, 240, VAR_ALPHA)' },
    skyline: {
      type: 'trees',
      baseY: 0.82,
      color: '#060a12',
      glowColor: 'rgba(100, 160, 200, 0.05)',
      tallChance: 0.2,
      tallHeight: { min: 20, max: 60 },
      mediumChance: 0.3,
      mediumHeight: { min: 10, max: 30 },
      smallVariation: 8,
    },
    waterReflection: true,
    waterReflectionY: 0.82,
    ambientOverlay: 'fireflies',
  },

  [THEME_IDS.DESERT]: {
    id: THEME_IDS.DESERT,
    name: 'Desert',
    description: 'Warm desert night with dune silhouettes and a giant moon',
    sky: {
      gradient: [
        { stop: 0, color: '#0d0a08' },
        { stop: 0.3, color: '#1a1510' },
        { stop: 0.6, color: '#221a12' },
        { stop: 1, color: '#2a2018' },
      ],
    },
    stars: { count: 300, color: 'rgba(255, 240, 200, VAR_ALPHA)' },
    moon: { visible: true, size: 35, glowColor: 'rgba(255, 220, 160, VAR_ALPHA)' },
    skyline: {
      type: 'dunes',
      baseY: 0.9,
      color: '#0f0c08',
      glowColor: 'rgba(255, 200, 100, 0.04)',
      tallChance: 0,
      tallHeight: { min: 0, max: 0 },
      mediumChance: 0.5,
      mediumHeight: { min: 5, max: 20 },
      smallVariation: 15,
    },
    waterReflection: false,
    ambientOverlay: null,
  },

  [THEME_IDS.SNOWY_MOUNTAINS]: {
    id: THEME_IDS.SNOWY_MOUNTAINS,
    name: 'Snowy Mountains',
    description: 'Cool mountain night with snow peaks and falling snowflakes',
    sky: {
      gradient: [
        { stop: 0, color: '#080c14' },
        { stop: 0.3, color: '#101828' },
        { stop: 0.6, color: '#182030' },
        { stop: 1, color: '#1e2838' },
      ],
    },
    stars: { count: 180, color: 'rgba(220, 230, 255, VAR_ALPHA)' },
    moon: { visible: true, size: 22, glowColor: 'rgba(200, 220, 255, VAR_ALPHA)' },
    skyline: {
      type: 'mountains',
      baseY: 0.85,
      color: '#0c1018',
      glowColor: 'rgba(180, 200, 240, 0.06)',
      tallChance: 0.15,
      tallHeight: { min: 40, max: 100 },
      mediumChance: 0.3,
      mediumHeight: { min: 20, max: 50 },
      smallVariation: 10,
    },
    waterReflection: false,
    ambientOverlay: 'snow',
  },

  [THEME_IDS.OCEAN_BEACH]: {
    id: THEME_IDS.OCEAN_BEACH,
    name: 'Ocean Beach',
    description: 'Tropical beach night with palm trees and ocean reflection',
    sky: {
      gradient: [
        { stop: 0, color: '#060a10' },
        { stop: 0.3, color: '#0a1520' },
        { stop: 0.6, color: '#0f1a28' },
        { stop: 1, color: '#122030' },
      ],
    },
    stars: { count: 220, color: 'rgba(210, 225, 250, VAR_ALPHA)' },
    moon: { visible: true, size: 24, glowColor: 'rgba(190, 210, 240, VAR_ALPHA)' },
    skyline: {
      type: 'palms',
      baseY: 0.88,
      color: '#060c14',
      glowColor: 'rgba(100, 180, 220, 0.05)',
      tallChance: 0.12,
      tallHeight: { min: 30, max: 70 },
      mediumChance: 0.2,
      mediumHeight: { min: 10, max: 25 },
      smallVariation: 6,
    },
    waterReflection: true,
    waterReflectionY: 0.88,
    ambientOverlay: null,
  },
};

export const THEME_LIST = Object.values(THEMES);
