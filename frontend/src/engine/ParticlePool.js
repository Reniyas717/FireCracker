/**
 * ParticlePool — pre-allocates particles and recycles them to avoid GC pressure.
 * Never creates particles during gameplay; only resets and reuses from the pool.
 */

import { Particle } from './Particle.js';

export class ParticlePool {
  /**
   * @param {number} maxSize — maximum number of particles in the pool
   */
  constructor(maxSize = 3000) {
    this.maxSize = maxSize;
    this.pool = [];
    this.activeCount = 0;

    // Pre-allocate all particles
    for (let i = 0; i < maxSize; i++) {
      this.pool.push(new Particle());
    }
  }

  /**
   * Acquire a particle from the pool and initialize it with the given config.
   * Returns null if the pool is exhausted.
   * @param {Object} config — initialization config passed to Particle.init()
   * @returns {Particle|null}
   */
  acquire(config) {
    // Find the first dead particle
    for (let i = 0; i < this.maxSize; i++) {
      const p = this.pool[i];
      if (!p.alive) {
        p.reset();
        p.init(config);
        this.activeCount++;
        return p;
      }
    }
    // Pool exhausted — skip this particle
    return null;
  }

  /**
   * Update all alive particles.
   * @param {number} dt — delta time in seconds
   * @param {number} wind — wind speed in px/s
   * @param {number} canvasW — canvas width for offscreen culling
   * @param {number} canvasH — canvas height for offscreen culling
   */
  update(dt, wind = 0, canvasW = 1920, canvasH = 1080) {
    const margin = 100; // px margin for offscreen culling
    this.activeCount = 0;

    for (let i = 0; i < this.maxSize; i++) {
      const p = this.pool[i];
      if (!p.alive) continue;

      p.update(dt, wind);

      // Kill particles that have fully expired
      if (!p.alive) continue;

      // Offscreen culling — kill particles that drifted way out of view
      if (
        p.x < -margin || p.x > canvasW + margin ||
        p.y < -margin || p.y > canvasH + margin
      ) {
        p.alive = false;
        continue;
      }

      this.activeCount++;
    }
  }

  /**
   * Iterate over all alive particles. Callback receives (particle, index).
   * @param {function} callback
   */
  forEachAlive(callback) {
    for (let i = 0; i < this.maxSize; i++) {
      const p = this.pool[i];
      if (p.alive) {
        callback(p, i);
      }
    }
  }

  /**
   * Kill all particles (e.g., on reset/clear).
   */
  killAll() {
    for (let i = 0; i < this.maxSize; i++) {
      this.pool[i].alive = false;
    }
    this.activeCount = 0;
  }

  /**
   * Get the number of currently alive particles.
   */
  getActiveCount() {
    return this.activeCount;
  }
}
