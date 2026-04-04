/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  AssetLoader.js — Async Asset Pipeline
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 */

'use strict';

export class AssetLoader {
  constructor(events) {
    this.events   = events;
    this._cache   = new Map();
    this._total   = 0;
    this._loaded  = 0;
  }

  /**
   * Load an array of asset descriptors.
   * @param {Array<{id:string, type:'audio'|'image'|'shader'|'font', src:string}>} list
   */
  async load(list) {
    this._total  += list.length;
    const promises = list.map(desc => this._loadOne(desc));
    await Promise.allSettled(promises);
  }

  async _loadOne(desc) {
    try {
      let asset;
      switch (desc.type) {
        case 'audio':  asset = await this._loadAudio(desc.src);  break;
        case 'image':  asset = await this._loadImage(desc.src);  break;
        case 'shader': asset = await this._loadText(desc.src);   break;
        case 'font':   asset = await this._loadFont(desc.id, desc.src); break;
        default: throw new Error(`Unknown asset type: ${desc.type}`);
      }
      this._cache.set(desc.id, asset);
    } catch (err) {
      console.warn(`[AssetLoader] Failed to load "${desc.id}" (${desc.src}):`, err.message);
    } finally {
      this._loaded++;
      const progress = this._loaded / this._total;
      this.events.emit('assets:progress', progress);
      if (this._loaded >= this._total) {
        this.events.emit('assets:complete');
      }
    }
  }

  async _loadAudio(src) {
    const res    = await fetch(src);
    const buf    = await res.arrayBuffer();
    const ctx    = new (window.AudioContext || window.webkitAudioContext)();
    return ctx.decodeAudioData(buf);
  }

  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src     = src;
    });
  }

  async _loadText(src) {
    const res = await fetch(src);
    return res.text();
  }

  async _loadFont(id, src) {
    const font = new FontFace(id, `url(${src})`);
    const loaded = await font.load();
    document.fonts.add(loaded);
    return loaded;
  }

  get(id) { return this._cache.get(id) ?? null; }

  get progress() { return this._total === 0 ? 1 : this._loaded / this._total; }
}
