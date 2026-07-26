# The Garage — Floor plan

Walls, doors, glass, and coplanar-shared surfaces only. No furniture.
Source of truth: `src/game/constants/gameConstants.ts::THE_GARAGE` +
`src/game/scene/TheGarage.tsx`.

## Grid

52 columns × 13 rows. 1 cell = 1 m. `X = -10 + col`.

```
Z=-74        ####################################################
Z=-73        G..............#........#........#........#........#
Z=-72        G..............#........#........#........#........#
Z=-71        G..............#........#........#........#........#
Z=-70        G..............#........#........#........#........#
Z=-69        GGGGGGGGddGGGGG#........#GGGddGGG#GGGddGGG#........#
Z=-68        G..................................................x
Z=-67        G..................................................x
Z=-66        D.......................#GGGddGGG#GGGddGGG#........#
Z=-65        D.......................#........#........#........#
Z=-64        G.......................#........#........#........#
Z=-63        G.......................#........#........#........#
Z=-62        =====================###############################
```

### Column ↔ X coordinate

```
col:    0         15       24       33       42      51
X:    -10         +5      +14      +23      +32     +41
```

## Legend

See [../layouts/README.md](./README.md) for the full legend. Used
here:

```
.  open floor
#  opaque wall
G  glass wall
D  2 m entry door (open, on the corridor-facing west wall)
d  interior 2 m door (open)
x  interior door (closed, glass slab, blocking)
=  wall coplanar with another room's wall (owned there, not
   re-rendered by TheGarage.tsx)
```

## Regions

| Region | Cols | X range | Z range |
|---|---|---|---|
| NW office | 1..14 | [-9, +4] | [-73, -69] |
| Bay 1 (N strip) | 16..23 | [+6, +13] | [-73, -69] |
| Alcove A (N) | 25..32 | [+15, +22] | [-73, -69] |
| Alcove B (N) | 34..41 | [+24, +31] | [-73, -69] |
| Bay 4 (N strip) | 43..50 | [+33, +40] | [-73, -69] |
| Aisle (E-W) | 1..50 | [-9, +40] | [-68, -67] |
| SW foyer (holds corridor entry) | 1..23 | [-9, +13] | [-65, -63] |
| Alcove A (S) | 25..32 | [+15, +22] | [-65, -63] |
| Alcove B (S) | 34..41 | [+24, +31] | [-65, -63] |
| Bay 4 (S strip) | 43..50 | [+33, +40] | [-65, -63] |

## Wall summary

| Wall | Coord | Material | Openings |
|---|---|---|---|
| West perimeter | X=-10 | Glass (owned by `CentralCorridor.tsx`) | 2 m open door @ Z=-65.5 |
| East perimeter | X=+41 | Opaque | 2 m closed glass door @ Z=-67.5 |
| North perimeter | Z=-74 | Opaque | — |
| South perimeter (Garage slice) | Z=-62, X ∈ [+10, +41] | Opaque | — |
| South perimeter (Station slice) | Z=-62, X ∈ [-10, +10] | Opaque (owned by `TheStation.tsx`) | — |
| NW office E wall | X=+5, Z ∈ [-74, -69] | Opaque | — |
| NW office S wall | Z=-69, X ∈ [-10, +5] | Glass | 2 m door @ X=-1.5, opens N into office |
| Partitions | X=+14, +23, +32 | Opaque | interrupted by 3 m aisle |
| Alcove A/B N walls | Z=-69, X ∈ [+14, +32] | Glass | 2 m door centered per alcove |
| Alcove A/B S walls | Z=-66, X ∈ [+14, +32] | Glass | 2 m door centered per alcove |

## Related

- Furniture: [the-garage-furniture.md](./the-garage-furniture.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheGarage.tsx`,
  `src/game/constants/gameConstants.ts::THE_GARAGE`
