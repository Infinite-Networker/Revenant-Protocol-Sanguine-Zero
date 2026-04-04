/**
 * ============================================================
 *  REVENANT PROTOCOL: SANGUINE ZERO
 *  blade_glow.glsl — Weapon Edge Luminance Shader
 *
 *  © 2026 Cherry Computer Ltd.
 *  All Rights Reserved.
 * ============================================================
 *
 *  Renders the "Blade Glow" effect on the player's weapon
 *  during high-speed strikes and Zero-Frame transitions.
 *
 *  Produces:
 *   • Sharp weapon silhouette with soft luminous halo
 *   • White-hot core shifting to rose-crimson at edges
 *   • Pulsing intensity proportional to attack momentum
 *   • Motion-blur streak in attack direction
 *
 *  Uniforms:
 *    u_time        — engine time (s)
 *    u_intensity   — [0,1] glow strength (1 = Zero-Frame strike)
 *    u_attackAngle — angle of swing (radians)
 *    u_resolution  — canvas size
 */

#version 300 es
precision highp float;

uniform float u_time;
uniform float u_intensity;
uniform float u_attackAngle;
uniform vec2  u_resolution;

in  vec2 v_texCoord;
out vec4 fragColor;

// ─── Helpers ──────────────────────────────────────────────────────────────────
float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
void main() {
  vec2 uv = v_texCoord - 0.5;
  float asp = u_resolution.x / u_resolution.y;
  uv.x *= asp;

  // ── Blade segment (diagonal across card) ──────────────────
  float angle = u_attackAngle;
  vec2  dir   = vec2(cos(angle), sin(angle));
  vec2  a     = -dir * 0.45;
  vec2  b     =  dir * 0.45;

  float dist  = sdSegment(uv, a, b);

  // ── Core glow (tight, near-white) ─────────────────────────
  float core  = smoothstep(0.015, 0.0, dist);

  // ── Mid glow (broader, warm white) ────────────────────────
  float mid   = smoothstep(0.08,  0.0, dist);

  // ── Outer halo (wide, crimson) ─────────────────────────────
  float outer = smoothstep(0.22,  0.0, dist);

  // ── Motion streak (elongated along attack direction) ───────
  float axial  = dot(uv, dir);
  float lateral= dot(uv, vec2(-dir.y, dir.x));
  float streak = smoothstep(0.03, 0.0, abs(lateral))
               * smoothstep(0.55, 0.3, abs(axial));
  streak      *= u_intensity * 0.6;

  // ── Temporal pulse ─────────────────────────────────────────
  float pulse  = 1.0 + sin(u_time * 22.0) * 0.08 * u_intensity;

  // ── Colour assembly ────────────────────────────────────────
  vec3 white   = vec3(1.0, 0.96, 0.90);
  vec3 rose    = vec3(1.0, 0.55, 0.55);
  vec3 crimson = vec3(0.75, 0.12, 0.12);
  vec3 dark    = vec3(0.0);

  vec3 col = mix(dark, crimson, outer * u_intensity);
  col      = mix(col,  rose,    mid   * u_intensity);
  col      = mix(col,  white,   core  * u_intensity * pulse);
  col     += white * streak;

  // ── Alpha ──────────────────────────────────────────────────
  float alpha = (outer + streak) * u_intensity;
  alpha       = clamp(alpha, 0.0, 1.0);

  // ── Additive blend (GPU side: src=ONE dest=ONE) ────────────
  fragColor = vec4(col * alpha, alpha);
}
