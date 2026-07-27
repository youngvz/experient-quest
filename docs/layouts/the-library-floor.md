# TheLibrary — Floor plan

Quiet focus room on the west side. 6 × 18 m. Corridor-side east wall
is glass with an **open outward-swinging** door (unlike Commons and
Atrium which have closed doors).

Source of truth: `src/game/constants/gameConstants.ts::THE_LIBRARY`,
`src/game/scene/TheLibrary.tsx`.

## Grid

19 rows × 7 cols. 1 cell = 1 m.

```
              -19       -16    -13
               v         v      v
        col:   0         3      6
Z=-22        ################    ← N wall (opaque)
Z=-21        #..............G
Z=-20        #..............G
Z=-19        #..............G
Z=-18        #..............G
Z=-17        #..............G
Z=-16        #..............G
Z=-15        #..............G
Z=-14        #..............G
Z=-13        #..............G
Z=-12        #..............G
Z=-11        #..............G
Z=-10        #..............G
Z=-9         #..............D    ← E wall open door @ Z=-8, outward-swinging
Z=-8         #..............D
Z=-7         #..............G
Z=-6         #..............G
Z=-5         #..............G
Z=-4         ################    ← S wall (opaque)
```

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
D  2 m open glass door (outward-swinging into the room)
```

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North | Z=-22 | Opaque | `TheLibrary.tsx` | Whiteboard mounted on south face @ X=-16; painting @ X=-16.5 |
| South | Z=-4 | Opaque | `TheLibrary.tsx` | Whiteboard mounted on north face @ X=-16 |
| West | X=-19 | Opaque | `TheLibrary.tsx` | Focus desks lined up along inside face (see furniture) |
| East | X=-13 | Glass storefront | `TheLibrary.tsx` (own split) + coplanar with `CentralCorridor.tsx` | Corridor door, 2 m open @ Z=-8, `openDirection=outward` (swings into the room) |

## Related

- Furniture: [the-library-furniture.md](./the-library-furniture.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheLibrary.tsx`,
  `src/game/constants/gameConstants.ts::THE_LIBRARY*`
- Adjacent spaces: `CentralCorridor` (E, coplanar glass with an open
  outward-swinging door)
