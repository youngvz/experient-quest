# The Garage — Furniture map

Furniture and props overlaid on the floor plan. Source of truth:
`src/game/scene/TheGarage.tsx`.

Cell positions are **snapped to the 1 m grid**; real world coordinates
in the code may sit at fractional meters (e.g. desks centered at
X=+18.5). Use this doc for intent, not for pixel-exact math — the code
is the truth.

## Grid

```
Z=-74        ######P#######################P########P###########
Z=-73        G..h..h..h..h..#........#...h...c#...h...c#........#
Z=-72        G..TTTTTTTTTT..#........#...L...c#...L...c#........#
Z=-71        G..TTTTTTTTTTV.#........#...M...c#...M...c#........#
Z=-70        G..h..h..h..h..#........#........#........#........#
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
.  open floor          T  desk / table         V  wall TV (facing west here)
#  opaque wall         h  chair                P  painting (on N wall)
G  glass wall          L  laptop               c  filing cabinet
D  2m entry door       M  monitor              d  interior door (open)
x  interior door (closed)
=  wall coplanar with another room's wall
```

Mugs and papers exist on the alcove desks in code but aren't drawn on
the grid — they'd crowd the same cells as the laptop/monitor. If you
want them shown, we can annotate them with `m`/`p` at the cost of
one prop per cell.

## What's placed

### NW office (cols 1..14, Z ∈ [-73, -70])

Formal conference room, mirrors the main conference room. Reads through
the glass south wall to anyone in the aisle.

| Item | Position | Notes |
|---|---|---|
| Conference table | center (-2.5, -71.5), size 8 × 2.6 | Brown top, dark legs |
| 4 chairs (N side) | Z=-73, X = -5.5, -3.5, -1.5, +0.5 | Face south (+Z, toward table) |
| 4 chairs (S side) | Z=-70, same X | Face north (-Z, toward table) |
| Wall TV | E wall (X=+5), centerY=1.5, 4 × 1.8, faces west | Cell shown as `V` at col 15 row Z=-71 |

### Alcove A — north strip (cols 25..32, Z ∈ [-73, -70])

Solo workstation for a west-side employee. Sitter faces south toward
the aisle-facing door.

| Item | Position | Notes |
|---|---|---|
| Desk | center (+18.5, -71.6), size 5 × 1.6 | Brown top, dark legs |
| Chair | (+18.5, -73), faces south | 1 m off the north wall |
| Laptop | on desk N edge | Screen faces sitter |
| Monitor | on desk S edge | Screen faces sitter |
| Mug | on desk (X=+19.4, Z=-71.75), white | |
| 2 papers | scattered around laptop | |
| Painting | N wall, centerX=+18.5, centerY=1.7, 1.8 × 1.4 (landscape) | Blue-slate `#4a6d8c` |
| 4 filing cabinets | E partition wall (X≈+22.5), Z ∈ [-72.5, -70.5] | Drawers face west |

### Alcove B — north strip (cols 34..41, Z ∈ [-73, -70])

Mirror of Alcove A with alternate details.

| Item | Position | Notes |
|---|---|---|
| Desk | center (+27.5, -71.6), size 5 × 1.6 | |
| Chair | (+27.5, -73), faces south | |
| Laptop, Monitor | same layout as A | |
| Mug | on desk (X=+28.4, Z=-71.75), black | |
| 2 papers | scattered | |
| Painting | N wall, centerX=+27.5, 1.8 × 1.4 (landscape) | Rust `#9a5b3d` |
| 4 filing cabinets | E partition wall (X≈+31.5), Z ∈ [-72.5, -70.5] | Drawers face west |

### Aisle (Z ∈ [-68, -67])

Fully open E-W circulation. No furniture.

### SW foyer (cols 1..23, Z ∈ [-65, -63])

Empty. Corridor entry door lands here at col 0.

### Alcoves A/B — south strip (cols 25..32, 34..41, Z ∈ [-65, -63])

Empty. Glass north walls with 2 m centered doors face the aisle.

### Bay 1 (N strip) and Bay 4 (N and S strips)

Open onto the aisle, empty.

## Related

- Floor plan: [the-garage-floor.md](./the-garage-floor.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheGarage.tsx`
