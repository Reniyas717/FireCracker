/**
 * CrackerConfigs — data-driven configuration for every firecracker type.
 * Each config defines the visual, physics, and audio behavior.
 * The engine reads these configs; no per-type logic lives inside the render loop.
 */

import {
  burstChrysanthemum,
  burstRadial,
  burstRing,
  burstDoubleRing,
  burstPalm,
  burstCrossette,
  burstWillow,
  burstHeart,
  randomPalette,
  randomColorFromPalette,
  BURST_PALETTES,
} from './BurstShapes.js';

/**
 * All cracker type identifiers.
 */
export const CRACKER_TYPES = {
  ROCKET: 'rocket',
  ANAR: 'anar',
  CHAKRI: 'chakri',
  PHULJHARI: 'phuljhari',
  SUTLI_BOMB: 'sutli_bomb',
  LADI: 'ladi',
  ROMAN_CANDLE: 'roman_candle',
  SHOWER_WILLOW: 'shower_willow',
  // New types
  MULTI_BREAK: 'multi_break',
  PEONY: 'peony',
  STROBE: 'strobe',
  SNAKE: 'snake',
  FLOWER_BOUQUET: 'flower_bouquet',
  SKY_LANTERN: 'sky_lantern',
  MESSAGE_ROCKET: 'message_rocket',
  HEART_ROCKET: 'heart_rocket',
  CAKE_12: 'cake_12',
  CAKE_100: 'cake_100',
};

/**
 * Cracker config definitions.
 */
export const CRACKER_CONFIGS = {
  [CRACKER_TYPES.ROCKET]: {
    name: 'Rocket',
    description: 'Launches with a whistle, bursts into a chrysanthemum.',
    placement: 'ground',
    launchPhase: {
      enabled: true,
      speed: 500,
      trailParticleRate: 60,
      trailParticleConfig: {
        size: 2.5,
        maxLife: 0.4,
        gravity: 50,
        drag: 0.95,
        useColorTemp: true,
        hasTrail: false,
        type: 'spark',
      },
      duration: 0.8,
      wobble: 15,
    },
    burstPhase: {
      enabled: true,
      particleCount: 160,
      getBurstVelocities: (count, speed) => burstChrysanthemum(count, speed),
      speed: 320,
      particleConfig: {
        size: 3.5,
        maxLife: 2.2,
        gravity: 140,
        drag: 0.965,
        useColorTemp: true,
        hasTrail: true,
        trailLength: 8,
        type: 'default',
      },
      screenFlash: true,
      cameraShake: 3,
      spawnSmoke: true,
      smokeCount: 8,
    },
    decayPhase: {
      smokeConfig: {
        size: 4, maxLife: 3, gravity: -10, drag: 0.99,
        smokeSize: 8, smokeGrowRate: 15, type: 'smoke',
      },
    },
    audio: { launchWhistle: true, burstBoom: true, boomDepth: 'medium', crackleDecay: true },
  },

  [CRACKER_TYPES.ANAR]: {
    name: 'Anar',
    description: 'Flower Pot — fountains colorful sparks upward.',
    placement: 'ground',
    launchPhase: { enabled: false },
    burstPhase: { enabled: false },
    continuousEmitter: {
      enabled: true,
      duration: 4,
      particleRate: 150,
      coneAngle: Math.PI / 6,
      baseAngle: -Math.PI / 2,
      speed: 250,
      speedVariance: 100,
      particleConfig: {
        size: 2.5, maxLife: 1.0, gravity: 180, drag: 0.96,
        useColorTemp: true, hasTrail: false, type: 'spark',
      },
      colorShift: true,
    },
    decayPhase: {
      smokeConfig: {
        size: 3, maxLife: 2, gravity: -8, drag: 0.99,
        smokeSize: 6, smokeGrowRate: 10, type: 'smoke',
      },
    },
    audio: { launchWhistle: false, burstBoom: false, continuousSizzle: true },
  },

  [CRACKER_TYPES.CHAKRI]: {
    name: 'Chakri',
    description: 'Spinning Wheel — spins rapidly throwing sparks.',
    placement: 'ground',
    launchPhase: { enabled: false },
    burstPhase: { enabled: false },
    spinner: {
      enabled: true,
      duration: 4,
      rotationAccel: 15,
      maxRotationSpeed: 40,
      particleRate: 120,
      armCount: 2,
      particleConfig: {
        size: 2, maxLife: 0.5, gravity: 100, drag: 0.94,
        useColorTemp: true, hasTrail: false, type: 'spark',
      },
      wobble: 3,
    },
    decayPhase: {
      smokeConfig: {
        size: 2, maxLife: 1.5, gravity: -5, drag: 0.99,
        smokeSize: 5, smokeGrowRate: 8, type: 'smoke',
      },
    },
    audio: { launchWhistle: false, burstBoom: false, spinWhir: true },
  },

  [CRACKER_TYPES.PHULJHARI]: {
    name: 'Phuljhari',
    description: 'Sparkler — fine sparks that follow your cursor.',
    placement: 'cursor',
    launchPhase: { enabled: false },
    burstPhase: { enabled: false },
    sparkler: {
      enabled: true,
      duration: 8,
      particleRate: 80,
      spread: Math.PI,
      speed: 80,
      speedVariance: 40,
      particleConfig: {
        size: 1.5, maxLife: 0.4, gravity: 60, drag: 0.92,
        useColorTemp: false, baseColor: { r: 255, g: 220, b: 120 },
        hasTrail: false, type: 'spark', flickerRate: 30,
      },
    },
    decayPhase: { smokeConfig: null },
    audio: { launchWhistle: false, burstBoom: false, gentleCrackle: true },
  },

  [CRACKER_TYPES.SUTLI_BOMB]: {
    name: 'Sutli Bomb',
    description: 'Massive flash + shockwave ring + deep boom.',
    placement: 'ground',
    launchPhase: { enabled: false },
    burstPhase: {
      enabled: true,
      particleCount: 80,
      getBurstVelocities: (count, speed) => burstRadial(count, speed, 150),
      speed: 450,
      particleConfig: {
        size: 5, maxLife: 1.0, gravity: 250, drag: 0.91,
        useColorTemp: true, hasTrail: true, trailLength: 3, type: 'default',
      },
      screenFlash: true,
      flashIntensity: 0.9,
      cameraShake: 12,
      spawnShockwave: true,
      shockwaveConfig: { maxRadius: 300, maxLife: 0.6, ringWidth: 6, type: 'shockwave' },
      spawnSmoke: true,
      smokeCount: 12,
    },
    decayPhase: {
      smokeConfig: {
        size: 5, maxLife: 2.5, gravity: -15, drag: 0.995,
        smokeSize: 12, smokeGrowRate: 20, type: 'smoke',
      },
    },
    audio: { launchWhistle: false, burstBoom: true, boomDepth: 'deep', crackleDecay: false },
  },

  [CRACKER_TYPES.LADI]: {
    name: 'Ladi',
    description: 'Chain crackers — rapid pop-pop-pop along a string.',
    placement: 'ground',
    launchPhase: { enabled: false },
    burstPhase: { enabled: false },
    chain: {
      enabled: true,
      totalPops: 20,
      popInterval: 0.08,
      stringLength: 200,
      popParticleCount: 8,
      popSpeed: 120,
      particleConfig: {
        size: 2, maxLife: 0.3, gravity: 150, drag: 0.92,
        useColorTemp: true, hasTrail: false, type: 'spark',
      },
      screenFlash: false,
      miniFlash: true,
    },
    decayPhase: { smokeConfig: null },
    audio: { launchWhistle: false, burstBoom: false, rapidPop: true },
  },

  [CRACKER_TYPES.ROMAN_CANDLE]: {
    name: 'Roman Candle',
    description: 'Shoots glowing fireballs upward in succession.',
    placement: 'ground',
    launchPhase: { enabled: false },
    burstPhase: { enabled: false },
    sequentialShooter: {
      enabled: true,
      shotCount: 5,
      shotInterval: 0.6,
      fireballSpeed: 350,
      fireballAngle: -Math.PI / 2 + 0.15,
      angleVariance: 0.2,
      fireballConfig: {
        size: 6, maxLife: 1.5, gravity: 150, drag: 0.97,
        useColorTemp: true, hasTrail: true, trailLength: 10, type: 'default',
      },
      trailParticleRate: 40,
      trailConfig: {
        size: 2, maxLife: 0.3, gravity: 80, drag: 0.94,
        useColorTemp: true, hasTrail: false, type: 'spark',
      },
    },
    decayPhase: { smokeConfig: null },
    audio: { launchWhistle: false, burstBoom: false, softThump: true },
  },

  [CRACKER_TYPES.SHOWER_WILLOW]: {
    name: 'Shower',
    description: 'Willow burst with long, slow-falling drooping trails.',
    placement: 'ground',
    launchPhase: {
      enabled: true,
      speed: 450,
      trailParticleRate: 50,
      trailParticleConfig: {
        size: 2, maxLife: 0.3, gravity: 40, drag: 0.96,
        useColorTemp: true, hasTrail: false, type: 'spark',
      },
      duration: 0.9,
      wobble: 10,
    },
    burstPhase: {
      enabled: true,
      particleCount: 80,
      getBurstVelocities: (count, speed) => burstWillow(count, speed),
      speed: 180,
      particleConfig: {
        size: 2.5, maxLife: 3.5, gravity: 60, drag: 0.993,
        useColorTemp: true, hasTrail: true, trailLength: 12, type: 'default',
      },
      screenFlash: false,
      cameraShake: 1,
      spawnSmoke: true,
      smokeCount: 5,
    },
    decayPhase: {
      smokeConfig: {
        size: 3, maxLife: 4, gravity: -5, drag: 0.998,
        smokeSize: 6, smokeGrowRate: 8, type: 'smoke',
      },
    },
    audio: { launchWhistle: true, burstBoom: true, boomDepth: 'light', crackleDecay: true },
  },

  // ——— NEW TYPES ———

  [CRACKER_TYPES.MULTI_BREAK]: {
    name: 'Multi-Break',
    description: 'Double explosion — bursts, then sub-clusters burst again.',
    placement: 'ground',
    launchPhase: {
      enabled: true,
      speed: 550,
      trailParticleRate: 70,
      trailParticleConfig: {
        size: 3, maxLife: 0.5, gravity: 50, drag: 0.95,
        useColorTemp: true, hasTrail: false, type: 'spark',
      },
      duration: 0.9,
      wobble: 12,
    },
    burstPhase: {
      enabled: true,
      particleCount: 30,
      getBurstVelocities: (count, speed) => burstCrossette(count, speed),
      speed: 250,
      particleConfig: {
        size: 4, maxLife: 2.0, gravity: 80, drag: 0.97,
        useColorTemp: true, hasTrail: true, trailLength: 5,
        type: 'default', canSplit: true, splitTime: 0.4,
      },
      screenFlash: true,
      flashIntensity: 0.5,
      cameraShake: 5,
      spawnSmoke: true,
      smokeCount: 10,
    },
    decayPhase: {
      smokeConfig: {
        size: 4, maxLife: 3, gravity: -10, drag: 0.99,
        smokeSize: 8, smokeGrowRate: 12, type: 'smoke',
      },
    },
    audio: { launchWhistle: true, burstBoom: true, boomDepth: 'medium', crackleDecay: true },
  },

  [CRACKER_TYPES.PEONY]: {
    name: 'Peony',
    description: 'Clean round burst — particles burn out suddenly, no trails.',
    placement: 'ground',
    launchPhase: {
      enabled: true,
      speed: 480,
      trailParticleRate: 50,
      trailParticleConfig: {
        size: 2, maxLife: 0.35, gravity: 45, drag: 0.95,
        useColorTemp: true, hasTrail: false, type: 'spark',
      },
      duration: 0.85,
      wobble: 12,
    },
    burstPhase: {
      enabled: true,
      particleCount: 100,
      getBurstVelocities: (count, speed) => burstRadial(count, speed, 60),
      speed: 260,
      particleConfig: {
        size: 3.5, maxLife: 1.2, gravity: 100, drag: 0.96,
        useColorTemp: true, hasTrail: false, type: 'default',
      },
      screenFlash: true,
      cameraShake: 2,
      spawnSmoke: true,
      smokeCount: 6,
    },
    decayPhase: {
      smokeConfig: {
        size: 3, maxLife: 2, gravity: -8, drag: 0.99,
        smokeSize: 6, smokeGrowRate: 10, type: 'smoke',
      },
    },
    audio: { launchWhistle: true, burstBoom: true, boomDepth: 'medium', crackleDecay: false },
  },

  [CRACKER_TYPES.STROBE]: {
    name: 'Strobe',
    description: 'Burst where particles flash on/off rapidly — blinking effect.',
    placement: 'ground',
    launchPhase: {
      enabled: true,
      speed: 500,
      trailParticleRate: 55,
      trailParticleConfig: {
        size: 2.5, maxLife: 0.4, gravity: 50, drag: 0.95,
        useColorTemp: true, hasTrail: false, type: 'spark',
      },
      duration: 0.8,
      wobble: 14,
    },
    burstPhase: {
      enabled: true,
      particleCount: 80,
      getBurstVelocities: (count, speed) => burstRadial(count, speed, 70),
      speed: 240,
      particleConfig: {
        size: 3, maxLife: 2.5, gravity: 90, drag: 0.97,
        useColorTemp: false, baseColor: { r: 255, g: 255, b: 255 },
        hasTrail: false, type: 'strobe', flickerRate: 20,
      },
      screenFlash: true,
      cameraShake: 3,
      spawnSmoke: true,
      smokeCount: 5,
    },
    decayPhase: {
      smokeConfig: {
        size: 3, maxLife: 2, gravity: -8, drag: 0.99,
        smokeSize: 6, smokeGrowRate: 10, type: 'smoke',
      },
    },
    audio: { launchWhistle: true, burstBoom: true, boomDepth: 'light', crackleDecay: true },
  },

  [CRACKER_TYPES.SNAKE]: {
    name: 'Snake',
    description: 'Ground spinner that crawls with sparks in a winding path.',
    placement: 'ground',
    launchPhase: { enabled: false },
    burstPhase: { enabled: false },
    groundCrawler: {
      enabled: true,
      duration: 5,
      speed: 80,
      turnRate: 3,
      particleRate: 100,
      particleConfig: {
        size: 2, maxLife: 0.6, gravity: 80, drag: 0.93,
        useColorTemp: true, hasTrail: false, type: 'spark',
      },
    },
    decayPhase: {
      smokeConfig: {
        size: 2, maxLife: 1.5, gravity: -5, drag: 0.99,
        smokeSize: 4, smokeGrowRate: 6, type: 'smoke',
      },
    },
    audio: { launchWhistle: false, burstBoom: false, continuousSizzle: true },
  },

  [CRACKER_TYPES.FLOWER_BOUQUET]: {
    name: 'Bouquet',
    description: 'Multiple small bursts clustered at different heights.',
    placement: 'ground',
    launchPhase: {
      enabled: true,
      speed: 520,
      trailParticleRate: 55,
      trailParticleConfig: {
        size: 2.5, maxLife: 0.4, gravity: 50, drag: 0.95,
        useColorTemp: true, hasTrail: false, type: 'spark',
      },
      duration: 0.85,
      wobble: 12,
    },
    burstPhase: {
      enabled: true,
      particleCount: 60,
      getBurstVelocities: (count, speed) => burstRadial(count, speed, 50),
      speed: 200,
      particleConfig: {
        size: 2.5, maxLife: 1.5, gravity: 110, drag: 0.97,
        useColorTemp: true, hasTrail: true, trailLength: 4, type: 'default',
      },
      screenFlash: true,
      cameraShake: 2,
      spawnSmoke: true,
      smokeCount: 6,
      // Special: spawn sub-bursts
      subBursts: 3,
      subBurstDelay: 0.15,
      subBurstSpread: 60,
    },
    decayPhase: {
      smokeConfig: {
        size: 3, maxLife: 2.5, gravity: -8, drag: 0.99,
        smokeSize: 7, smokeGrowRate: 10, type: 'smoke',
      },
    },
    audio: { launchWhistle: true, burstBoom: true, boomDepth: 'light', crackleDecay: true },
  },

  [CRACKER_TYPES.SKY_LANTERN]: {
    name: 'Sky Lantern',
    description: 'Glowing paper lantern that rises slowly with warm amber glow.',
    placement: 'ground',
    launchPhase: { enabled: false },
    burstPhase: { enabled: false },
    lantern: {
      enabled: true,
      duration: 12,
      riseSpeed: 40,
      driftSpeed: 15,
      glowSize: 12,
      glowColor: { r: 255, g: 180, b: 60 },
      particleRate: 8,
      particleConfig: {
        size: 1.5, maxLife: 1.0, gravity: -10, drag: 0.98,
        useColorTemp: false, baseColor: { r: 255, g: 160, b: 40 },
        hasTrail: false, type: 'spark',
      },
    },
    decayPhase: { smokeConfig: null },
    audio: { launchWhistle: false, burstBoom: false },
  },

  [CRACKER_TYPES.MESSAGE_ROCKET]: {
    name: 'Message',
    description: 'Rocket that spells out your custom message in the sky.',
    placement: 'ground',
    launchPhase: {
      enabled: true,
      speed: 480,
      trailParticleRate: 60,
      trailParticleConfig: {
        size: 2.5, maxLife: 0.4, gravity: 50, drag: 0.95,
        useColorTemp: true, hasTrail: false, type: 'spark',
      },
      duration: 0.85,
      wobble: 14,
    },
    burstPhase: {
      enabled: true,
      particleCount: 80,
      getBurstVelocities: (count, speed) => burstRadial(count, speed, 50),
      speed: 200,
      particleConfig: {
        size: 4, maxLife: 2.5, gravity: 40, drag: 0.985,
        useColorTemp: false, baseColor: { r: 255, g: 220, b: 100 },
        hasTrail: false, type: 'text',
      },
      screenFlash: true,
      cameraShake: 3,
      spawnSmoke: true,
      smokeCount: 6,
    },
    decayPhase: {
      smokeConfig: {
        size: 3, maxLife: 2, gravity: -8, drag: 0.99,
        smokeSize: 6, smokeGrowRate: 10, type: 'smoke',
      },
    },
    audio: { launchWhistle: true, burstBoom: true, boomDepth: 'medium', crackleDecay: true },
    requiresMessage: true,
  },

  [CRACKER_TYPES.HEART_ROCKET]: {
    name: 'Heart',
    description: 'A premium rocket that bursts into a perfect glowing heart shape.',
    placement: 'ground',
    launchPhase: {
      enabled: true,
      speed: 450,
      trailParticleRate: 60,
      trailParticleConfig: { size: 2.5, maxLife: 0.4, gravity: 50, drag: 0.95, useColorTemp: true, hasTrail: false, type: 'spark' },
      duration: 0.9, wobble: 10,
    },
    burstPhase: {
      enabled: true,
      particleCount: 100,
      getBurstVelocities: (count, speed) => burstHeart(count, speed),
      speed: 150,
      particleConfig: { size: 4, maxLife: 2.0, gravity: 20, drag: 0.98, useColorTemp: false, baseColor: {r: 255, g: 50, b: 50}, hasTrail: true, trailLength: 4, type: 'default' },
      screenFlash: true, cameraShake: 2, spawnSmoke: true, smokeCount: 6,
    },
    decayPhase: { smokeConfig: { size: 3, maxLife: 2, gravity: -8, drag: 0.99, smokeSize: 6, smokeGrowRate: 10, type: 'smoke' } },
    audio: { launchWhistle: true, burstBoom: true, boomDepth: 'light', crackleDecay: false },
  },

  [CRACKER_TYPES.CAKE_12]: {
    name: '12-Shot Cake',
    description: 'Fires 12 assorted aerial rockets in rapid succession.',
    placement: 'ground',
    launchPhase: { enabled: false },
    burstPhase: { enabled: false },
    repeaterCake: {
      enabled: true,
      shots: 12,
      interval: 0.8,
      spread: 0.4,
      rocketSpeed: 450,
      rocketTypes: [CRACKER_TYPES.ROCKET, CRACKER_TYPES.PEONY, CRACKER_TYPES.MULTI_BREAK],
    },
    decayPhase: { smokeConfig: null },
    audio: { launchWhistle: false, burstBoom: false, crackleDecay: false },
  },

  [CRACKER_TYPES.CAKE_100]: {
    name: '100-Shot Finale',
    description: 'A massive multi-shot cake for the ultimate grand finale.',
    placement: 'ground',
    launchPhase: { enabled: false },
    burstPhase: { enabled: false },
    repeaterCake: {
      enabled: true,
      shots: 100,
      interval: 0.2, // very fast
      spread: 0.8, // wide spread
      rocketSpeed: 500,
      rocketTypes: [CRACKER_TYPES.ROCKET, CRACKER_TYPES.PEONY, CRACKER_TYPES.MULTI_BREAK, CRACKER_TYPES.SHOWER_WILLOW, CRACKER_TYPES.HEART_ROCKET],
    },
    decayPhase: { smokeConfig: null },
    audio: { launchWhistle: false, burstBoom: false, crackleDecay: false },
  },
};

/**
 * Get a palette for a cracker burst (randomized or fixed).
 */
export function getPaletteForCracker(crackerType) {
  switch (crackerType) {
    case CRACKER_TYPES.PHULJHARI:
      return BURST_PALETTES[0];
    case CRACKER_TYPES.SUTLI_BOMB:
      return BURST_PALETTES[4];
    case CRACKER_TYPES.SHOWER_WILLOW:
      return Math.random() > 0.5 ? BURST_PALETTES[0] : BURST_PALETTES[5];
    case CRACKER_TYPES.STROBE:
      return BURST_PALETTES[4];
    case CRACKER_TYPES.SKY_LANTERN:
      return BURST_PALETTES[0];
    default:
      return randomPalette();
  }
}
