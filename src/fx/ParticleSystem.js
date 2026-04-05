/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  ParticleSystem.js — Vivid-Shadow & Blade Glow FX
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 *
 *  Provides:
 *   • Vivid-Shadow  — particle trail emitted during Sanguine Dash
 *   • Blade Glow    — weapon-edge luminance effect during attacks
 *   • Blood Splash  — impact splatter on heavy hits
 *   • Ambient Motes — gothic-renaissance courtyard atmosphere
 */

'use strict';

// ─── Particle Presets ─────────────────────────────────────────────────────────
const PRESETS = {
  VIVID_SHADOW: {
    count      : 18,
    lifetime   : 350,    // ms
    speed      : 1.2,
    spread     : 0.6,
    startSize  : 14,
    endSize    : 0,
    startAlpha : 0.85,
    endAlpha   : 0,
    colors     : ['#c0392b', '#8e0000', '#200000', '#ff6b6b'],
    glow       : true,
    glowColor  : 'rgba(192,57,43,0.5)',
    glowRadius : 20,
  },
  BLADE_GLOW: {
    count      : 8,
    lifetime   : 200,
    speed      : 2.8,
    spread     : 0.3,
    startSize  : 6,
    endSize    : 0,
    startAlpha : 1.0,
    endAlpha   : 0,
    colors     : ['#ffffff', '#ffe0e0', '#ff9090'],
    glow       : true,
    glowColor  : 'rgba(255,180,180,0.7)',
    glowRadius : 14,
  },
  BLOOD_SPLASH: {
    count      : 24,
    lifetime   : 600,
    speed      : 3.5,
    spread     : Math.PI * 2,
    startSize  : 5,
    endSize    : 2,
    startAlpha : 0.9,
    endAlpha   : 0,
    colors     : ['#c0392b', '#8e0000', '#ff3333'],
    glow       : false,
    gravity    : 180,
  },
  AMBIENT_MOTE: {
    count      : 1,
    lifetime   : 3000,
    speed      : 0.15,
    spread     : Math.PI * 2,
    startSize  : 3,
    endSize    : 1,
    startAlpha : 0.4,
    endAlpha   : 0,
    colors     : ['#9b59b6', '#6c3483', '#e8daef'],
    glow       : true,
    glowColor  : 'rgba(155,89,182,0.3)',
    glowRadius : 8,
  },
};

// ──────────────────────────────────────────────────────────────────────────────
//  Particle — data class
// ──────────────────────────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, preset, angle) {
    this.x       = x;
    this.y       = y;
    this.preset  = preset;
    this.timer   = preset.lifetime;
    this.total   = preset.lifetime;

    const speed  = preset.speed * (0.7 + Math.random() * 0.6);
    const a      = angle + (Math.random() - 0.5) * (preset.spread ?? Math.PI * 2);
    this.vx      = Math.cos(a) * speed;
    this.vy      = Math.sin(a) * speed - (preset.gravity ? 0 : speed * 0.5);
    this.gravity = preset.gravity ?? 0;

    this.color   = preset.colors[Math.floor(Math.random() * preset.colors.length)];
  }

  get life()  { return this.timer / this.total; }   // 1 → 0
  get size()  {
    const { startSize, endSize } = this.preset;
    return startSize + (endSize - startSize) * (1 - this.life);
  }
  get alpha() {
    const { startAlpha, endAlpha } = this.preset;
    return startAlpha + (endAlpha - startAlpha) * (1 - this.life);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  ParticleSystem
// ──────────────────────────────────────────────────────────────────────────────
export class ParticleSystem {
  constructor(events) {
    this.events = events;

    /** @type {Particle[]} */
    this._pool    = [];
    this._emitters= [];   // active continuous emitters

    this._maxParticles = 800;
  }

  init() {
    // Listen for FX triggers from CombatSystem / InputManager
    this.events.on('combat:dash_start',      d  => this._onDashStart(d));
    this.events.on('combat:dash_end',        ()  => this._stopDashTrail());
    this.events.on('combat:zero_frame_strike', d => this._onBladeStrike(d));
    this.events.on('fx:hit_flash',           d  => this._onHitFX(d));
    this.events.on('combat:entity_spawned',  () => {}); // placeholder

    // Ambient motes (gothic atmosphere)
    this._startAmbientMotes();

    console.log('[ParticleSystem] Ready ✓');
  }

  // ═══════════════════════════════════════════════════════════
  //  Update & Render
  // ═══════════════════════════════════════════════════════════
  update(dt) {
    // Tick emitters
    for (const emitter of this._emitters) {
      emitter.timer -= dt;
      if (emitter.timer > 0 && emitter.active) {
        emitter.elapsed += dt;
        while (emitter.elapsed >= emitter.interval) {
          this._burst(emitter.x, emitter.y, emitter.preset, emitter.count, emitter.angle);
          emitter.elapsed -= emitter.interval;
        }
      }
    }
    this._emitters = this._emitters.filter(e => e.timer > 0 || e.persistent);

    // Tick particles
    for (const p of this._pool) {
      p.timer -= dt;
      const dts = dt / 1000;
      p.vy     += p.gravity * dts;
      p.x      += p.vx;
      p.y      += p.vy;
    }
    this._pool = this._pool.filter(p => p.timer > 0);
  }

  render(ctx) {
    for (const p of this._pool) {
      const { preset } = p;

      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (preset.glow) {
        ctx.shadowColor = preset.glowColor;
        ctx.shadowBlur  = preset.glowRadius * p.life;
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Event Handlers
  // ═══════════════════════════════════════════════════════════
  _onDashStart({ vector, duration }) {
    const angle  = Math.atan2(vector.y, vector.x) + Math.PI;   // trail behind
    const cx     = 0, cy = 0;   // would be player world-pos in real scene

    this._emitters.push({
      id       : 'dash_trail',
      active   : true,
      timer    : duration,
      elapsed  : 0,
      interval : 30,
      x        : cx, y: cy,
      angle,
      preset   : PRESETS.VIVID_SHADOW,
      count    : 4,
    });
  }

  _stopDashTrail() {
    const e = this._emitters.find(e => e.id === 'dash_trail');
    if (e) e.active = false;
  }

  _onBladeStrike({ type }) {
    this._burst(0, 0, PRESETS.BLADE_GLOW, 12, -Math.PI / 4);
  }

  _onHitFX({ isCrit }) {
    const count = isCrit ? 30 : 16;
    this._burst(0, 0, PRESETS.BLOOD_SPLASH, count, 0);
  }

  _startAmbientMotes() {
    this._emitters.push({
      id        : 'ambient',
      active    : true,
      persistent: true,
      timer     : Infinity,
      elapsed   : 0,
      interval  : 400,
      x         : 0, y: 0,
      angle     : 0,
      preset    : PRESETS.AMBIENT_MOTE,
      count     : 1,
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  Core Burst
  // ═══════════════════════════════════════════════════════════
  _burst(x, y, preset, count, angle = 0) {
    const free = this._maxParticles - this._pool.length;
    const n    = Math.min(count, free);
    for (let i = 0; i < n; i++) {
      this._pool.push(new Particle(x, y, preset, angle));
    }
  }
}
