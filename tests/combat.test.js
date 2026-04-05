/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  combat.test.js — CombatSystem Unit Tests
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 *
 *  Test suite for:
 *   • Blood Meter regen & consumption
 *   • Sanguine Dash state transitions
 *   • Zero-Frame dash-to-strike window
 *   • Critical hit calculation
 *   • Combo counter lifecycle
 *   • Enemy HP application
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus }    from '../src/core/EventBus.js';
import {
  CombatSystem,
  CombatState,
  BLOOD_METER_MAX,
  BLOOD_DASH_COST,
  BLOOD_REGEN_RATE,
  DASH_DURATION,
  ZERO_FRAME_WINDOW,
  CRIT_MULTIPLIER,
} from '../src/combat/CombatSystem.js';

// ─── Test Fixtures ────────────────────────────────────────────────────────────
let events, combat;

beforeEach(() => {
  events = new EventBus();
  combat = new CombatSystem(events);
  combat.init();
});

// ──────────────────────────────────────────────────────────────────────────────
describe('CombatSystem — Blood Meter', () => {

  it('starts at maximum', () => {
    expect(combat.bloodMeter).toBe(BLOOD_METER_MAX);
  });

  it('regenerates passively over time', () => {
    combat.bloodMeter = 50;
    combat.update(1000);  // 1 second
    expect(combat.bloodMeter).toBeCloseTo(50 + BLOOD_REGEN_RATE, 0);
  });

  it('does not exceed maximum during regen', () => {
    combat.bloodMeter = BLOOD_METER_MAX - 1;
    combat.update(5000);
    expect(combat.bloodMeter).toBe(BLOOD_METER_MAX);
  });

  it('emits ui:blood_meter_change on regen', () => {
    const spy = vi.fn();
    events.on('ui:blood_meter_change', spy);
    combat.bloodMeter = 50;
    combat.update(500);
    expect(spy).toHaveBeenCalled();
  });

});

// ──────────────────────────────────────────────────────────────────────────────
describe('CombatSystem — Sanguine Dash', () => {

  it('enters DASHING state on dash input', () => {
    events.emit('input:dash:start');
    expect(combat.state).toBe(CombatState.DASHING);
  });

  it('consumes BLOOD_DASH_COST on dash', () => {
    events.emit('input:dash:start');
    expect(combat.bloodMeter).toBe(BLOOD_METER_MAX - BLOOD_DASH_COST);
  });

  it('blocks dash when blood meter is insufficient', () => {
    combat.bloodMeter = BLOOD_DASH_COST - 1;
    events.emit('input:dash:start');
    expect(combat.state).toBe(CombatState.IDLE);
  });

  it('emits ui:blood_insufficient when meter is too low', () => {
    const spy = vi.fn();
    events.on('ui:blood_insufficient', spy);
    combat.bloodMeter = 0;
    events.emit('input:dash:start');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('returns to IDLE after dash duration elapses', () => {
    events.emit('input:dash:start');
    combat.update(DASH_DURATION + 10);
    expect(combat.state).toBe(CombatState.IDLE);
  });

  it('emits combat:dash_start with correct payload', () => {
    const spy = vi.fn();
    events.on('combat:dash_start', spy);
    events.emit('input:dash:start');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      speedMult : 4.5,
      duration  : DASH_DURATION,
    }));
  });

});

// ──────────────────────────────────────────────────────────────────────────────
describe('CombatSystem — Zero-Frame Dash-to-Strike', () => {

  it('cancels dash immediately on attack within Zero-Frame window', () => {
    events.emit('input:dash:start');
    // Attack immediately (within ZERO_FRAME_WINDOW)
    events.emit('input:attack_light:start');
    expect(combat.state).toBe(CombatState.ATTACKING);
    expect(combat._dashTimer).toBe(0);
  });

  it('emits combat:zero_frame_strike event on Zero-Frame', () => {
    const spy = vi.fn();
    events.on('combat:zero_frame_strike', spy);
    events.emit('input:dash:start');
    events.emit('input:attack_light:start');
    expect(spy).toHaveBeenCalledWith({ type: 'LIGHT' });
  });

  it('does NOT trigger Zero-Frame after dash window expires', () => {
    const spy = vi.fn();
    events.on('combat:zero_frame_strike', spy);
    events.emit('input:dash:start');
    // Advance past the Zero-Frame window
    combat.update(DASH_DURATION - ZERO_FRAME_WINDOW + 10);
    events.emit('input:attack_light:start');
    expect(spy).not.toHaveBeenCalled();
  });

  it('prevents double Zero-Frame in same dash', () => {
    const spy = vi.fn();
    events.on('combat:zero_frame_strike', spy);
    events.emit('input:dash:start');
    events.emit('input:attack_light:start');
    events.emit('input:attack_heavy:start');
    expect(spy).toHaveBeenCalledTimes(1);
  });

});

// ──────────────────────────────────────────────────────────────────────────────
describe('CombatSystem — Critical Hits', () => {

  it('deals at least base damage on light attack', () => {
    const spy = vi.fn();
    events.on('ui:damage_number', spy);
    events.emit('input:attack_light:start');
    expect(spy).toHaveBeenCalled();
    const { value } = spy.mock.calls[0][0];
    expect(value).toBeGreaterThanOrEqual(18);
  });

  it('critical damage is significantly higher than base', () => {
    // Force a crit by mocking Math.random
    const origRandom = Math.random;
    Math.random = () => 0;   // always returns 0 → crit guaranteed (< CRIT_THRESHOLD)
    const spy = vi.fn();
    events.on('ui:damage_number', spy);
    events.emit('input:attack_heavy:start');
    Math.random = origRandom;
    const { value, isCrit } = spy.mock.calls[0][0];
    expect(isCrit).toBe(true);
    expect(value).toBeGreaterThanOrEqual(Math.floor(55 * CRIT_MULTIPLIER));
  });

  it('emits ui:crit_indicator on critical strike', () => {
    const spy = vi.fn();
    events.on('ui:crit_indicator', spy);
    const origRandom = Math.random;
    Math.random = () => 0;
    events.emit('input:attack_heavy:start');
    Math.random = origRandom;
    expect(spy).toHaveBeenCalledOnce();
  });

});

// ──────────────────────────────────────────────────────────────────────────────
describe('CombatSystem — Combo Counter', () => {

  it('increments combo on each attack', () => {
    events.emit('input:attack_light:start');
    events.emit('input:attack_light:start');
    events.emit('input:attack_light:start');
    expect(combat.comboCount).toBe(3);
  });

  it('resets combo after timeout', () => {
    events.emit('input:attack_light:start');
    expect(combat.comboCount).toBe(1);
    combat.update(2000);   // > COMBO_RESET (1800ms)
    expect(combat.comboCount).toBe(0);
  });

  it('emits ui:combo_reset when combo expires', () => {
    const spy = vi.fn();
    events.on('ui:combo_reset', spy);
    events.emit('input:attack_light:start');
    combat.update(2000);
    expect(spy).toHaveBeenCalledOnce();
  });

});

// ──────────────────────────────────────────────────────────────────────────────
describe('CombatSystem — Entity Management', () => {

  it('spawns an enemy and returns a numeric ID', () => {
    const id = combat.spawnEnemy({ hp: 100 });
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('applies damage to nearest alive enemy', () => {
    const killedSpy = vi.fn();
    events.on('combat:enemy_killed', killedSpy);
    combat.spawnEnemy({ hp: 10 });   // very low HP
    const origRandom = Math.random;
    Math.random = () => 0.5;         // no crit
    events.emit('input:attack_heavy:start');   // 55 > 10
    Math.random = origRandom;
    expect(killedSpy).toHaveBeenCalledOnce();
  });

  it('grants blood on enemy kill', () => {
    combat.bloodMeter = 40;
    combat.spawnEnemy({ hp: 1 });
    const origRandom = Math.random;
    Math.random = () => 0.5;
    events.emit('input:attack_light:start');
    Math.random = origRandom;
    expect(combat.bloodMeter).toBeGreaterThan(40);
  });

});
