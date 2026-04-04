/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  vite.config.js
 *
 *  © 2026 Cherry Computer Ltd.
 * ============================================================
 */

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir:   'dist',
    assetsDir:'assets',
    target:   'esnext',
    sourcemap: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    globals: true,
  },
});
