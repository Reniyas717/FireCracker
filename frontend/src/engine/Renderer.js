/**
 * Renderer — draws the night sky, particles, effects (bloom, flash, shake)
 * onto an HTML5 Canvas 2D context.
 * Supports multiple themes with different sky gradients, skylines, and overlays.
 */

import { THEMES, THEME_IDS } from './ThemeConfigs.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = canvas.width;
    this.height = canvas.height;

    // Theme
    this.theme = THEMES[THEME_IDS.DIWALI_NIGHT];

    // Background cache
    this._skyGradient = null;
    this._stars = [];
    this._moonX = 0;
    this._moonY = 0;
    this._customBgImg = null;
    this._generateStars();

    // Screen flash
    this.flashAlpha = 0;

    // Camera shake
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeMagnitude = 0;
    this.shakeDecay = 0.9;

    // Quality
    this.quality = 'high';

    // Skyline
    this._skylinePoints = [];
    this._generateSkyline();

    // Ambient overlay particles (snow, fireflies)
    this._ambientParticles = [];
    this._generateAmbientParticles();
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this._skyGradient = null;
    this._generateStars();
    this._generateSkyline();
    this._generateAmbientParticles();
  }

  setTheme(theme) {
    this.theme = theme;
    this._skyGradient = null;
    this._generateStars();
    this._generateSkyline();
    this._generateAmbientParticles();
  }

  setCustomBackground(url) {
    if (!url) {
      this._customBgImg = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      this._customBgImg = img;
    };
    img.src = url;
  }

  // ——— Generation ———

  _generateStars() {
    this._stars = [];
    const count = this.theme?.stars?.count || 200;
    for (let i = 0; i < count; i++) {
      this._stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.7,
        size: 0.5 + Math.random() * 1.5,
        twinkleSpeed: 1 + Math.random() * 3,
        twinkleOffset: Math.random() * Math.PI * 2,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
    const moonSize = this.theme?.moon?.size || 20;
    this._moonX = this.width * (0.15 + Math.random() * 0.2);
    this._moonY = this.height * (0.08 + Math.random() * 0.12);
  }

  _generateSkyline() {
    this._skylinePoints = [];
    const sl = this.theme?.skyline;
    if (!sl) return;

    const skylineBaseY = this.height * sl.baseY;
    const segments = 80;
    const segmentWidth = this.width / segments;

    for (let i = 0; i <= segments; i++) {
      const x = i * segmentWidth;
      let y = skylineBaseY;

      if (sl.type === 'mountains') {
        // Jagged mountain peaks
        const mountainWave = Math.sin(i * 0.3) * 20 + Math.sin(i * 0.7) * 15;
        y -= Math.max(0, mountainWave);
        if (Math.random() < sl.tallChance) {
          y -= sl.tallHeight.min + Math.random() * (sl.tallHeight.max - sl.tallHeight.min);
        } else if (Math.random() < sl.mediumChance) {
          y -= sl.mediumHeight.min + Math.random() * (sl.mediumHeight.max - sl.mediumHeight.min);
        }
      } else if (sl.type === 'dunes') {
        // Smooth rolling dunes
        const duneWave = Math.sin(i * 0.15) * 12 + Math.sin(i * 0.08 + 1) * 8;
        y -= Math.max(0, duneWave);
      } else if (sl.type === 'palms') {
        // Mostly flat with occasional tall palm tree shapes
        y -= Math.random() * sl.smallVariation;
        if (Math.random() < sl.tallChance) {
          y -= sl.tallHeight.min + Math.random() * (sl.tallHeight.max - sl.tallHeight.min);
        }
      } else if (sl.type === 'trees') {
        // Undulating treeline
        const treeWave = Math.sin(i * 0.4) * 10 + Math.sin(i * 0.9) * 8;
        y -= Math.max(0, treeWave);
        if (Math.random() < sl.tallChance) {
          y -= sl.tallHeight.min + Math.random() * (sl.tallHeight.max - sl.tallHeight.min);
        }
      } else {
        // City (default)
        if (Math.random() < sl.tallChance) {
          y -= sl.tallHeight.min + Math.random() * (sl.tallHeight.max - sl.tallHeight.min);
        } else if (Math.random() < sl.mediumChance) {
          y -= sl.mediumHeight.min + Math.random() * (sl.mediumHeight.max - sl.mediumHeight.min);
        } else {
          y -= Math.random() * sl.smallVariation;
        }
      }

      this._skylinePoints.push({ x, y });
    }
  }

  _generateAmbientParticles() {
    this._ambientParticles = [];
    const overlay = this.theme?.ambientOverlay;
    if (!overlay) return;

    const count = overlay === 'snow' ? 100 : overlay === 'fireflies' ? 30 : 0;
    for (let i = 0; i < count; i++) {
      this._ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: overlay === 'snow' ? (Math.random() - 0.5) * 20 : (Math.random() - 0.5) * 10,
        vy: overlay === 'snow' ? 20 + Math.random() * 30 : (Math.random() - 0.5) * 8,
        size: overlay === 'snow' ? 1 + Math.random() * 2 : 1.5 + Math.random() * 1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
      });
    }
  }

  // ——— Drawing ———

  drawBackground(time) {
    const { ctx, width, height, theme } = this;

    ctx.save();
    if (this.shakeMagnitude > 0.1) {
      this.shakeX = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      this.shakeMagnitude *= this.shakeDecay;
      ctx.translate(this.shakeX, this.shakeY);
    } else {
      this.shakeMagnitude = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Sky gradient from theme or Custom Background Image
    if (this._customBgImg) {
      // Draw image to cover
      const imgRatio = this._customBgImg.width / this._customBgImg.height;
      const canvasRatio = width / height;
      let drawWidth = width;
      let drawHeight = height;
      let drawX = -10;
      let drawY = -10;

      if (canvasRatio > imgRatio) {
        drawHeight = (width / this._customBgImg.width) * this._customBgImg.height;
        drawY = -10 - (drawHeight - height) / 2;
      } else {
        drawWidth = (height / this._customBgImg.height) * this._customBgImg.width;
        drawX = -10 - (drawWidth - width) / 2;
      }
      
      // Draw standard gradient behind just in case
      if (!this._skyGradient) {
        this._skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        for (const s of theme.sky.gradient) {
          this._skyGradient.addColorStop(s.stop, s.color);
        }
      }
      ctx.fillStyle = this._skyGradient;
      ctx.fillRect(-10, -10, width + 20, height + 20);

      // Darken the custom background slightly so particles pop
      ctx.drawImage(this._customBgImg, drawX, drawY, drawWidth + 20, drawHeight + 20);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(-10, -10, width + 20, height + 20);
      
    } else {
      if (!this._skyGradient) {
        this._skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        for (const s of theme.sky.gradient) {
          this._skyGradient.addColorStop(s.stop, s.color);
        }
      }
      ctx.fillStyle = this._skyGradient;
      ctx.fillRect(-10, -10, width + 20, height + 20);
    }

    // Moon
    if (theme.moon?.visible) this._drawMoon(ctx, time);

    // Stars
    this._drawStars(ctx, time);

    // Ambient overlay
    this._drawAmbientOverlay(ctx, time);

    // Skyline
    this._drawSkyline(ctx);

    // Water reflection
    if (theme.waterReflection) {
      this._drawWaterReflection(ctx, time);
    }
  }

  _drawMoon(ctx, time) {
    const mx = this._moonX;
    const my = this._moonY;
    const moonRadius = this.theme.moon.size;

    const glowGrad = ctx.createRadialGradient(mx, my, moonRadius * 0.5, mx, my, moonRadius * 4);
    glowGrad.addColorStop(0, this.theme.moon.glowColor.replace('VAR_ALPHA', '0.15'));
    glowGrad.addColorStop(0.5, this.theme.moon.glowColor.replace('VAR_ALPHA', '0.05'));
    glowGrad.addColorStop(1, this.theme.moon.glowColor.replace('VAR_ALPHA', '0'));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(mx, my, moonRadius * 4, 0, Math.PI * 2);
    ctx.fill();

    const moonGrad = ctx.createRadialGradient(mx - 3, my - 3, 0, mx, my, moonRadius);
    moonGrad.addColorStop(0, '#e8e8f0');
    moonGrad.addColorStop(0.7, '#c8c8d8');
    moonGrad.addColorStop(1, '#a0a0b8');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(mx, my, moonRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawStars(ctx, time) {
    const starColorTemplate = this.theme.stars.color;
    for (const star of this._stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.brightness * twinkle;
      ctx.fillStyle = starColorTemplate.replace('VAR_ALPHA', alpha.toFixed(2));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawSkyline(ctx) {
    const points = this._skylinePoints;
    if (points.length < 2) return;

    ctx.fillStyle = this.theme.skyline.color;
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.theme.skyline.glowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i].x, points[i].y);
      else ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  _drawWaterReflection(ctx, time) {
    const reflY = this.height * (this.theme.waterReflectionY || 0.85);
    const reflHeight = this.height - reflY;

    // Semi-transparent dark overlay for water
    ctx.fillStyle = 'rgba(5, 10, 20, 0.6)';
    ctx.fillRect(0, reflY, this.width, reflHeight);

    // Subtle shimmer lines
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const lineY = reflY + (reflHeight * (i + 1)) / 9;
      const wave = Math.sin(time * 0.8 + i * 0.7) * 3;
      ctx.beginPath();
      ctx.moveTo(0, lineY + wave);
      ctx.lineTo(this.width, lineY - wave);
      ctx.stroke();
    }
  }

  _drawAmbientOverlay(ctx, time) {
    const overlay = this.theme.ambientOverlay;
    if (!overlay || this._ambientParticles.length === 0) return;

    for (const p of this._ambientParticles) {
      // Update position
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;

      // Wrap around
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y > this.height + 10) p.y = -10;
      if (p.y < -10) p.y = this.height + 10;

      if (overlay === 'snow') {
        const wobble = Math.sin(time * p.speed + p.phase) * 8;
        ctx.fillStyle = `rgba(220, 230, 255, ${0.3 + Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(p.x + wobble, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (overlay === 'fireflies') {
        const pulse = 0.3 + 0.7 * Math.max(0, Math.sin(time * p.speed * 2 + p.phase));
        ctx.fillStyle = `rgba(180, 255, 100, ${pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        glowGrad.addColorStop(0, `rgba(180, 255, 100, ${pulse * 0.15})`);
        glowGrad.addColorStop(1, 'rgba(180, 255, 100, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ——— Particle Rendering ———

  drawParticles(pool) {
    const { ctx } = this;
    ctx.save();

    pool.forEachAlive((p) => {
      if (p.type === 'smoke') {
        this._drawSmoke(ctx, p);
      } else if (p.type === 'shockwave') {
        this._drawShockwave(ctx, p);
      } else if (p.type === 'text') {
        ctx.globalCompositeOperation = 'lighter';
        this._drawTextParticle(ctx, p);
        ctx.globalCompositeOperation = 'source-over';
      } else if (p.type === 'strobe') {
        this._drawStrobeParticle(ctx, p);
      } else if (p.type === 'lantern') {
        this._drawLanternParticle(ctx, p);
      } else {
        ctx.globalCompositeOperation = 'lighter';
        this._drawGlowParticle(ctx, p);
        ctx.globalCompositeOperation = 'source-over';
      }
    });

    ctx.restore();
  }

  _drawGlowParticle(ctx, p) {
    const color = p.getColor();

    if (p.hasTrail && p.trailHistory.length > 1) {
      ctx.beginPath();
      ctx.moveTo(p.trailHistory[0].x, p.trailHistory[0].y);
      for (let i = 1; i < p.trailHistory.length; i++) {
        ctx.lineTo(p.trailHistory[i].x, p.trailHistory[i].y);
      }
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = p.size * 0.5 * p.alpha;
      ctx.stroke();
    }

    if (this.quality !== 'low') {
      const glowSize = p.size * 3;
      const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
      const lifeRatio = p.life / p.maxLife;
      const glowAlpha = p.alpha * (1 - lifeRatio * 0.5) * 0.4;
      const { r, g, b } = this._parseRGBA(color);
      glowGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${glowAlpha})`);
      glowGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawTextParticle(ctx, p) {
    if (!p.textChar) {
      this._drawGlowParticle(ctx, p);
      return;
    }

    const fontSize = Math.max(12, p.size * 4);
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow behind text
    if (this.quality !== 'low') {
      const glowSize = fontSize * 1.5;
      const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
      glowGrad.addColorStop(0, `rgba(${p.baseColor.r}, ${p.baseColor.g}, ${p.baseColor.b}, ${p.alpha * 0.3})`);
      glowGrad.addColorStop(1, `rgba(${p.baseColor.r}, ${p.baseColor.g}, ${p.baseColor.b}, 0)`);
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `rgba(${p.baseColor.r}, ${p.baseColor.g}, ${p.baseColor.b}, ${p.alpha})`;
    ctx.fillText(p.textChar, p.x, p.y);
  }

  _drawStrobeParticle(ctx, p) {
    // Strobe: flash on/off based on flickerRate
    const flickerPhase = Math.sin(p.life * (p.flickerRate || 20) * Math.PI * 2);
    if (flickerPhase < 0) return; // off phase — don't draw

    ctx.globalCompositeOperation = 'lighter';
    const alpha = p.alpha * flickerPhase;
    const color = `rgba(${p.baseColor.r}, ${p.baseColor.g}, ${p.baseColor.b}, ${alpha})`;

    if (this.quality !== 'low') {
      const glowSize = p.size * 4;
      const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
      glowGrad.addColorStop(0, `rgba(${p.baseColor.r}, ${p.baseColor.g}, ${p.baseColor.b}, ${alpha * 0.5})`);
      glowGrad.addColorStop(1, `rgba(${p.baseColor.r}, ${p.baseColor.g}, ${p.baseColor.b}, 0)`);
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  _drawLanternParticle(ctx, p) {
    // Warm glowing lantern body
    const glowSize = p.lanternSize || 12;
    const alpha = p.alpha * 0.8;

    // Outer glow
    const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize * 3);
    glowGrad.addColorStop(0, `rgba(255, 180, 60, ${alpha * 0.2})`);
    glowGrad.addColorStop(1, 'rgba(255, 180, 60, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowSize * 3, 0, Math.PI * 2);
    ctx.fill();

    // Lantern body (oval)
    ctx.fillStyle = `rgba(255, 190, 80, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, glowSize * 0.6, glowSize * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = `rgba(255, 240, 180, ${alpha * 0.6})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, glowSize * 0.3, glowSize * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSmoke(ctx, p) {
    ctx.globalCompositeOperation = 'source-over';
    const size = p.smokeSize || p.size;
    const alpha = p.alpha * 0.15;
    ctx.fillStyle = `rgba(120, 120, 130, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawShockwave(ctx, p) {
    ctx.globalCompositeOperation = 'lighter';
    const alpha = p.alpha * 0.5;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = p.ringWidth * (1 - p.progress);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }

  // ——— Effects ———

  triggerFlash(intensity = 0.5) { this.flashAlpha = intensity; }

  drawFlash(dt) {
    if (this.flashAlpha > 0.01) {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.fillStyle = `rgba(255, 255, 240, ${this.flashAlpha})`;
      this.ctx.fillRect(-10, -10, this.width + 20, this.height + 20);
      this.flashAlpha *= Math.pow(0.02, dt);
    }
  }

  triggerShake(magnitude = 5) {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
  }

  endFrame() { this.ctx.restore(); }

  _parseRGBA(str) {
    const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    return { r: 255, g: 255, b: 255 };
  }

  drawDebugHUD(activeParticles, fps) {
    const { ctx } = this;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(8, 8, 180, 50);
    ctx.fillStyle = '#0f0';
    ctx.font = '12px monospace';
    ctx.fillText(`Particles: ${activeParticles}`, 16, 26);
    ctx.fillText(`FPS: ${fps.toFixed(0)}`, 16, 44);
  }

  setQuality(q) { this.quality = q; }
}
