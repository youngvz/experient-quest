# TheLab — Floor plan

L-shaped room east of the central corridor. West rect
X ∈ [-10, -4], Z ∈ [-32, -16] (SW corner bitten out by
CorridorPocket + EastCorridor). East rect X ∈ [-4, +10], Z ∈ [-32, -10].
Three interior east-side alcoves (A/B/C) carved out for solo offices;
the corridor entry is on the west wall at Z=-24.

Source of truth:
`src/game/constants/gameConstants.ts::THE_LAB` +
`THE_LAB_ALCOVES` + `THE_LAB_CABINETS`,
`src/game/scene/TheLab.tsx`.

## Grid

23 rows × 21 cols. 1 cell = 1 m.

```
              -10       -5      -4       0        +5       +10
               v         v      v        v         v        v
        col:   0         5      6         10        15        20
Z=-32        #####################    ← N wall (opaque, 20 m)
Z=-31        G....................#
Z=-30        G....................#
Z=-29        G....................#
Z=-28        G....................#
Z=-27        G....................#
Z=-26        G....................#
Z=-25        G....................#
Z=-24        D....................#    ← corridor entry @ Z=-24 (2 m open glass door, X=-10)
Z=-23        D..........#####d####    ← alcove A doorway @ Z=-23 X=+5 (1.4 m open, opaque wall)
Z=-22        G..........#........#
Z=-21        G..........#........#
Z=-20        G..........##########    ← alcove A/B divider
Z=-19        G..........#........#
Z=-18        G..........#####d####    ← alcove B doorway @ Z=-17.5 (1.4 m open)
Z=-17        G..........#........#
Z=-16        LLLLLLL#####........#    ← pocket north wall (Z=-16, owned by CorridorPocket) west of X=-4
Z=-15        .......#####........#
Z=-14        .......#####d########    ← alcove C doorway @ Z=-12.5 (1.4 m open)
Z=-13        .......#####........#
Z=-12        .......#############
Z=-11        .......=====.........
Z=-10        .......=============    ← S wall of east rect = EastCorridor N wall (owned there)
```

Notes:
- The L-shape's south boundary is composed from three externally-owned
  walls: pocket north (Z=-16, X ∈ [-10, -4], `CorridorPocket.tsx`),
  pocket east (X=-4, Z ∈ [-16, -10], `CorridorPocket.tsx`), and east
  corridor north (Z=-10, X ∈ [-4, +10], `EastCorridor.tsx`).
- Alcoves A/B/C occupy X ∈ [+5, +10]. All alcove walls are opaque.
- The corridor entry on the west (X=-10) is owned by
  `CentralCorridor.tsx`; TheLab does not render its own west wall.

## Column ↔ X coordinate

```
col:    0         5      6         10        15        20
X:    -10        -5     -4        +1        +6       +10
```

## Legend

See [./README.md](./README.md) for the universal legend. Symbols here:

```
.  open floor
#  opaque wall
G  glass wall (west side owned by corridor)
D  2 m open glass entry door (owned by corridor)
d  1.4 m open interior door (header only)
L  wall coplanar with CorridorPocket north (owned there)
=  wall coplanar with EastCorridor north (owned there)
```

## Regions

| Region | X range | Z range |
|---|---|---|
| West rect (main floor) | [-10, -4] | [-32, -16] |
| East rect (main floor + alcove strip) | [-4, +10] | [-32, -10] |
| Alcove A | [+5, +10] | [-32, -20], door 1.4 m @ Z=-23 |
| Alcove B | [+5, +10] | [-20, -15], door 1.4 m @ Z=-17.5 |
| Alcove C | [+5, +10] | [-15, -10], door 1.4 m @ Z=-12.5 |

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North | Z=-32 | Opaque, full 20 m | `TheLab.tsx` | — |
| East | X=+10 | Opaque, full 22 m | `TheLab.tsx` | — |
| West | X=-10, Z ∈ [-32, -16] | Glass storefront | `CentralCorridor.tsx` | Corridor entry, 2 m open @ Z=-24 |
| South (west rect) | Z=-16, X ∈ [-10, -4] | Opaque | `CorridorPocket.tsx` (coplanar) | — |
| South (step) | X=-4, Z ∈ [-16, -10] | Opaque | `CorridorPocket.tsx` (coplanar) | — |
| South (east rect) | Z=-10, X ∈ [-4, +10] | Opaque | `EastCorridor.tsx` (coplanar) | TheLab south door, 1.6 m open header-only @ X=+3 |
| Alcove A west wall | X=+5, Z ∈ [-32, -20] | Opaque | `TheLab.tsx` | Door 1.4 m open @ Z=-23 |
| Alcove B west wall | X=+5, Z ∈ [-20, -15] | Opaque | `TheLab.tsx` | Door 1.4 m open @ Z=-17.5 |
| Alcove C west wall | X=+5, Z ∈ [-15, -10] | Opaque | `TheLab.tsx` | Door 1.4 m open @ Z=-12.5 |
| Alcove dividers | Z=-20 and Z=-15, X ∈ [+5, +10] | Opaque | `TheLab.tsx` | — |

## Related

- Furniture: [the-lab-furniture.md](./the-lab-furniture.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheLab.tsx`,
  `src/game/constants/gameConstants.ts::THE_LAB*`
- Adjacent spaces: `CentralCorridor` (W), `CorridorPocket` (SW),
  `EastCorridor` (S), `NorthEastPocket` (N wall coplanar)
