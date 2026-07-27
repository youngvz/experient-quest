# TheStation — Furniture map

Six alcove workstations (A/B/D/E/F furnished; C empty), Boardroom
with a big meeting table + wall TV + laptops, two west-side solo
workstations along the glass corridor wall, a sofa flush against the
Boardroom's north wall, and NPC Catherine.

Source of truth: `src/game/scene/TheStation.tsx` +
`src/game/constants/gameConstants.ts::THE_STATION_WEST_WORKSTATIONS` +
`THE_STATION_F_EXPANSION` + `THE_BOARDROOM`.

## Grid

Shell mirrors the floor plan; furniture overlaid.

```
              -10       -5        0        +5       +10   +14
               v         v        v         v        v     v
        col:   0         5         10        15        20    24
Z=-62        #####################----
Z=-61        #..h..#..h..#.......#----    ← A/B chairs @ north (facing south)
Z=-60        #.TTT.#.TTT.#..C....#----    ← A/B desks; C empty
Z=-59        #.MLM.#.MLM.#.......#----
Z=-58        #.....#.....#.......#----
Z=-57        GGdGGG#GGdGGG#####d######
Z=-56        #....................#..#
Z=-55        #....................#.h#    ← D chair @ (+13, -54)
Z=-54        #....................#TLM
Z=-53        #.T..................#TLM    ← W-workstation @ (-7.5, -53) + D desk
Z=-52        #.T..................GGdG
Z=-51        #....................#.h#    ← E chair @ (+13, -48)
Z=-50        #....................#TLM
Z=-49        #....................#TLM
Z=-48        #.T..................GGdG    ← W-workstation @ (-7.5, -48)
Z=-47        #.T..................#.h#    ← F chair @ (+13, -42)
Z=-46        #....................#TLM
Z=-45        #....######d##GG######TLM
Z=-44        #....#*V*#F..S........TLM
Z=-43        #....G*T*#F..S...........
Z=-42        #....d*T*#F..Y............   ← Boardroom W door; Catherine NPC (-4, 0, -50) actually — see below
Z=-41        #....G*T*#F..............
Z=-40        #....#*..*#F..............
Z=-39        ==========================
```

Notes on the grid rendering:
- The main-floor area between the alcoves and the Boardroom (roughly
  X ∈ [-10, -4], Z ∈ [-57, -40]) is largely open; the two west-wall
  workstations sit at (-7.5, -53) and (-7.5, -48).
- The Sofa (`S`) marker inside the Boardroom row is a rendering hack
  — the sofa actually sits at (+0.5, ~-48.65) rotationY=π **on the
  main floor north of the Boardroom's north wall**, backed flush
  against Z=-48. Read the Sofa row below for the true coordinates.
- Catherine (`Y`) at (-4, 0, -50) is on the main floor, west of the
  Boardroom west wall.

## What's placed

### West workstations (`THE_STATION_WEST_WORKSTATIONS`)

Two solo workstations against the west (glass) wall, sitter faces east.

| Location | Desk center | Chair | Monitor | Laptop | Papers |
|---|---|---|---|---|---|
| North | (-7.5, -53), 2 × 0.75 × 3 | (-9, 0, -53, π/2) — east | (-6.1, -53) faces west | (-8.9, -53) faces west | 2 |
| South | (-7.5, -48), 2 × 0.75 × 3 | (-9, 0, -48, π/2) — east | (-6.1, -48) faces west | (-8.9, -48) faces west | 2 |

### Sofa & NPC

| Item | Position | Notes |
|---|---|---|
| Sofa | (+0.5, ~-48.65), rotationY=π | 4-seat, faces north; backed against the Boardroom's north wall (Z=-48) |
| Catherine NPC | (-4, 0, -50), rotationY=-π/2 | Faces west |

### North-side alcoves — furnished A + B (C empty)

Chair against the north wall (chairZ = northZ + 0.6 = -61.4),
rotationY=0 (facing south, toward alcove door). Desk in front, 3 × 2.
Monitor on the north (back) side; laptop nearer the sitter.

| Bay | Bay center X | Chair | Desk center | Monitor Z | Laptop Z | Papers |
|---|---|---|---|---|---|---|
| A | -7 | (-7, 0, -61.4) | (-7, -59.5), 3 × 0.75 × 2 | -60.5 | -58.5 | 2 |
| B | -1 | (-1, 0, -61.4) | (-1, -59.5), 3 × 0.75 × 2 | -60.5 | -58.5 | 2 |
| C | +6 | — | — | — | — | — |

### East-side alcoves — furnished D + E + F (all west-facing workstations)

Chair against east wall (X=+13), rotationY=-π/2 (facing west).
Desk 2 × 3 in front. Monitor at desk's west (back) edge, laptop nearer
sitter.

| Bay | Bay center Z | Chair | Desk center | Monitor X | Laptop X | Papers |
|---|---|---|---|---|---|---|
| D | -54 | (+13, 0, -54, -π/2) | (+11.5, -54), 2 × 0.75 × 3 | +10.9 | +12.1 | 2 |
| E | -48 | (+13, 0, -48, -π/2) | (+11.5, -48), 2 × 0.75 × 3 | +10.9 | +12.1 | 2 |
| F | -42 | (+13, 0, -42, -π/2) | (+11.5, -42), 2 × 0.75 × 3 | +10.9 | +12.1 | 2 |

### The Boardroom

Enclosed meeting sub-room in the SE quadrant.

| Item | Position | Size / Details |
|---|---|---|
| Meeting table | (+0.5, -42.5), Y=0.75 | 3 × 5, brown top, dark legs |
| Chair NW | (-2, -44, +π/2) | Faces east |
| Chair NE | (+2, -44, -π/2) | Faces west |
| Chair SW | (-2, -42, +π/2) | Faces east |
| Chair SE | (+2, -42, -π/2) | Faces west |
| 4 laptops | One per chair, nudged 0.9 m toward table center along X | Screens face sitter |
| Paper (NW corner) | (-0.3, -44.1), rot 0.4 | On table |
| Paper (SE corner) | (+1.1, -40.7), rot -0.5 | On table |
| Wall TV | North wall (Z=-48), centerX=+1, centerY=1.6 | 4 × 1.6 × 0.12, faces south (+Z into room) |

## Related

- Floor plan: [the-station-floor.md](./the-station-floor.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheStation.tsx`
