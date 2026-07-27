# TheArchive — Floor plan

Small non-enterable storefront north of `NorthEastCorridor`, filling
the gap east of TheStation. 6 × 6 m. Player sees inside through the
closed glass storefront door on the south (corridor-facing) wall but
cannot enter.

Source of truth: `src/game/constants/gameConstants.ts::THE_ARCHIVE`,
`src/game/scene/TheArchive.tsx`.

## Grid

7 rows × 7 cols. 1 cell = 1 m.

```
              +14       +17     +20
               v         v      v
        col:   0         3      6
Z=-45        ################    ← N wall (opaque)
Z=-44        S..............#
Z=-43        S..............#
Z=-42        S..............#
Z=-41        S..............#
Z=-40        S..............#
Z=-39        ######xxx######    ← S wall: closed glass storefront door @ X=+17, 1.4 m
```

- West wall (X=+14) is coplanar with TheStation east-strip east wall
  (owned by `TheStation.tsx`, not re-rendered here). Marked `S`.
- South wall (Z=-39) is coplanar with `NorthEastCorridor`'s north
  wall (which is not rendered for this X-span because TheArchive
  owns the plane here). Door is a visible **closed** glass slab.

## Column ↔ X coordinate

```
col:    0         3      6
X:    +14       +17    +20
```

## Legend

Symbols from [./README.md](./README.md):

```
.  open floor
#  opaque wall
x  closed glass storefront door (blocking, visible slab)
S  wall coplanar with TheStation east strip (owned there)
```

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North | Z=-45 | Opaque, 6 m | `TheArchive.tsx` | Whiteboard mounted on the south face (see furniture) |
| East | X=+20 | Opaque, 6 m | `TheArchive.tsx` | — |
| West | X=+14 | Opaque | `TheStation.tsx` (coplanar, not re-rendered here) | — |
| South | Z=-39 | Glass storefront split around 1.4 m closed glass door @ X=+17 | `TheArchive.tsx` | Storefront door, 1.4 m closed (blocking) |

## Related

- Furniture: [the-archive-furniture.md](./the-archive-furniture.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheArchive.tsx`,
  `src/game/constants/gameConstants.ts::THE_ARCHIVE`
- Adjacent spaces: `TheStation` (west wall coplanar),
  `NorthEastCorridor` (south wall coplanar)
