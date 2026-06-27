/**
 * CharacterSystem — Single animated igniter character per user.
 *
 * One character object per session, configured via characterConfig.
 * State machine: idle → walkIn → crouchLight → retreat → react → walkOut
 * Supports male/female proportions, skin tone, clothing, face photo.
 */

// ─── Easing ────────────────────────────────────────────────────────────────────
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOut   = (t) => 1 - Math.pow(1 - t, 3);
const lerp      = (a, b, t) => a + (b - a) * t;

// ─── Walk-cycle keyframes (proper 4-pose cycle) ────────────────────────────────
const WALK_POSES = {
  contact: {
    hipL: -0.45, kneeL: -0.15, hipR:  0.35, kneeR: -0.05,
    shoulderL:  0.35, elbowL: 0.25, shoulderR: -0.30, elbowR: 0.20,
    torsoBob: -4, headTilt:  0.06,
  },
  recoil: {
    hipL: -0.15, kneeL: -0.60, hipR:  0.10, kneeR: -0.20,
    shoulderL:  0.15, elbowL: 0.15, shoulderR: -0.10, elbowR: 0.10,
    torsoBob:  4, headTilt: -0.04,
  },
  passing: {
    hipL:  0.10, kneeL: -0.80, hipR: -0.05, kneeR: -0.05,
    shoulderL: -0.10, elbowL: 0.10, shoulderR:  0.08, elbowR: 0.08,
    torsoBob: -3, headTilt:  0.04,
  },
  highPoint: {
    hipL:  0.35, kneeL: -0.25, hipR: -0.40, kneeR: -0.05,
    shoulderL: -0.30, elbowL: 0.20, shoulderR:  0.32, elbowR: 0.22,
    torsoBob:  5, headTilt: -0.06,
  },
};

const WALK_SEQUENCE = [
  { pose: 'contact',   duration: 0.25 },
  { pose: 'recoil',    duration: 0.25 },
  { pose: 'passing',   duration: 0.25 },
  { pose: 'highPoint', duration: 0.25 },
];

const IDLE_POSE = {
  hipL: 0, kneeL: -0.05, hipR: 0, kneeR: -0.05,
  shoulderL:  0.06, elbowL: 0.05, shoulderR: -0.06, elbowR: 0.05,
  torsoBob: 0, headTilt: 0,
};

const CROUCH_POSE = {
  hipL: 0.50, kneeL: -1.1, hipR: 0.45, kneeR: -1.0,
  shoulderL: -0.10, elbowL: 0.20, shoulderR: 0.70, elbowR: 0.10,
  torsoBob: 22, headTilt: 0.35,
};

const CROUCH_HOLD = {
  hipL: 0.55, kneeL: -1.2, hipR: 0.50, kneeR: -1.1,
  shoulderL: -0.12, elbowL: 0.22, shoulderR: 0.80, elbowR: 0.15,
  torsoBob: 24, headTilt: 0.40,
};

const REACT_POSES = {
  loud: {
    hipL: 0.10, kneeL: -0.15, hipR: -0.10, kneeR: -0.15,
    shoulderL: 1.20, elbowL: 1.50, shoulderR: 1.20, elbowR: 1.50,
    torsoBob: 10, headTilt: -0.2,
  },
  sky: {
    hipL: -0.05, kneeL: -0.05, hipR: 0.05, kneeR: -0.05,
    shoulderL: -0.20, elbowL: 0.10, shoulderR: 0.20, elbowR: 0.10,
    torsoBob: -4, headTilt: -0.50,
  },
  fountain: {
    hipL:  0.08, kneeL: -0.10, hipR: -0.08, kneeR: -0.10,
    shoulderL: 0.60, elbowL: 0.80, shoulderR: 0.30, elbowR: 0.40,
    torsoBob: -6, headTilt: -0.20,
  },
};

const REACT_FAMILY = {
  rocket: 'sky', multi_break: 'sky', peony: 'sky', message_rocket: 'sky',
  heart_rocket: 'sky', cake_12: 'sky', cake_100: 'sky', shower_willow: 'sky',
  sutli_bomb: 'loud', ladi: 'loud', strobe: 'loud',
  anar: 'fountain', chakri: 'fountain', phuljhari: 'fountain',
  roman_candle: 'fountain', snake: 'fountain', flower_bouquet: 'fountain',
  sky_lantern: 'fountain',
};

const SAFE_DISTANCE = 120;

// ─── Default character config ──────────────────────────────────────────────────
export const DEFAULT_CHARACTER_CONFIG = {
  gender:        'male',       // 'male' | 'female'
  skinTone:      '#C68642',    // hex
  clothingColor: '#E8572A',    // hex (kurta/shirt)
  clothingStyle: 'kurta',      // 'kurta' | 'tshirt' | 'saree' | 'salwar'
  hairColor:     '#1A0A00',    // hex
  hairStyle:     0,            // 0-3 for male, 0-3 for female
  faceImage:     null,         // dataURL or null
  name:          'You',
};

// ─── Single Character ──────────────────────────────────────────────────────────
class Character {
  constructor() {
    this.alive        = false;
    this.config       = { ...DEFAULT_CHARACTER_CONFIG };

    // Position
    this.x            = 0;
    this.y            = 0;      // feet y (canvas coords)
    this.facingRight  = true;
    this.hopY         = 0;

    // State
    this.state        = 'idle';
    this.stateTimer   = 0;

    // Walk
    this.targetX      = 0;
    this.walkSpeed    = 90;
    this.walkPhase    = 0;
    this.walkPhaseSpeed = 1.7;

    // Cracker info
    this.crackerX     = 0;
    this.crackerY     = 0;
    this.crackerType  = 'rocket';
    this.entryEdge    = 'left';
    this.retreatTarget = 0;

    // Crouching
    this.crouchProgress   = 0;
    this.crouchHoldTimer  = 0;
    this.emberTouchFired  = false;
    this.hasTriggeredIgnition = false;

    // Callbacks
    this.sparkCallback    = null;
    this.ignitionCallback = null;
    this.footDustCallback = null;

    // React
    this.reactTimer   = 0;
    this.reactFamily  = 'sky';
    this.reactSway    = 0;

    // Hop (excited, post-light)
    this.hopActive    = false;
    this.hopTimer     = 0;

    // Idle
    this.idleSwayPhase = Math.random() * Math.PI * 2;

    // Pose
    this.pose = { ...IDLE_POSE };

    // Face image element (loaded from config.faceImage dataURL)
    this._faceImg = null;
    this._faceImgUrl = null;
  }

  setConfig(cfg) {
    this.config = { ...DEFAULT_CHARACTER_CONFIG, ...cfg };
    // Load face image if changed
    if (cfg.faceImage && cfg.faceImage !== this._faceImgUrl) {
      this._faceImgUrl = cfg.faceImage;
      const img = new Image();
      img.onload = () => { this._faceImg = img; };
      img.src    = cfg.faceImage;
    } else if (!cfg.faceImage) {
      this._faceImg    = null;
      this._faceImgUrl = null;
    }
  }

  reset() {
    this.stateTimer   = 0;
    this.walkPhase    = 0;
    this.crouchProgress  = 0;
    this.crouchHoldTimer = 0;
    this.emberTouchFired = false;
    this.hasTriggeredIgnition = false;
    this.hopActive = false;
    this.hopTimer  = 0;
    this.hopY      = 0;
    this.reactSway = 0;
    this.reactTimer = 0;
    this.pose = { ...IDLE_POSE };
  }

  spawn(crackerX, crackerY, crackerType, groundY, onSpark, onIgnition, onDust, canvasWidth) {
    this.reset();
    
    // Only pick an entry edge and teleport if we are dead or offscreen
    if (!this.alive || this.isOffScreen(canvasWidth)) {
      this.entryEdge = crackerX < (canvasWidth / 2) ? 'left' : 'right';
      if (Math.random() < 0.25) this.entryEdge = this.entryEdge === 'left' ? 'right' : 'left';
      this.x = this.entryEdge === 'left' ? -50 : canvasWidth + 50;
    }
    
    this.alive       = true;
    this.crackerX    = crackerX;
    this.crackerY    = crackerY;
    this.crackerType = crackerType;
    this.y           = groundY;

    this.facingRight = (this.x < crackerX);

    const side = this.facingRight ? -1 : 1;
    this.targetX      = crackerX + side * 15;
    this.retreatTarget = crackerX + side * SAFE_DISTANCE;

    this.walkSpeed      = 88 + Math.random() * 20;
    this.walkPhaseSpeed = 1.65 + Math.random() * 0.3;

    this.sparkCallback    = onSpark;
    this.ignitionCallback = onIgnition;
    this.footDustCallback = onDust;

    this.reactFamily  = REACT_FAMILY[crackerType] || 'sky';
    this.state        = 'walkIn';
  }

  update(dt, time) {
    if (!this.alive) return;
    this.stateTimer += dt;

    switch (this.state) {
      case 'walkIn':      this._walkIn(dt);      break;
      case 'crouchLight': this._crouchLight(dt); break;
      case 'retreat':     this._retreat(dt);     break;
      case 'react':       this._react(dt, time); break;
      case 'walkOut':     this._walkOut(dt);     break;
      case 'idle':        this._idle(time);      break;
    }

    if (this.hopActive) this._updateHop(dt);
  }

  _walkIn(dt) {
    const dx   = this.targetX - this.x;
    const dist = Math.abs(dx);
    if (dist < 4) {
      this.x = this.targetX;
      this._goto('crouchLight');
      return;
    }
    const speed = this.walkSpeed * Math.min(1, dist / 80);
    this.x += Math.sign(dx) * speed * dt;
    this._advanceWalk(dt, 1.0);
    this._applyWalkPose(1.0);
    this._stepDust(dt);
  }

  _crouchLight(dt) {
    const CROUCH_IN  = 0.40;
    const HOLD_TIME  = 0.65;

    this.crouchProgress = Math.min(this.crouchProgress + dt / CROUCH_IN, 1.0);

    if (this.crouchProgress < 1.0) {
      this._blendPoses(IDLE_POSE, CROUCH_POSE, easeInOut(this.crouchProgress));
      return;
    }

    // Crouching is complete — now hold
    this.crouchHoldTimer += dt;
    this._blendPoses(CROUCH_POSE, CROUCH_HOLD, easeInOut(Math.min(this.crouchHoldTimer / HOLD_TIME, 1)));

    // Fire spark at ~40% through hold
    if (!this.emberTouchFired && this.crouchHoldTimer > HOLD_TIME * 0.4) {
      this.emberTouchFired = true;
      const ep = this.getEmberPos();
      if (this.sparkCallback) this.sparkCallback(ep.x, ep.y);
    }

    if (this.crouchHoldTimer >= HOLD_TIME) {
      // Optional excited hop for lighter personality
      if (Math.random() < 0.30) { this.hopActive = true; this.hopTimer = 0; }
      this._goto('retreat');
    }
  }

  _retreat(dt) {
    const dx   = this.retreatTarget - this.x;
    const dist = Math.abs(dx);

    // Trigger ignition once 45px from cracker
    if (!this.hasTriggeredIgnition && Math.abs(this.x - this.crackerX) > 45) {
      this.hasTriggeredIgnition = true;
      if (this.ignitionCallback) this.ignitionCallback();
    }

    if (dist < 6) {
      this.x = this.retreatTarget;
      if (!this.hasTriggeredIgnition) {
        this.hasTriggeredIgnition = true;
        if (this.ignitionCallback) this.ignitionCallback();
      }
      this._goto('react');
      return;
    }

    const speed = this.walkSpeed * 1.5 * Math.min(1, dist / 50);
    this.x += Math.sign(dx) * speed * dt;
    this._advanceWalk(dt, 1.5);
    this._applyWalkPose(1.2);
    this._stepDust(dt);
  }

  _react(dt, time) {
    this.reactTimer += dt;
    const REACT_DUR = 1.8;

    if (this.reactTimer < REACT_DUR) {
      const rp = REACT_POSES[this.reactFamily] || REACT_POSES.sky;
      const t  = Math.min(this.reactTimer / 0.2, 1.0);
      this._blendPoses(IDLE_POSE, rp, easeOut(t));

      if (this.reactFamily === 'fountain') {
        this.reactSway = Math.sin(time * 2.5 + this.idleSwayPhase) * 0.09;
        this.pose.shoulderL = REACT_POSES.fountain.shoulderL + this.reactSway;
        this.pose.shoulderR = REACT_POSES.fountain.shoulderR - this.reactSway;
      }
    } else {
      this._goto('idle');
    }
  }

  _walkOut(dt) {
    const exitDir = (this.entryEdge === 'left') ? -1 : 1;
    this.facingRight = (exitDir > 0);
    this.x += exitDir * this.walkSpeed * dt;
    this._advanceWalk(dt, 1.0);
    this._applyWalkPose(1.0);
    this._stepDust(dt);
  }

  _idle(time) {
    if (this.stateTimer > 30) {
      this._goto('walkOut');
      return;
    }

    const sway    = Math.sin(time * 0.7 + this.idleSwayPhase) * 0.04;
    const breathe = Math.sin(time * 1.2 + this.idleSwayPhase) * 1.5;
    this.pose = {
      ...IDLE_POSE,
      shoulderL: IDLE_POSE.shoulderL + sway,
      shoulderR: IDLE_POSE.shoulderR + sway,
      hipL: sway * 0.3, hipR: -sway * 0.3,
      torsoBob: breathe,
      headTilt:  sway * 0.6,
    };
  }

  _goto(newState) {
    this.state      = newState;
    this.stateTimer = 0;
    if (newState === 'crouchLight') {
      this.crouchProgress  = 0;
      this.crouchHoldTimer = 0;
      this.emberTouchFired = false;
      this.facingRight     = this.crackerX > this.x;
    }
    if (newState === 'retreat') {
      this.facingRight = this.retreatTarget > this.x;
    }
    if (newState === 'react') {
      this.reactTimer = 1.8;
    }
    if (newState === 'walkOut') {
      this.facingRight = !(this.entryEdge === 'left');
    }
  }

  // ─── Walk helpers ─────────────────────────────────────────────────────────────
  _advanceWalk(dt, speedMult = 1.0) {
    this.walkPhase = (this.walkPhase + dt * this.walkPhaseSpeed * speedMult) % 1;
  }

  _applyWalkPose(bobMult = 1.0) {
    let accumulated = 0;
    let fromKey = 'highPoint', toKey = 'contact', localT = 0;
    for (let i = 0; i < WALK_SEQUENCE.length; i++) {
      const step = WALK_SEQUENCE[i];
      if (this.walkPhase < accumulated + step.duration) {
        localT  = (this.walkPhase - accumulated) / step.duration;
        fromKey = step.pose;
        toKey   = WALK_SEQUENCE[(i + 1) % WALK_SEQUENCE.length].pose;
        break;
      }
      accumulated += step.duration;
    }
    const f = WALK_POSES[fromKey], t2 = WALK_POSES[toKey];
    const t = easeInOut(localT);
    this.pose = {
      hipL:      lerp(f.hipL,      t2.hipL,      t),
      kneeL:     lerp(f.kneeL,     t2.kneeL,     t),
      hipR:      lerp(f.hipR,      t2.hipR,      t),
      kneeR:     lerp(f.kneeR,     t2.kneeR,     t),
      shoulderL: lerp(f.shoulderL, t2.shoulderL, t),
      elbowL:    lerp(f.elbowL,    t2.elbowL,    t),
      shoulderR: lerp(f.shoulderR, t2.shoulderR, t),
      elbowR:    lerp(f.elbowR,    t2.elbowR,    t),
      torsoBob:  lerp(f.torsoBob,  t2.torsoBob,  t) * bobMult,
      headTilt:  lerp(f.headTilt,  t2.headTilt,  t),
    };
  }

  _blendPoses(from, to, t) {
    this.pose = {
      hipL:      lerp(from.hipL,      to.hipL,      t),
      kneeL:     lerp(from.kneeL,     to.kneeL,     t),
      hipR:      lerp(from.hipR,      to.hipR,      t),
      kneeR:     lerp(from.kneeR,     to.kneeR,     t),
      shoulderL: lerp(from.shoulderL, to.shoulderL, t),
      elbowL:    lerp(from.elbowL,    to.elbowL,    t),
      shoulderR: lerp(from.shoulderR, to.shoulderR, t),
      elbowR:    lerp(from.elbowR,    to.elbowR,    t),
      torsoBob:  lerp(from.torsoBob,  to.torsoBob,  t),
      headTilt:  lerp(from.headTilt,  to.headTilt,  t),
    };
  }

  // ─── Hop ─────────────────────────────────────────────────────────────────────
  _updateHop(dt) {
    this.hopTimer += dt;
    const DUR = 0.35;
    if (this.hopTimer >= DUR) { this.hopActive = false; this.hopY = 0; return; }
    this.hopY = -Math.sin((this.hopTimer / DUR) * Math.PI) * 26;
  }

  // ─── Footstep dust ────────────────────────────────────────────────────────────
  _stepDust(dt) {
    if (!this.footDustCallback) return;
    const prev = Math.floor((this.walkPhase - dt * this.walkPhaseSpeed) * 4 + 4) % 4;
    const curr = Math.floor(this.walkPhase * 4);
    if (curr !== prev && curr % 2 === 0) {
      this.footDustCallback(this.x + (Math.random() - 0.5) * 10, this.y);
    }
  }

  // ─── Ember position ───────────────────────────────────────────────────────────
  getEmberPos() {
    const dir = this.facingRight ? 1 : -1;
    const sc  = this.config.gender === 'male' ? 30 : 27;
    return {
      x: this.x + dir * sc * 1.7,
      y: this.y - sc * 0.7,
    };
  }

  isOffScreen(w) { return this.x < -120 || this.x > w + 120; }
}

// ─── CharacterSystem ──────────────────────────────────────────────────────────
export class CharacterSystem {
  constructor() {
    this.enabled   = true;
    this.localCharacter = new Character();
    this.remoteCharacters = new Map();

    this._onSpawnDust  = null;
    this._onSpawnSpark = null;

    // Ember smoke wisps
    this._smoke      = [];
    this._smokeTimer = 0;
  }

  setCharacterConfig(cfg) {
    this.config = cfg;
    this.localCharacter.setConfig(cfg);
  }

  setCallbacks(onDust, onSpark) {
    this._onSpawnDust  = onDust;
    this._onSpawnSpark = onSpark;
  }

  /**
   * Spawn (or re-use) the single character to light a cracker.
   * Returns false if character is busy in a critical state.
   */
  spawnLighter({ crackerX, crackerY, crackerType, groundY, onIgnition, canvasWidth }) {
    if (!this.enabled) return false;

    const c = this.localCharacter;

    // If character is mid-light or retreating, fire immediately
    if (c.alive && (c.state === 'crouchLight' || c.state === 'retreat')) {
      return false; // onIgnition will fire directly in engine
    }

    const onSpark = (x, y) => { if (this._onSpawnSpark) this._onSpawnSpark(x, y); };
    const onDust  = (x, y) => { if (this._onSpawnDust)  this._onSpawnDust(x, y);  };

    c.spawn(crackerX, crackerY, crackerType, groundY, onSpark, onIgnition, onDust, canvasWidth);
    return true;
  }

  spawnRemoteLighter({ crackerX, crackerY, crackerType, groundY, onIgnition, canvasWidth, config, playerId }) {
    if (!this.enabled) return false;

    let c = this.remoteCharacters.get(playerId);
    if (!c) {
      c = new Character();
      this.remoteCharacters.set(playerId, c);
    }

    c.setConfig(config);

    const onSpark = (x, y) => { if (this._onSpawnSpark) this._onSpawnSpark(x, y); };
    const onDust  = (x, y) => { if (this._onSpawnDust)  this._onSpawnDust(x, y);  };

    c.spawn(crackerX, crackerY, crackerType, groundY, onSpark, onIgnition, onDust, canvasWidth);
    return true;
  }

  notifyBurst(crackerType) {
    for (const c of this.getAllCharacters()) {
      if (c.state === 'idle') {
        c.reactFamily = REACT_FAMILY[crackerType] || 'fountain';
        c.state = 'react';
        c.reactTimer = 0;
      }
    }
  }

  update(dt, time, canvasWidth) {
    const all = [this.localCharacter, ...Array.from(this.remoteCharacters.values())];
    for (const c of all) {
      if (c.alive) {
        if (c.state === 'walkIn') {
          c.x = Math.max(-60, Math.min(canvasWidth + 60, c.x));
        }
        c.update(dt, time);
        if (c.state === 'walkOut' && c.isOffScreen(canvasWidth)) {
          c.alive = false;
        }
      }
    }
    
    // Clean up dead remote characters from the Map
    for (const [id, c] of this.remoteCharacters.entries()) {
      if (!c.alive) {
        this.remoteCharacters.delete(id);
      }
    }

    this._updateSmoke(dt);
  }

  _updateSmoke(dt) {
    for (let i = this._smoke.length - 1; i >= 0; i--) {
      const w = this._smoke[i];
      w.life -= dt;
      w.y    -= 16 * dt;
      w.x    += w.vx * dt;
      w.alpha = Math.max(0, w.life / w.maxLife * 0.32);
      if (w.life <= 0) this._smoke.splice(i, 1);
    }

    this._smokeTimer += dt;
    if (this._smokeTimer > 0.07) {
      this._smokeTimer = 0;
      for (const c of this.getAllCharacters()) {
        if (c.state === 'crouchLight' || c.state === 'retreat') {
          const ep = c.getEmberPos();
          this._smoke.push({
            x: ep.x + (Math.random() - 0.5) * 3,
            y: ep.y - 2,
            vx: (Math.random() - 0.5) * 7,
            life: 0.5 + Math.random() * 0.3,
            maxLife: 0.5 + Math.random() * 0.3,
            size: 1.8 + Math.random() * 2.2,
            alpha: 0.3,
          });
        }
      }
    }
  }

  getAllCharacters() {
    return [this.localCharacter, ...Array.from(this.remoteCharacters.values())].filter(c => c.alive);
  }

  getEmberSmoke() { return this._smoke; }
}
