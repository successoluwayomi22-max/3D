/**
 * Procedural Web Audio Ambient Sound & UI Haptics Generator
 * Generates an inspiring academic soundscape + tactile UI interaction sounds (hover blips, clicks).
 * 100% procedural with Web Audio API - zero external files needed.
 */
export class AcademyAudioManager {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.uiGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.filter = null;
    this.intervalId = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master Ambient Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // UI Sound Effects Gain (always available with low volume)
    this.uiGain = this.ctx.createGain();
    this.uiGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.uiGain.connect(this.ctx.destination);

    // Warm Low-pass Filter for Ambient Drone
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.filter.connect(this.masterGain);

    // Deep Architectural Ground Drone (C2 = 65.4 Hz, G2 = 98.0 Hz)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.setValueAtTime(65.4, this.ctx.currentTime);

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(98.0, this.ctx.currentTime);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    this.droneOsc1.connect(this.filter);
    this.droneOsc2.connect(droneGain);
    droneGain.connect(this.filter);

    this.droneOsc1.start();
    this.droneOsc2.start();

    this.scheduleHarmonics();
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Tactile subtle UI Hover sound
   */
  playHoverSound() {
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // High soft ping
      osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.uiGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {}
  }

  /**
   * Satisfying tactical UI Click sound
   */
  playClickSound() {
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(210, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.uiGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  scheduleHarmonics() {
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];

    this.intervalId = setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      if (Math.random() > 0.45) {
        const note = notes[Math.floor(Math.random() * notes.length)];
        this.playChime(note);
      }
    }, 4500);
  }

  playChime(freq) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.0);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 3.2);
  }

  toggle() {
    this.ensureContext();

    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.masterGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 1.5);
    } else {
      this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 1.0);
    }

    return this.isPlaying;
  }
}
