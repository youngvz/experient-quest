# ConferenceRoom — Floor plan

Main conference room centered on the world origin. 20 × 14 m. Glass
walls on north/west and the west portion of the south wall; opaque
east wall (backs the main TV) and opaque south east segment (shared
with TheBakery's NE alcove north).

Source of truth: `src/game/scene/ConferenceRoom.tsx`,
`src/game/constants/gameConstants.ts` (`ROOM_WIDTH`, `ROOM_DEPTH`,
`DOOR`).

## Grid

15 rows × 21 cols. 1 cell = 1 m.

```
              -10       -5        0        +5       +10
               v         v        v         v        v
        col:   0         5         10        15        20
Z=-7         GGGGGGGGGGGGGGGGGGGGG    ← north wall (glass, 3 divisions)
Z=-6         G...................#
Z=-5         G...................#
Z=-4         G...................#
Z=-3         G...................#
Z=-2         G...................#
Z=-1         G...................#
Z=0          G...................#    ← east wall (opaque), TV @ Z=0 centerY=1.5
Z=+1         G...................#
Z=+2         G...................#
Z=+3         G...................#
Z=+4         G...................#
Z=+5         G...................#
Z=+6         G...................#
Z=+7         GGGGGGGGGGGGGdd######    ← south wall: glass west, opaque east; front door @ X=+3.5
```

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
G  glass wall
d  2 m open door (header only, no slab)
```

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North | Z=-7 | Glass (3 divisions) | `ConferenceRoom.tsx` — also coplanar with `EastCorridor.tsx`'s south (not re-rendered there) | — |
| East | X=+10 | Opaque | `ConferenceRoom.tsx` | Main TV mounted on the west face @ Z=0, centerY=1.5, 5 × 1.8 |
| South (west segment) | Z=+7, X ∈ [-10, +2.5] | Glass | `ConferenceRoom.tsx` | — |
| South (east segment) | Z=+7, X ∈ [+4.5, +10] | Opaque | `ConferenceRoom.tsx` — coplanar with TheBakery NE alcove's north wall | — |
| Front door | Z=+7, X ∈ [+2.5, +4.5] | Open passage (header + lintel only, no slab) | `ConferenceRoom.tsx` | Player enters from TheBakery, `DOOR.centerX=+3.5`, width 2 m |
| West | X=-10 | Glass | `ConferenceRoom.tsx` — coplanar with `CentralCorridor.tsx`'s east wall (also rendered there) | — |

## Related

- Furniture: [conference-room-furniture.md](./conference-room-furniture.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/ConferenceRoom.tsx`,
  `ConferenceFloor.tsx`, `ConferenceTable.tsx`,
  `ConferenceChairs.tsx`, `ConferenceLaptops.tsx`, `Televisions.tsx`,
  `Whiteboards.tsx`;
  `src/game/constants/gameConstants.ts` (`DOOR`, `CONFERENCE_TABLE`,
  `CHAIR`, `TV`, `WHITEBOARD`)
- Adjacent spaces: `EastCorridor` (N, coplanar), `TheBakery` (S,
  coplanar east segment), `CentralCorridor` (W, coplanar glass)
