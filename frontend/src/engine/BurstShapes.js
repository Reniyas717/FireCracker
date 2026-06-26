/**
 * BurstShapes — reusable burst geometry generators.
 * Each function returns an array of {vx, vy} velocity vectors.
 * These are applied to particles at the moment of burst.
 */

/**
 * Radial sphere burst — particles fly outward uniformly in all directions.
 * @param {number} count — number of particles
 * @param {number} speed — base speed in px/s
 * @param {number} speedVariance — random variance ±
 * @returns {Array<{vx: number, vy: number}>}
 */
export function burstRadial(count, speed = 300, speedVariance = 80) {
  const velocities = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.15;
    const s = speed + (Math.random() - 0.5) * speedVariance * 2;
    velocities.push({
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s,
    });
  }
  return velocities;
}

/**
 * Ring burst — particles fly outward in a single ring (horizontal bias).
 */
export function burstRing(count, speed = 300, speedVariance = 40) {
  const velocities = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.1;
    const s = speed + (Math.random() - 0.5) * speedVariance * 2;
    velocities.push({
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s * 0.4, // squash vertically for ring effect
    });
  }
  return velocities;
}

/**
 * Double ring — two concentric rings at different speeds.
 */
export function burstDoubleRing(count, speed = 300) {
  const inner = burstRing(Math.floor(count / 2), speed * 0.5, 20);
  const outer = burstRing(Math.ceil(count / 2), speed, 40);
  return [...inner, ...outer];
}

/**
 * Palm burst — few thick arms radiating outward like a palm tree.
 */
export function burstPalm(armCount = 6, particlesPerArm = 15, speed = 350) {
  const velocities = [];
  for (let arm = 0; arm < armCount; arm++) {
    const baseAngle = (Math.PI * 2 * arm) / armCount + (Math.random() - 0.5) * 0.1;
    for (let i = 0; i < particlesPerArm; i++) {
      const angleSplay = baseAngle + (Math.random() - 0.5) * 0.2;
      const s = speed * (0.5 + Math.random() * 0.8);
      velocities.push({
        vx: Math.cos(angleSplay) * s,
        vy: Math.sin(angleSplay) * s,
      });
    }
  }
  return velocities;
}

/**
 * Crossette — particles that will split mid-flight into 4 mini-particles.
 * Returns velocities with a `canSplit: true` flag.
 */
export function burstCrossette(count = 20, speed = 250) {
  const velocities = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.15;
    const s = speed + (Math.random() - 0.5) * 60;
    velocities.push({
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s,
      canSplit: true,
      splitTime: 0.3 + Math.random() * 0.3, // split after 0.3-0.6s
    });
  }
  return velocities;
}

/**
 * Willow burst — particles fly up and outward but with very low speed,
 * long life, and heavy gravity so they droop downward like a willow tree.
 */
export function burstWillow(count = 80, speed = 200) {
  const velocities = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.2;
    const s = speed + (Math.random() - 0.5) * 80;
    velocities.push({
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s - 30, // slight upward bias
      isWillow: true,
    });
  }
  return velocities;
}

/**
 * Chrysanthemum — the classic round burst with many fine particles and slight droop.
 * This is the iconic firework shape.
 */
export function burstChrysanthemum(count = 120, speed = 280, speedVariance = 100) {
  const velocities = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
    const s = speed + (Math.random() - 0.5) * speedVariance * 2;
    velocities.push({
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s,
    });
  }
  return velocities;
}

/**
 * Heart burst — particles form a heart shape using a parametric equation.
 */
export function burstHeart(count = 60, speed = 250) {
  const velocities = [];
  for (let i = 0; i < count; i++) {
    const t = (Math.PI * 2 * i) / count;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    const s = speed * 0.05 * (0.9 + Math.random() * 0.2); 
    velocities.push({
      vx: hx * s,
      vy: hy * s,
    });
  }
  return velocities;
}

/**
 * Pick a random burst shape for variety.
 */
const BURST_FUNCTIONS = [
  burstChrysanthemum,
  burstRadial,
  burstRing,
  burstDoubleRing,
  burstPalm,
  burstWillow,
  burstHeart,
  burstCrossette,
];

export function randomBurstShape(count, speed) {
  const fn = BURST_FUNCTIONS[Math.floor(Math.random() * BURST_FUNCTIONS.length)];
  if (fn === burstPalm) return fn(6, Math.ceil(count / 6), speed);
  return fn(count, speed);
}

/**
 * Color palettes for bursts.
 */
export const BURST_PALETTES = [
  // Gold
  [{ r: 255, g: 200, b: 50 }, { r: 255, g: 170, b: 30 }, { r: 255, g: 220, b: 100 }],
  // Red
  [{ r: 255, g: 50, b: 30 }, { r: 255, g: 80, b: 50 }, { r: 255, g: 30, b: 10 }],
  // Green
  [{ r: 50, g: 255, b: 80 }, { r: 30, g: 200, b: 60 }, { r: 80, g: 255, b: 120 }],
  // Blue-Purple
  [{ r: 80, g: 100, b: 255 }, { r: 150, g: 80, b: 255 }, { r: 100, g: 150, b: 255 }],
  // White-Strobe
  [{ r: 255, g: 255, b: 255 }, { r: 240, g: 240, b: 255 }, { r: 255, g: 250, b: 240 }],
  // Silver
  [{ r: 200, g: 210, b: 220 }, { r: 180, g: 190, b: 200 }, { r: 220, g: 225, b: 230 }],
  // Multi-color
  [{ r: 255, g: 50, b: 50 }, { r: 50, g: 255, b: 50 }, { r: 50, g: 100, b: 255 }, { r: 255, g: 255, b: 50 }, { r: 255, g: 50, b: 255 }],
];

export function randomPalette() {
  return BURST_PALETTES[Math.floor(Math.random() * BURST_PALETTES.length)];
}

export function randomColorFromPalette(palette) {
  return palette[Math.floor(Math.random() * palette.length)];
}
