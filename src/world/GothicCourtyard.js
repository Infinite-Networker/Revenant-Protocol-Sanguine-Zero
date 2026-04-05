/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  GothicCourtyard.js — Environmental Storytelling
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 *
 *  Gothic-Renaissance courtyard level layout.
 *  Built from modular assets with high-contrast "Dark Fantasy"
 *  lighting to establish atmosphere and environmental storytelling.
 *
 *  Layout strategy:
 *   • Modular stone tile floor with depth parallax layers
 *   • Arched archways framing the combat arena
 *   • Torch sconces providing warm contrast against cold stone
 *   • Blood-moon ambient light (deep crimson tint overhead)
 *   • Foreground ivy/vines for depth layering
 */

'use strict';

// ─── Lighting Config ──────────────────────────────────────────────────────────
const LIGHTING = {
  ambient     : 'rgba(18, 4, 22, 0.92)',      // near-black purple void
  moonColor   : 'rgba(100, 0, 10, 0.35)',     // blood-moon overhead
  torchWarm   : 'rgba(255, 120, 30, 0.55)',   // warm torch pools
  torchRadius : 160,
  fogColor    : 'rgba(20, 0, 30, 0.18)',
  fogLayers   : 4,
};

// ─── Architecture Palette ─────────────────────────────────────────────────────
const STONE = {
  dark   : '#1a1018',
  mid    : '#2d2030',
  light  : '#3e2d45',
  mortar : '#120e16',
  grime  : '#0d0b0f',
};

// ─── Torch Positions (normalised 0-1) ─────────────────────────────────────────
const TORCHES = [
  { nx: 0.12, ny: 0.45 },
  { nx: 0.88, ny: 0.45 },
  { nx: 0.30, ny: 0.30 },
  { nx: 0.70, ny: 0.30 },
];

export class GothicCourtyard {
  constructor() {
    this._flickerPhase = Math.random() * Math.PI * 2;
    this._time         = 0;
  }

  update(dt) {
    this._time += dt;
  }

  /**
   * Render the courtyard background layers.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} W
   * @param {number} H
   * @param {number} alpha  — interpolation factor (unused here, reserved)
   */
  render(ctx, W, H, alpha = 1) {
    // Layer 0 — Sky void
    this._drawSky(ctx, W, H);

    // Layer 1 — Far architecture (parallax 0.2)
    this._drawFarArchitecture(ctx, W, H);

    // Layer 2 — Mid stone floor
    this._drawFloor(ctx, W, H);

    // Layer 3 — Columns & arches
    this._drawArchways(ctx, W, H);

    // Layer 4 — Torch lighting
    this._drawTorches(ctx, W, H);

    // Layer 5 — Atmospheric fog
    this._drawFog(ctx, W, H);

    // Layer 6 — Blood-moon vignette
    this._drawVignette(ctx, W, H);
  }

  // ═══════════════════════════════════════════════════════════
  //  Layer Renderers
  // ═══════════════════════════════════════════════════════════
  _drawSky(ctx, W, H) {
    const grad = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    grad.addColorStop(0, '#080008');
    grad.addColorStop(0.5, '#130516');
    grad.addColorStop(1, '#1a0a1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  _drawFarArchitecture(ctx, W, H) {
    // Cathedral silhouette on horizon
    ctx.fillStyle = STONE.grime;
    const baseY   = H * 0.52;

    // Towers
    for (let i = 0; i < 5; i++) {
      const tx = W * (0.05 + i * 0.22);
      const tw = 18 + i * 4;
      const th = 60 + Math.abs(i - 2) * 30;
      ctx.fillRect(tx - tw / 2, baseY - th, tw, th);

      // Spire
      ctx.beginPath();
      ctx.moveTo(tx - tw / 2, baseY - th);
      ctx.lineTo(tx, baseY - th - 30);
      ctx.lineTo(tx + tw / 2, baseY - th);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawFloor(ctx, W, H) {
    const floorY = H * 0.55;
    const tileW  = 64, tileH = 32;

    // Floor base
    ctx.fillStyle = STONE.dark;
    ctx.fillRect(0, floorY, W, H - floorY);

    // Tile grid (perspective foreshortened)
    ctx.strokeStyle = STONE.mortar;
    ctx.lineWidth   = 0.8;

    const rows = 8;
    const cols = Math.ceil(W / tileW) + 2;

    for (let r = 0; r <= rows; r++) {
      const frac = r / rows;
      const y    = floorY + (H - floorY) * frac;
      const xOff = (tileW * (1 - frac)) * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();

      // Vertical lines with perspective convergence
      for (let c = 0; c <= cols; c++) {
        const xTop = W / 2 + (c - cols / 2) * tileW * (1 - frac) * 0.5;
        const xBot = W / 2 + (c - cols / 2) * tileW * 0.5;
        if (r === rows) {
          ctx.beginPath();
          ctx.moveTo(xTop, floorY);
          ctx.lineTo(xBot, H);
          ctx.stroke();
        }
      }
    }

    // Floor highlight near horizon
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, floorY + 120);
    floorGrad.addColorStop(0, STONE.light + '44');
    floorGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, W, 120);
  }

  _drawArchways(ctx, W, H) {
    const archData = [
      { x: W * 0.05, w: W * 0.18, h: H * 0.55 },
      { x: W * 0.77, w: W * 0.18, h: H * 0.55 },
    ];

    for (const arch of archData) {
      // Column
      ctx.fillStyle = STONE.mid;
      const colW    = arch.w * 0.22;
      ctx.fillRect(arch.x, H * 0.12, colW, arch.h);
      ctx.fillRect(arch.x + arch.w - colW, H * 0.12, colW, arch.h);

      // Arch top
      ctx.beginPath();
      ctx.strokeStyle = STONE.light;
      ctx.lineWidth   = 3;
      const cx        = arch.x + arch.w / 2;
      const cy        = H * 0.12 + arch.w * 0.5;
      ctx.arc(cx, cy, arch.w / 2, Math.PI, 0);
      ctx.stroke();

      ctx.fillStyle = STONE.mid;
      ctx.fill();

      // Decorative keystone
      ctx.fillStyle = STONE.light;
      ctx.fillRect(cx - 8, H * 0.12 - 15, 16, 20);
    }
  }

  _drawTorches(ctx, W, H) {
    const t  = this._time / 1000;

    for (const torch of TORCHES) {
      const tx     = torch.nx * W;
      const ty     = torch.ny * H;
      const flicker= 0.85 + Math.sin(t * 8.5 + torch.nx * 17) * 0.12 +
                     Math.cos(t * 13  + torch.ny * 9) * 0.06;

      // Glow pool
      const glow   = ctx.createRadialGradient(tx, ty, 0, tx, ty, LIGHTING.torchRadius * flicker);
      glow.addColorStop(0,   LIGHTING.torchWarm);
      glow.addColorStop(0.5, 'rgba(255,80,10,0.15)');
      glow.addColorStop(1,   'transparent');

      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(tx, ty, LIGHTING.torchRadius * flicker, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Flame sprite (simple)
      ctx.fillStyle = `rgba(255,${100 + Math.random() * 80},0,${0.7 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(tx, ty - 8 + Math.sin(t * 12) * 3, 5 * flicker, 0, Math.PI * 2);
      ctx.fill();

      // Sconce bracket
      ctx.fillStyle = '#333';
      ctx.fillRect(tx - 4, ty, 8, 14);
    }
  }

  _drawFog(ctx, W, H) {
    const t = this._time / 1000;
    for (let l = 0; l < LIGHTING.fogLayers; l++) {
      const offsetX = Math.sin(t * 0.07 + l * 1.3) * 30;
      const offsetY = H * 0.58 + l * 18;
      const grad    = ctx.createLinearGradient(0, offsetY, 0, offsetY + 80);
      grad.addColorStop(0, LIGHTING.fogColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(offsetX - 30, offsetY, W + 60, 80);
    }
  }

  _drawVignette(ctx, W, H) {
    // Dark vignette around edges
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(4,0,8,0.88)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Blood-moon tint from above
    const moonGrad = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.6);
    moonGrad.addColorStop(0, LIGHTING.moonColor);
    moonGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = moonGrad;
    ctx.fillRect(0, 0, W, H);
  }
}
