# EastCorridor — Floor plan

Short east-running corridor above the conference room. 20 m × 3 m.
Reached through `CorridorPocket` at its NW corner. Ends at a
header-only dead-end door on its east wall.

Source of truth:
`src/game/constants/gameConstants.ts::EAST_CORRIDOR`,
`src/game/scene/EastCorridor.tsx`.

## Grid

4 rows × 21 cols. 1 cell = 1 m. Row Z=-10 (north wall / TheLab south
edge), row Z=-7 (south wall / ConferenceRoom north edge). Interior
Z ∈ [-9, -8].

```
              -10       -5        0        +5       +10
               v         v        v         v        v
        col:   0         5         10        15        20
Z=-10        ..d######L######L######L######L######L#####    ← N wall: open west, TheLab south door @ X=+3
Z=-9         .....................................d      ← east dead-end (header-only)
Z=-8         .....................................d
Z=-7         =====================================.....    ← S wall = ConferenceRoom N glass, owned there
```

Notes on the ASCII:
- The corridor's west side (X=-10) is fully open (part of the
  CentralCorridor east-wall carve-out). Row Z=-10 cols 0..1 are `..`
  showing that open transition into CorridorPocket.
- North wall renders opaquely only from X=-4 eastward (the west end
  is part of the pocket mouth). TheLab's south doorway sits inside
  the corridor's north wall at X=+3, width 1.6 m.
- East dead-end door at Z=-8.5, width 1.6 m, is header-only — no door
  slab.
- South wall is coplanar with `ConferenceRoom`'s north (glass) wall
  and is not re-rendered by EastCorridor.

## Column ↔ X coordinate

```
col:    0         5         10        15        20
X:    -10        -5         0        +5       +10
```

## Legend

See [./README.md](./README.md) for the universal legend. Symbols here:

```
.  open floor
#  opaque wall
L  Lab-side (shared) wall — coplanar with TheLab's south boundary,
   rendered by EastCorridor.tsx along X ∈ [-4, +10]
d  interior door (header only, no slab)
=  wall coplanar with another room's wall (owned there, not
   re-rendered by EastCorridor.tsx)
```

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North | Z=-10, X ∈ [-4, +10] | Opaque | `EastCorridor.tsx` (west stretch X ∈ [-10, -4] is CorridorPocket's mouth, not rendered here) | TheLab south door, 1.6 m header-only @ X=+3 |
| East | X=+10 | Opaque | `EastCorridor.tsx` | Dead-end door, 1.6 m header-only @ Z=-8.5 |
| South | Z=-7 | Glass (owned by `ConferenceRoom.tsx`, its 3-panel north wall) | — | — |
| West | X=-10 | Not rendered (full-height open passage to CorridorPocket) | — | Whole side |

## Related

- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/EastCorridor.tsx`,
  `src/game/constants/gameConstants.ts::EAST_CORRIDOR`
- Adjacent spaces: `CorridorPocket` (west, opens through the whole
  X=-10 side), `ConferenceRoom` (south wall coplanar), `TheLab`
  (accessible through the 1.6 m south door)
