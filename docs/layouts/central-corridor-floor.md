# CentralCorridor — Floor plan

Long N-S corridor west of the office. 3 m wide × 94 m tall, from the
sealed dead-end north wall at Z=-74 south to the spawn-side entry at
Z=+20. Every east-side branch room (Bakery, Lab, Station, Garage) and
every west-side storefront (Commons, Library, Atrium) opens off it.

Source of truth:
`src/game/constants/gameConstants.ts::CENTRAL_CORRIDOR`,
`src/game/scene/CentralCorridor.tsx`.

## Grid

95 rows × 4 cols. 1 cell = 1 m. Col 0 = X=-13 (west wall), col 3 = X=-10
(east wall). Rows go from Z=-74 (north) to Z=+20 (south).

Because the corridor is so long, the grid is split into three vertical
segments. Read top-to-bottom.

### Segment 1 — north end to Station (Z=-74 to Z=-40)

```
       col:  0 1 2 3
       X:  -13     -10
              ↓     ↓
Z=-74        ####          ← north wall (sealed dead-end)
Z=-73        #..G
Z=-72        #..G
Z=-71        #..G
Z=-70        #..G
Z=-69        #..G          (Garage west storefront)
Z=-68        #..G
Z=-67        #..G
Z=-66        #..D          ← Garage entry, 2m open (center Z=-65.5)
Z=-65        #..D
Z=-64        #..G
Z=-63        #..G
Z=-62        #..G
Z=-61        #..#          (Station Alcove A behind opaque stretch)
Z=-60        #..#
Z=-59        #..#
Z=-58        #..#
Z=-57        #..#
Z=-56        #..G          (Station west storefront begins)
Z=-55        G..G          ← Atrium west storefront begins
Z=-54        G..G
Z=-53        G..G
Z=-52        G..G
Z=-51        G..G
Z=-50        G..G
Z=-49        G..G
Z=-48        G..G
Z=-47        G..G
Z=-46        x..G          ← Atrium door, closed glass 2m (center Z=-45)
Z=-45        x..G
Z=-44        G..G
Z=-43        G..D          ← Station entry, 2m open (center Z=-42)
Z=-42        G..D
Z=-41        G..G
Z=-40        G..G          (Station south storefront continues)
```

### Segment 2 — NE pocket to east/pocket carve-out (Z=-39 to Z=-7)

```
Z=-39        G..G          ← (below: NE pocket mouth on east wall)
Z=-38        G...
Z=-37        G...
Z=-36        G...
Z=-35        G...
Z=-34        G...
Z=-33        G...
Z=-32        G..G          ← Lab west storefront begins
Z=-31        G..G
Z=-30        G..G
Z=-29        G..G
Z=-28        #..G          ← (west opaque stretch begins)
Z=-27        #..G
Z=-26        #..G
Z=-25        #..D          ← Lab entry, 2m open (center Z=-24)
Z=-24        #..D
Z=-23        #..G
Z=-22        #..G          (Library storefront begins on west wall)
Z=-21        G..G
Z=-20        G..G
Z=-19        G..G
Z=-18        G..G
Z=-17        G..G          ← (below: CorridorPocket + EastCorridor east carve-out)
Z=-16        G...
Z=-15        G...
Z=-14        G...
Z=-13        G...
Z=-12        G...
Z=-11        G...
Z=-10        G...
Z=-9         D...          ← Library door, 2m open outward (center Z=-8)
Z=-8         D...
```

### Segment 3 — Conference span to south entry (Z=-7 to Z=+20)

```
Z=-7         G..=          ← (east wall = Conference west glass, owned there)
Z=-6         G..=
Z=-5         G..=
Z=-4         #..=          (west opaque stretch begins)
Z=-3         #..=
Z=-2         #..=
Z=-1         #..=
Z=0          #..=
Z=+1         #..=
Z=+2         G..=          ← Commons storefront begins on west wall
Z=+3         G..=
Z=+4         G..=
Z=+5         G..=
Z=+6         G..=
Z=+7         G..G          ← (Conference east span ends; Bakery west storefront begins)
Z=+8         G..G
Z=+9         G..G
Z=+10        x..G          ← Commons door, closed glass 2m (center Z=+10)
Z=+11        x..G
Z=+12        G..G
Z=+13        G..G
Z=+14        G..G
Z=+15        G..G
Z=+16        G..G
Z=+17        G..D          ← Bakery west door, 2m header-only opening (center Z=+17.5)
Z=+18        G..D
Z=+19        #..G          ← (west opaque strip at south end)
Z=+20        #D##          ← south wall + player-entry door (2m at X=-11.5)
```

## Legend

See [./README.md](./README.md) for the universal legend. Symbols used
here:

```
.  open floor
#  opaque wall
G  glass wall
D  2 m open door (glass slab or header-only passage)
x  2 m closed glass door
=  wall coplanar with another room's wall (owned there, not
   re-rendered by CentralCorridor.tsx)
```

## Wall summary

### East wall (X=-10)

| Z-span | Material | Owner | Openings |
|---|---|---|---|
| -74 to -62 | Glass storefront | Owned by `CentralCorridor.tsx`, coplanar with TheGarage west wall | Garage entry, 2 m open @ Z=-65.5 |
| -62 to -57 | Opaque | `CentralCorridor.tsx` — behind TheStation's Alcove A | — |
| -57 to -39 | Glass storefront | Owned by corridor, coplanar with TheStation west wall | Station entry, 2 m open @ Z=-42 |
| -39 to -32 | Open (full-height carve-out) | — | NE pocket mouth |
| -32 to -16 | Glass storefront | Owned by corridor, coplanar with TheLab west wall | Lab entry, 2 m open @ Z=-24 |
| -16 to -7 | Open (full-height carve-out) | — | CorridorPocket + EastCorridor combined mouth |
| -7 to +7 | Glass (not rendered here) | `ConferenceRoom.tsx` west wall | — |
| +7 to +20 | Glass storefront | Owned by corridor, coplanar with TheBakery west wall | Bakery entry, 2 m header-only @ Z=+17.5 (slab owned by TheBakery, blocking) |

### West wall (X=-13)

| Z-span | Material | Openings |
|---|---|---|
| -74 to -55 | Opaque | — |
| -55 to -28 | Glass storefront (TheAtrium) | Atrium door, 2 m closed glass @ Z=-45 |
| -28 to -22 | Opaque | — |
| -22 to -4 | Glass storefront (TheLibrary) | Library door, 2 m open outward @ Z=-8 |
| -4 to +2 | Opaque | — |
| +2 to +18 | Glass storefront (TheCommons) | Commons door, 2 m closed glass @ Z=+10 |
| +18 to +20 | Opaque | — |

### North / south perimeter

| Wall | Coord | Material | Openings |
|---|---|---|---|
| North wall | Z=-74 | Opaque | — (sealed dead-end) |
| South wall | Z=+20 | Opaque, split around player entry | Player entry, 2 m open outward-swinging (center X=-11.5) |

## Related

- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/CentralCorridor.tsx`,
  `src/game/constants/gameConstants.ts::CENTRAL_CORRIDOR`
- Rooms opening east (N→S): TheGarage, TheStation, TheLab, TheBakery
- Rooms opening west (N→S): TheAtrium, TheLibrary, TheCommons
- Adjacent corridor spaces: CorridorPocket (east, Z ∈ [-16, -10]),
  NorthEastPocket (east, Z ∈ [-39, -32])
