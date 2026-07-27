# NorthEastCorridor — Floor plan

Narrow east-running corridor pulled flush against TheStation's south
wall. 24 m × 3 m (narrow section). Enters through
`NorthEastPocket` at its west end; terminates at an open dead-end door
on its east wall.

Source of truth:
`src/game/constants/gameConstants.ts::NORTH_EAST_CORRIDOR`,
`src/game/scene/NorthEastCorridor.tsx`.

## Grid

4 rows × 25 cols. 1 cell = 1 m. Row Z=-39 (north wall / TheStation
south boundary), row Z=-36 (south wall).

```
              -5        0        +5       +10       +15       +20
               v        v         v         v         v         v
        col:   0         5         10        15        20        24
Z=-39        S=========================================A=====A====    ← N wall: TheStation south (Z=-39), then TheArchive gap
Z=-38        ...........................................d.......
Z=-37        ...........................................d.......x   ← open glass door on east dead-end @ Z=-37.5
Z=-36        ###########################################         ← south wall, opaque
Z=-35        ..
Z=-34        ..    ← step area (X ∈ [-4, -4], Z ∈ [-36, -32]) sealed by step wall
Z=-33        ..
Z=-32        ..    ← below: TheLab north wall, owned there
```

Notes:
- Corridor interior is Z ∈ [-39, -36]. Rows Z=-35 through Z=-32 shown
  above are the dead-space strip between the corridor's south wall
  and TheLab's north wall (Z=-32); this strip is left as intentional
  dead space to be filled later.
- North wall is coplanar with TheStation's south wall at X ∈ [-4, +14]
  (owned by TheStation.tsx, not re-rendered here). East of X=+14 the
  same plane is TheArchive's south wall (X ∈ [+14, +20]), with
  TheArchive's own closed glass storefront door at X=+17, width 1.4 m.
- East wall (X=+20) has an open glass door slab at Z=-37.5, width 1.6 m
  — leads nowhere yet.
- West side (X=-4) is open into NorthEastPocket; the step wall at
  X=-4, Z ∈ [-36, -32] closes off the strip south of the corridor.

## Column ↔ X coordinate

```
col:    0         5         10        15        20        24
X:     -4        +1        +6       +11       +16       +20
```

## Legend

See [./README.md](./README.md) for the universal legend. Symbols here:

```
.  open floor
#  opaque wall (S wall + step wall)
S  wall coplanar with TheStation south (owned by TheStation.tsx)
A  wall coplanar with TheArchive south (owned by TheArchive.tsx)
d  closed glass storefront door (TheArchive entry, owned by TheArchive.tsx)
x  open glass door (east dead-end, owned by NorthEastCorridor.tsx)
=  wall coplanar with another room's wall (owned there)
```

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North (Station stretch) | Z=-39, X ∈ [-4, +14] | Opaque | `TheStation.tsx` | — |
| North (Archive stretch) | Z=-39, X ∈ [+14, +20] | Split (opaque + glass around door) | `TheArchive.tsx` | Archive storefront door, 1.4 m closed glass @ X=+17 |
| East | X=+20 | Opaque | `NorthEastCorridor.tsx` | Dead-end door, 1.6 m open glass @ Z=-37.5 |
| South | Z=-36 | Opaque | `NorthEastCorridor.tsx` | — |
| Step wall | X=-4, Z ∈ [-36, -32] | Opaque | `NorthEastCorridor.tsx` (seals strip south of corridor) | — |
| West | X=-4, Z ∈ [-39, -36] | Not rendered (open into NorthEastPocket) | — | Whole side |

## Related

- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/NorthEastCorridor.tsx`,
  `src/game/constants/gameConstants.ts::NORTH_EAST_CORRIDOR`
- Adjacent spaces: `NorthEastPocket` (west), `TheStation` (north wall
  coplanar), `TheArchive` (north wall coplanar east of X=+14),
  `TheLab` (~4 m south, separated by dead-space strip)
