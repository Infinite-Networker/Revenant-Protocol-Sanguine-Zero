/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  Renderer.js — Canvas 2D / WebGL Facade
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 */

'use strict';

export class Renderer {
  constructor(canvas, events) {
    this.canvas = canvas;
    this.events = events;
    this.ctx    = canvas.getContext('2d');
    this.width  = canvas.width;
    this.height = canvas.height;
    this._resizeObserver = null;
  }

  async init() {
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(this.canvas);
    this._onResize();
    console.log('[Renderer] Ready ✓');
  }

  _onResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width  = rect.width  || 1280;
    this.canvas.height = rect.height || 720;
    this.width  = this.canvas.width;
    this.height = this.canvas.height;
    this.events.emit('renderer:resize', { width: this.width, height: this.height });
  }

  beginFrame() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  endFrame() {
    // Post-process hooks can be injected here (bloom, aberration, etc.)
  }

  drawSprite(img, x, y, w, h, angle = 0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(angle);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  destroy() {
    this._resizeObserver?.disconnect();
  }
}
