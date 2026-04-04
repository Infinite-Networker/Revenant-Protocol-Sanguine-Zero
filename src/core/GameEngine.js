/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  GameEngine.js — Core Engine Module
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 *
 *  The central orchestration layer for Revenant Protocol.
 *  Manages the game loop, scene graph, entity registry,
 *  and high-level subsystem lifecycle.
 */

'use strict';

import { EventBus }        from './EventBus.js';
import { InputManager }    from './InputManager.js';
import { AssetLoader }     from './AssetLoader.js';
import { SceneManager }    from './SceneManager.js';
import { Renderer }        from '../fx/Renderer.js';
import { AudioSystem }     from '../audio/AudioSystem.js';
import { CombatSystem }    from '../combat/CombatSystem.js';
import { UIManager }       from '../ui/UIManager.js';
import { DebugOverlay }    from './DebugOverlay.js';

// ─── Engine Constants ──────────────────────────────────────────────────────────
export const ENGINE_VERSION  = '0.9.1-alpha';
export const TARGET_FPS      = 60;
export const FIXED_TIMESTEP  = 1000 / TARGET_FPS;   // ms per tick
export const MAX_DELTA_CLAMP = 100;                  // ms – prevents spiral of death

// ─── Engine States ─────────────────────────────────────────────────────────────
export const EngineState = Object.freeze({
  UNINITIALIZED : 'UNINITIALIZED',
  LOADING       : 'LOADING',
  RUNNING       : 'RUNNING',
  PAUSED        : 'PAUSED',
  STOPPED       : 'STOPPED',
  ERROR         : 'ERROR',
});

// ──────────────────────────────────────────────────────────────────────────────
//  GameEngine — Singleton
// ──────────────────────────────────────────────────────────────────────────────
export class GameEngine {
  /** @type {GameEngine|null} */
  static #instance = null;

  static getInstance() {
    if (!GameEngine.#instance) GameEngine.#instance = new GameEngine();
    return GameEngine.#instance;
  }

  constructor() {
    if (GameEngine.#instance) {
      throw new Error('[GameEngine] Use GameEngine.getInstance()');
    }

    // ── Core State ──────────────────────────────────────────
    this.state           = EngineState.UNINITIALIZED;
    this.canvas          = null;
    this.frameId         = null;
    this.lastTimestamp   = 0;
    this.accumulator     = 0;
    this.totalTime       = 0;
    this.frameCount      = 0;
    this.fps             = 0;
    this._fpsTimer       = 0;
    this._fpsFrames      = 0;

    // ── Subsystems ──────────────────────────────────────────
    this.events   = new EventBus();
    this.input    = null;
    this.assets   = null;
    this.scene    = null;
    this.renderer = null;
    this.audio    = null;
    this.combat   = null;
    this.ui       = null;
    this.debug    = null;

    // ── Config ──────────────────────────────────────────────
    this.config = {
      debug        : false,
      targetFPS    : TARGET_FPS,
      audioEnabled : true,
      vsync        : true,
    };

    console.log(`%c[Revenant Protocol] Engine v${ENGINE_VERSION} — Cherry Computer Ltd.`,
      'color:#c0392b;font-weight:bold;font-size:14px;');
  }

  // ═══════════════════════════════════════════════════════════
  //  Initialisation
  // ═══════════════════════════════════════════════════════════
  /**
   * Bootstrap the engine against a <canvas> element.
   * @param {HTMLCanvasElement} canvas
   * @param {object} [cfg] — optional config overrides
   */
  async init(canvas, cfg = {}) {
    if (this.state !== EngineState.UNINITIALIZED) {
      console.warn('[GameEngine] Already initialised.');
      return;
    }

    this.canvas = canvas;
    Object.assign(this.config, cfg);
    this.state  = EngineState.LOADING;

    this.events.emit('engine:loading');

    try {
      // Ordered subsystem boot
      this.assets   = new AssetLoader(this.events);
      this.renderer = new Renderer(canvas, this.events);
      this.input    = new InputManager(canvas, this.events);
      this.audio    = new AudioSystem(this.events, this.config.audioEnabled);
      this.combat   = new CombatSystem(this.events);
      this.ui       = new UIManager(canvas, this.events);
      this.scene    = new SceneManager(this.events);

      if (this.config.debug) {
        this.debug = new DebugOverlay(canvas, this);
      }

      await this._loadCoreAssets();
      await this._initSubsystems();

      this.state = EngineState.RUNNING;
      this.events.emit('engine:ready');
      console.log('[GameEngine] Ready ✓');

      this._loop(performance.now());
    } catch (err) {
      this.state = EngineState.ERROR;
      this.events.emit('engine:error', err);
      console.error('[GameEngine] Fatal init error:', err);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Private Bootstrap Helpers
  // ═══════════════════════════════════════════════════════════
  async _loadCoreAssets() {
    await this.assets.load([
      { id: 'sfx_dash',        type: 'audio', src: 'assets/audio/sfx_sanguine_dash.ogg' },
      { id: 'sfx_hit_heavy',   type: 'audio', src: 'assets/audio/sfx_hit_heavy.ogg' },
      { id: 'sfx_crit',        type: 'audio', src: 'assets/audio/sfx_critical.ogg' },
      { id: 'sfx_bloodmeter',  type: 'audio', src: 'assets/audio/sfx_blood_charge.ogg' },
      { id: 'shader_blood',    type: 'shader', src: 'assets/shaders/blood_trail.glsl' },
      { id: 'shader_blade',    type: 'shader', src: 'assets/shaders/blade_glow.glsl' },
      { id: 'font_hud',        type: 'font',   src: 'assets/fonts/SanguineHUD.woff2' },
    ]);
  }

  async _initSubsystems() {
    await this.renderer.init();
    await this.audio.init();
    this.input.init();
    this.combat.init();
    this.ui.init();
    this.scene.init();
  }

  // ═══════════════════════════════════════════════════════════
  //  Main Loop  (fixed-timestep + variable render)
  // ═══════════════════════════════════════════════════════════
  _loop(timestamp) {
    if (this.state !== EngineState.RUNNING) return;

    const raw   = timestamp - this.lastTimestamp;
    const delta = Math.min(raw, MAX_DELTA_CLAMP);   // clamp
    this.lastTimestamp = timestamp;
    this.accumulator  += delta;

    // ── Fixed Update (physics / combat) ─────────────────────
    while (this.accumulator >= FIXED_TIMESTEP) {
      this._fixedUpdate(FIXED_TIMESTEP);
      this.accumulator -= FIXED_TIMESTEP;
      this.totalTime   += FIXED_TIMESTEP;
    }

    // ── Variable Render ─────────────────────────────────────
    const alpha = this.accumulator / FIXED_TIMESTEP;   // interpolation factor
    this._render(delta, alpha);

    // ── FPS Counter ─────────────────────────────────────────
    this._fpsFrames++;
    this._fpsTimer += delta;
    if (this._fpsTimer >= 1000) {
      this.fps       = this._fpsFrames;
      this._fpsFrames = 0;
      this._fpsTimer  = 0;
      this.events.emit('engine:fps', this.fps);
    }

    this.frameCount++;
    this.frameId = requestAnimationFrame(ts => this._loop(ts));
  }

  _fixedUpdate(dt) {
    this.input.update(dt);
    this.scene.update(dt);
    this.combat.update(dt);
    this.ui.update(dt);
    if (this.debug) this.debug.update(dt);
  }

  _render(dt, alpha) {
    this.renderer.beginFrame();
    this.scene.render(this.renderer, alpha);
    this.ui.render(this.renderer);
    if (this.debug) this.debug.render(this.renderer);
    this.renderer.endFrame();
  }

  // ═══════════════════════════════════════════════════════════
  //  Lifecycle Controls
  // ═══════════════════════════════════════════════════════════
  pause() {
    if (this.state !== EngineState.RUNNING) return;
    this.state = EngineState.PAUSED;
    cancelAnimationFrame(this.frameId);
    this.events.emit('engine:paused');
    console.log('[GameEngine] Paused.');
  }

  resume() {
    if (this.state !== EngineState.PAUSED) return;
    this.state         = EngineState.RUNNING;
    this.lastTimestamp = performance.now();
    this._loop(this.lastTimestamp);
    this.events.emit('engine:resumed');
    console.log('[GameEngine] Resumed.');
  }

  stop() {
    cancelAnimationFrame(this.frameId);
    this.state = EngineState.STOPPED;
    this.events.emit('engine:stopped');
    console.log('[GameEngine] Stopped.');
  }

  // ═══════════════════════════════════════════════════════════
  //  Utility
  // ═══════════════════════════════════════════════════════════
  setDebug(enabled) {
    this.config.debug = enabled;
    if (enabled && !this.debug) {
      this.debug = new DebugOverlay(this.canvas, this);
    } else if (!enabled && this.debug) {
      this.debug.destroy();
      this.debug = null;
    }
  }

  get diagnostics() {
    return {
      version    : ENGINE_VERSION,
      state      : this.state,
      fps        : this.fps,
      frameCount : this.frameCount,
      totalTime  : this.totalTime,
      entities   : this.scene?.entityCount ?? 0,
    };
  }
}

export default GameEngine.getInstance();
