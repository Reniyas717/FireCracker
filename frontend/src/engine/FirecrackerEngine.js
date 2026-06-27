/**
 * FirecrackerEngine — the main orchestrator.
 * Manages the game loop (requestAnimationFrame), spawns crackers,
 * delegates to ParticlePool, Renderer, and AudioManager.
 * Pure, framework-agnostic — no React imports.
 */

import { ParticlePool } from './ParticlePool.js';
import { Renderer } from './Renderer.js';
import { AudioManager } from './AudioManager.js';
import { CRACKER_CONFIGS, CRACKER_TYPES, getPaletteForCracker } from './CrackerConfigs.js';
import { randomColorFromPalette, burstRadial } from './BurstShapes.js';
import { THEMES } from './ThemeConfigs.js';
import { CharacterSystem } from './CharacterSystem.js';
import { CharacterRenderer } from './CharacterRenderer.js';

const QUALITY_LIMITS = { low: 800, medium: 2000, high: 4000 };

export class FirecrackerEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.pool = new ParticlePool(QUALITY_LIMITS.high);
    this.renderer = new Renderer(canvas);
    this.audio = new AudioManager();

    this.running = false;
    this.elapsed = 0;
    this.lastTimestamp = 0;
    this.fps = 60;
    this._fpsFrames = 0;
    this._fpsTime = 0;

    this.wind = 0;
    this.quality = 'high';
    this.activeCrackers = [];

    this._tick = this._tick.bind(this);
    this._splitQueue = [];
    this.showDebug = false;

    // External callback for multiplayer broadcasting
    this.onCrackerEvent = null;

    // ── Character system ──
    this.showCharacters = true;
    this.characters = new CharacterSystem();
    this.charRenderer = new CharacterRenderer(this.renderer.ctx);
    this._setupCharacterCallbacks();

    // Light sources list fed to CharacterRenderer (updated each burst)
    this._lightSources = [];
    this._lightSourceTimer = 0;
  }

  // ——— Lifecycle ———

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    requestAnimationFrame(this._tick);
  }

  stop() { this.running = false; }

  resize(width, height) {
    this.renderer.resize(width, height);
  }

  setQuality(q) {
    this.quality = q;
    this.renderer.setQuality(q);
  }

  setWind(w) { this.wind = w; }

  setTheme(themeId) {
    const theme = THEMES[themeId];
    if (theme) this.renderer.setTheme(theme);
  }

  setCustomBackground(imageUrl) {
    this.renderer.setCustomBackground(imageUrl);
  }

  initAudio() { this.audio.init(); }

  setShowCharacters(enabled) {
    this.showCharacters = enabled;
    this.characters.enabled = enabled;
  }

  _setupCharacterCallbacks() {
    const groundY = () => this.renderer.height * 0.88;

    // Dust puff callback
    this.characters.setCallbacks(
      // onDust
      (x, y) => {
        for (let i = 0; i < 3; i++) {
          this.pool.acquire({
            x: x + (Math.random() - 0.5) * 12,
            y: groundY(),
            vx: (Math.random() - 0.5) * 30,
            vy: -8 - Math.random() * 18,
            size: 3 + Math.random() * 4,
            maxLife: 0.55,
            gravity: 20,
            drag: 0.93,
            alpha: 0.6,
            type: 'smoke',
            smokeSize: 5 + Math.random() * 5,
            baseColor: { r: 180, g: 160, b: 140 },
            useColorTemp: false,
            hasTrail: false,
          });
        }
      },
      // onSpark
      (x, y) => {
        for (let i = 0; i < 18; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 40 + Math.random() * 80;
          this.pool.acquire({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 30,
            size: 1.2 + Math.random() * 1.5,
            maxLife: 0.35 + Math.random() * 0.25,
            gravity: 120,
            drag: 0.94,
            alpha: 1,
            type: 'default',
            baseColor: { r: 255, g: 230, b: 160 },
            useColorTemp: true,
            hasTrail: true,
            trailLength: 3,
          });
        }
        this.renderer.triggerFlash(0.08);
      }
    );
  }

  // ——— Main Loop ———

  _tick(timestamp) {
    if (!this.running) return;

    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;
    this.elapsed += dt;

    this._fpsFrames++;
    this._fpsTime += dt;
    if (this._fpsTime >= 0.5) {
      this.fps = this._fpsFrames / this._fpsTime;
      this._fpsFrames = 0;
      this._fpsTime = 0;
    }

    this._updateActiveCrackers(dt);
    this.pool.update(dt, this.wind, this.renderer.width, this.renderer.height);
    this._processSplits();

    // Decay light sources
    this._lightSourceTimer += dt;
    if (this._lightSourceTimer > 0.8) {
      this._lightSources = this._lightSources.filter(ls => ls.born + 0.8 > this.elapsed);
      this._lightSourceTimer = 0;
    }

    // Update characters
    if (this.showCharacters) {
      this.characters.update(dt, this.elapsed, this.renderer.width);
    }

    this.renderer.drawBackground(this.elapsed);

    // Draw characters BELOW particles (behind fireworks)
    if (this.showCharacters) {
      const chars   = this.characters.getAllCharacters();
      const smoke   = this.characters.getEmberSmoke();
      this.charRenderer.ctx = this.renderer.ctx;
      this.charRenderer.drawAll(chars, smoke, this.elapsed, this._lightSources);

      // Draw ember glows in canvas coordinates (not flipped)
      this._drawEmberGlows(chars);
    }

    this.renderer.drawParticles(this.pool);
    this.renderer.drawFlash(dt);
    this.renderer.endFrame();

    if (this.showDebug) {
      this.renderer.drawDebugHUD(this.pool.getActiveCount(), this.fps);
    }

    requestAnimationFrame(this._tick);
  }

  _drawEmberGlows(chars) {
    const ctx = this.renderer.ctx;
    for (const c of chars) {
      if (!c.alive) continue;
      if (c.state !== 'crouchLight' && c.state !== 'retreat') continue;
      const ep = c.getEmberPos();
      const flicker = 0.65 + Math.sin(this.elapsed * 14) * 0.25;
      this.charRenderer.drawEmberGlow(ctx, ep.x, ep.y, flicker);
    }
  }

  // ——— Cracker Spawning ———

  lightCracker(type, x, y, message = '', isRemote = false, remoteConfig = null) {
    this.audio.init();

    const config = CRACKER_CONFIGS[type];
    if (!config) { console.warn(`Unknown cracker type: ${type}`); return; }

    const palette = getPaletteForCracker(type);
    const groundY = this.renderer.height * 0.88;

    if (config.placement === 'ground') y = groundY;

    // Broadcast immediately upon placement so remote clients can spawn the character.
    if (!isRemote && this.onCrackerEvent) {
      this.onCrackerEvent({ 
        type, x, y, message, timestamp: Date.now(),
        characterConfig: this.characters.localCharacter.config 
      });
    }

    // ── Character: spawn a lighter who walks in and triggers the ignition ──
    if (this.showCharacters) {
      let ignitionFired = false;
      const fireIgnition = () => {
        if (ignitionFired) return;
        ignitionFired = true;
        this._fireIgnition(type, config, x, y, palette, message);
        // Add light source for character rim-lighting
        this._lightSources.push({ x, y, radius: 280, intensity: 0.8, born: this.elapsed });
      };

      if (!isRemote) {
        const poolFull = !this.characters.spawnLighter({
          crackerX: x, crackerY: groundY, crackerType: type, groundY, onIgnition: fireIgnition, canvasWidth: this.renderer.width,
        });
        if (poolFull) fireIgnition();
      } else if (remoteConfig) {
        const poolFull = !this.characters.spawnRemoteLighter({
          crackerX: x, crackerY: groundY, crackerType: type, groundY, onIgnition: fireIgnition, canvasWidth: this.renderer.width, config: remoteConfig
        });
        if (poolFull) fireIgnition();
      } else {
        fireIgnition();
      }
      return; 
    }

    // Instant ignition (characters off)
    this._fireIgnition(type, config, x, y, palette, message);
  }

  _fireIgnition(type, config, x, y, palette, message) {
    if (config.launchPhase?.enabled) {
      this._startLaunchPhase(type, config, x, y, palette, message);
    } else if (config.continuousEmitter?.enabled) {
      this._startContinuousEmitter(type, config, x, y, palette);
    } else if (config.spinner?.enabled) {
      this._startSpinner(type, config, x, y, palette);
    } else if (config.sparkler?.enabled) {
      this._startSparkler(type, config, x, y, palette);
    } else if (config.chain?.enabled) {
      this._startChain(type, config, x, y, palette);
    } else if (config.sequentialShooter?.enabled) {
      this._startSequentialShooter(type, config, x, y, palette);
    } else if (config.groundCrawler?.enabled) {
      this._startGroundCrawler(type, config, x, y, palette);
    } else if (config.lantern?.enabled) {
      this._startLantern(type, config, x, y, palette);
    } else if (config.repeaterCake?.enabled) {
      this._startRepeaterCake(type, config, x, y, palette);
    } else if (config.burstPhase?.enabled) {
      this._spawnBurst(config, x, y, palette, message, type);
    }
  }

  /** Convenience for message rockets */
  lightMessageRocket(x, y, message) {
    this.lightCracker(CRACKER_TYPES.MESSAGE_ROCKET, x, y, message);
  }

  // ——— Phase Handlers ———

  _startLaunchPhase(type, config, x, y, palette, message = '') {
    const lp = config.launchPhase;
    if (config.audio.launchWhistle) {
      this.audio.playLaunchWhistle(x, this.renderer.width, lp.duration);
    }
    this.activeCrackers.push({
      type, phase: 'launch', config, x, y, startY: y,
      elapsed: 0, duration: lp.duration, palette, trailAccum: 0,
      rocketX: x, rocketY: y, message,
    });
  }

  _spawnBurst(config, x, y, palette, message = '', crackerType = 'rocket') {
    const bp = config.burstPhase;
    if (!bp?.enabled) return;

    const velocities = bp.getBurstVelocities(bp.particleCount, bp.speed);
    const isMessageType = config.requiresMessage && message;

    for (let i = 0; i < velocities.length; i++) {
      const vel = velocities[i];
      const color = randomColorFromPalette(palette);
      const particleConf = {
        x, y, vx: vel.vx, vy: vel.vy,
        ...bp.particleConfig,
        baseColor: color,
        canSplit: vel.canSplit || bp.particleConfig.canSplit || false,
        splitTime: vel.splitTime || bp.particleConfig.splitTime || 0,
      };

      // For message rockets, assign characters to the first N particles
      if (isMessageType && i < message.length) {
        particleConf.textChar = message[i];
        particleConf.type = 'text';
        // Spread characters in an arc
        const charAngle = (-Math.PI / 4) + (Math.PI / 2) * (i / Math.max(1, message.length - 1));
        const charSpeed = bp.speed * 0.6;
        particleConf.vx = Math.cos(charAngle) * charSpeed;
        particleConf.vy = Math.sin(charAngle) * charSpeed - 50;
        particleConf.size = 5;
        particleConf.maxLife = 3;
        particleConf.gravity = 20;
        particleConf.drag = 0.99;
      }

      this.pool.acquire(particleConf);
    }

    if (bp.screenFlash) this.renderer.triggerFlash(bp.flashIntensity || 0.4);
    if (bp.cameraShake) this.renderer.triggerShake(bp.cameraShake);

    if (config.audio.burstBoom) {
      this.audio.playBoom(x, this.renderer.width, config.audio.boomDepth || 'medium');
    }
    if (config.audio.crackleDecay) {
      setTimeout(() => this.audio.playCrackle(x, this.renderer.width), 100);
    }

    if (bp.cameraShake && bp.cameraShake > 3) this.audio.triggerHaptic(80);
    else this.audio.triggerHaptic(30);

    // Notify crowd to react and add burst light source
    if (this.showCharacters) {
      this.characters.notifyBurst(crackerType);
      this._lightSources.push({ x, y, radius: 350, intensity: 1.0, born: this.elapsed });
    }

    if (bp.spawnShockwave) {
      this.pool.acquire({
        x, y, vx: 0, vy: 0, gravity: 0, drag: 1, size: 1, alpha: 1,
        maxLife: bp.shockwaveConfig.maxLife, type: 'shockwave',
        maxRadius: bp.shockwaveConfig.maxRadius, ringWidth: bp.shockwaveConfig.ringWidth,
      });
    }

    if (bp.spawnSmoke && config.decayPhase?.smokeConfig) {
      for (let i = 0; i < (bp.smokeCount || 5); i++) {
        this.pool.acquire({
          x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 20,
          ...config.decayPhase.smokeConfig,
        });
      }
    }

    // Sub-bursts (flower bouquet)
    if (bp.subBursts) {
      for (let sb = 0; sb < bp.subBursts; sb++) {
        const delay = (sb + 1) * (bp.subBurstDelay || 0.15) * 1000;
        const offsetX = (Math.random() - 0.5) * (bp.subBurstSpread || 60);
        const offsetY = (Math.random() - 0.5) * (bp.subBurstSpread || 60) * 0.7;
        setTimeout(() => {
          const subVelocities = burstRadial(Math.floor(bp.particleCount * 0.5), bp.speed * 0.7, 40);
          const subPalette = getPaletteForCracker(CRACKER_TYPES.ROCKET);
          for (const sv of subVelocities) {
            this.pool.acquire({
              x: x + offsetX, y: y + offsetY, vx: sv.vx, vy: sv.vy,
              size: 2.5, maxLife: 1.3, gravity: 100, drag: 0.97,
              useColorTemp: true, hasTrail: true, trailLength: 4,
              type: 'default', baseColor: randomColorFromPalette(subPalette),
            });
          }
          this.renderer.triggerFlash(0.15);
          this.audio.playBoom(x + offsetX, this.renderer.width, 'light');
        }, delay);
      }
    }
  }

  _startContinuousEmitter(type, config, x, y, palette) {
    const ce = config.continuousEmitter;
    if (config.audio.continuousSizzle) this.audio.playSizzle(x, this.renderer.width, ce.duration);
    this.activeCrackers.push({
      type, phase: 'emitting', config, x, y,
      elapsed: 0, duration: ce.duration, palette, emitAccum: 0,
    });
  }

  _startSpinner(type, config, x, y, palette) {
    const sp = config.spinner;
    if (config.audio.spinWhir) this.audio.playSpinWhir(x, this.renderer.width, sp.duration);
    this.activeCrackers.push({
      type, phase: 'spinning', config, x, y,
      elapsed: 0, duration: sp.duration, palette,
      angle: 0, rotationSpeed: 0, emitAccum: 0,
    });
  }

  _startSparkler(type, config, x, y, palette) {
    const sk = config.sparkler;
    if (config.audio.gentleCrackle) this.audio.playSizzle(x, this.renderer.width, sk.duration);
    this.activeCrackers.push({
      type, phase: 'sparkling', config, x, y,
      elapsed: 0, duration: sk.duration, palette,
      emitAccum: 0, cursorX: x, cursorY: y,
    });
  }

  _startChain(type, config, x, y, palette) {
    const ch = config.chain;
    this.activeCrackers.push({
      type, phase: 'chaining', config, x, y,
      elapsed: 0, duration: ch.totalPops * ch.popInterval, palette,
      popIndex: 0, popAccum: 0,
    });
  }

  _startSequentialShooter(type, config, x, y, palette) {
    const ss = config.sequentialShooter;
    this.activeCrackers.push({
      type, phase: 'shooting', config, x, y,
      elapsed: 0, duration: ss.shotCount * ss.shotInterval + 1, palette,
      shotIndex: 0, shotAccum: 0,
    });
  }

  _startGroundCrawler(type, config, x, y, palette) {
    const gc = config.groundCrawler;
    if (config.audio.continuousSizzle) this.audio.playSizzle(x, this.renderer.width, gc.duration);
    this.activeCrackers.push({
      type, phase: 'crawling', config, x, y,
      elapsed: 0, duration: gc.duration, palette,
      crawlX: x, crawlY: y, crawlAngle: Math.random() * Math.PI * 2,
      emitAccum: 0,
    });
  }

  _startLantern(type, config, x, y, palette) {
    const ln = config.lantern;
    this.activeCrackers.push({
      type, phase: 'floating', config, x, y,
      elapsed: 0, duration: ln.duration, palette,
      lanternX: x, lanternY: y, emitAccum: 0,
    });
  }

  _startRepeaterCake(type, config, x, y, palette) {
    const rc = config.repeaterCake;
    this.activeCrackers.push({
      type, phase: 'repeating', config, x, y,
      elapsed: 0, duration: rc.shots * rc.interval + 1, palette,
      shotIndex: 0, shotAccum: 0,
    });
  }

  // ——— Active Cracker Updates ———

  _updateActiveCrackers(dt) {
    for (let i = this.activeCrackers.length - 1; i >= 0; i--) {
      const cracker = this.activeCrackers[i];
      cracker.elapsed += dt;

      if (cracker.elapsed >= cracker.duration) {
        if (cracker.phase === 'launch') {
          this._spawnBurst(cracker.config, cracker.rocketX, cracker.rocketY, cracker.palette, cracker.message, cracker.type);
        }
        this.activeCrackers.splice(i, 1);
        continue;
      }

      switch (cracker.phase) {
        case 'launch': this._updateLaunch(cracker, dt); break;
        case 'emitting': this._updateContinuousEmitter(cracker, dt); break;
        case 'spinning': this._updateSpinner(cracker, dt); break;
        case 'sparkling': this._updateSparkler(cracker, dt); break;
        case 'chaining': this._updateChain(cracker, dt); break;
        case 'shooting': this._updateSequentialShooter(cracker, dt); break;
        case 'crawling': this._updateGroundCrawler(cracker, dt); break;
        case 'floating': this._updateLantern(cracker, dt); break;
        case 'repeating': this._updateRepeaterCake(cracker, dt); break;
      }
    }
  }

  _updateLaunch(cracker, dt) {
    const lp = cracker.config.launchPhase;
    const progress = cracker.elapsed / cracker.duration;

    const targetY = cracker.startY - (cracker.startY * 0.6 + 50);
    cracker.rocketY = cracker.startY + (targetY - cracker.startY) * Math.pow(progress, 0.8); // slight deceleration curve
    
    // Add both slow wobble and fast chaotic jitter to the flight path
    const wobble = Math.sin(cracker.elapsed * 15) * lp.wobble * (1 - progress);
    const jitter = (Math.random() - 0.5) * lp.wobble * 0.5;
    cracker.rocketX = cracker.x + wobble + jitter;

    cracker.trailAccum += dt * lp.trailParticleRate;
    while (cracker.trailAccum >= 1) {
      cracker.trailAccum -= 1;
      const color = randomColorFromPalette(cracker.palette);
      this.pool.acquire({
        x: cracker.rocketX + (Math.random() - 0.5) * 4,
        y: cracker.rocketY + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 30, vy: 30 + Math.random() * 50,
        ...lp.trailParticleConfig, baseColor: color,
      });
    }
  }

  _updateContinuousEmitter(cracker, dt) {
    const ce = cracker.config.continuousEmitter;
    const progress = cracker.elapsed / cracker.duration;

    cracker.emitAccum += dt * ce.particleRate;
    while (cracker.emitAccum >= 1) {
      cracker.emitAccum -= 1;
      const angle = ce.baseAngle + (Math.random() - 0.5) * ce.coneAngle * 2;
      const speed = ce.speed + (Math.random() - 0.5) * ce.speedVariance * 2;

      let color;
      if (ce.colorShift) {
        const paletteIdx = Math.floor(progress * cracker.palette.length) % cracker.palette.length;
        color = cracker.palette[paletteIdx];
      } else {
        color = randomColorFromPalette(cracker.palette);
      }

      this.pool.acquire({
        x: cracker.x + (Math.random() - 0.5) * 6, y: cracker.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        ...ce.particleConfig, baseColor: color,
      });
    }
  }

  _updateSpinner(cracker, dt) {
    const sp = cracker.config.spinner;

    cracker.rotationSpeed = Math.min(cracker.rotationSpeed + sp.rotationAccel * dt, sp.maxRotationSpeed);
    cracker.angle += cracker.rotationSpeed * dt;

    cracker.emitAccum += dt * sp.particleRate;
    while (cracker.emitAccum >= 1) {
      cracker.emitAccum -= 1;
      for (let arm = 0; arm < sp.armCount; arm++) {
        const armAngle = cracker.angle + (Math.PI * 2 * arm) / sp.armCount;
        const wobble = Math.sin(cracker.elapsed * 20) * sp.wobble;
        const speed = 100 + Math.random() * 80;
        this.pool.acquire({
          x: cracker.x + Math.cos(armAngle) * 10,
          y: cracker.y + Math.sin(armAngle) * 10 + wobble,
          vx: Math.cos(armAngle) * speed, vy: Math.sin(armAngle) * speed,
          ...sp.particleConfig, baseColor: randomColorFromPalette(cracker.palette),
        });
      }
    }
  }

  _updateSparkler(cracker, dt) {
    const sk = cracker.config.sparkler;
    cracker.emitAccum += dt * sk.particleRate;
    while (cracker.emitAccum >= 1) {
      cracker.emitAccum -= 1;
      const angle = Math.random() * sk.spread * 2 - sk.spread;
      const speed = sk.speed + (Math.random() - 0.5) * sk.speedVariance * 2;
      this.pool.acquire({
        x: cracker.cursorX + (Math.random() - 0.5) * 8,
        y: cracker.cursorY + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 20,
        ...sk.particleConfig,
      });
    }
  }

  _updateChain(cracker, dt) {
    const ch = cracker.config.chain;
    cracker.popAccum += dt;
    while (cracker.popAccum >= ch.popInterval && cracker.popIndex < ch.totalPops) {
      cracker.popAccum -= ch.popInterval;
      const t = cracker.popIndex / ch.totalPops;
      const popX = cracker.x + (t - 0.5) * ch.stringLength;
      const popY = cracker.y - Math.sin(t * Math.PI) * 5;

      const velocities = burstRadial(ch.popParticleCount, ch.popSpeed, 40);
      for (const vel of velocities) {
        this.pool.acquire({
          x: popX, y: popY, vx: vel.vx, vy: vel.vy,
          ...ch.particleConfig, baseColor: randomColorFromPalette(cracker.palette),
        });
      }
      if (ch.miniFlash) this.renderer.triggerFlash(0.08);
      if (cracker.config.audio.rapidPop) this.audio.playPop(popX, this.renderer.width);
      this.audio.triggerHaptic(10);
      cracker.popIndex++;
    }
  }

  _updateSequentialShooter(cracker, dt) {
    const ss = cracker.config.sequentialShooter;
    cracker.shotAccum += dt;
    while (cracker.shotAccum >= ss.shotInterval && cracker.shotIndex < ss.shotCount) {
      cracker.shotAccum -= ss.shotInterval;
      const angle = ss.fireballAngle + (Math.random() - 0.5) * ss.angleVariance;
      const speed = ss.fireballSpeed + (Math.random() - 0.5) * 50;
      this.pool.acquire({
        x: cracker.x, y: cracker.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        ...ss.fireballConfig, baseColor: randomColorFromPalette(cracker.palette),
      });
      if (cracker.config.audio.softThump) this.audio.playSoftThump(cracker.x, this.renderer.width);
      this.renderer.triggerFlash(0.1);
      cracker.shotIndex++;
    }
  }

  _updateGroundCrawler(cracker, dt) {
    const gc = cracker.config.groundCrawler;

    // Snake crawls along the ground, turning randomly
    cracker.crawlAngle += (Math.random() - 0.5) * gc.turnRate * dt;
    cracker.crawlX += Math.cos(cracker.crawlAngle) * gc.speed * dt;
    // Keep it on the ground (don't go up)
    cracker.crawlY += Math.sin(cracker.crawlAngle) * gc.speed * dt * 0.2;
    // Clamp to ground area
    cracker.crawlY = Math.max(cracker.crawlY, cracker.y - 20);
    cracker.crawlY = Math.min(cracker.crawlY, cracker.y + 5);

    cracker.emitAccum += dt * gc.particleRate;
    while (cracker.emitAccum >= 1) {
      cracker.emitAccum -= 1;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 50 + Math.random() * 80;
      this.pool.acquire({
        x: cracker.crawlX + (Math.random() - 0.5) * 6,
        y: cracker.crawlY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        ...gc.particleConfig, baseColor: randomColorFromPalette(cracker.palette),
      });
    }
  }

  _updateLantern(cracker, dt) {
    const ln = cracker.config.lantern;
    const progress = cracker.elapsed / cracker.duration;

    // Lantern rises and drifts
    cracker.lanternY -= ln.riseSpeed * dt;
    cracker.lanternX += Math.sin(cracker.elapsed * 0.5) * ln.driftSpeed * dt;

    // Spawn the lantern body as a special particle each frame (just one alive at a time)
    // Actually, let's just emit ambient glow particles from the lantern position
    cracker.emitAccum += dt * ln.particleRate;
    while (cracker.emitAccum >= 1) {
      cracker.emitAccum -= 1;
      this.pool.acquire({
        x: cracker.lanternX + (Math.random() - 0.5) * 4,
        y: cracker.lanternY + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 8, vy: 5 + Math.random() * 10,
        ...ln.particleConfig,
      });
    }

    // Draw the lantern body itself as a special particle
    const existingLantern = this.pool.acquire({
      x: cracker.lanternX, y: cracker.lanternY,
      vx: 0, vy: 0, gravity: 0, drag: 1,
      size: ln.glowSize, maxLife: dt + 0.01, alpha: 1 - progress * 0.5,
      type: 'lantern', lanternSize: ln.glowSize,
      baseColor: ln.glowColor, useColorTemp: false,
    });
  }

  _updateRepeaterCake(cracker, dt) {
    const rc = cracker.config.repeaterCake;
    cracker.shotAccum += dt;
    while (cracker.shotAccum >= rc.interval && cracker.shotIndex < rc.shots) {
      cracker.shotAccum -= rc.interval;
      
      const subType = rc.rocketTypes[Math.floor(Math.random() * rc.rocketTypes.length)];
      const subConfig = CRACKER_CONFIGS[subType];
      
      const spreadX = (Math.random() - 0.5) * rc.spread * this.renderer.width;
      const targetX = cracker.x + spreadX;

      if (subConfig && subConfig.launchPhase) {
        // Fire the sub-rocket!
        // We override the x position to create a fan/spread effect from the base
        const palette = getPaletteForCracker(subType);
        
        if (subConfig.audio.launchWhistle) {
          this.audio.playLaunchWhistle(targetX, this.renderer.width, subConfig.launchPhase.duration);
        }
        
        this.activeCrackers.push({
          type: subType, phase: 'launch', config: subConfig, 
          x: targetX, y: cracker.y, startY: cracker.y, // start from cake position, but spread horizontally
          elapsed: 0, duration: subConfig.launchPhase.duration, palette, trailAccum: 0,
          rocketX: targetX, rocketY: cracker.y, message: '',
        });
      }

      cracker.shotIndex++;
    }
  }

  // ——— Crossette Split Logic ———

  _processSplits() {
    this._splitQueue = [];
    this.pool.forEachAlive((p) => {
      if (p.canSplit && !p.hasSplit && p.life >= p.splitTime) {
        p.hasSplit = true;
        this._splitQueue.push({
          x: p.x, y: p.y, baseColor: { ...p.baseColor },
          size: p.size * 0.6, maxLife: p.maxLife - p.life,
          gravity: p.gravity, drag: p.drag,
        });
        p.alive = false;
      }
    });

    for (const split of this._splitQueue) {
      const miniVels = burstRadial(4, 120, 30);
      for (const vel of miniVels) {
        this.pool.acquire({
          x: split.x, y: split.y, vx: vel.vx, vy: vel.vy,
          size: split.size, maxLife: split.maxLife,
          gravity: split.gravity, drag: split.drag,
          baseColor: split.baseColor, useColorTemp: true,
          hasTrail: true, trailLength: 4, type: 'default',
        });
      }
    }
  }

  // ——— Cursor Tracking ———

  updateCursorPosition(x, y) {
    for (const cracker of this.activeCrackers) {
      if (cracker.phase === 'sparkling') {
        cracker.cursorX = x;
        cracker.cursorY = y;
      }
    }
  }

  // ——— Remote cracker replay for multiplayer ———

  handleRemoteCracker(event) {
    // Replay a cracker event from another player
    const { type, x, y, message, characterConfig } = event;
    // Call lightCracker with isRemote = true to prevent broadcasting it back
    this.lightCracker(type, x, y, message || '', true, characterConfig);
  }

  // ——— Cleanup ———

  destroy() {
    this.stop();
    this.pool.killAll();
    this.audio.dispose();
    this.activeCrackers = [];
    this._lightSources = [];
  }
}
