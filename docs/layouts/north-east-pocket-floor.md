# NorthEastPocket — Floor plan

6 × 7 m open pocket at the mouth of `NorthEastCorridor`. Fills the gap
between TheStation's south face (Z=-39) and TheLab's north face
(Z=-32). No dedicated component — its floor is rendered inline by
`NorthEastCorridor.tsx`. Every perimeter surface is either fully open
or coplanar with a neighbor's wall.

Source of truth:
`src/game/constants/gameConstants.ts::NORTH_EAST_POCKET`,
`src/game/scene/NorthEastCorridor.tsx` (floor slab).

## Grid

8 rows × 7 cols. 1 cell = 1 m.

```
              -10       -5      -4
               v         v      v
        col:   0         5      6
Z=-39        S=======S=======S=#    ← N wall = TheStation south, owned there
Z=-38        .......#
Z=-37        .......#
Z=-36        .......#    ← east side X=-4: open Z ∈ [-39, -36], step wall closes Z ∈ [-36, -32]
Z=-35        ........
Z=-34        ........
Z=-33        ........
Z=-32        L=======L=======L=======    ← S wall = TheLab north, owned there
```

Notes:
- North wall (Z=-39) is coplanar with TheStation's south wall
  (`TheStation.tsx`, opaque, full-width span X ∈ [-10, +14]). Not
  re-rendered by any pocket component.
- South wall (Z=-32) is coplanar with TheLab's north wall
  (`TheLab.tsx`, opaque, full 20 m span X ∈ [-10, +10]). Not
  re-rendered here.
- West side (X=-10) is a full-height cutout in `CentralCorridor.tsx`'s
  east wall (the `gaps` array).
- East side (X=-4) is split: Z ∈ [-39, -36] is open into
  `NorthEastCorridor`; Z ∈ [-36, -32] is the "step wall" rendered by
  `NorthEastCorridor.tsx` (sealing off the dead-space strip).
- Contains two `Sofa` props (rendered by NorthEastCorridor.tsx, not
  shown in this floor doc — see the pocket's furniture in the
  north-east-corridor scene component).

## Column ↔ X coordinate

```
col:    0         5      6
X:    -10        -5     -4
```

## Legend

See [./README.md](./README.md) for the universal legend. Symbols here:

```
.  open floor
#  step wall (opaque, X=-4 Z ∈ [-36, -32], owned by NorthEastCorridor.tsx)
S  wall coplanar with TheStation south (owned by TheStation.tsx)
L  wall coplanar with TheLab north (owned by TheLab.tsx)
=  wall coplanar with another room's wall (owned there)
```

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North | Z=-39, X ∈ [-10, -4] | Opaque | `TheStation.tsx` (coplanar) | — |
| South | Z=-32, X ∈ [-10, -4] | Opaque | `TheLab.tsx` (coplanar) | — |
| East (open stretch) | X=-4, Z ∈ [-39, -36] | Not rendered (open into NorthEastCorridor) | — | Whole stretch |
| East (step wall) | X=-4, Z ∈ [-36, -32] | Opaque | `NorthEastCorridor.tsx` | — |
| West | X=-10 | Not rendered (full-height cutout in CentralCorridor east wall) | — | Whole side |

## Related

- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/NorthEastCorridor.tsx` (renders the floor and
  step wall for this pocket),
  `src/game/constants/gameConstants.ts::NORTH_EAST_POCKET`
- Adjacent spaces: `CentralCorridor` (west, open),
  `NorthEastCorridor` (east, open along Z ∈ [-39, -36]), `TheStation`
  (north wall coplanar), `TheLab` (south wall coplanar)
