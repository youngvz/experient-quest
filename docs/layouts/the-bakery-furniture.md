# TheBakery — Furniture map

Four workbench desks in the main floor with laptops/monitors/papers,
two alcove desks in the NE offices, a kitchen prep table + water
cooler + east cabinet row + fax machine at the south end. Includes
NPC "Sarah" as a greeter and a painting on the east wall.

Source of truth: `src/game/scene/TheBakery.tsx` +
`src/game/constants/gameConstants.ts::THE_BAKERY_DESKS`,
`THE_BAKERY_DESK_CHAIRS`, `THE_BAKERY_ALCOVE_DESKS`,
`THE_BAKERY_KITCHEN_TABLE`, `THE_BAKERY_EAST_CABINETS`.

## Grid

Same shell as the floor plan, with furniture overlaid.

```
              -10       -5        0        +5       +10
               v         v        v         v        v
        col:   0         5         10        15        20
Z=+7         =====================.....===.....===
Z=+8         G..................#....T.....#    ← upper alcove desk @ (+7.25, +8.2), V on N wall
Z=+9         G..................#..........#
Z=+10        G.h.T....h..h.T.h..d..........#    ← NW+NE workbenches, chairs W/E; upper alcove door
Z=+11        G...T.......T....########B####    ← workbench desks (span rows), whiteboard on divider (lower office N)
Z=+12        G...T.......T......d..........#    ← lower alcove door
Z=+13        G.h.T....h..h.T.h..#....T.....#    ← SW+SE workbenches; lower alcove desk @ (+7.25, +13.5)
Z=+14        G...T.......T......#..........#
Z=+15        G...................############
Z=+16        G............P#..........#      ← Sarah NPC @ (+2.5, +17) roughly (grid approximation)
Z=+17        G..........f........c......    ← fax machine, east cabinet row starts
Z=+18        D#GGGG#TT..GGGG#w..c#####      ← kitchen table @ (+6, +18.4), water cooler @ (0, +19.4)
Z=+19        ...................c
Z=+20        ...................c    ← east cabinet row continues south
```

The east cabinet row spans Z ∈ [+15.5, +19.7] approximately (7 units
× 0.6 m starting at Z ≈ +15.7). Painting on east wall (X=+10)
centerZ=+17 is shown as `P` in the wall column.

## Legend

See [./README.md](./README.md) for the universal legend. Additions
used here:

```
T  desk / workbench            m  mug (not drawn — see table below)
h  chair                       V  wall TV (upper alcove)
L  laptop (crowded — see table) B  wall whiteboard
M  monitor (crowded — see table) P  wall painting
c  cabinet row cell             w  water cooler
f  fax machine                  Y  NPC anchor (Sarah)
```

## What's placed

### Main-floor workbenches (`THE_BAKERY_DESKS` + chairs, laptops, monitors, papers)

Four 2 × 3 m brown workbenches. Each has a chair on its west or east
side and a laptop + monitor + 1–2 papers.

| Cluster | Desk center | Chair | Laptop / Monitor | Papers |
|---|---|---|---|---|
| NW | (-6.5, +10) | (-8, +10, +π/2) — east-facing | Screens face east (toward sitter) | 2 |
| NE | (-3.5, +10) | (-2, +10, -π/2) — west-facing | Screens face west | 1 |
| SW | (-6.5, +14) | (-8, +14, +π/2) | Screens face east | 1 |
| SE | (-3.5, +14) | (-2, +14, -π/2) | Screens face west | 2 |

Fax machine sits on the SE desk at (-2.95, +15.1), rotationY=+π/2.

Note: the NW workbench's laptop flashes until the `bakery-laptop`
presentation stop is completed.

### NE alcove desks (`THE_BAKERY_ALCOVE_DESKS`)

Two 3 × 2 m white-topped light-grey-legged desks (contrast finish
to signal they're solo workstations).

| Location | Desk center | Papers |
|---|---|---|
| Upper alcove | (+7.25, +8.2) — flush against north wall | 1, rotated 0.5 |
| Lower alcove | (+7.25, +13.5) — centered | 1, rotated -0.6 |

### Kitchen strip

| Item | Position | Notes |
|---|---|---|
| Kitchen prep table | center (+6, +18.4), 4 × 0.75 × 1.1 | White top / grey legs |
| 3 mugs on prep table | (+4.8, +18.4), (+5.1, +18.65), (+5.4, +18.2) | All black |
| Water cooler | (0, +19.4), rotationY=+π/2 | Spigot faces north into room |
| East cabinet row | Backed against east wall (X=+10), 7 cabinets 0.6 × 0.6, `facing=-1` (fronts face west) | Northmost cabinet has a sink; startZ ≈ +15.5, runs south |

### Wall-mounted props

| Item | Wall | Center | Size | Facing |
|---|---|---|---|---|
| **TV** (upper alcove) | Z=+7 (alcove's N wall = ConferenceRoom S segment) | X=+7.25, Y=2.0 | 3 × 1.4 | +Z (south, into upper alcove) |
| **Whiteboard** (lower alcove) | Z=+11 (upper/lower divider) | X=+7.25, Y=1.5 | 4 × 1.6 | +Z (south, into lower alcove) |
| **Painting** | East wall (X=+10) | Z=+17, Y=2.1 | 1.4 × 1.0, `#c99a3f` | -X (west, into room) |

### NPCs

| NPC | Position | Rotation |
|---|---|---|
| Sarah (greeter) | (+2.5, 0, +17) | -π/2 (facing west); waves until `sarah` completed |

## Related

- Floor plan: [the-bakery-floor.md](./the-bakery-floor.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheBakery.tsx`, `Televisions.tsx`,
  `Whiteboards.tsx`
