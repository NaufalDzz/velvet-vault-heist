export class HeistAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastStepAt = 0;
  }

  unlock() {
    if (this.muted) return;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, duration, type = 'sine', gain = 0.08, endFreq = freq) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playFootstep(sprinting) {
    if (this.muted || !this.ctx) return;
    const now = performance.now();
    const interval = sprinting ? 190 : 340;
    if (now - this.lastStepAt < interval) return;
    this.lastStepAt = now;
    this.tone(sprinting ? 120 : 88, 0.05, 'triangle', sprinting ? 0.045 : 0.02, 55);
  }

  playEmp() {
    this.tone(740, 0.35, 'sawtooth', 0.09, 110);
    this.tone(360, 0.42, 'sine', 0.07, 70);
  }

  playDecoy() {
    this.tone(1320, 0.14, 'sine', 0.07, 1320);
    setTimeout(() => this.tone(1760, 0.2, 'sine', 0.05, 1760), 80);
  }

  playSmoke() {
    this.tone(240, 0.28, 'triangle', 0.06, 95);
  }

  playHack() {
    this.tone(520, 0.08, 'square', 0.05, 780);
    setTimeout(() => this.tone(880, 0.14, 'sine', 0.06, 1040), 75);
  }

  playLoot() {
    this.tone(587, 0.12, 'triangle', 0.08);
    setTimeout(() => this.tone(880, 0.14, 'triangle', 0.08), 90);
    setTimeout(() => this.tone(1174, 0.24, 'sine', 0.09), 180);
  }

  playSuspicion() {
    this.tone(310, 0.18, 'sawtooth', 0.05, 390);
  }

  playAlarm() {
    this.tone(420, 0.22, 'sawtooth', 0.10, 290);
    setTimeout(() => this.tone(440, 0.22, 'sawtooth', 0.09, 280), 210);
  }

  playGetaway() {
    this.tone(523, 0.14, 'triangle', 0.08);
    setTimeout(() => this.tone(659, 0.14, 'triangle', 0.08), 100);
    setTimeout(() => this.tone(784, 0.16, 'triangle', 0.08), 200);
    setTimeout(() => this.tone(1046, 0.35, 'sine', 0.10), 300);
  }
}
