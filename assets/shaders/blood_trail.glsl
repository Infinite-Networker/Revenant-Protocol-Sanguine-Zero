/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  blood_trail.glsl — Vivid-Shadow Particle Shader
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 *
 *  Fragment shader for the Sanguine Dash "Vivid-Shadow" trail.
 *  Produces a high-intensity crimson afterimage effect with
 *  radial softness and temporal fade.
 *
 *  Uniforms:
 *    u_time       — engine total time (seconds)
 *    u_life       — particle normalised lifetime [1.0 → 0.0]
 *    u_resolution — canvas resolution (vec2)
 *    u_dashDir    — normalised dash direction (vec2)
 *    u_bloodColor — base blood colour (vec3, default #c0392b)
 */

#version 300 es
precision highp float;

// ─── Uniforms ─────────────────────────────────────────────────────────────────
uniform float u_time;
uniform float u_life;        // 1.0 at spawn → 0.0 at death
uniform vec2  u_resolution;
uniform vec2  u_dashDir;
uniform vec3  u_bloodColor;  // default: vec3(0.753, 0.224, 0.169)

// ─── Varyings ─────────────────────────────────────────────────────────────────
in  vec2 v_texCoord;         // [0, 1]²
out vec4 fragColor;

// ─── Helpers ──────────────────────────────────────────────────────────────────
float smootherstep(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * t * (t * (6.0 * t - 15.0) + 10.0);
}

// Turbulence for organic shadow edges
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1,0));
  float c = hash(i + vec2(0,1));
  float d = hash(i + vec2(1,1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
void main() {
  vec2 uv   = v_texCoord - 0.5;           // centre at origin
  float asp = u_resolution.x / u_resolution.y;
  uv.x     *= asp;

  // Elongate along dash direction
  vec2  perp   = vec2(-u_dashDir.y, u_dashDir.x);
  float axial  = dot(uv, u_dashDir);      // along dash
  float lateral= dot(uv, perp);           // perpendicular

  // Elliptical falloff: elongated along dash, thin perpendicularly
  float ell    = (axial * 0.6) * (axial * 0.6) + lateral * lateral * 4.0;
  float shape  = 1.0 - smootherstep(0.0, 0.25, ell);

  // Turbulent edge dissolve
  float turb   = noise(uv * 8.0 + u_time * 1.5) * 0.25;
  shape        = max(0.0, shape - turb * (1.0 - u_life));

  // Colour: shift from bright crimson to near-black as particle ages
  float hot    = u_life * u_life;
  vec3  cool   = u_bloodColor * 0.15;
  vec3  col    = mix(cool, u_bloodColor, hot);

  // Core bloom: add white-hot core at high life values
  float core   = smootherstep(0.18, 0.02, ell) * u_life;
  col          = mix(col, vec3(1.0, 0.9, 0.85), core * 0.6);

  // Final alpha: shape × life fade
  float alpha  = shape * u_life * 0.92;

  fragColor = vec4(col, alpha);
}
