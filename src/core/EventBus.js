/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  EventBus.js — Pub/Sub Event System
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 */

'use strict';

export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
    /** @type {Map<string, Set<Function>>} */
    this._once      = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string}   event
   * @param {Function} handler
   * @returns {() => void}  unsubscribe function
   */
  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * Subscribe once — auto-removed after first call.
   * @param {string}   event
   * @param {Function} handler
   */
  once(event, handler) {
    if (!this._once.has(event)) this._once.set(event, new Set());
    this._once.get(event).add(handler);
  }

  /**
   * Unsubscribe from an event.
   */
  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
    this._once.get(event)?.delete(handler);
  }

  /**
   * Emit an event to all subscribers.
   * @param {string} event
   * @param {...*}   args
   */
  emit(event, ...args) {
    this._listeners.get(event)?.forEach(h => {
      try { h(...args); } catch (e) { console.error(`[EventBus] Error in "${event}" handler:`, e); }
    });

    const onceSet = this._once.get(event);
    if (onceSet) {
      onceSet.forEach(h => {
        try { h(...args); } catch (e) { console.error(`[EventBus] Error in "${event}" once-handler:`, e); }
      });
      this._once.delete(event);
    }
  }

  /** Remove all listeners for a specific event, or all events. */
  clear(event) {
    if (event) {
      this._listeners.delete(event);
      this._once.delete(event);
    } else {
      this._listeners.clear();
      this._once.clear();
    }
  }
}
