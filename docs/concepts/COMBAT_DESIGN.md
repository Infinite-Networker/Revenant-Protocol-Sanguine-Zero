# ⚔️ Concept Doc — Combat Design Philosophy
> **Revenant Protocol: Sanguine Zero** | Cherry Computer Ltd. | 2026

---

## Core Combat Identity

Revenant Protocol sits at the intersection of:
- **Devil May Cry** — stylish combo expression
- **Sekiro** — posture-based rhythm and precision
- **Bleach/Demon Slayer** — anime-speed visual language
- **Bloodborne** — aggressive resource loop (rally mechanic inspiration)

The player should feel like a *barely-controlled force of nature* — powerful, fast, and constantly one mistake away from losing everything.

---

## Attack Triangle

```
         [Z] Light Attack
              ⬆
              │  Fast, low damage, high Blood gain
              │  Best for combo building
              │
    [C] ──────┼────── [X] Heavy Attack
   Special    │         Slow, high damage, massive hit-stop
   (Unique    │         Best for closing combos
   per char)  │
              ↓
         Sanguine Dash [SHIFT]
              │
              └─ Zero-Frame window enables any attack to
                 become a dash-strike (hybrid move)
```

---

## Combo Design

### Standard Combo Flow
```
  L → L → L → H        (Light × 3 into Heavy finisher)
  L → L → DASH → L     (Dash cancel mid-combo)
  DASH → H              (Zero-Frame heavy — maximum impact)
  DASH → DASH → L       (Double-dash gap closer)
```

### Combo Multiplier Scaling
Each successive hit in a combo increases:
- Critical hit chance by +2% per hit
- Blood Meter gain by +5% per hit (not yet implemented)
- HUD combo number size (visual feedback)

Combo resets after 1.8 seconds of no hits.

---

## Enemy Design Principles

| Enemy Tier | HP | Stagger Threshold | Behaviour |
|---|---|---|---|
| **Grunt** | 60–80 | 20 stagger | Rushes player, no guard |
| **Guard** | 120–150 | 45 stagger | Blocks light attacks, parriable |
| **Berserker** | 200–280 | 60 stagger | Counterattacks on guard break |
| **Knight** | 350+ | 90 stagger | Full suite of player moves |
| **Boss** | 800–2000 | Phase-based | Multi-phase with unique mechanics |

**Design Rule**: No enemy should require more than 2 full combos to stagger. Stagger = reward state = more aggressive play.

---

## Hit-Stop Design

Hit-stop (engine freeze-frames on impact) is calibrated to maximize *perceived impact* without disrupting *player agency*:

| Attack | Hit-Stop | Zero-Frame Modifier |
|---|---|---|
| Light | 60ms | × 1.4 = 84ms |
| Heavy | 130ms | × 1.4 = 182ms |
| Special | 200ms | × 1.4 = 280ms |
| Critical | +50% of above | — |

**Maximum cap**: 280ms. Beyond this, the freeze reads as a performance issue rather than an impact cue.

During hit-stop:
- All physics freeze
- Audio low-pass filter engages (800Hz cutoff)
- Particle emission pauses
- Input buffer continues (Zero-Frame window active)

---

## The $800!$ Critical Indicator

Named after the iconic damage numbers from JRPG traditions. The on-screen critical indicator:

1. Triggers at 15% base chance (+2% per combo hit)
2. Displays centre-screen for 900ms
3. Scales with `sin(time × 12)` pulse animation
4. Fades in over first 10% of lifetime, holds, fades out over last 30%
5. Uses additive glow blend for "screen burn" effect

The `$800!$` label is a deliberate reference to classic RPG damage caps — a nod to genre history while subverting the expectation (our damage system has no cap).

---

## Resource Loop Diagram

```
  AGGRESSIVE PLAY
        │
        ▼
  Land hits ──→ Gain Blood ──→ Enable more Dashes
        ▲                              │
        │                              ▼
  Deal damage ◄── Zero-Frame Strike ◄──┘
        │
        ▼
  Enemy HP depletes ──→ Kill bonus (+30 Blood) ──→ Full meter
        │
        ▼
  More Blood ──→ More Dashes ──→ More hits
  
  DEFENSIVE PLAY (avoidance / passivity)
        │
        ▼
  Reduced hit count ──→ Slower Blood regen
        │
        ▼
  Limited Dashes ──→ Reduced mobility ──→ More hits taken
  (Negative feedback spiral — punishes passivity)
```

---

## Character Concept: The Revenant (Player)

- **Background**: Bound by the Sanguine Pact — power fuelled by their own blood
- **Weapon**: Dual blades with blood-conducting channels (explains blade glow)
- **Ability Source**: Each dash literally ruptures their Blood Meter — they're sacrificing health potential for mobility
- **Visual Style**: Tattered black coat, blood-red accents, white hair from the curse
- **Personality**: Silent, relentless, not inherently evil — hunts specific targets only
