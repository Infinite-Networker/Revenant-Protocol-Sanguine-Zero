# 🏛 Concept Doc — Gothic-Renaissance Courtyard
> **Revenant Protocol: Sanguine Zero** | Cherry Computer Ltd. | 2026

---

## Environmental Storytelling Philosophy

> *"The arena must feel like it has already witnessed a thousand deaths."*

The **Gothic-Renaissance Courtyard** is not merely a backdrop — it is a character. Every architectural choice communicates a history of violence, grandeur, and decay. The player should feel the weight of the setting before a single enemy appears.

---

## Visual Style: Dark Fantasy Contrast

The courtyard uses **high-contrast, chromatic separation** as its core lighting strategy:

```
COLOUR LANGUAGE
══════════════════════════════════════════════════════════════
  Warm:  #FF7820  — Torch fire, life, danger, animation cue
  Cold:  #130516  — Void, death, negative space
  Blood: #C0392B  — Player power, resource, reward feedback
  Gold:  #F1C40F  — Critical hits, rare items (future)
  Fog:   #140020  — Atmosphere, depth cue, mystery
══════════════════════════════════════════════════════════════
```

**Rule**: No neutral greys. Every surface either belongs to the warm torchlight or the cold moonlit void.

---

## Modular Asset Strategy

The courtyard is constructed from **8 modular tile types**, allowing rapid level iteration:

| Module | Description |
|---|---|
| `floor_tile_a` | Standard cobblestone, 64×64 units |
| `floor_tile_b` | Bloodstained variant, same dimensions |
| `arch_frame`   | Half-arch pillar pair, 128 units tall |
| `arch_cap`     | Keystone topper, placed above arch frames |
| `wall_segment` | Straight wall section, 64×256 |
| `wall_corner`  | 90° corner joint |
| `sconce_mount` | Torch bracket, snaps to wall segments |
| `ivy_overlay`  | Transparent foreground decoration |

This system allows a new courtyard variant to be dressed in under 30 minutes.

---

## Lighting Architecture

### Primary: Blood Moon Overhead
A radial gradient from `rgba(100, 0, 10, 0.35)` at zenith to transparent creates a permanent crimson tint on upper surfaces. This:
- Reinforces the "Blood" theme in passive visual language
- Makes the player's blood meter gauge feel *thematically appropriate*
- Desaturates sky objects, making torch pools the only warm contrast

### Secondary: Torch Sconces (×4 default layout)
Each torch uses **procedural flicker** (sinusoidal noise, 8.5Hz primary + 13Hz harmonic) to simulate organic fire without sprite animation:

```
flicker = 0.85
       + sin(time × 8.5 + posX × 17) × 0.12
       + cos(time × 13  + posY × 9 ) × 0.06
```

The torch light pools use **Screen blend mode** to additively illuminate without washing out the dark base.

### Tertiary: Fog Layers (×4)
Low-hanging animated fog layers add parallax depth:
- Each layer scrolls at `sin(time × 0.07 + layer × 1.3) × 30px` horizontal drift
- Opacity: `rgba(20, 0, 30, 0.18)` — just enough to read without obscuring gameplay

### Vignette
A radial gradient from transparent (centre) to `rgba(4, 0, 8, 0.88)` (edges) keeps the player's eye locked to the centre combat arena.

---

## Depth Layer Order

```
  ┌─────────────────────────────────────────────────────────┐
  │  8. Vignette Overlay (darkens edges)                    │ ← TOP
  │  7. Blood-Moon Tint (radial red gradient from above)    │
  │  6. Atmospheric Fog (4 drifting layers)                 │
  │  5. Torch Lighting (screen-blend radial pools)          │
  │  4. Columns & Arches (mid-ground architecture)          │
  │  3. Stone Floor (perspective tile grid)                 │
  │  2. Far Architecture (cathedral silhouettes, parallax)  │
  │  1. Sky Void (near-black gradient)                      │ ← BOTTOM
  └─────────────────────────────────────────────────────────┘
       + Entities / Player / Enemies (between layers 4–5)
       + Particle FX (above all environment, below HUD)
       + HUD / UI (topmost, screen-space)
```

---

## Sound Design: Environmental Audio

| Source | Brief |
|---|---|
| Ambient wind | Low-frequency drone, -20dB, looped |
| Distant chains | Occasional metallic clink, -30dB, randomised interval 8–22s |
| Torch crackle | Layered fire ambience at each sconce position (3D positioned) |
| Stone echo | Reverb impulse response: large stone room, 1.8s decay |
| Blood moon hum | Sub-bass rumble at 40Hz, -18dB — felt more than heard |

---

## Future Environment Modules

- **Inner Sanctum**: Enclosed throne room, candelabra lighting, marble floor
- **Ossuary Corridor**: Bone-lined walls, extreme close quarters, skulls as platforming
- **Rooftop Spire**: Open sky, wind FX, lightning ambient, zero ground echo
- **Blood Garden**: Overgrown roses, red water features, heavily atmospheric
