# TheBakery — Floor plan

Main open workroom + kitchen, immediately south of the conference
room. 20 × 13 m. Contains a **NE alcove** sub-region divided into an
upper and a lower enclosed office. West wall opens into the central
corridor; south wall opens outdoors (currently closed glass).

Source of truth:
`src/game/constants/gameConstants.ts::THE_BAKERY` + related
constants (`THE_BAKERY_WEST_DOOR`, `THE_BAKERY_SOUTH_DOOR`,
`THE_BAKERY_SOUTH_WINDOWS`, `THE_BAKERY_NE_ALCOVE`),
`src/game/scene/TheBakery.tsx`.

## Grid

14 rows × 21 cols. 1 cell = 1 m.

```
              -10       -5        0        +5       +10
               v         v        v         v        v
        col:   0         5         10        15        20
Z=+7         =====================.....===.....===    ← N wall coplanar w/ ConferenceRoom S; NE alcove opens at X ∈ [+4.5, +10]
Z=+8         G..................#..........#
Z=+9         G..................#..........#
Z=+10        G..................d..........#    ← upper office door @ Z=+10 X=+4.5 (1 m)
Z=+11        G..................############    ← upper/lower divider
Z=+12        G..................d..........#    ← lower office door @ Z=+12 X=+4.5 (1 m)
Z=+13        G..................#..........#
Z=+14        G..................#..........#
Z=+15        G..................############    ← alcove south wall (seals lower office)
Z=+16        G...................
Z=+17        G...................
Z=+18        D#GGGG#GGGG#GGGG####    ← S wall: closed glass door @ X=-7.5, three windows + opaque
Z=+19        .....................
Z=+20        .....................
```

Note on the grid:
- The NE alcove occupies X ∈ [+4.5, +10], Z ∈ [+7, +15]. Because
  X=+4.5 doesn't fall on a whole-cell boundary I've shown it at
  col 14/15 (X=+4/+5); the actual wall sits at the alcove's true
  X=+4.5. Similarly the alcove doors' 1 m widths straddle cell
  boundaries.
- The south wall's segmented pattern shows: opaque + glass window +
  opaque + glass window + opaque + glass window + opaque, with the
  closed glass door taking a 2 m slice west of center.
- Bakery west door is `D` at col 0, Z=+18 area (actually Z=+17.5) —
  connects to CentralCorridor.

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
D  2 m closed glass door (visible blocking slab)
d  1 m open interior door (header only)
=  wall coplanar with another room's wall (owned there, not
   re-rendered by TheBakery.tsx)
```

## Regions

| Region | X range | Z range | Notes |
|---|---|---|---|
| Bakery main floor | [-10, +4.5] | [+7, +18] | Open workroom + kitchen |
| NE alcove — upper office | [+4.5, +10] | [+7, +11] | Enclosed, west door 1 m @ Z=+10 |
| NE alcove — lower office | [+4.5, +10] | [+11, +15] | Enclosed, west door 1 m @ Z=+12 |
| Kitchen strip (south end) | [-10, +10] | [+15, +18] | Merges with main; cabinet row runs east side |

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North | Z=+7 | Coplanar with ConferenceRoom south (opaque east segment shared with alcove's N wall) | `ConferenceRoom.tsx` | ConferenceRoom's front door slot, X ∈ [+2.5, +4.5] |
| West | X=-10 | Glass | `TheBakery.tsx` (and coplanar corridor glass) | West door, 2 m open (header only) @ Z=+17.5 |
| East | X=+10 | Opaque, full 13 m | `TheBakery.tsx` | — |
| South | Z=+18 | Opaque with 3 glass window inserts and closed glass door | `TheBakery.tsx` | South door, 2 m closed glass slab @ X=-7.5; windows at X=-4.5, +2.5, +6.5 (each 4 m wide) |
| NE alcove west wall | X=+4.5, Z ∈ [+7, +15] | Glass | `TheBakery.tsx` | Upper door 1 m @ Z=+10; lower door 1 m @ Z=+12 (both open, header only) |
| NE alcove upper/lower divider | Z=+11, X ∈ [+4.5, +10] | Opaque | `TheBakery.tsx` | — |
| NE alcove south wall | Z=+15, X ∈ [+4.5, +10] | Opaque | `TheBakery.tsx` | — |

## Related

- Furniture: [the-bakery-furniture.md](./the-bakery-furniture.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheBakery.tsx`,
  `src/game/constants/gameConstants.ts::THE_BAKERY*`
- Adjacent spaces: `ConferenceRoom` (N, coplanar),
  `CentralCorridor` (W, west door connects)
