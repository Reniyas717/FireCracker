/**
 * AudioManager — Advanced procedural sound synthesis using Web Audio API.
 * High-fidelity synthesis designed to sound like real explosives (heavy transients,
 * sub-bass rumbles, asymmetric distortion, granular crackles, FM whistles).
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.masterVolume = 0.7;
    this.initialized = false;

    this.ambientSource = null;
    this.ambientGain = null;

    this.reverbNode = null;
    
    // Create an asymmetric distortion curve for heavy "cracking" explosions
    this.distortionCurve = this._makeAsymmetricDistortionCurve(400); 

    // Raw Audio buffers
    this.explosionBuffer = null;
    this.popBuffer = null;
    this.deepBuffer = null;
    this.crackleBuffer = null;
  }

  async init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;

      // Remove the heavy compressor that was suppressing transients
      // Just connect the master gain directly to destination, but add a 
      // simple hard limiter (waveshaper) to prevent digital clipping nastiness
      // without ducking the entire mix like a compressor does.
      const limiter = this.ctx.createWaveShaper();
      limiter.curve = this._makeLimiterCurve();
      limiter.oversample = '2x';

      this.masterGain.connect(limiter);
      limiter.connect(this.ctx.destination);

      this._initReverb();
      this.initialized = true;
      this._startAmbient();

      // Load raw audio files
      this._loadAudio('/explosion.wav').then(buf => this.explosionBuffer = buf);
      this._loadAudio('/pop.ogg').then(buf => this.popBuffer = buf);
      this._loadAudio('/deep_boom.ogg').then(buf => this.deepBuffer = buf);
      this._loadAudio('/crackle.ogg').then(buf => this.crackleBuffer = buf);

    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }

  setVolume(v) {
    this.masterVolume = v;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(v, this.ctx.currentTime);
    }
  }

  _createPanner(screenX, canvasWidth) {
    const panner = this.ctx.createStereoPanner();
    const pan = ((screenX / canvasWidth) * 2 - 1) * 0.7; // Keep pan slightly centered
    panner.pan.setValueAtTime(pan, this.ctx.currentTime);
    return panner;
  }

  // Generate an impulse response for outdoor "echo/reverb" (slapback + decay)
  _initReverb() {
    const duration = 2.5;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);

    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        // High-density noise that decays exponentially
        const decay = Math.pow(1 - i / length, 4.0);
        // Simulate a slapback echo around 150ms
        const echo = (i > sampleRate * 0.15 && i < sampleRate * 0.2) ? 1.5 : 1.0;
        data[i] = (Math.random() * 2 - 1) * decay * echo;
      }
    }

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;
    
    // Connect reverb to master, but at low volume
    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = 0.15; // Lowered to 15% wet mix to keep primary sound unsuppressed and forward
    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.masterGain);
  }

  // Soft limiter to prevent absolute 0dBfs clipping without pumping
  _makeLimiterCurve() {
    const amount = 44100;
    const curve = new Float32Array(amount);
    for (let i = 0; i < amount; ++i) {
      const x = (i * 2) / amount - 1;
      // hyperbolic tangent for smooth clipping at the very top
      curve[i] = Math.tanh(x);
    }
    return curve;
  }

  async _loadAudio(url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.ctx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error(`Failed to load audio from ${url}:`, e);
      return null;
    }
  }

  // Asymmetric curve for more "cracking/tearing" sound on loud transients
  _makeAsymmetricDistortionCurve(amount) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Hard clip on positive, soft fold on negative
      if (x < 0) {
        curve[i] = x * (1 + amount / 100) / (1 + Math.abs(x) * (amount / 10));
      } else {
        curve[i] = (Math.atan(x * amount) / (Math.PI / 2));
      }
    }
    return curve;
  }

  _noiseBuffer(duration, type = 'white') {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    if (length <= 0) return null;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'brownian') {
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // compensate
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  // ——— Generators ———

  playLaunchWhistle(screenX = 0.5, canvasWidth = 1, duration = 0.8) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const panner = this._createPanner(screenX, canvasWidth);

    // FM Synthesis for Screeching Whistle
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sawtooth';
    
    const modulator = this.ctx.createOscillator();
    modulator.type = 'sine';
    
    const modGain = this.ctx.createGain();
    
    // The pitch rises rapidly, then wabbles
    const startFreq = 800 + Math.random() * 200;
    const endFreq = 2800 + Math.random() * 800;
    carrier.frequency.setValueAtTime(startFreq, now);
    carrier.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    
    modulator.frequency.setValueAtTime(40, now); // 40Hz rattle
    modGain.gain.setValueAtTime(100, now); // Amount of FM
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    // Layer with narrow-band noise for breathiness/air
    const noise = this.ctx.createBufferSource();
    const nb = this._noiseBuffer(duration + 0.2, 'white');
    if (!nb) return;
    noise.buffer = nb;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 10;
    bp.frequency.setValueAtTime(startFreq, now);
    bp.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.01, now);
    env.gain.linearRampToValueAtTime(0.4, now + duration * 0.2); // Slower attack
    env.gain.exponentialRampToValueAtTime(0.01, now + duration);

    carrier.connect(env);
    noise.connect(bp);
    bp.connect(env);
    
    env.connect(panner);
    panner.connect(this.masterGain);
    panner.connect(this.reverbNode); // Echoing whistle

    carrier.start(now);
    modulator.start(now);
    noise.start(now);
    carrier.stop(now + duration + 0.1);
    modulator.stop(now + duration + 0.1);
    noise.stop(now + duration + 0.1);
  }

  playBoom(screenX = 0.5, canvasWidth = 1, depth = 'medium') {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const panner = this._createPanner(screenX, canvasWidth);
    
    // Route dry to master, wet to reverb
    panner.connect(this.masterGain);
    panner.connect(this.reverbNode);

    const configs = {
      light: { buffer: this.popBuffer || this.explosionBuffer, playbackRate: 1.0, duration: 0.6, vol: 0.8 },
      medium: { buffer: this.explosionBuffer, playbackRate: 1.0, duration: 0.9, vol: 1.0 },
      deep: { buffer: this.deepBuffer || this.explosionBuffer, playbackRate: 1.0, duration: 1.4, vol: 1.2 },
    };
    const cfg = configs[depth] || configs.medium;

    // 1. Play Raw Explosion Sample
    if (cfg.buffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = cfg.buffer;
      source.playbackRate.value = cfg.playbackRate;

      // Randomize pitch slightly
      source.playbackRate.value *= (1 + (Math.random() - 0.5) * 0.1);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(cfg.vol * 1.5, now); // Push it loud into the limiter
      
      source.connect(gain);
      gain.connect(panner);
      source.start(now);
    } else {
      // Fallback to old transient if buffer didn't load
      const crackSource = this.ctx.createBufferSource();
      const cbuf = this._noiseBuffer(0.1, 'white');
      if (cbuf) {
        crackSource.buffer = cbuf;
        const crackLP = this.ctx.createBiquadFilter();
        crackLP.type = 'lowpass';
        crackLP.frequency.setValueAtTime(20000, now);
        crackLP.frequency.exponentialRampToValueAtTime(2000, now + 0.05);
        
        const crackGain = this.ctx.createGain();
        crackGain.gain.setValueAtTime(cfg.vol * 3.0, now);
        crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        crackSource.connect(crackLP);
        crackLP.connect(crackGain);
        crackGain.connect(panner);
        crackSource.start(now);
      }
    }

    // 3. Dense Rumble (Pink Noise)
    const rumbleSource = this.ctx.createBufferSource();
    const rbuf = this._noiseBuffer(cfg.duration, 'pink');
    if (rbuf) {
      rumbleSource.buffer = rbuf;
      const rumbleLP = this.ctx.createBiquadFilter();
      rumbleLP.type = 'lowpass';
      rumbleLP.frequency.setValueAtTime(800, now);
      rumbleLP.frequency.exponentialRampToValueAtTime(50, now + cfg.duration * 0.8);
      
      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(cfg.vol * 0.8, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + cfg.duration * 0.8);

      rumbleSource.connect(rumbleLP);
      rumbleLP.connect(rumbleGain);
      rumbleGain.connect(panner);
      rumbleSource.start(now);
    }
  }

  playCrackle(screenX = 0.5, canvasWidth = 1, duration = 1.5) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const panner = this._createPanner(screenX, canvasWidth);
    panner.connect(this.masterGain);

    if (this.crackleBuffer) {
      // Use the raw crackle recording for realistic sound
      const source = this.ctx.createBufferSource();
      source.buffer = this.crackleBuffer;
      // Pitch it up randomly to sound like smaller sparks
      source.playbackRate.value = 1.2 + Math.random() * 0.5;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      source.connect(gain);
      gain.connect(panner);
      source.start(now);
    } else {
      // Extremely dense granular pops fallback
      const popCount = 20 + Math.random() * 20;
      for (let i = 0; i < popCount; i++) {
        const timeOffset = Math.random() * duration;
        const start = now + timeOffset;
        
        const popDur = 0.01 + Math.random() * 0.02;
        const noise = this.ctx.createBufferSource();
        const nbuf = this._noiseBuffer(popDur, 'brownian');
        if (!nbuf) continue;
        noise.buffer = nbuf;

        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1000 + Math.random() * 2000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.4, start + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.01, start + popDur);

        noise.connect(hp);
        hp.connect(gain);
        gain.connect(panner);

        noise.start(start);
        noise.stop(start + popDur);
      }
    }
  }

  playPop(screenX = 0.5, canvasWidth = 1) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const panner = this._createPanner(screenX, canvasWidth);
    panner.connect(this.masterGain);
    panner.connect(this.reverbNode);

    // Ladi Pop: Sharp 'snap' like a whip
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200 + Math.random() * 600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.02);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    const noise = this.ctx.createBufferSource();
    const nbuf = this._noiseBuffer(0.04, 'white');
    if (nbuf) {
      noise.buffer = nbuf;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.7, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
      
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 4000;
      bp.Q.value = 0.5;

      noise.connect(bp);
      bp.connect(noiseGain);
      noiseGain.connect(panner);
      noise.start(now);
    }

    osc.connect(gain);
    gain.connect(panner);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  playSizzle(screenX = 0.5, canvasWidth = 1, duration = 4) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const panner = this._createPanner(screenX, canvasWidth);
    panner.connect(this.masterGain);

    const noise = this.ctx.createBufferSource();
    const nbuf = this._noiseBuffer(duration + 0.5, 'pink');
    if (!nbuf) return;
    noise.buffer = nbuf;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(5000, now);

    // Add a bit of resonance to make it sound sparkly
    hp.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.setValueAtTime(0.2, now + duration - 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(panner);

    noise.start(now);
    noise.stop(now + duration + 0.1);
  }

  playSpinWhir(screenX = 0.5, canvasWidth = 1, duration = 4) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const panner = this._createPanner(screenX, canvasWidth);
    panner.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    // Rev up fast, hold, then slow down
    osc.frequency.exponentialRampToValueAtTime(800, now + duration * 0.2);
    osc.frequency.setValueAtTime(800, now + duration * 0.7);
    osc.frequency.exponentialRampToValueAtTime(100, now + duration);

    // Add a tremolo effect for the spinning sound (doppler simulation)
    const tremolo = this.ctx.createOscillator();
    tremolo.type = 'sine';
    tremolo.frequency.setValueAtTime(10, now); // 10 spins per sec
    tremolo.frequency.linearRampToValueAtTime(30, now + duration * 0.2);
    tremolo.frequency.setValueAtTime(30, now + duration * 0.7);
    tremolo.frequency.linearRampToValueAtTime(5, now + duration);
    
    const tremoloGain = this.ctx.createGain();
    tremoloGain.gain.value = 0.5; // Depth of tremolo
    
    // DC offset for tremolo so it doesn't invert phase
    const offsetNode = this.ctx.createConstantSource();
    offsetNode.offset.value = 0.5;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.linearRampToValueAtTime(2500, now + duration * 0.2);
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
    gain.gain.setValueAtTime(0.15, now + duration - 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Connections
    tremolo.connect(tremoloGain);
    offsetNode.connect(tremoloGain);
    tremoloGain.connect(gain.gain); // Modulate amplitude

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);

    // Layer noise for spark friction
    const noise = this.ctx.createBufferSource();
    const nbuf = this._noiseBuffer(duration + 0.5, 'white');
    if (nbuf) {
      noise.buffer = nbuf;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.1, now + 0.2);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2000;
      
      noise.connect(hp);
      hp.connect(noiseGain);
      noiseGain.connect(panner);
      noise.start(now);
    }

    osc.start(now);
    tremolo.start(now);
    offsetNode.start(now);
    
    osc.stop(now + duration + 0.1);
    tremolo.stop(now + duration + 0.1);
    offsetNode.stop(now + duration + 0.1);
  }

  playSoftThump(screenX = 0.5, canvasWidth = 1) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const panner = this._createPanner(screenX, canvasWidth);
    panner.connect(this.masterGain);
    panner.connect(this.reverbNode);

    // Roman Candle muffled "thwomp"
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle'; // rounder than sawtooth, dirtier than sine
    osc.frequency.setValueAtTime(150 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  _startAmbient() {
    if (!this.initialized || this.ambientSource) return;

    const duration = 15;
    const buffer = this._noiseBuffer(duration, 'brownian');
    if (!buffer) return;

    this.ambientSource = this.ctx.createBufferSource();
    this.ambientSource.buffer = buffer;
    this.ambientSource.loop = true;

    // Filter to make it sound like distant, low-frequency wind rumble
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;
    
    // Add a very slow LFO to the wind frequency for realism
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // 10 second cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 150; // Sweep between 100-400Hz
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.25, this.ctx.currentTime); // Louder ambient

    this.ambientSource.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    this.ambientSource.start();
  }

  triggerHaptic(ms = 50) {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  dispose() {
    if (this.ambientSource) {
      this.ambientSource.stop();
      this.ambientSource = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.initialized = false;
  }
}
