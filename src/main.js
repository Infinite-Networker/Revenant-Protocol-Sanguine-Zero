/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  main.js — Application Entry Point
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 */

'use strict';

import engine from './core/GameEngine.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game-canvas');

  if (!canvas) {
    console.error('[Main] No #game-canvas element found.');
    return;
  }

  // Unlock audio on first user interaction
  window.addEventListener('pointerdown', () => engine.audio?.unlock(), { once: true });
  window.addEventListener('keydown',     () => engine.audio?.unlock(), { once: true });

  // Boot
  await engine.init(canvas, {
    debug        : new URLSearchParams(location.search).has('debug'),
    audioEnabled : true,
  });

  // Spawn a demo enemy in the courtyard
  engine.combat.spawnEnemy({ hp: 200, position: { x: 4, y: 0, z: 0 } });

  console.log('%c🩸 Revenant Protocol: Sanguine Zero — Running', 'color:#c0392b;font-size:16px;font-weight:bold;');
  console.log('%c   Cherry Computer Ltd. © 2026',               'color:#888;font-size:11px;');
  console.log('%c   Controls: WASD/Arrows → Move | Shift → Sanguine Dash | Z/X/C → Attack', 'color:#aaa;font-size:11px;');
});
