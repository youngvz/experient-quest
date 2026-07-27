# TheStation — Floor plan

L-shaped room north of TheLab. Main rect X ∈ [-10, +10], Z ∈ [-62, -39];
east strip X ∈ [+10, +14], Z ∈ [-57, -39]. Six alcoves (three on the
north wall, three on the east wall) plus an enclosed **Boardroom**
sub-room in the SE quadrant. Corridor entry on the west wall at Z=-42.

Source of truth:
`src/game/constants/gameConstants.ts::THE_STATION` +
`THE_STATION_ALCOVES` + `THE_STATION_EAST_ALCOVES` +
`THE_STATION_F_EXPANSION` + `THE_BOARDROOM`,
`src/game/scene/TheStation.tsx`.

## Grid

24 rows × 25 cols. 1 cell = 1 m. Because the room is L-shaped, cells
in the NE cutout (X ∈ [+10, +14], Z ∈ [-62, -57]) are marked `-`
(not part of the room).

```
              -10       -5        0        +5       +10   +14
               v         v        v         v        v     v
        col:   0         5         10        15        20    24
Z=-62        #####################----    ← N wall (opaque, only main rect)
Z=-61        #.....#.....#.......#----
Z=-60        #..A..#..B..#..C....#----    ← Alcoves A/B/C north-side (Z ∈ [-62, -57])
Z=-59        #.....#.....#.......#----
Z=-58        #.....#.....#.......#----
Z=-57        GGdGGG#GGdGGG#####d######    ← A/B glass S walls (with doors); C opaque S wall
Z=-56        #....................#..#
Z=-55        #....................#D.#    ← Alcove D interior (glass west wall, door center Z=-54)
Z=-54        #....................#D.#
Z=-53        #.T..................#D.#    ← W workstation @ (-7.5, -53)
Z=-52        #.T..................GGdG   ← D/E divider
Z=-51        #....................#E.#    ← Alcove E (glass west, door Z=-48)
Z=-50        #....................#E.#
Z=-49        #....................#E.#
Z=-48        #.T..................GGdG   ← E/F divider @ Z=-45; W workstation @ (-7.5, -48)
Z=-47        #.T..................#F.#    ← Alcove F interior (expanded, west X=+5)
Z=-46        #....................#F.#
Z=-45        #....######d##GG#####F.#    ← Alcove F north wall: opaque + 2m door @ X=+6.5 + 2m glass @ X=+8..9 + opaque
Z=-44        #....#B*..*#F.........#F.#    ← Boardroom X ∈ [-4, +5], Z ∈ [-48, -39]
Z=-43        #....G*TT*#F..S........#F.#    ← Boardroom W wall glass; door Z=-42
Z=-42        #....d*TTV#F..........#F.#    ← Boardroom W door 2m open; TV on N wall of Boardroom (owned there)
Z=-41        #....G*TT*#F..........#F.#
Z=-40        #....#*..*#F..........#F.#
Z=-39        ===========================    ← S wall shared w/ NorthEastCorridor N + NorthEastPocket N (owned here)
```

The grid renders sub-rooms compressed. Precise sub-room coords:
- **Alcove A**: X ∈ [-10, -4], Z ∈ [-62, -57], door 1.4 m @ X=-7. **South wall glass.**
- **Alcove B**: X ∈ [-4, +2], Z ∈ [-62, -57], door 1.4 m @ X=-1. **South wall glass.**
- **Alcove C**: X ∈ [+2, +10], Z ∈ [-62, -57], door 1.4 m @ X=+6. **South wall opaque.**
- **Alcove D**: X ∈ [+9, +14], Z ∈ [-57, -51], door 1.4 m @ Z=-54. Glass west wall.
- **Alcove E**: X ∈ [+9, +14], Z ∈ [-51, -45], door 1.4 m @ Z=-48. Glass west wall.
- **Alcove F (expanded)**: X ∈ [+5, +14], Z ∈ [-45, -39]. West wall shared with Boardroom east wall (opaque). North wall: X ∈ [+5, +5.5] opaque, [+5.5, +7.5] doorway 2 m, [+7.5, +9] glass, [+9, +14] opaque (E/F divider). South wall = TheStation south perimeter (Z=-39).
- **The Boardroom** (sub-room): X ∈ [-4, +5], Z ∈ [-48, -39]. West wall glass with 2 m open door @ Z=-42. East wall opaque. North wall opaque. South wall = TheStation south perimeter.

## Column ↔ X coordinate

```
col:    0         5         10        15        20    24
X:    -10        -5         0        +5       +10   +14
```

## Legend

Symbols from [./README.md](./README.md). Additions here:

```
A, B, C  north-alcove interior labels
D, E, F  east-alcove interior labels
*        Boardroom perimeter marker (visual grouping in the ASCII;
         actual wall type is described in the wall summary)
-        outside the L (NE corner cutout)
=        wall coplanar with another room's wall (owned there or here)
```

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| North (main rect) | Z=-62, X ∈ [-10, +10] | Opaque | `TheStation.tsx` | — |
| South | Z=-39, X ∈ [-10, +14] | Opaque | `TheStation.tsx` — also coplanar with NorthEastCorridor's N + NorthEastPocket's N | — |
| West (main) | X=-10, Z ∈ [-62, -57] | Opaque (behind Alcove A) | `TheStation.tsx` | — |
| West (glass storefront) | X=-10, Z ∈ [-57, -39] | Glass storefront | `CentralCorridor.tsx` (coplanar) + own splits at TheStation.tsx | Corridor entry, 2 m open @ Z=-42 |
| East (east strip) | X=+14, Z ∈ [-57, -39] | Opaque | `TheStation.tsx` | Coplanar with `TheArchive.tsx` west wall at Z ∈ [-45, -39] |
| NE corner step (horizontal) | Z=-57, X ∈ [+10, +14] | Opaque | `TheStation.tsx` (drawn as Alcove D's north wall) | — |
| NE corner step (vertical) | X=+10, Z ∈ [-62, -57] | Opaque | `TheStation.tsx` (drawn as Alcove C's east partition) | — |
| Alcove A south | Z=-57, X ∈ [-10, -4] | Glass (divisions=1) | `TheStation.tsx` | Door 1.4 m @ X=-7 |
| Alcove B south | Z=-57, X ∈ [-4, +2] | Glass (divisions=1) | `TheStation.tsx` | Door 1.4 m @ X=-1 |
| Alcove C south | Z=-57, X ∈ [+2, +10] | Opaque | `TheStation.tsx` | Door 1.4 m @ X=+6 |
| Alcove D west | X=+9, Z ∈ [-57, -51] | Glass (divisions=1) | `TheStation.tsx` | Door 1.4 m @ Z=-54 |
| Alcove E west | X=+9, Z ∈ [-51, -45] | Glass (divisions=1) | `TheStation.tsx` | Door 1.4 m @ Z=-48 |
| Alcove F west (interior partition) | X=+5, Z ∈ [-45, -39] | Opaque (= Boardroom east wall) | Rendered by Boardroom block | — |
| Alcove F north | Z=-45, X ∈ [+5, +14] | Split (opaque + 2 m door + glass + opaque divider) | `TheStation.tsx` | Door 2 m @ X=+6.5 |
| Boardroom west | X=-4, Z ∈ [-48, -39] | Glass (divisions=1) | `TheStation.tsx` (Boardroom block) | Door 2 m open @ Z=-42 |
| Boardroom north | Z=-48, X ∈ [-4, +5] | Opaque | `TheStation.tsx` (Boardroom block) | — |
| Boardroom east | X=+5, Z ∈ [-48, -39] | Opaque | `TheStation.tsx` (Boardroom block) — same plane as Alcove F west | — |

## Related

- Furniture: [the-station-furniture.md](./the-station-furniture.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheStation.tsx`,
  `src/game/constants/gameConstants.ts::THE_STATION*` +
  `THE_BOARDROOM`
- Adjacent spaces: `CentralCorridor` (W, coplanar glass),
  `TheArchive` (E, coplanar wall at Z ∈ [-45, -39]),
  `NorthEastCorridor` + `NorthEastPocket` (S, coplanar), TheGarage (N,
  coplanar south wall X ∈ [-10, +10])
