---
id: thegarage-floor-plan-refinement
status: backlog
created: 2026-07-25
owner: unassigned
---

# TheGarage floor plan refinement

## Why

`TheGarage` (main floor + north conference sub-room) was built with a
first-pass layout: two lounge tables on the main floor, a 7-seat
meeting table in the conference sub-room, and a whiteboard on the
east wall. It's structurally correct — walls, doors, coplanar-glass
with the corridor, shared south wall with `TheStation` — but the
interior is otherwise empty. Before the next content pass, we want an
edited floor-plan grid to drive alcoves, furniture placement, and any
prop pinning inside the room. This item captures the current baseline
as a 1-character-per-cell ASCII grid that a future turn can edit and
port back into `gameConstants.ts` + `src/game/scene/TheGarage.tsx`.

## Scope

- Iterate on the grid in this file to lock in the final floor plan:
  alcoves, workstations, NPC positions, TV / whiteboard placement,
  any additional doorways.
- Port the edited grid into `THE_GARAGE` and related constant blocks
  in `src/game/constants/gameConstants.ts`.
- Update `src/game/scene/TheGarage.tsx` to match: walls, floors,
  furniture, wall-mounted props.
- If new alcoves or sub-regions land, add them as
  `THE_GARAGE_ALCOVES` / `THE_GARAGE_WORKSTATIONS` etc. following the
  `THE_STATION_*` / `THE_LAB_*` naming convention.
- Update `CLAUDE.md`'s TheGarage layout paragraph if the footprint,
  wall material, or doorways change.

## Non-goals

- No new NPCs beyond what the grid explicitly places. NPC wiring
  (Employee GLBs, interaction zones, presentation stops) is a
  separate item.
- No quest hookup / `PresentationStop` schema entries — content
  authoring happens after the floor plan is locked.
- No physics tuning; Garage floor is a plain fixed slab like every
  other room.

## Acceptance criteria

- Grid in this file reflects the target floor plan (walls, doors,
  furniture) at 1 character per cell.
- `gameConstants.ts` and `TheGarage.tsx` match the grid; `npm run
  build`, `npm run lint`, `npm run test` pass.
- No regressions in the coplanar-glass storefront along the
  corridor east wall (Z ∈ [-100, -62]).
- `TheStation` still owns the shared south wall at Z=-62,
  X ∈ [-10, +10]; TheGarage still owns only the X ∈ [+10, +14]
  slice on that plane.

## Baseline floor plan

Current state, one character per cell (1 m per cell). Header shows
X coordinate at every 5-column tick; rows are labeled by Z.

```
              -10       -5        0       +5       +10   +14
               v         v        v         v        v     v
        col:   0         10        20
               |         |         |
Z=-100         ############V############        N wall + TV @ X=+2
Z=-99          G.......................#
Z=-98          G.......................#
Z=-97          G.......................#
Z=-96          G.......................#
Z=-95          D........h..h..h........#        conf S-side chairs
Z=-94          D........TTTTTT.h.......#        conf 6m table + E head chair
Z=-93          G........h..h..h........#        conf N-side chairs
Z=-92          G.......................#
Z=-91          G.......................#
Z=-90          G.......................#
Z=-89          G.......................#
Z=-88          ############d############        shared wall + door @ X=+2
Z=-87          G.......................#
Z=-86          G.......................#
Z=-85          G.......................#
Z=-84          G..................h....#        Table 2 N chair (X=+8)
Z=-83          G.......................#
Z=-82          G................h.T.h..#        Table 2 (X=+8) + W/E chairs
Z=-81          G.......................#
Z=-80          G..................h....#        Table 2 S chair
Z=-79          G.......................#
Z=-78          D.......................#        main entry
Z=-77          D.......................B        whiteboard on E wall
Z=-76          G.......................#
Z=-75          G.......................#
Z=-74          G......h................#        Table 1 N chair (X=-4)
Z=-73          G.......................#
Z=-72          G...h.T.h...............#        Table 1 (X=-4) + W/E chairs
Z=-71          G.......................#
Z=-70          G......h................#        Table 1 S chair
Z=-69          G.......................#
Z=-68          G.......................#
Z=-67          G.......................#
Z=-66          G.......................#
Z=-65          G.......................#
Z=-64          G.......................#
Z=-63          G.......................#
Z=-62          ====================#####        S wall: Station owns first 20, Garage last 5
```

### Legend

| Char | Meaning |
|---|---|
| `.` | Open floor |
| `#` | Opaque wall |
| `G` | Glass wall |
| `D` | 2 m glass entry doorway (open) |
| `d` | Interior doorway (open) |
| `T` | Table / desk |
| `h` | Chair |
| `V` | Wall-mounted TV |
| `B` | Wall-mounted whiteboard |
| `=` | Wall coplanar with an adjacent room's wall (owned by that room, not re-rendered here) |

### Column ↔ X mapping

```
col:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
X:  -10 -9 -8 -7 -6 -5 -4 -3 -2 -1  0 +1 +2 +3 +4 +5 +6 +7 +8 +9 +10 +11 +12 +13 +14
```

## Wall summary

| Wall | Coord | Material | Owner | Openings |
|---|---|---|---|---|
| **West wall** | `X=-10`, `Z ∈ [-100, -62]` | Glass storefront (coplanar w/ corridor east wall) | `CentralCorridor.tsx` | Main door `Z=-77` (2 m), Conf door `Z=-94` (2 m) |
| **East wall** | `X=+14`, `Z ∈ [-100, -62]` | Opaque | `TheGarage.tsx` | Whiteboard mounted @ `Z=-77` facing west |
| **North wall** (conference) | `Z=-100`, `X ∈ [-10, +14]` | Opaque | `TheGarage.tsx` | TV mounted @ `X=+2` facing south |
| **Shared wall** (main ↔ conf) | `Z=-88`, `X ∈ [-10, +14]` | Opaque | `TheGarage.tsx` | 2 m doorway @ `X=+2` |
| **South wall — slice A** | `Z=-62`, `X ∈ [-10, +10]` | Opaque (= TheStation N wall) | `TheStation.tsx` | none |
| **South wall — slice B** | `Z=-62`, `X ∈ [+10, +14]` | Opaque | `TheGarage.tsx` | none |

## Coordinates for code (current)

```
THE_GARAGE
  Main floor        : X ∈ [-10, +14],  Z ∈ [-88, -62]     (24 × 26 m)
  Corridor door     : center Z=-77, width 2 m             (on west wall)
  Table 1 (lounge)  : center [-4, -72], 1.8 × 1.8, 4 chairs
  Table 2 (lounge)  : center [+8, -82], 1.8 × 1.8, 4 chairs
  Whiteboard        : east wall X=+14, centerZ=-77, facing west

THE_GARAGE.conference
  Sub-room          : X ∈ [-10, +14],  Z ∈ [-100, -88]    (24 × 12 m)
  South door        : center X=+2, width 2 m              (into main floor)
  West door         : center Z=-94, width 2 m             (onto corridor)
  Meeting table     : center [+2, -94], 6 × 2.4, 7 chairs
                        - 3 south-side chairs (facing north): X=-1, +2, +5 @ Z=-92.9
                        - 3 north-side chairs (facing south): X=-1, +2, +5 @ Z=-95.1
                        - 1 east head chair (facing west): [+6.5, -94]
  Wall TV           : north wall Z=-100, centerX=+2, facing south (3.2 × 1.4 m)
```

## How to iterate

- **Move a wall**: change the coord in the `THE_GARAGE` block
  (e.g. push `eastX` from `+14` to `+16`).
- **Add an alcove**: mark cells with a region letter (`A`, `B`),
  draw partitions with `#`, add `d` in the wall row/column where
  the doorway lives. Wire a `THE_GARAGE_ALCOVES` block modeled on
  `THE_STATION_ALCOVES`.
- **Pin an asset**: drop `T`, `h`, `L`, `M`, `p`, `V`, `B` into the
  cell where you want it.
- **Change wall material**: swap `G` ↔ `#` on the boundary marks.
- **Add a doorway**: put `D` (main) or `d` (interior) at the wall
  row/column.

## Rough estimate

~1 focused pass once the grid is edited: constants block + scene
component edits, plus doc updates in `CLAUDE.md`. No dependency
churn.

## Related

- `docs/room-authoring.md` — grid-first workflow this item follows.
- `src/game/scene/TheGarage.tsx` — current implementation.
- `src/game/constants/gameConstants.ts::THE_GARAGE` — current
  constants block.
- Prior turns 2026-07-25: introduced TheGarage, coplanar glass with
  the corridor east wall, shared south wall with TheStation.
