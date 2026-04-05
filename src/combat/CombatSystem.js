/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  CombatSystem.js — Combat Logic & Sanguine Dash Mechanic
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 *
 *  Implements:
 *   • Sanguine Dash  — Blood Meter-fuelled dash-to-strike
 *   • Zero-Frame     — dash → strike transition with no input lag
 *   • Hit-Flash      — visual feedback on successful hits
 *   • Critical Hits  — $800!$ damage burst system
 *   • Blood Meter    — resource gauge management
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────
export const BLOOD_METER_MAX      = 100;
export const BLOOD_DASH_COST      = 25;       // per dash consume
export const BLOOD_REGEN_RATE     = 4;        // per second (passive)
export const BLOOD_ON_HIT         = 8;        // gained per landed hit
export const BLOOD_ON_KILL        = 30;       // gained on enemy kill

export const DASH_DURATION        = 180;      // ms — dash animation window
export const DASH_SPEED_MULT      = 4.5;      // velocity multiplier
export const ZERO_FRAME_WINDOW    = 80;       // ms — attack-input window mid-dash

export const CRIT_THRESHOLD       = 0.15;     // 15% crit chance base
export const CRIT_MULTIPLIER      = 3.5;      // damage × 3.5 on crit ($800!$ moments)
export const HIT_FLASH_DURATION   = 90;       // ms — white flash on hit

// Attack data table
const ATTACK_DATA = {
  LIGHT  : { damage: 18,  stagger: 10, hitstop: 60,  bloodGain: BLOOD_ON_HIT        },
  HEAVY  : { damage: 55,  stagger: 35, hitstop: 130, bloodGain: BLOOD_ON_HIT * 1.5  },
  SPECIAL: { damage: 90,  stagger: 60, hitstop: 200, bloodGain: BLOOD_ON_HIT * 2    },
};

// ─── Enums ────────────────────────────────────────────────────────────────────
export const CombatState = Object.freeze({
  IDLE    : 'IDLE',
  DASHING : 'DASHING',
  ATTACKING:'ATTACKING',
  STUNNED : 'STUNNED',
  DEAD    : 'DEAD',
});

// ──────────────────────────────────────────────────────────────────────────────
//  CombatSystem
// ──────────────────────────────────────────────────────────────────────────────
export class CombatSystem {
  constructor(events) {
    this.events = events;

    // Player combat stats
    this.bloodMeter    = BLOOD_METER_MAX;
    this.playerHP      = 200;
    this.playerMaxHP   = 200;
    this.state         = CombatState.IDLE;
    this.comboCount    = 0;
    this.comboTimer    = 0;
    this.COMBO_RESET   = 1800;   // ms before combo resets

    // Dash state
    this._dashTimer    = 0;
    this._dashVector   = { x: 0, y: 0 };
    this._dashAttacked = false;   // tracks Zero-Frame attack-within-dash

    // Hit stop (engine freeze frames)
    this._hitstopTimer = 0;

    // Active hit-flash instances [{timer, intensity}]
    this._hitFlashes   = [];

    // Entity registry (enemies, etc.)
    this._entities     = new Map();   // id → entity
    this._nextId       = 1;
  }

  init() {
    // Subscribe to input events
    this.events.on('input:dash:start',          () => this._onDashInput());
    this.events.on('input:attack_light:start',  () => this._onAttackInput('LIGHT'));
    this.events.on('input:attack_heavy:start',  () => this._onAttackInput('HEAVY'));
    this.events.on('input:attack_special:start',() => this._onAttackInput('SPECIAL'));
    console.log('[CombatSystem] Ready ✓');
  }

  // ═══════════════════════════════════════════════════════════
  //  Update Loop
  // ═══════════════════════════════════════════════════════════
  update(dt) {
    this._updateBloodRegen(dt);
    this._updateDash(dt);
    this._updateHitstop(dt);
    this._updateComboTimer(dt);
    this._updateHitFlashes(dt);
  }

  _updateBloodRegen(dt) {
    if (this.bloodMeter < BLOOD_METER_MAX) {
      this.bloodMeter = Math.min(
        BLOOD_METER_MAX,
        this.bloodMeter + BLOOD_REGEN_RATE * (dt / 1000)
      );
      this.events.emit('ui:blood_meter_change', this.bloodMeter);
    }
  }

  _updateDash(dt) {
    if (this.state !== CombatState.DASHING) return;

    this._dashTimer -= dt;
    if (this._dashTimer <= 0) {
      this.state = CombatState.IDLE;
      this._dashAttacked = false;
      this.events.emit('combat:dash_end');
    }
  }

  _updateHitstop(dt) {
    if (this._hitstopTimer > 0) {
      this._hitstopTimer -= dt;
    }
  }

  _updateComboTimer(dt) {
    if (this.comboCount > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.events.emit('ui:combo_reset');
      }
    }
  }

  _updateHitFlashes(dt) {
    this._hitFlashes = this._hitFlashes
      .map(f => ({ ...f, timer: f.timer - dt }))
      .filter(f => f.timer > 0);
  }

  // ═══════════════════════════════════════════════════════════
  //  Sanguine Dash  ━━  Core Mechanic
  // ═══════════════════════════════════════════════════════════
  _onDashInput() {
    if (this.state === CombatState.DASHING) return;
    if (this._hitstopTimer > 0) return;
    if (this.bloodMeter < BLOOD_DASH_COST) {
      this.events.emit('ui:blood_insufficient');
      return;
    }

    // Consume Blood Meter
    this.bloodMeter -= BLOOD_DASH_COST;
    this.events.emit('ui:blood_meter_change', this.bloodMeter);

    // Transition into dash
    this.state      = CombatState.DASHING;
    this._dashTimer = DASH_DURATION;

    // Use current move vector (from input manager via event or stored)
    const dir = this.events.query?.('input:move_vector') ?? { x: 1, y: 0 };
    this._dashVector = { ...dir };

    this.events.emit('combat:dash_start', {
      vector    : this._dashVector,
      speedMult : DASH_SPEED_MULT,
      duration  : DASH_DURATION,
    });

    this.events.emit('fx:vivid_shadow_start', this._dashVector);
    this.events.emit('audio:play', 'sfx_dash');
  }

  // ═══════════════════════════════════════════════════════════
  //  Zero-Frame Dash-to-Strike
  // ═══════════════════════════════════════════════════════════
  _onAttackInput(type) {
    if (this._hitstopTimer > 0) return;

    const isDashStrike = (
      this.state === CombatState.DASHING &&
      !this._dashAttacked &&
      this._dashTimer > (DASH_DURATION - ZERO_FRAME_WINDOW)
    );

    if (isDashStrike) {
      // Zero-Frame: cancel remaining dash, immediately strike
      this._dashAttacked = true;
      this.state         = CombatState.ATTACKING;
      this._dashTimer    = 0;
      this.events.emit('combat:zero_frame_strike', { type });
    }

    this._executeAttack(type, isDashStrike);
  }

  _executeAttack(type, isDashStrike) {
    const data = ATTACK_DATA[type];
    if (!data) return;

    // Combo tracking
    this.comboCount++;
    this.comboTimer = this.COMBO_RESET;

    // Damage calculation
    let damage  = data.damage;
    let isCrit  = false;

    const critChance = CRIT_THRESHOLD + (this.comboCount * 0.02);   // scales with combo
    if (Math.random() < critChance) {
      damage  *= CRIT_MULTIPLIER;
      isCrit   = true;
    }

    // Hit-stop freeze
    this._hitstopTimer = isDashStrike ? data.hitstop * 1.4 : data.hitstop;

    // Feedback events
    this.events.emit('fx:hit_flash', { duration: HIT_FLASH_DURATION, isCrit });
    this.events.emit('ui:damage_number', { value: Math.round(damage), isCrit, combo: this.comboCount });
    this.events.emit('audio:play', isCrit ? 'sfx_crit' : 'sfx_hit_heavy');

    if (isCrit) {
      this.events.emit('ui:crit_indicator');   // $800!$ style burst
    }

    // Blood on hit
    this.bloodMeter = Math.min(BLOOD_METER_MAX, this.bloodMeter + data.bloodGain);
    this.events.emit('ui:blood_meter_change', this.bloodMeter);

    // Apply to nearest enemy
    this._applyDamageToNearestEnemy(damage, data.stagger, isDashStrike);

    console.log(
      `[Combat] ${type} Attack${isDashStrike ? ' (Zero-Frame!)' : ''} — ` +
      `DMG: ${Math.round(damage)}${isCrit ? ' 🩸CRIT' : ''} | Combo: ${this.comboCount}x`
    );
  }

  _applyDamageToNearestEnemy(damage, stagger, isDashStrike) {
    // In a full implementation this would ray-cast / hitbox check
    // Here we find the first alive enemy in range
    for (const [id, entity] of this._entities) {
      if (entity.type === 'enemy' && entity.alive) {
        entity.hp -= damage;
        if (entity.hp <= 0) {
          entity.alive = false;
          this.bloodMeter = Math.min(BLOOD_METER_MAX, this.bloodMeter + BLOOD_ON_KILL);
          this.events.emit('combat:enemy_killed', { id });
        } else {
          this.events.emit('combat:enemy_hit', { id, damage, stagger, isDashStrike });
        }
        break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Entity Management
  // ═══════════════════════════════════════════════════════════
  spawnEnemy(config = {}) {
    const id = this._nextId++;
    this._entities.set(id, {
      id,
      type    : 'enemy',
      hp      : config.hp ?? 120,
      maxHp   : config.hp ?? 120,
      alive   : true,
      position: config.position ?? { x: 0, y: 0, z: 0 },
      ...config,
    });
    this.events.emit('combat:entity_spawned', { id });
    return id;
  }

  // ═══════════════════════════════════════════════════════════
  //  Accessors
  // ═══════════════════════════════════════════════════════════
  get isInHitstop()     { return this._hitstopTimer > 0; }
  get bloodPercent()    { return this.bloodMeter / BLOOD_METER_MAX; }
  get activeHitFlashes(){ return this._hitFlashes; }
}
