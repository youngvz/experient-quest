# TheAtrium — Floor plan

Two-zone room on the west side. 6 × 27 m. **Conference nook** at the
south (Z ∈ [-55, -45]) and a **4-desk pod** at the north
(Z ∈ [-42, -28]), with a whiteboard on the west wall at Z=-42
separating the two zones visually.

Source of truth: `src/game/constants/gameConstants.ts::THE_ATRIUM`,
`src/game/scene/TheAtrium.tsx`.

## Grid

28 rows × 7 cols. 1 cell = 1 m.

```
              -19       -16    -13
               v         v      v
        col:   0         3      6
Z=-55        ################    ← N wall (opaque)
Z=-54        #..............G
Z=-53        #..............G
Z=-52        #..............G
Z=-51        #..............G
Z=-50        #..............G
Z=-49        #..............G
Z=-48        #..............G
Z=-47        #..............G
Z=-46        #..............G
Z=-45        #..............x    ← E wall closed glass door @ Z=-45
Z=-44        #..............x
Z=-43        #..............G
Z=-42        #..............G
Z=-41        #..............G
Z=-40        #..............G
Z=-39        #..............G
Z=-38        #..............G
Z=-37        #..............G
Z=-36        #..............G
Z=-35        #..............G
Z=-34        #..............G
Z=-33        #..............G
Z=-32        #..............G
Z=-31        #..............G
Z=-30        #..............G
Z=-29        #..............G
Z=-28        ################    ← S wall (opaque)
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
x  closed glass door (owned by CentralCorridor.tsx)
```

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North | Z=-55 | Opaque | `TheAtrium.tsx` | — |
| South | Z=-28 | Opaque | `TheAtrium.tsx` | — |
| West | X=-19 | Opaque | `TheAtrium.tsx` | TV mounted on east face @ Z=-50 (conference nook); whiteboard mounted on east face @ Z=-42 (zone divider) |
| East | X=-13 | Glass storefront | `TheAtrium.tsx` (own split) + coplanar with `CentralCorridor.tsx` | Corridor door, 2 m closed glass @ Z=-45 |

## Zones

TheAtrium has no interior partition walls. The two zones are
defined purely by prop placement:

| Zone | Z range | Notes |
|---|---|---|
| Conference nook | [-55, -45] | 4-seat table + TV on W wall @ Z=-50 |
| (implicit divider) | Z ≈ -42 | Whiteboard on W wall marks the seam |
| Desk pod | [-42, -28] | 2×2 desk layout, staggered along Z |

## Related

- Furniture: [the-atrium-furniture.md](./the-atrium-furniture.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheAtrium.tsx`,
  `src/game/constants/gameConstants.ts::THE_ATRIUM*`
- Adjacent spaces: `CentralCorridor` (E, coplanar glass with closed
  door)
