# TheLab — Furniture map

Kitchen cabinet row against the alcove A west partition, two
back-to-back shared tables in the north cluster, two more shared
tables in the south cluster, plus Bay B and Bay C solo workstations
(Bay A is a kitchen station, not a workstation). NPCs: Logan
(cooking in Bay A) and Juan (in the main floor).

Source of truth: `src/game/scene/TheLab.tsx` +
`src/game/constants/gameConstants.ts::THE_LAB_CABINETS`.

## Grid

Same shell as the floor plan, furniture overlaid.

```
              -10       -5      -4       0        +5       +10
               v         v      v        v         v        v
        col:   0         5      6         10        15        20
Z=-32        #####################
Z=-31        G.........TT.TT......c    ← 2 holding stations (+1,-31.45) (+2.8,-31.45); cabinet row start
Z=-30        G...h.TTTTT.h........c
Z=-29        G....TTTTT...........c
Z=-28        G....TTTTT...........c    ← top table @ (-4, -28.5), 6×3
Z=-27        G....TTTTT...........c
Z=-26        G....TTTTT...........c
Z=-25        G....TTTTT...........c    ← bottom table @ (-4, -25.5), 6×3
Z=-24        D....TTTTT...........c
Z=-23        D...h.TTTTT.h....####d####
Z=-22        G.........###..K.h..#    ← Bay A: KitchenStation @ (+9.45, -27) faces west + Logan NPC (+7.5, -27)
Z=-21        G..........#........#
Z=-20        G..........#..........
Z=-19        G..........#........#
Z=-18        G..........#####d####    ← Bay B door
Z=-17        G......h...#..h..M.L.#    ← main-floor S cluster table + Bay B workstation
Z=-16        LLLLLLL#####.h.M.L.T#
Z=-15        .......#####........#
Z=-14        .......#####d########    ← Bay C door
Z=-13        .......####.h..M.L.T#    ← Bay C workstation
Z=-12        .......####..h.M.L.T#    ← south cluster table @ (+0.5, -13)
Z=-11        .......=====.........
Z=-10        .......==============
```

## Legend

Symbols from [./README.md](./README.md). New symbols here:

```
K  KitchenStation prop (custom, appears in Bay A with smoking effect)
c  cabinet row cell (part of THE_LAB_CABINETS)
Y  NPC anchor (used inline: Logan in Bay A, Juan in main floor)
```

## What's placed

### Kitchen cabinet row (`THE_LAB_CABINETS`)

Backed against Alcove A's west partition wall at X=+5, `facing=-1`
(fronts face west into the main floor). 10 cabinets of 0.6 × 0.6 m.
`startZ = -31.2`, runs south. Southmost cabinet (index 9) has a sink.

### North kitchen holding stations

Two `KitchenStation` props against the north wall:

- (+1, -31.45), rotationY=0 (facing south)
- (+2.8, -31.45), rotationY=0 (facing south)

### North cluster — back-to-back shared tables (`TheLab.tsx:273-351`)

| Table | Center | Size | Sitters |
|---|---|---|---|
| Top | (-4, -28.5) | 6 × 0.75 × 3 | 2 chairs at (-6, -30, 0) and (-2, -30, 0) — face south; each has laptop + monitor + 2 papers |
| Bottom | (-4, -25.5) | 6 × 0.75 × 3 | 2 chairs at (-6, -24, π) and (-2, -24, π) — face north; same accessories |

Screens face the sitter (rotationY = ±π appropriately). Per-sitter
jitter offsets are hand-authored in the code.

### South cluster — face-to-face shared tables

| Table | Center | Size | Sitters |
|---|---|---|---|
| North of pair | (+0.5, -18) | 4 × 0.75 × 3 | West chair (-2, -18, +π/2), east chair (+3, -18, -π/2); each with laptop, monitor, 2 papers |
| South of pair | (+0.5, -13) | 4 × 0.75 × 3 | Same pattern |

### Alcove workstations

**Bay A**: intentionally left as a kitchen zone rather than a desk.

| Prop | Position | Notes |
|---|---|---|
| KitchenStation | (+9.45, -27), rotationY=-π/2 (faces west) | `smoke=true` |
| Logan NPC | (+7.5, 0, -27), rotationY=+π/2 (faces east) | Faces the kitchen station |

**Bay B / Bay C** — mirror workstations. Both use the same layout:

| Bay | Desk center | Chair | Monitor | Laptop | Papers |
|---|---|---|---|---|---|
| B | (+7.5, -17.5), 2 × 0.75 × 3 | (+9, 0, -17.5, -π/2) — faces west | (+5.9, -17.5) faces east | (+9.1, -17.5) faces east | 2 |
| C | (+7.5, -12.5), 2 × 0.75 × 3 | (+9, 0, -12.5, -π/2) | (+5.9, -12.5) | (+9.1, -12.5) | 2 |

### NPCs

| NPC | Position | Rotation |
|---|---|---|
| Logan | (+7.5, 0, -27) | +π/2 (faces east, toward the Bay A kitchen station) |
| Juan | (-3, 0, -20) | 5π/4 |

## Related

- Floor plan: [the-lab-floor.md](./the-lab-floor.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheLab.tsx`
