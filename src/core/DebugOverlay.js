/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  DebugOverlay.js — Developer HUD
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 */

'use strict';

export class DebugOverlay {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.engine = engine;
    this.ctx    = canvas.getContext('2d');
  }

  update(dt) {}

  render(renderer) {
    const ctx  = this.ctx;
    const diag = this.engine.diagnostics;
    const W    = this.canvas.width;

    ctx.save();
    ctx.font      = '12px monospace';
    ctx.fillStyle = 'rgba(0,255,100,0.9)';
    ctx.textAlign = 'right';

    const lines = [
      `Revenant Protocol v${diag.version}`,
      `FPS: ${diag.fps}`,
      `Frames: ${diag.frameCount}`,
      `State: ${diag.state}`,
      `Entities: ${diag.entities}`,
      `Time: ${(diag.totalTime / 1000).toFixed(1)}s`,
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, W - 10, 18 + i * 16);
    });

    ctx.restore();
  }

  destroy() {}
}
