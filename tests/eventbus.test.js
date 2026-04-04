/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  eventbus.test.js — EventBus Unit Tests
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 */

import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src/core/EventBus.js';

describe('EventBus', () => {
  it('calls handlers on emit', () => {
    const bus = new EventBus();
    const fn  = vi.fn();
    bus.on('test', fn);
    bus.emit('test', 42);
    expect(fn).toHaveBeenCalledWith(42);
  });

  it('once handler fires only once', () => {
    const bus = new EventBus();
    const fn  = vi.fn();
    bus.once('x', fn);
    bus.emit('x');
    bus.emit('x');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('off removes handler', () => {
    const bus = new EventBus();
    const fn  = vi.fn();
    bus.on('y', fn);
    bus.off('y', fn);
    bus.emit('y');
    expect(fn).not.toHaveBeenCalled();
  });

  it('on returns an unsubscribe function', () => {
    const bus  = new EventBus();
    const fn   = vi.fn();
    const unsub = bus.on('z', fn);
    unsub();
    bus.emit('z');
    expect(fn).not.toHaveBeenCalled();
  });

  it('clear removes all listeners', () => {
    const bus = new EventBus();
    const fn  = vi.fn();
    bus.on('a', fn);
    bus.on('b', fn);
    bus.clear();
    bus.emit('a');
    bus.emit('b');
    expect(fn).not.toHaveBeenCalled();
  });

  it('passes multiple arguments', () => {
    const bus = new EventBus();
    const fn  = vi.fn();
    bus.on('multi', fn);
    bus.emit('multi', 1, 'two', { three: 3 });
    expect(fn).toHaveBeenCalledWith(1, 'two', { three: 3 });
  });
});
