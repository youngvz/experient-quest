# CorridorPocket — Floor plan

6 × 6 m T-junction between the central and east corridors. Fully open
on the south (into `EastCorridor`) and west (into `CentralCorridor`)
sides — no doors at all.

Source of truth:
`src/game/constants/gameConstants.ts::CORRIDOR_POCKET`,
`src/game/scene/CorridorPocket.tsx`.

## Grid

7 rows × 7 cols. 1 cell = 1 m. Row Z=-16 (north wall / TheLab south
boundary), row Z=-10 (open south into EastCorridor).

```
              -10       -5      -4
               v         v      v
        col:   0         5      6
Z=-16        L######L######L#    ← N wall coplanar w/ TheLab south, drawn here
Z=-15        .......#
Z=-14        .......#
Z=-13        .......#
Z=-12        .......#
Z=-11        .......#
Z=-10        ........        ← open south into EastCorridor
```

Notes:
- North wall (Z=-16) is opaque and rendered here; it's also TheLab's
  `westSouthZ` boundary but TheLab does not re-render this stretch.
- East wall (X=-4) is opaque and rendered here; fills the inside
  corner of TheLab's L-shape (TheLab's `stepX`).
- West side (X=-10) is fully open — part of the CentralCorridor east
  wall carve-out.
- South side (Z=-10) is fully open — merges with `EastCorridor`.

## Column ↔ X coordinate

```
col:    0         5      6
X:    -10        -5     -4
```

## Legend

See [./README.md](./README.md) for the universal legend. Symbols here:

```
.  open floor
#  opaque wall
L  wall coplanar with TheLab's south boundary (owned here by
   CorridorPocket.tsx, TheLab does not re-render this stretch)
```

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North | Z=-16, X ∈ [-10, -4] | Opaque | `CorridorPocket.tsx` (also TheLab's south) | — |
| East | X=-4, Z ∈ [-16, -10] | Opaque | `CorridorPocket.tsx` (fills TheLab's L-step) | — |
| South | Z=-10 | Not rendered (full-height open into EastCorridor) | — | Whole side |
| West | X=-10 | Not rendered (full-height open into CentralCorridor) | — | Whole side |

## Related

- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/CorridorPocket.tsx`,
  `src/game/constants/gameConstants.ts::CORRIDOR_POCKET`
- Adjacent spaces: `CentralCorridor` (west), `EastCorridor` (south),
  `TheLab` (north wall coplanar)
