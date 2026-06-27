/**
 * CharacterRenderer — draws a realistic procedural skeletal character rig.
 *
 * Gender-specific proportions:
 *   Male   — wider shoulders, narrower hips, rectangular torso
 *   Female — narrower shoulders, wider hips, hourglass torso, longer hair
 *
 * Drawing order per character (back → front):
 *   Back limbs → torso → clothing detail → front limbs → head/hair/face → accessories
 *
 * Face photo: if config.faceImage is set, clips and draws it inside the head circle.
 *
 * Coordinate system inside _drawRig:
 *   Origin at feet. ctx.scale(dirX, -1) so +Y = up. All joint math uses natural up.
 */

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function joint(x, y, angle, length) {
  return { x: x + Math.sin(angle) * length, y: y - Math.cos(angle) * length };
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// ─── Base proportions (adult male = scale 1.0) ────────────────────────────────
const BASE = {
  // leg
  upperLeg: 26, lowerLeg: 24,
  // torso
  torsoLen: 38, neckLen: 6,
  // arm
  upperArm: 20, foreArm: 17,
  // head
  headRadius: 10,
  // widths
  shoulderHalfM: 15, shoulderHalfF: 12,
  hipHalfM: 10, hipHalfF: 14,
  // stick
  stickLen: 24,
};

// Gender scale multipliers
const GENDER = {
  male:   { scale: 1.00, shoulderMult: 1.00, hipMult: 1.00, torsoMult: 1.00 },
  female: { scale: 0.93, shoulderMult: 0.82, hipMult: 1.18, torsoMult: 0.95 },
};

// ─── CharacterRenderer ────────────────────────────────────────────────────────
export class CharacterRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  /**
   * Draw all characters + ember smoke.
   * @param {Character[]} characters
   * @param {object[]}    smoke         - wisps from CharacterSystem
   * @param {number}      time          - elapsed seconds
   * @param {{x,y,radius,intensity}[]} lightSources
   */
  drawAll(characters, smoke, time, lightSources) {
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    for (const c of characters) {
      this._drawCharacter(c, time, lightSources);
    }

    this._drawSmoke(smoke);
    ctx.restore();
  }

  // ─── Per-character ──────────────────────────────────────────────────────────
  _drawCharacter(char, time, lightSources) {
    const { ctx } = this;
    const dir  = char.facingRight ? 1 : -1;
    const baseX = char.x;
    const baseY = char.y + (char.hopY || 0);
    const rim   = this._rimLight(baseX, baseY, lightSources);

    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.scale(dir, -1);   // +Y = up, dir = horizontal flip

    this._drawRig(ctx, char, rim, time);

    ctx.restore();

    // Ember glow drawn in normal canvas coords (called separately by engine)
  }

  _drawRig(ctx, char, rim, time) {
    const cfg = char.config;
    const gd  = GENDER[cfg.gender] || GENDER.male;
    const sc  = gd.scale;
    
    // Only the face part is funny and huge! Bobblehead effect!
    const B   = { ...BASE, headRadius: BASE.headRadius * 2.8 };
    const pose = char.pose;

    // ── Compute joint positions ────────────────────────────────────────────────

    // Hip center (y from feet, adjusted by torso bob)
    const hipY = (B.upperLeg + B.lowerLeg) * sc + pose.torsoBob * sc * 0.5;
    const hipX = 0;

    // Shoulder center
    const shoulderY = hipY + B.torsoLen * sc * gd.torsoMult;
    const shoulderX = hipX;

    // ── Leg joints ────────────────────────────────────────────────────────────
    const hipHalf = (cfg.gender === 'female' ? B.hipHalfF : B.hipHalfM) * sc * gd.hipMult;
    const shHalf  = (cfg.gender === 'female' ? B.shoulderHalfF : B.shoulderHalfM) * sc * gd.shoulderMult;

    // LEFT leg
    const lHipX    = hipX - hipHalf * 0.5;
    const lKnee    = joint(lHipX, hipY, pose.hipL, B.upperLeg * sc);
    const lFoot    = joint(lKnee.x, lKnee.y, pose.hipL + pose.kneeL, B.lowerLeg * sc);

    // RIGHT leg
    const rHipX    = hipX + hipHalf * 0.5;
    const rKnee    = joint(rHipX, hipY, pose.hipR, B.upperLeg * sc);
    const rFoot    = joint(rKnee.x, rKnee.y, pose.hipR + pose.kneeR, B.lowerLeg * sc);

    // ── Arm joints ────────────────────────────────────────────────────────────
    const lShX  = shoulderX - shHalf;
    const rShX  = shoulderX + shHalf;
    const lElbow = joint(lShX, shoulderY, pose.shoulderL, B.upperArm * sc);
    const lHand  = joint(lElbow.x, lElbow.y, pose.shoulderL + pose.elbowL, B.foreArm * sc);
    const rElbow = joint(rShX, shoulderY, pose.shoulderR, B.upperArm * sc);
    const rHand  = joint(rElbow.x, rElbow.y, pose.shoulderR + pose.elbowR, B.foreArm * sc);

    // ── Head position ─────────────────────────────────────────────────────────
    const neckTopY  = shoulderY + B.neckLen * sc;
    const headX     = hipX + Math.sin(pose.headTilt) * B.headRadius * sc;
    const headY     = neckTopY + B.headRadius * sc;

    // ── Determine front/back legs for depth sorting ───────────────────────────
    const leftFront = pose.hipL < pose.hipR;
    const [frontHipX, frontKnee, frontFoot, backHipX, backKnee, backFoot] = leftFront
      ? [lHipX, lKnee, lFoot, rHipX, rKnee, rFoot]
      : [rHipX, rKnee, rFoot, lHipX, lKnee, lFoot];

    // ── Draw back leg ─────────────────────────────────────────────────────────
    this._limb(ctx, backHipX, hipY, backKnee, backFoot, 5 * sc, 4 * sc, rim, cfg, false);

    // ── Female: saree/salwar lower body detail (drawn behind torso) ───────────
    if (cfg.gender === 'female' && (cfg.clothingStyle === 'saree' || cfg.clothingStyle === 'salwar')) {
      this._drawSkirt(ctx, hipX, hipY, hipHalf, B, sc, cfg, rim);
    }

    // ── Torso ─────────────────────────────────────────────────────────────────
    this._drawTorso(ctx, hipX, hipY, shoulderX, shoulderY, hipHalf, shHalf, sc, rim, cfg, time);

    // ── Back arm ──────────────────────────────────────────────────────────────
    const leftArmFront = pose.shoulderL < pose.shoulderR;
    if (leftArmFront) {
      // Right arm is back
      this._limb(ctx, rShX, shoulderY, rElbow, rHand, 4 * sc, 3.2 * sc, rim, cfg, false);
    } else {
      // Left arm is back
      this._limb(ctx, lShX, shoulderY, lElbow, lHand, 4 * sc, 3.2 * sc, rim, cfg, false);
    }

    // ── Front leg ─────────────────────────────────────────────────────────────
    this._limb(ctx, frontHipX, hipY, frontKnee, frontFoot, 5 * sc, 4 * sc, rim, cfg, true);

    // ── Front arm + ember ─────────────────────────────────────────────────────
    if (leftArmFront) {
      this._limb(ctx, lShX, shoulderY, lElbow, lHand, 4 * sc, 3.2 * sc, rim, cfg, true);
      if (char.state === 'crouchLight' || char.state === 'retreat') {
        this._drawEmberStick(ctx, rHand, pose.shoulderR + pose.elbowR, sc);
      }
      this._limb(ctx, rShX, shoulderY, rElbow, rHand, 4 * sc, 3.2 * sc, rim, cfg, true);
    } else {
      this._limb(ctx, rShX, shoulderY, rElbow, rHand, 4 * sc, 3.2 * sc, rim, cfg, true);
      if (char.state === 'crouchLight' || char.state === 'retreat') {
        this._drawEmberStick(ctx, rHand, pose.shoulderR + pose.elbowR, sc);
      }
      this._limb(ctx, lShX, shoulderY, lElbow, lHand, 4 * sc, 3.2 * sc, rim, cfg, true);
    }

    // ── Neck ──────────────────────────────────────────────────────────────────
    this._seg(ctx, hipX, shoulderY, hipX, neckTopY, 4 * sc, rim, cfg, true);

    // ── Head ──────────────────────────────────────────────────────────────────
    this._drawHead(ctx, headX, headY, B.headRadius * sc, rim, cfg, char._faceImg);
  }

  // ─── Body parts ─────────────────────────────────────────────────────────────

  _drawTorso(ctx, hipX, hipY, shX, shY, hipHalf, shHalf, sc, rim, cfg, time) {
    const skin  = hexToRgb(cfg.skinTone);
    const cloth = hexToRgb(cfg.clothingColor);
    const r = rim;

    // Torso shape (male=rect-ish, female=hourglass)
    const waistNarrow = cfg.gender === 'female' ? 0.68 : 0.88;
    const midY = (hipY + shY) * 0.45;

    ctx.beginPath();
    ctx.moveTo(hipX - hipHalf * 0.9, hipY);
    ctx.quadraticCurveTo(hipX - hipHalf * waistNarrow, midY, shX - shHalf * 0.95, shY);
    ctx.lineTo(shX + shHalf * 0.95, shY);
    ctx.quadraticCurveTo(hipX + hipHalf * waistNarrow, midY, hipX + hipHalf * 0.9, hipY);
    ctx.closePath();

    // Clothing fill with rim glow
    ctx.fillStyle = `rgba(${cloth.r + Math.round(r * 40)}, ${cloth.g + Math.round(r * 25)}, ${cloth.b + Math.round(r * 10)}, 0.95)`;
    ctx.fill();

    // Clothing outline / edge — very subtle
    ctx.strokeStyle = `rgba(${cloth.r + 30}, ${cloth.g + 20}, ${cloth.b + 10}, 0.4)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Rim-light sheen on shoulder edge
    if (r > 0.06) {
      const grad = ctx.createLinearGradient(shX - shHalf, shY, shX + shHalf, shY);
      grad.addColorStop(0, `rgba(255,200,120,${r * 0.4})`);
      grad.addColorStop(1, `rgba(255,200,120,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(shX, shY + 2 * sc, shHalf * 0.8, 3 * sc, 0, Math.PI, 0);
      ctx.fill();
    }

    // Male collar / female neckline detail
    if (cfg.clothingStyle === 'kurta' || cfg.clothingStyle === 'salwar') {
      ctx.strokeStyle = `rgba(${cloth.r + 60}, ${cloth.g + 40}, ${cloth.b + 20}, 0.5)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(shX - shHalf * 0.3, shY);
      ctx.lineTo(shX, shY - 4 * sc);
      ctx.lineTo(shX + shHalf * 0.3, shY);
      ctx.stroke();
    }
  }

  _drawSkirt(ctx, hipX, hipY, hipHalf, B, sc, cfg, rim) {
    const cloth = hexToRgb(cfg.clothingColor);
    const r     = rim;
    // Flowing skirt below hip
    ctx.beginPath();
    ctx.moveTo(hipX - hipHalf * 0.9, hipY);
    ctx.lineTo(hipX - hipHalf * 1.5, hipY - (B.lowerLeg + B.upperLeg) * sc * 0.6);
    ctx.lineTo(hipX + hipHalf * 1.5, hipY - (B.lowerLeg + B.upperLeg) * sc * 0.6);
    ctx.lineTo(hipX + hipHalf * 0.9, hipY);
    ctx.closePath();
    ctx.fillStyle = `rgba(${cloth.r + 20}, ${cloth.g + 15}, ${cloth.b + 30}, 0.7)`;
    ctx.fill();
  }

  _drawHead(ctx, x, y, radius, rim, cfg, faceImg) {
    const skin = hexToRgb(cfg.skinTone);
    const r = rim;

    // Head base (skin tone)
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${skin.r + Math.round(r * 30)}, ${skin.g + Math.round(r * 18)}, ${skin.b + Math.round(r * 8)}, 1.0)`;
    ctx.fill();

    // Face photo (clipped circle)
    if (faceImg && faceImg.complete && faceImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.92, 0, Math.PI * 2);
      ctx.clip();
      
      // Face is in `scale(dir, -1)` space (upside down).
      // Translate to head center, flip Y back, draw centered.
      ctx.translate(x, y);
      ctx.scale(1, -1);
      ctx.drawImage(faceImg, -radius * 0.92, -radius * 0.92, radius * 1.84, radius * 1.84);
      ctx.restore();
    } else {
      // Procedural facial features
      this._drawFace(ctx, x, y, radius, rim, cfg);
      // Hair
      this._drawHair(ctx, x, y, radius, rim, cfg);
    }

    // Rim highlight arc on head
    if (r > 0.05) {
      ctx.strokeStyle = `rgba(255, 195, 110, ${r * 0.55})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, radius + 0.5, -Math.PI * 0.75, Math.PI * 0.05);
      ctx.stroke();
    }
  }

  _drawFace(ctx, x, y, radius, rim, cfg) {
    const skin = hexToRgb(cfg.skinTone);
    const r = rim;

    // Eyes
    const eyeY = y + radius * 0.12;
    const eyeOff = radius * 0.28;
    const eyeR = radius * 0.10;

    ctx.fillStyle = `rgba(20,10,5,0.9)`;
    ctx.beginPath();
    ctx.ellipse(x - eyeOff, eyeY, eyeR * 1.2, eyeR, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + eyeOff, eyeY, eyeR * 1.2, eyeR, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye whites
    ctx.fillStyle = `rgba(255,255,255,0.7)`;
    ctx.beginPath();
    ctx.ellipse(x - eyeOff + eyeR * 0.15, eyeY, eyeR * 0.5, eyeR * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + eyeOff + eyeR * 0.15, eyeY, eyeR * 0.5, eyeR * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose — just a tiny dot
    ctx.fillStyle = `rgba(${skin.r - 30}, ${skin.g - 25}, ${skin.b - 20}, 0.5)`;
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.1, radius * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Mouth — slight smile curve
    ctx.strokeStyle = `rgba(${skin.r - 50}, ${skin.g - 40}, ${skin.b - 30}, 0.7)`;
    ctx.lineWidth = radius * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.28, radius * 0.22, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // Female: bindi
    if (cfg.gender === 'female') {
      ctx.fillStyle = 'rgba(220, 30, 30, 0.85)';
      ctx.beginPath();
      ctx.arc(x, y + radius * 0.42, radius * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawHair(ctx, x, y, radius, rim, cfg) {
    const hair = hexToRgb(cfg.hairColor);
    const r = rim;
    const hairFill = `rgba(${hair.r + Math.round(r * 20)}, ${hair.g + Math.round(r * 12)}, ${hair.b + Math.round(r * 5)}, 0.97)`;

    ctx.fillStyle = hairFill;

    if (cfg.gender === 'male') {
      switch (cfg.hairStyle % 4) {
        case 0: // Short crop
          ctx.beginPath();
          ctx.ellipse(x, y + radius * 0.35, radius * 0.95, radius * 0.65, 0, Math.PI, 0);
          ctx.fill();
          break;
        case 1: // Side-parted
          ctx.beginPath();
          ctx.ellipse(x - radius * 0.1, y + radius * 0.3, radius * 0.98, radius * 0.68, -0.1, Math.PI, 0);
          ctx.fill();
          // Small side tuft
          ctx.beginPath();
          ctx.ellipse(x + radius * 0.7, y + radius * 0.1, radius * 0.28, radius * 0.15, 0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 2: // Curly/thick
          ctx.beginPath();
          ctx.ellipse(x, y + radius * 0.3, radius * 1.0, radius * 0.72, 0, Math.PI, 0);
          ctx.fill();
          // Extra volume on top
          ctx.beginPath();
          ctx.arc(x, y + radius * 0.5, radius * 0.7, Math.PI, 0);
          ctx.fill();
          break;
        case 3: // Buzz cut
          ctx.beginPath();
          ctx.ellipse(x, y + radius * 0.38, radius * 0.92, radius * 0.55, 0, Math.PI, 0);
          ctx.fill();
          break;
      }
    } else {
      // Female hair styles
      switch (cfg.hairStyle % 4) {
        case 0: // Long straight
          ctx.beginPath();
          ctx.ellipse(x, y + radius * 0.35, radius * 0.98, radius * 0.68, 0, Math.PI, 0);
          ctx.fill();
          // Long strands falling to shoulder
          ctx.beginPath();
          ctx.moveTo(x - radius * 0.88, y + radius * 0.05);
          ctx.quadraticCurveTo(x - radius * 1.0, y - radius * 0.8, x - radius * 0.7, y - radius * 1.6);
          ctx.quadraticCurveTo(x - radius * 0.5, y - radius * 1.6, x - radius * 0.6, y - radius * 0.8);
          ctx.quadraticCurveTo(x - radius * 0.65, y - radius * 0.2, x - radius * 0.6, y + radius * 0.05);
          ctx.closePath();
          ctx.fill();
          // Right side
          ctx.beginPath();
          ctx.moveTo(x + radius * 0.88, y + radius * 0.05);
          ctx.quadraticCurveTo(x + radius * 1.0, y - radius * 0.8, x + radius * 0.7, y - radius * 1.6);
          ctx.quadraticCurveTo(x + radius * 0.5, y - radius * 1.6, x + radius * 0.6, y - radius * 0.8);
          ctx.quadraticCurveTo(x + radius * 0.65, y - radius * 0.2, x + radius * 0.6, y + radius * 0.05);
          ctx.closePath();
          ctx.fill();
          break;
        case 1: // Bun
          ctx.beginPath();
          ctx.ellipse(x, y + radius * 0.3, radius * 0.95, radius * 0.65, 0, Math.PI, 0);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + radius * 0.55, y + radius * 0.62, radius * 0.38, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 2: // Wavy (plaited/braid hint)
          ctx.beginPath();
          ctx.ellipse(x, y + radius * 0.3, radius * 1.02, radius * 0.72, 0, Math.PI, 0);
          ctx.fill();
          // Braid going down
          ctx.beginPath();
          ctx.moveTo(x - radius * 0.1, y - radius * 0.6);
          ctx.quadraticCurveTo(x + radius * 0.3, y - radius * 1.0, x + radius * 0.1, y - radius * 1.7);
          ctx.lineWidth = radius * 0.32;
          ctx.strokeStyle = hairFill;
          ctx.lineCap = 'round';
          ctx.stroke();
          break;
        case 3: // Short bob
          ctx.beginPath();
          ctx.ellipse(x, y + radius * 0.3, radius * 0.97, radius * 0.62, 0, Math.PI, 0);
          ctx.fill();
          // Bob sides
          ctx.beginPath();
          ctx.ellipse(x - radius * 0.78, y - radius * 0.1, radius * 0.3, radius * 0.5, -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(x + radius * 0.78, y - radius * 0.1, radius * 0.3, radius * 0.5, 0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    }
  }

  // ─── Limb (two-segment) ──────────────────────────────────────────────────────
  _limb(ctx, shX, shY, elbow, hand, upperW, lowerW, rim, cfg, isFront) {
    this._seg(ctx, shX, shY, elbow.x, elbow.y, upperW, rim, cfg, isFront);
    this._seg(ctx, elbow.x, elbow.y, hand.x, hand.y, lowerW, rim, cfg, isFront);
  }

  _seg(ctx, x1, y1, x2, y2, width, rim, cfg, isFront) {
    const skin  = hexToRgb(cfg.skinTone);
    const r     = rim;
    // Arms/legs use skin tone; slightly brighter on front limbs
    const bright = isFront ? 12 : 0;
    const glow   = Math.round(r * 35);
    ctx.strokeStyle = `rgba(${skin.r + bright + glow}, ${skin.g + Math.round(bright * 0.8) + Math.round(glow * 0.6)}, ${skin.b + Math.round(bright * 0.6) + Math.round(glow * 0.4)}, ${isFront ? 1.0 : 0.75})`;
    ctx.lineWidth   = width;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // ─── Ember stick ─────────────────────────────────────────────────────────────
  _drawEmberStick(ctx, hand, armAngle, sc) {
    const stickLen = BASE.stickLen * sc;
    const stickAngle = armAngle + Math.PI * 0.2;
    const tipX = hand.x + Math.sin(stickAngle) * stickLen;
    const tipY = hand.y + Math.cos(stickAngle) * stickLen;

    // Bamboo stick
    ctx.strokeStyle = 'rgba(140, 100, 45, 0.92)';
    ctx.lineWidth   = 1.8 * sc;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(hand.x, hand.y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Store tip for glow (drawn in normal coords by engine)
    this._lastEmberLocalTip = { x: tipX, y: tipY };
  }

  /** Draw the ember glow in *normal canvas* coordinates (not flipped). */
  drawEmberGlow(ctx, ex, ey, flicker) {
    // Outer soft glow
    const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 14);
    grad.addColorStop(0, `rgba(255, 170, 50, ${0.85 * flicker})`);
    grad.addColorStop(0.45, `rgba(255, 100, 15, ${0.45 * flicker})`);
    grad.addColorStop(1,   'rgba(255, 60,  0,  0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ex, ey, 14, 0, Math.PI * 2);
    ctx.fill();

    // Hot white core dot
    ctx.fillStyle = `rgba(255, 245, 200, ${0.95 * flicker})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── Smoke wisps ─────────────────────────────────────────────────────────────
  _drawSmoke(wisps) {
    const { ctx } = this;
    for (const w of wisps) {
      ctx.fillStyle = `rgba(170, 155, 145, ${w.alpha})`;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ─── Rim-light ───────────────────────────────────────────────────────────────
  _rimLight(x, y, sources) {
    let intensity = 0;
    for (const ls of sources) {
      const dx = ls.x - x, dy = ls.y - y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      intensity += Math.max(0, 1 - d / (ls.radius || 260)) * (ls.intensity || 1);
    }
    return Math.min(intensity, 1.0);
  }
}
