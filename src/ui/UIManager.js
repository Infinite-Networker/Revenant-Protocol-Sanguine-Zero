/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  UIManager.js — Reactive Combat HUD
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 *
 *  Manages:
 *   • Blood Meter gauge
 *   • HP bar
 *   • Combo counter
 *   • Damage numbers (floating)
 *   • Hit-Flash full-screen overlay
 *   • Critical Indicator ($800!$ burst)
 *   • Boss health bar
 */

'use strict';

import { BLOOD_METER_MAX } from '../combat/CombatSystem.js';

// ─── Colour Palette ───────────────────────────────────────────────────────────
const COL = {
  blood         : '#c0392b',
  bloodGlow     : 'rgba(192,57,43,0.6)',
  bloodDark     : '#6c0c06',
  critFlash     : 'rgba(255,215,0,0.85)',
  hitFlash      : 'rgba(255,255,255,0.55)',
  hpGreen       : '#27ae60',
  hpLow         : '#e74c3c',
  comboGold     : '#f1c40f',
  critText      : '#ffe600',
  hudBg         : 'rgba(5,0,8,0.78)',
  hudBorder     : 'rgba(192,57,43,0.5)',
};

// ─── Config ───────────────────────────────────────────────────────────────────
const DAMAGE_NUMBER_LIFETIME = 1200;  // ms
const COMBO_FLASH_DURATION   = 400;   // ms

export class UIManager {
  constructor(canvas, events) {
    this.canvas  = canvas;
    this.events  = events;
    this.ctx     = canvas.getContext('2d');

    // State
    this._bloodPct      = 1.0;
    this._hpPct         = 1.0;
    this._combo         = 0;
    this._comboFlash    = 0;
    this._hitFlash      = 0;
    this._critFlash     = 0;
    this._critVisible   = false;
    this._critTimer     = 0;

    /** @type {Array<{value:number, x:number, y:number, timer:number, isCrit:boolean, vy:number}>} */
    this._damageNumbers = [];
  }

  init() {
    this.events.on('ui:blood_meter_change', v => { this._bloodPct = v / BLOOD_METER_MAX; });
    this.events.on('ui:damage_number',      d => this._spawnDamageNumber(d));
    this.events.on('ui:combo_reset',        () => { this._combo = 0; });
    this.events.on('fx:hit_flash',          d => {
      this._hitFlash  = d.duration;
      if (d.isCrit) this._critFlash = 160;
    });
    this.events.on('ui:crit_indicator',     () => {
      this._critVisible = true;
      this._critTimer   = 900;
    });
    console.log('[UIManager] Ready ✓');
  }

  update(dt) {
    this._hitFlash   = Math.max(0, this._hitFlash - dt);
    this._critFlash  = Math.max(0, this._critFlash - dt);
    this._comboFlash = Math.max(0, this._comboFlash - dt);

    if (this._critVisible) {
      this._critTimer -= dt;
      if (this._critTimer <= 0) this._critVisible = false;
    }

    // Update floating damage numbers
    this._damageNumbers = this._damageNumbers
      .map(n => ({ ...n, timer: n.timer - dt, y: n.y - n.vy * (dt / 1000) }))
      .filter(n => n.timer > 0);
  }

  render(renderer) {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    ctx.save();

    // ── Hit Flash Overlay ─────────────────────────────────
    if (this._hitFlash > 0) {
      const alpha = (this._hitFlash / 90) * 0.55;
      ctx.fillStyle = this._critFlash > 0
        ? `rgba(255,215,0,${alpha})`
        : `rgba(255,255,255,${alpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Blood Meter (bottom-left) ─────────────────────────
    this._drawBloodMeter(ctx, W, H);

    // ── HP Bar ────────────────────────────────────────────
    this._drawHPBar(ctx, W, H);

    // ── Combo Counter ─────────────────────────────────────
    if (this._combo > 1) {
      this._drawComboCounter(ctx, W, H);
    }

    // ── Critical Indicator ────────────────────────────────
    if (this._critVisible) {
      this._drawCritIndicator(ctx, W, H);
    }

    // ── Floating Damage Numbers ───────────────────────────
    this._drawDamageNumbers(ctx);

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════
  //  Draw Helpers
  // ═══════════════════════════════════════════════════════════
  _drawBloodMeter(ctx, W, H) {
    const x = 40, y = H - 80, w = 220, h = 22;
    const filled = w * this._bloodPct;
    const pulse  = 1 + Math.sin(Date.now() * 0.006) * (this._bloodPct < 0.3 ? 0.06 : 0);

    // Background
    ctx.fillStyle = COL.hudBg;
    this._roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 6);
    ctx.fill();

    // Border
    ctx.strokeStyle = COL.hudBorder;
    ctx.lineWidth   = 1.5;
    this._roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 6);
    ctx.stroke();

    // Fill gradient
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, COL.bloodDark);
    grad.addColorStop(0.5, COL.blood);
    grad.addColorStop(1, '#ff6b6b');
    ctx.fillStyle = grad;
    this._roundRect(ctx, x, y, filled, h, 4);
    ctx.fill();

    // Glow when high
    if (this._bloodPct > 0.7) {
      ctx.shadowColor = COL.bloodGlow;
      ctx.shadowBlur  = 12 * pulse;
      this._roundRect(ctx, x, y, filled, h, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Label
    ctx.fillStyle  = '#fff';
    ctx.font       = 'bold 11px monospace';
    ctx.textAlign  = 'left';
    ctx.fillText('🩸 BLOOD METER', x, y - 8);
    ctx.fillStyle  = 'rgba(255,255,255,0.7)';
    ctx.textAlign  = 'right';
    ctx.fillText(`${Math.round(this._bloodPct * 100)}%`, x + w, y - 8);
  }

  _drawHPBar(ctx, W, H) {
    const x = 40, y = H - 120, w = 220, h = 14;
    const filled = w * this._hpPct;
    const col    = this._hpPct < 0.3 ? COL.hpLow : COL.hpGreen;

    ctx.fillStyle = COL.hudBg;
    this._roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 5);
    ctx.fill();

    ctx.fillStyle = col;
    this._roundRect(ctx, x, y, filled, h, 3);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font      = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('❤ HP', x, y - 6);
  }

  _drawComboCounter(ctx, W, H) {
    const scale = 1 + (this._comboFlash / COMBO_FLASH_DURATION) * 0.25;
    const cx    = W / 2;
    const cy    = 120;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.textAlign  = 'center';

    // Hit count
    ctx.font      = `bold ${48 + Math.min(this._combo * 2, 24)}px monospace`;
    ctx.fillStyle = COL.comboGold;
    ctx.shadowColor= 'rgba(241,196,15,0.8)';
    ctx.shadowBlur = 18;
    ctx.fillText(`${this._combo}`, 0, 0);

    // "HIT" label
    ctx.font      = 'bold 16px monospace';
    ctx.fillStyle = '#fff';
    ctx.shadowBlur= 0;
    ctx.fillText('HIT COMBO', 0, 26);

    ctx.restore();
  }

  _drawCritIndicator(ctx, W, H) {
    const age     = 900 - this._critTimer;
    const phase   = age / 900;
    const alpha   = phase < 0.1 ? phase / 0.1 : phase > 0.7 ? 1 - (phase - 0.7) / 0.3 : 1;
    const scale   = 1 + Math.sin(Date.now() * 0.012) * 0.04;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, H / 2 - 80);
    ctx.scale(scale, scale);
    ctx.textAlign  = 'center';

    // Backdrop glow
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur  = 40;

    // Main text: $800!$  (stylised critical indicator)
    ctx.font      = 'bold 64px monospace';
    ctx.fillStyle = COL.critText;
    ctx.fillText('$800!$', 0, 0);

    ctx.font      = 'bold 18px monospace';
    ctx.fillStyle = 'rgba(255,230,0,0.9)';
    ctx.fillText('— CRITICAL STRIKE —', 0, 40);

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  _drawDamageNumbers(ctx) {
    for (const n of this._damageNumbers) {
      const alpha = n.timer / DAMAGE_NUMBER_LIFETIME;
      ctx.globalAlpha = alpha;
      ctx.textAlign   = 'center';
      ctx.shadowColor = n.isCrit ? '#ffe600' : '#ff4444';
      ctx.shadowBlur  = n.isCrit ? 16 : 8;
      ctx.font        = n.isCrit ? 'bold 36px monospace' : 'bold 24px monospace';
      ctx.fillStyle   = n.isCrit ? COL.critText : '#fff';
      ctx.fillText(n.isCrit ? `✦${n.value}` : String(n.value), n.x, n.y);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _spawnDamageNumber({ value, isCrit, combo }) {
    const W = this.canvas.width, H = this.canvas.height;
    this._combo = combo;
    this._comboFlash = COMBO_FLASH_DURATION;

    this._damageNumbers.push({
      value,
      isCrit,
      x     : W / 2 + (Math.random() - 0.5) * 120,
      y     : H / 2 - 60 + (Math.random() - 0.5) * 40,
      timer : DAMAGE_NUMBER_LIFETIME,
      vy    : 55 + Math.random() * 30,
    });
  }
}
