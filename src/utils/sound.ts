class SoundEffects {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  /**
   * Synthesizes a deep, mournful tolling gong/bell.
   * Uses frequency modulation and inharmonic overtones to create a tragic metallic ringing
   * layered with a low-frequency rumbling thunder.
   */
  public playDespairBell() {
    try {
      this.init();
      if (!this.ctx) return;

      // Resume context if suspended (browser security policy)
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      
      // HAUNTING BELL STRIKE
      // Fundamental at 108Hz (around A2/A#2) and inharmonic overtones for that tragic bell dissonance
      const frequencies = [108, 222, 335, 440, 560, 680, 800];
      const gains = [0.8, 0.45, 0.3, 0.2, 0.15, 0.08, 0.04];
      
      // Master Bell Gain
      const bellGain = this.ctx.createGain();
      bellGain.gain.setValueAtTime(0, now);
      bellGain.gain.linearRampToValueAtTime(0.7, now + 0.01);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5); // long sad decay
      
      // Apply Reverb-like stereo delay using a splitter/merger and feedback
      const delay = this.ctx.createDelay();
      delay.delayTime.setValueAtTime(0.3, now);
      
      const delayGain = this.ctx.createGain();
      delayGain.gain.setValueAtTime(0.25, now);
      
      bellGain.connect(this.ctx.destination);
      bellGain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(this.ctx.destination);
      delayGain.connect(delay); // feedback loop
      
      frequencies.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        // Dissonance sweep to emulate structural vibrations of a massive heavy metal bell
        osc.frequency.linearRampToValueAtTime(freq - 1.5, now + 4.5);
        
        oscGain.gain.setValueAtTime(gains[idx], now);
        // Overtones fade out faster than the base frequency
        const decayRate = 4.5 / (idx * 0.75 + 1);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decayRate);
        
        osc.connect(oscGain);
        oscGain.connect(bellGain);
        
        osc.start(now);
        osc.stop(now + 4.5);
      });

      // DISTANT THUNDER RUMBLE
      const bufferSize = this.ctx.sampleRate * 2.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(120, now);
      lowpass.frequency.exponentialRampToValueAtTime(25, now + 2.5);
      
      const thunderGain = this.ctx.createGain();
      thunderGain.gain.setValueAtTime(0, now);
      thunderGain.gain.linearRampToValueAtTime(0.35, now + 0.1);
      thunderGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      
      noise.connect(lowpass);
      lowpass.connect(thunderGain);
      thunderGain.connect(this.ctx.destination);
      
      noise.start(now);
      noise.stop(now + 2.5);
    } catch (e) {
      console.warn("AudioContext despair bell playback failed:", e);
    }
  }

  /**
   * Synthesizes a mournful, vibrating pluck mimicking a classic Sitar or Tanpura string.
   * Employs vibrato (LFO) and a buzzy bridge simulator using waveshaping elements.
   */
  public playSadSitar() {
    try {
      this.init();
      if (!this.ctx) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const baseFreq = 196.00; // G3 (a tragic, drone-like key)

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.65, now + 0.015);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

      // Warm acoustic resonance filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, now);
      filter.frequency.exponentialRampToValueAtTime(280, now + 3.0);

      filter.connect(this.ctx.destination);
      masterGain.connect(filter);

      // Create a set of vibrating string harmonics
      const harmonics = [1, 2, 3, 4, 5, 6, 7];
      const gains = [0.85, 0.5, 0.4, 0.25, 0.12, 0.06, 0.02];

      harmonics.forEach((h, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        // Alternating waveforms to simulate the complex harmonics of a flat bridge (Jawari)
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(baseFreq * h, now);

        // Add LFO (Vibrato / Tremolo) for the soulful wavering of Indian classical music
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(5.8, now); // ~6Hz vibrato
        lfoGain.gain.setValueAtTime(h * 1.8, now); // vibrato depth scales with harmonics

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        oscGain.gain.setValueAtTime(gains[idx], now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + (3.2 / h));

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        lfo.start(now);
        osc.start(now);

        lfo.stop(now + 3.5);
        osc.stop(now + 3.5);
      });
    } catch (e) {
      console.warn("AudioContext sad sitar playback failed:", e);
    }
  }
}

export const soundEffects = new SoundEffects();
