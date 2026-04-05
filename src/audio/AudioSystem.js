/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  AudioSystem.js — Spatial & Reactive Audio
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 *
 *  Web Audio API wrapper providing:
 *   • One-shot SFX playback with pitch randomisation
 *   • Layered music system (base + intensity stems)
 *   • Hit-stop audio ducking
 *   • Low-pass filter during slow-mo / hitstop
 */

'use strict';

const PITCH_VARIANCE = 0.08;   // ± semitones (proportional)

export class AudioSystem {
  constructor(events, enabled = true) {
    this.events   = events;
    this.enabled  = enabled;

    /** @type {AudioContext|null} */
    this._ctx     = null;
    /** @type {Map<string, AudioBuffer>} */
    this._buffers = new Map();

    this._masterGain  = null;
    this._musicGain   = null;
    this._sfxGain     = null;
    this._filter      = null;

    this._musicSource = null;
  }

  async init() {
    if (!this.enabled) return;
    try {
      this._ctx        = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._sfxGain    = this._ctx.createGain();
      this._musicGain  = this._ctx.createGain();
      this._filter     = this._ctx.createBiquadFilter();

      this._filter.type            = 'lowpass';
      this._filter.frequency.value = 20000;   // full range default

      // Chain: [sfx / music] → filter → master → destination
      this._sfxGain.connect(this._filter);
      this._musicGain.connect(this._filter);
      this._filter.connect(this._masterGain);
      this._masterGain.connect(this._ctx.destination);

      this._sfxGain.gain.value   = 0.9;
      this._musicGain.gain.value = 0.55;
      this._masterGain.gain.value= 1.0;

      // Subscribe
      this.events.on('audio:play',        id  => this.play(id));
      this.events.on('audio:play_music',  id  => this.playMusic(id));
      this.events.on('audio:stop_music',  ()  => this.stopMusic());
      this.events.on('audio:set_volume',  v   => this.setMasterVolume(v));
      this.events.on('combat:dash_start', ()  => this._onHitstopBegin());
      this.events.on('combat:dash_end',   ()  => this._onHitstopEnd());

      console.log('[AudioSystem] Ready ✓ (Web Audio API)');
    } catch (err) {
      console.warn('[AudioSystem] Web Audio unavailable:', err.message);
      this.enabled = false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Buffer Registration (called by AssetLoader)
  // ═══════════════════════════════════════════════════════════
  registerBuffer(id, buffer) {
    this._buffers.set(id, buffer);
  }

  // ═══════════════════════════════════════════════════════════
  //  Playback
  // ═══════════════════════════════════════════════════════════
  play(id, options = {}) {
    if (!this.enabled || !this._ctx) return;
    const buffer = this._buffers.get(id);
    if (!buffer) { console.warn(`[AudioSystem] Buffer not found: ${id}`); return; }

    const source        = this._ctx.createBufferSource();
    source.buffer       = buffer;
    source.playbackRate.value = 1 + (Math.random() - 0.5) * PITCH_VARIANCE * 2;

    const gainNode = this._ctx.createGain();
    gainNode.gain.value = options.volume ?? 1.0;

    source.connect(gainNode);
    gainNode.connect(this._sfxGain);
    source.start(0);
  }

  async playMusic(id, fadeIn = 1.5) {
    if (!this.enabled || !this._ctx) return;
    this.stopMusic(0.5);

    const buffer = this._buffers.get(id);
    if (!buffer) return;

    const source   = this._ctx.createBufferSource();
    source.buffer  = buffer;
    source.loop    = true;
    source.connect(this._musicGain);

    const now = this._ctx.currentTime;
    this._musicGain.gain.setValueAtTime(0, now);
    this._musicGain.gain.linearRampToValueAtTime(0.55, now + fadeIn);
    source.start(0);
    this._musicSource = source;
  }

  stopMusic(fadeOut = 1.0) {
    if (!this._musicSource) return;
    const now = this._ctx.currentTime;
    this._musicGain.gain.setValueAtTime(this._musicGain.gain.value, now);
    this._musicGain.gain.linearRampToValueAtTime(0, now + fadeOut);
    this._musicSource.stop(now + fadeOut);
    this._musicSource = null;
  }

  // ═══════════════════════════════════════════════════════════
  //  Hit-stop Ducking (low-pass during freeze-frames)
  // ═══════════════════════════════════════════════════════════
  _onHitstopBegin() {
    if (!this._filter) return;
    this._filter.frequency.cancelScheduledValues(0);
    this._filter.frequency.setValueAtTime(this._filter.frequency.value, this._ctx.currentTime);
    this._filter.frequency.linearRampToValueAtTime(900, this._ctx.currentTime + 0.05);
  }

  _onHitstopEnd() {
    if (!this._filter) return;
    this._filter.frequency.cancelScheduledValues(0);
    this._filter.frequency.setValueAtTime(this._filter.frequency.value, this._ctx.currentTime);
    this._filter.frequency.linearRampToValueAtTime(20000, this._ctx.currentTime + 0.15);
  }

  // ═══════════════════════════════════════════════════════════
  //  Controls
  // ═══════════════════════════════════════════════════════════
  setMasterVolume(v) {
    if (this._masterGain) this._masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  mute()   { this.setMasterVolume(0); }
  unmute() { this.setMasterVolume(1); }

  /** Must be called from a user gesture to unlock AudioContext on mobile. */
  unlock() {
    if (this._ctx?.state === 'suspended') this._ctx.resume();
  }
}
