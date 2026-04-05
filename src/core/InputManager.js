/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  InputManager.js — Input Handling & Action Mapping
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 *
 *  Provides a unified keyboard + gamepad input layer with
 *  action-mapping, buffering, and combo-detection for the
 *  Sanguine Dash mechanic.
 */

'use strict';

// ─── Action Bindings ──────────────────────────────────────────────────────────
export const ActionMap = Object.freeze({
  MOVE_LEFT    : ['ArrowLeft',  'KeyA'],
  MOVE_RIGHT   : ['ArrowRight', 'KeyD'],
  MOVE_UP      : ['ArrowUp',    'KeyW'],
  MOVE_DOWN    : ['ArrowDown',  'KeyS'],
  DASH         : ['ShiftLeft',  'ShiftRight'],   // Sanguine Dash trigger
  ATTACK_LIGHT : ['KeyZ',       'KeyJ'],
  ATTACK_HEAVY : ['KeyX',       'KeyK'],
  ATTACK_SPECIAL:['KeyC',       'KeyL'],
  DODGE        : ['Space'],
  LOCK_ON      : ['KeyQ'],
  INTERACT     : ['KeyE'],
  PAUSE        : ['Escape'],
});

// Buffer window for input (ms) — Zero-Frame feel
const INPUT_BUFFER_MS = 120;

export class InputManager {
  constructor(canvas, events) {
    this.canvas   = canvas;
    this.events   = events;

    /** @type {Set<string>} */
    this._held    = new Set();   // currently held keys
    /** @type {Set<string>} */
    this._pressed = new Set();   // pressed this frame
    /** @type {Set<string>} */
    this._released= new Set();   // released this frame

    // Input buffer for forgiving combo windows
    this._buffer  = [];          // [{ action, timestamp }]

    // Reverse lookup: key → actions
    this._keyToActions = new Map();
    for (const [action, keys] of Object.entries(ActionMap)) {
      for (const key of keys) {
        if (!this._keyToActions.has(key)) this._keyToActions.set(key, []);
        this._keyToActions.get(key).push(action);
      }
    }

    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp   = this._onKeyUp.bind(this);
  }

  init() {
    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup',   this._boundKeyUp);
    console.log('[InputManager] Ready ✓');
  }

  destroy() {
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup',   this._boundKeyUp);
  }

  update(dt) {
    // Flush per-frame transient sets
    this._pressed.clear();
    this._released.clear();

    // Expire old buffer entries
    const now = performance.now();
    this._buffer = this._buffer.filter(e => now - e.timestamp < INPUT_BUFFER_MS);
  }

  // ═══════════════════════════════════════════════════════════
  //  Raw Event Handlers
  // ═══════════════════════════════════════════════════════════
  _onKeyDown(e) {
    if (e.repeat) return;
    this._held.add(e.code);
    this._pressed.add(e.code);

    const actions = this._keyToActions.get(e.code) ?? [];
    for (const action of actions) {
      this._buffer.push({ action, timestamp: performance.now() });
      this.events.emit(`input:${action.toLowerCase()}:start`);
    }
  }

  _onKeyUp(e) {
    this._held.delete(e.code);
    this._released.add(e.code);

    const actions = this._keyToActions.get(e.code) ?? [];
    for (const action of actions) {
      this.events.emit(`input:${action.toLowerCase()}:end`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Public Query API
  // ═══════════════════════════════════════════════════════════

  /** True while the action's key is held. */
  isHeld(action) {
    return ActionMap[action]?.some(k => this._held.has(k)) ?? false;
  }

  /** True only on the frame the action was pressed. */
  isPressed(action) {
    return ActionMap[action]?.some(k => this._pressed.has(k)) ?? false;
  }

  /** True only on the frame the action was released. */
  isReleased(action) {
    return ActionMap[action]?.some(k => this._released.has(k)) ?? false;
  }

  /**
   * Check if an action was recently buffered (within INPUT_BUFFER_MS).
   * Used to implement the Zero-Frame dash-to-strike leniency.
   */
  wasBuffered(action) {
    return this._buffer.some(e => e.action === action);
  }

  /**
   * Movement vector {x, y} — normalised to [-1, 1].
   */
  get moveVector() {
    let x = 0, y = 0;
    if (this.isHeld('MOVE_LEFT'))  x -= 1;
    if (this.isHeld('MOVE_RIGHT')) x += 1;
    if (this.isHeld('MOVE_UP'))    y -= 1;
    if (this.isHeld('MOVE_DOWN'))  y += 1;

    const len = Math.hypot(x, y);
    if (len > 0) { x /= len; y /= len; }
    return { x, y };
  }
}
