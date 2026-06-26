/**
 * Particle class — represents a single particle in the system.
 * Designed for object pooling: never garbage-collected, only reset and reused.
 */

// Color temperature presets (white-hot → yellow → orange → red → smoke-grey)
const COLOR_TEMP_CURVE = [
  { r: 255, g: 255, b: 255 },   // 0.0 — white-hot
  { r: 255, g: 240, b: 180 },   // 0.15 — pale yellow
  { r: 255, g: 200, b: 80 },    // 0.3 — bright yellow
  { r: 255, g: 140, b: 40 },    // 0.5 — orange
  { r: 255, g: 60, b: 20 },     // 0.7 — red-orange
  { r: 200, g: 30, b: 10 },     // 0.85 — deep red
  { r: 80, g: 80, b: 90 },      // 1.0 — smoke grey
];

function lerpColor(a, b, t) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/**
 * Sample the color temperature curve at a normalized position t ∈ [0, 1].
 * 0 = white-hot birth, 1 = dead smoke.
 */
export function sampleColorTemp(t) {
  t = Math.max(0, Math.min(1, t));
  const segments = COLOR_TEMP_CURVE.length - 1;
  const scaledT = t * segments;
  const idx = Math.min(Math.floor(scaledT), segments - 1);
  const frac = scaledT - idx;
  return lerpColor(COLOR_TEMP_CURVE[idx], COLOR_TEMP_CURVE[idx + 1], frac);
}

export class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    // Position
    this.x = 0;
    this.y = 0;

    // Velocity
    this.vx = 0;
    this.vy = 0;

    // Physics
    this.gravity = 0;       // px/s² (positive = downward)
    this.drag = 0;           // 0–1, multiplicative per second
    this.mass = 1;

    // Appearance
    this.size = 2;
    this.baseColor = { r: 255, g: 200, b: 80 }; // tint overlay
    this.useColorTemp = true;   // if true, use temp curve; else use baseColor
    this.alpha = 1;

    // Lifecycle
    this.life = 0;           // current age in seconds
    this.maxLife = 1;        // total lifespan in seconds
    this.alive = false;

    // Trail
    this.hasTrail = false;
    this.trailLength = 5;
    this.trailHistory = [];  // [{x,y}, ...] ring buffer

    // Type tag for special rendering
    this.type = 'default';   // 'default' | 'spark' | 'smoke' | 'flash' | 'shockwave'

    // Shockwave-specific
    this.radius = 0;
    this.maxRadius = 0;
    this.ringWidth = 2;

    // Smoke-specific
    this.smokeSize = 0;
    this.smokeGrowRate = 0;

    // Sparkler-specific
    this.flickerRate = 0;

    // Text particle (message rocket)
    this.textChar = null;

    // Lantern-specific
    this.lanternSize = 12;

    // Crossette split
    this.canSplit = false;
    this.splitTime = 0;      // age at which to split
    this.hasSplit = false;

    return this;
  }

  /**
   * Initialize a particle with a config object.
   * This is the "spawn" call from the pool.
   */
  init(config) {
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.vx = config.vx ?? 0;
    this.vy = config.vy ?? 0;
    this.gravity = config.gravity ?? 200;
    this.drag = config.drag ?? 0.98;
    this.mass = config.mass ?? 1;
    this.size = config.size ?? 2;
    this.baseColor = config.baseColor ?? { r: 255, g: 200, b: 80 };
    this.useColorTemp = config.useColorTemp ?? true;
    this.alpha = config.alpha ?? 1;
    this.maxLife = config.maxLife ?? 1;
    this.life = 0;
    this.alive = true;
    this.hasTrail = config.hasTrail ?? false;
    this.trailLength = config.trailLength ?? 5;
    this.trailHistory = [];
    this.type = config.type ?? 'default';
    this.radius = config.radius ?? 0;
    this.maxRadius = config.maxRadius ?? 0;
    this.ringWidth = config.ringWidth ?? 2;
    this.smokeSize = config.smokeSize ?? 0;
    this.smokeGrowRate = config.smokeGrowRate ?? 0;
    this.flickerRate = config.flickerRate ?? 0;
    this.textChar = config.textChar ?? null;
    this.lanternSize = config.lanternSize ?? 12;
    this.canSplit = config.canSplit ?? false;
    this.splitTime = config.splitTime ?? 0;
    this.hasSplit = false;
    return this;
  }

  /**
   * Update physics for one frame.
   * @param {number} dt — delta time in seconds
   * @param {number} wind — wind speed in px/s (positive = rightward)
   */
  update(dt, wind = 0) {
    if (!this.alive) return;

    this.life += dt;
    if (this.life >= this.maxLife) {
      this.alive = false;
      return;
    }

    // Store trail position BEFORE updating
    if (this.hasTrail) {
      this.trailHistory.push({ x: this.x, y: this.y });
      if (this.trailHistory.length > this.trailLength) {
        this.trailHistory.shift();
      }
    }

    // Apply gravity (downward)
    this.vy += this.gravity * dt;

    // Apply wind to horizontal velocity
    this.vx += wind * dt * 0.1;

    // Apply air drag (exponential decay per second → per frame)
    const dragFactor = Math.pow(this.drag, dt);
    this.vx *= dragFactor;
    this.vy *= dragFactor;

    // Integrate position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Shockwave expansion
    if (this.type === 'shockwave') {
      const progress = this.life / this.maxLife;
      this.radius = this.maxRadius * progress;
      this.alpha = 1 - progress;
    }

    // Smoke growth
    if (this.type === 'smoke') {
      this.smokeSize += this.smokeGrowRate * dt;
    }

    // Fade alpha based on life progress (last 30% of life fades out)
    if (this.type !== 'shockwave') {
      const lifeRatio = this.life / this.maxLife;
      if (lifeRatio > 0.7) {
        this.alpha = 1 - ((lifeRatio - 0.7) / 0.3);
      }
    }
  }

  /**
   * Get the current display color, factoring in color-temperature curve.
   */
  getColor() {
    if (this.type === 'smoke') {
      const a = this.alpha * 0.3;
      return `rgba(120, 120, 130, ${a})`;
    }

    const lifeRatio = this.life / this.maxLife;

    if (this.useColorTemp) {
      const temp = sampleColorTemp(lifeRatio);
      // Blend with base color for tinting
      const r = Math.round((temp.r * 0.6 + this.baseColor.r * 0.4));
      const g = Math.round((temp.g * 0.6 + this.baseColor.g * 0.4));
      const b = Math.round((temp.b * 0.6 + this.baseColor.b * 0.4));
      return `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
    }

    return `rgba(${this.baseColor.r}, ${this.baseColor.g}, ${this.baseColor.b}, ${this.alpha})`;
  }

  /** Normalized life progress 0→1 */
  get progress() {
    return Math.min(this.life / this.maxLife, 1);
  }
}
