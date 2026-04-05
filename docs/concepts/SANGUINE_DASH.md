# 🩸 Concept Doc — Sanguine Dash Mechanic
> **Revenant Protocol: Sanguine Zero** | Cherry Computer Ltd. | 2026

---

## Overview

The **Sanguine Dash** is the signature traversal-and-combat mechanic of Revenant Protocol. It converts **Blood Meter** resource into a high-velocity dash that can seamlessly chain into devastating physical strikes through the **Zero-Frame** transition system.

The philosophy: *every button press should feel like it has weight and consequence.*

---

## Design Pillars

| Pillar | Description |
|---|---|
| **Resource Tension** | Blood Meter is both offensive fuel and the dash cost — players must fight to sustain their own power |
| **Momentum Reward** | Chaining Dash → Strike rewards aggression; passive play denies the resource loop |
| **Sensory Impact** | Every hit must feel physically present through audio, freeze-frames, and visual effects |
| **Readable Chaos** | High-speed combat must remain readable — Vivid-Shadow trails and Hit-Flash cues serve as navigational anchors |

---

## Blood Meter System

```
┌─────────────────────────────────────────────────────┐
│  🩸 BLOOD METER                         [████████░░]  │
│                                           80 / 100   │
└─────────────────────────────────────────────────────┘

  SOURCES                         COSTS
  ──────────────────────────────────────
  + Passive regen    +4 /sec      Sanguine Dash     −25
  + Light hit        +8           (blocked if < 25)
  + Heavy hit        +12
  + Special hit      +16
  + Enemy killed     +30
```

**Design Intent:** The meter creates a *positive feedback loop* — successful aggressive play generates more Blood, enabling more dashes, enabling more hits. Breaking this loop by dying or being staggered is a meaningful setback.

---

## Zero-Frame Dash-to-Strike

```
Timeline (ms):
  0 ──────────── 80 ──────────── 180
  │  DASH START   │ ZERO-FRAME   │ DASH END
  │               │   WINDOW     │
  │               │←───80ms────→ │
  │                              │
  If [ATTACK] pressed in window:
    → IMMEDIATELY snap to ATTACKING state
    → +1.4× hit-stop duration (heavier impact)
    → Vivid-Shadow trail cuts off cleanly
    → Zero-Frame bonus damage NOT applied (feel reward only)
```

**Player Experience:** The Zero-Frame window gives the player the sensation of *perfectly cancelling* the dash into a strike. It's generous enough (80ms ≈ ~5 frames at 60fps) to feel responsive without being trivially automatic.

---

## Hit-Flash System

Three layers of visual feedback fire on every successful hit:

1. **Full-Screen Flash** — brief white/gold overlay (`rgba(255,255,255,0.55)`, 90ms)
2. **Damage Number** — floating text, scales with combo and crit status
3. **Hit-Stop** — engine freeze for 60–200ms, proportional to attack weight

On **Critical Strike** (`$800!$` threshold):
- Flash colour shifts to **gold** (`rgba(255,215,0,0.85)`)
- Critical Indicator animates centre-screen for 900ms
- Hit-Stop duration is maximum (200ms+)
- Damage number displays `✦VALUE` prefix

---

## Vivid-Shadow Particle Trail

| Property | Value |
|---|---|
| Particle count | 18 per burst |
| Emission interval | 30ms during dash |
| Lifetime | 350ms |
| Colours | `#c0392b` → `#8e0000` → `#200000` |
| Shape | Elliptical, elongated along dash vector |
| Glow | Additive `rgba(192,57,43,0.5)`, radius 20px |

The trail is intentionally **directional** — elongated opposite the dash direction to read as velocity. The opacity gradient (bright at spawn → black at death) creates an "afterimage" silhouette reading.

---

## Blade Glow Effect

Activated during any attack (intensity × 1.4 for Zero-Frame strikes):

- **Core**: Near-white (`#ffffff → #ffe0e0`), tight 2px radius
- **Mid halo**: Rose glow (`rgba(255,180,180,0.7)`), 14px radius
- **Outer halo**: Crimson fade, 22px radius
- **Motion streak**: Elongated along attack angle, visible at intensity > 0.8

---

## Audio Design Notes

| Event | Sound Design Brief |
|---|---|
| Dash trigger | Short pitched swoosh + low rumble sub-bass |
| Zero-Frame strike | Instant impact transient — NO pre-wind sound |
| Light hit | Dry percussive thud |
| Heavy hit | Layered impact: bone crack + flesh + reverb tail |
| Critical hit | Heavy hit + high-frequency ring + brief silence |
| Blood charge | Wet, organic bubbling (meter gaining) |

All SFX play with ±8% pitch randomisation to prevent ear fatigue in long combat chains.

---

## Iteration Log

| Version | Change |
|---|---|
| v0.1 | Dash cost: 30 → 25 (felt too punishing at low meter) |
| v0.2 | Zero-Frame window: 60ms → 80ms (needed 1 more frame of leniency) |
| v0.3 | Hit-stop max cap: 250ms → 200ms (too disorienting in multi-enemy) |
| v0.5 | Crit multiplier: 4.0× → 3.5× (4.0 broke enemy HP pacing) |
| v0.9 | Blood regen: 3/s → 4/s (passive play felt too starved) |
