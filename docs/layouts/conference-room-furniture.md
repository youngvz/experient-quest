# ConferenceRoom — Furniture map

Big 10 × 4 m brown conference table on the axis, 10 chairs around it,
whiteboard on the north wall, TV on the east wall. This is the room
the front-door presentation stops render into.

Source of truth: `src/game/scene/ConferenceRoom.tsx` +
`ConferenceTable.tsx` + `ConferenceChairs.tsx` +
`ConferenceLaptops.tsx` + `Televisions.tsx` + `Whiteboards.tsx`.

## Grid

Overlay of the ConferenceRoom floor plan with furniture markers.

```
              -10       -5        0        +5       +10
               v         v        v         v        v
        col:   0         5         10        15        20
Z=-7         GGGGGGGGGGGBGGGGGGGGG    ← whiteboard on N wall, centerX=0
Z=-6         G...................#
Z=-5         G......h..h..h..h..h#    ← N-side chairs @ Z=-2.55 (rendered here as approx row -5..-3)
Z=-4         G...................#
Z=-3         G......L.L.L..L.L.L.#    ← 6 laptops on table (mixed sides)
Z=-2         G...................#
Z=-1         G...TTTTTTTTTTTTTTT.#
Z=0          G...TTTTTTTTTTTTTTT.V    ← 10 × 4 conf table; TV on E wall centerZ=0
Z=+1         G...TTTTTTTTTTTTTTT.#
Z=+2         G...................#
Z=+3         G......L.L.L..L.L.L.#
Z=+4         G......h..h..h..h..h#    ← S-side chairs @ Z=+2.55
Z=+5         G...................#
Z=+6         G...................#
Z=+7         GGGGGGGGGGGGGdd######    ← front door @ X=+3.5, opens into TheBakery
```

## Legend

See [./README.md](./README.md) for the universal legend. Additions
for this room:

```
T  desk / table                V  wall-mounted TV
h  chair                       B  wall-mounted whiteboard
L  laptop on table              d  open door
```

## What's placed

### Conference table (`ConferenceTable.tsx`)

| Item | Position | Size | Notes |
|---|---|---|---|
| Table | center (0, 0), Y=0.75 | 10 × 4 | Brown top, dark legs |

### Chairs (`ConferenceChairs.tsx`, uses `CHAIR.positions`)

Ten chairs total, 5 on each long side, all facing the table.

| Side | Z | X positions | Facing |
|---|---|---|---|
| North | Z=-2.55 | -4, -2, 0, +2, +4 | +Z (south, toward table) |
| South | Z=+2.55 | -4, -2, 0, +2, +4 | -Z (north, toward table) |

### Laptops on table (`ConferenceLaptops.tsx`)

Six laptops with hand-authored jitter positions:

- **North side**: `(-2.2, -1.45, ~π)`, `(+3.4, -1.35, ~π)`
- **South side**: `(-4.0, +1.5, ~0)`, `(-1.6, +1.4, ~0)`,
  `(+1.3, +1.55, ~0)`, `(+3.8, +1.4, ~0)`
- Scale: 1.25

### Wall-mounted props

| Item | Wall | Center | Size | Facing |
|---|---|---|---|---|
| **TV** | East wall (X=+10) | Z=0, Y=1.5 | 5 × 1.8 × 0.15 | -X (west, into room) |
| **Whiteboard** | North wall (Z=-7) | X=0, Y=1.5 | 7 × 1.8 | +Z (south, into room) |

### Interaction zone

Presentation-stop zone sits in front of the east-wall TV:

- Center: `(+7, 0, 0)` (3 m west of the east wall)
- Size: 3.5 × 5 m

## Related

- Floor plan: [conference-room-floor.md](./conference-room-floor.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: see files listed in the floor plan doc
