# TheCommons — Floor plan

West-side breakout / collab room, south of world center. 6 × 16 m.
Corridor-side east wall is glass (coplanar with `CentralCorridor.tsx`'s
west wall); everything else is opaque.

Source of truth: `src/game/constants/gameConstants.ts::THE_COMMONS`,
`src/game/scene/TheCommons.tsx`.

## Grid

17 rows × 7 cols. 1 cell = 1 m.

```
              -19       -16    -13
               v         v      v
        col:   0         3      6
Z=+2         ################    ← N wall (opaque)
Z=+3         #..............G
Z=+4         #..............G
Z=+5         #..............G
Z=+6         #..............G
Z=+7         #..............G
Z=+8         #..............G
Z=+9         #..............G
Z=+10        #..............x    ← E wall closed glass door @ Z=+10
Z=+11        #..............x
Z=+12        #..............G
Z=+13        #..............G
Z=+14        #..............G
Z=+15        #..............G
Z=+16        #..............G
Z=+17        #..............G
Z=+18        ################    ← S wall (opaque)
```

Note: E wall glass is duplicated coplanar with `CentralCorridor.tsx`'s
west wall (an intentional prototype overlap). Door slab (closed
glass) is owned by CentralCorridor.

## Column ↔ X coordinate

```
col:    0         3      6
X:    -19       -16    -13
```

## Legend

Symbols from [./README.md](./README.md):

```
.  open floor
#  opaque wall
G  glass wall
x  closed glass door (owned by CentralCorridor.tsx)
```

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North | Z=+2 | Opaque | `TheCommons.tsx` | Whiteboard mounted on south face @ X=-16 |
| South | Z=+18 | Opaque | `TheCommons.tsx` | TV mounted on north face @ X=-16 |
| West | X=-19 | Opaque | `TheCommons.tsx` | 2 paintings on the east face |
| East | X=-13 | Glass storefront | `TheCommons.tsx` (own split) + coplanar with `CentralCorridor.tsx` | Corridor door, 2 m closed glass @ Z=+10 (slab owned corridor-side) |

## Related

- Furniture: [the-commons-furniture.md](./the-commons-furniture.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheCommons.tsx`,
  `src/game/constants/gameConstants.ts::THE_COMMONS*`
- Adjacent spaces: `CentralCorridor` (E, coplanar glass with a closed
  door)
