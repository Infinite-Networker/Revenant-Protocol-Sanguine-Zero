/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  SceneManager.js — Scene Graph & Entity Management
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 */

'use strict';

import { GothicCourtyard } from '../world/GothicCourtyard.js';
import { ParticleSystem }  from '../fx/ParticleSystem.js';

export class SceneManager {
  constructor(events) {
    this.events   = events;

    this._scenes    = new Map();
    this._active    = null;
    this._entities  = new Map();
    this._nextId    = 1;

    this.particles  = new ParticleSystem(events);
    this.courtyard  = new GothicCourtyard();
  }

  init() {
    this.particles.init();
    this.registerScene('gothic_courtyard', this.courtyard);
    this.loadScene('gothic_courtyard');
    console.log('[SceneManager] Ready ✓');
  }

  registerScene(id, scene) {
    this._scenes.set(id, scene);
  }

  loadScene(id) {
    if (!this._scenes.has(id)) {
      console.error(`[SceneManager] Scene "${id}" not found.`);
      return;
    }
    this._active = this._scenes.get(id);
    this.events.emit('scene:loaded', id);
  }

  update(dt) {
    this._active?.update(dt);
    this.particles.update(dt);
    for (const entity of this._entities.values()) {
      entity.update?.(dt);
    }
  }

  render(renderer, alpha) {
    const ctx = renderer.ctx;
    const W   = renderer.width;
    const H   = renderer.height;

    // Background scene
    this._active?.render(ctx, W, H, alpha);

    // Entities
    for (const entity of this._entities.values()) {
      entity.render?.(ctx, alpha);
    }

    // Particles on top
    this.particles.render(ctx);
  }

  spawnEntity(config) {
    const id = this._nextId++;
    const entity = { id, ...config };
    this._entities.set(id, entity);
    return id;
  }

  removeEntity(id) {
    this._entities.delete(id);
  }

  get entityCount() { return this._entities.size; }
}
