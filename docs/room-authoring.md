# Room Authoring — Grid-First Workflow

## Why this doc exists

Rooms in this project live in `src/game/scene/*.tsx` as R3F components
driven by constants in `src/game/constants/gameConstants.ts`. It's easy
to write coordinates in prose ("wall on the north side, door in the
middle") and end up with something the AI has to guess about. This
workflow eliminates the guesswork: **you sketch the room as a 1 m
top-down ASCII grid, mark every wall, door, and prop, and the AI reads
the grid directly**.

The grid is the source of truth. The code follows.

## The workflow

1. **Ask for a grid template** — request a floor plan of the area you
   want to modify (any existing room, a corridor, an open zone). The
   AI will produce a grid like the one in the example below, with
   coordinates already labeled.
2. **Edit the grid** — copy it into your reply and modify cells to
   place walls, doors, furniture, TVs, chairs, NPCs. Legend below.
3. **Send it back** — with a one-line description of intent ("this is
   a boardroom") and the AI wires up:
   - a new `THE_[NAME]` block in `gameConstants.ts`
   - a new `<The[Name]>` component (or additions to an existing one)
   - a zone in `Player.tsx` if the room warrants one
   - a mount in `OfficeScene.tsx`
4. **Iterate** — small edits ("push the door 2 m south", "make that
   wall glass") describe changes in the grid's own vocabulary and land
   as targeted constant edits.

## Grid conventions

### World axes

- **X** = east (+) / west (−). Columns of the grid.
- **Z** = south (+) / north (−). Rows of the grid.
- **Y** = up. Not represented on the top-down grid.
- The conference room is centered on the origin (X=0, Z=0). Rooms south
  of it have positive Z; rooms north have negative Z. Rooms east have
  positive X; west have negative X.
- 1 grid cell = 1 world meter.

### Grid frame

Every grid has X coordinates across the top and Z coordinates down the
left side. Cells inside the grid are one meter square. The player is
~2 m tall × 0.44 m radius (from `PLAYER_HEIGHT` / `PLAYER_RADIUS`), so a
1 m wide door is comfortably passable but tight; 1.4–2 m is the norm.

### Cell markers

| Marker | Meaning |
|---|---|
| `.` | Open, walkable floor |
| `▓` | Opaque wall (fills the whole 1 m cell as a full-height wall) |
| `G` | Glass wall (single continuous pane, no interior mullion) |
| `d` | Doorway (1.4 m opening, no blocker) — put it in a wall row/column |
| `D` | Wide doorway (2 m opening) — the "main entrance" convention |
| `W` | User shorthand for wall — treat as `▓` unless the context implies glass |
| Any capital letter (`A`, `B`, `C`, `X`, `Y`, …) | An interior region you're naming for reference; the AI will ask what it is if not obvious |
| `outside` | Cell is outside the room (used to mark cut-off corners like TheStation's NE) |

### Furniture / prop markers

| Marker | Component | Notes |
|---|---|---|
| `T` | `<Desk>` | Table/desk footprint (1 cell per m²; larger tables span multiple cells) |
| `h` | `<Chair>` | Chair. Append `< > ^ v` to indicate facing (see below) |
| `L` | `<Laptop>` | Laptop on desk. Screen auto-faces the sitter |
| `M` | `<Monitor>` | Desktop monitor on desk. Screen auto-faces the sitter |
| `p` | `<Paper>` | Paper on desk |
| `V` | `<Television>` (wall-mounted) | Append `< > ^ v` for screen direction, or infer from the adjacent wall |

### Chair / TV facing suffixes

Append a direction glyph to `h` (chair sitter) or `V` (TV screen):

```
h<   faces west   (-X)     V<   screen faces west
h>   faces east   (+X)     V>   screen faces east
h^   faces north  (-Z)     V^   screen faces north
hv   faces south  (+Z)     Vv   screen faces south
```

If a chair is next to a desk with a monitor/laptop, the screens
automatically face the sitter — no extra markup needed.

### NPCs

| Marker | Character |
|---|---|
| `Y` | Youngvz (the player) — only relevant when marking spawn context |
| `D` | Distasi | 
| Any new character | Add it to `src/game/characters/characters.ts` first; then use its `id` (kebab-case, first letter as the marker if unambiguous) |

## Anatomy of a good grid

Here's what a fully-annotated room looks like — this is the exact grid
that drove the current TheStation build:

```
                                   THE STATION — 1 m grid (X across, Z down)

      X:  -10  -9  -8  -7  -6  -5  -4  -3  -2  -1   0  +1  +2  +3  +4  +5  +6  +7  +8  +9 +10 +11 +12 +13 +14
          ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
Z=-62     │ ─── ─── ─── ─── ─── ─── ─── north wall (X ∈ [-10, +10]) ─── ─── ─── ─── ─── ─── │  outside outside outside outside
          ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
Z=-61     │ W │ A │ A │ A │ A │ A │ ▓ │ B │ B │ B │ B │ B │ ▓ │ C │ C │ C │ C │ C │ C │ C │   outside outside outside outside
Z=-60     │ W │ A │ A │ A │ A │ A │ ▓ │ B │ B │ B │ B │ B │ ▓ │ C │ C │ C │ C │ C │ C │ C │   outside outside outside outside
Z=-59     │ W │ A │ A │ A │ A │ A │ ▓ │ B │ B │ B │ B │ B │ ▓ │ C │ C │ C │ C │ C │ C │ C │   outside outside outside outside
Z=-58     │ W │ A │ A │ A │ A │ A │ ▓ │ B │ B │ B │ B │ B │ ▓ │ C │ C │ C │ C │ C │ C │ C │   outside outside outside outside
          ├─G─┼─G─┼─d─┼─G─┼─G─┼─G─┼─▓─┼─G─┼─d─┼─G─┼─G─┼─G─┼─▓─┼─▓─┼─▓─┼─▓─┼─d─┼─▓─┼─▓─┼─▓─┤
Z=-57     │ W │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ D │ D │ D │ D │ D │ E │
Z=-56     │ W │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ G │ D │ D │ D │ D │ E │
Z=-55     │ W │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ d │ D │ D │ D │ D │ E │  ← D door
Z=-54     │ W │ . │ T │ T │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ d │ D │ D │ D │ D │ E │
Z=-53     │ W │ h>│ T │ T │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ G │ D │ D │ D │ D │ E │
Z=-52     │ W │ . │ T │ T │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ . │ G │ D │ D │ D │ D │ E │
...

Legend:
  W   west wall (glass, both sides)
  D   corridor doorway on the west wall  (Z ∈ [-43, -41])
  E   east perimeter wall (opaque, spans Z ∈ [-57, -39] only)
  A/B/C   north-side alcove interiors     (letters name each region)
  D/E/F   east-side alcove interiors      (same convention)
  T   desk footprint (multi-cell)
  h>  chair facing east
  L   laptop
  M   monitor
  p   paper
  V   TV (wall-mounted)
  G   glass wall segment (single pane, no interior mullion)
  d   1.4 m alcove doorway
  ▓   opaque wall / partition
  .   open floor (walkable)
  outside   corner clipped off — not part of the room

Wall summary (optional but useful for large rooms):
  Column at X=-10  → glass west wall (with a 2 m open door at Z ∈ [-43, -41])
  Column at X=+9   → glass west face of east alcoves (with 1.4 m doors at Z=-54, -48, -42)
  Row    at Z=-62  → opaque north wall (X ∈ [-10, +10] only)
  ...

Coordinates for code:
  Room bounds : X ∈ [-10, +14], Z ∈ [-62, -39]
  Alcove A    : X ∈ [-10, -4], Z ∈ [-62, -57]
  ...
```

The three sections at the bottom — **Legend**, **Wall summary**, and
**Coordinates for code** — are what let the AI translate the grid into
`gameConstants.ts` entries without ambiguity.

## Requesting a grid

### To sketch a new room

> "Show me the space east of the central corridor between Z=−90 and
> Z=−70 as a 1 m grid. I want to add a new room there."

The AI responds with a labeled grid of that area with walls it can
detect from `gameConstants.ts` already marked, and open floor `.`
elsewhere.

### To modify an existing room

> "Show me TheStation as a 1 m grid."

The AI responds with the current state — walls, doors, alcoves,
existing furniture — that you can then edit.

### To place furniture only

> "Give me a grid of TheLab, I want to place some desks."

The AI responds with the room's shell + a furniture legend, expecting
you to place `T` / `h` / `L` / `M` / `p` cells in `.` floor.

## Sending it back

Copy the grid, edit cells, and send it with intent. Minimal example:

> Here's my edited grid. Call this **The Workshop**. Wall material for
> the room's own perimeter should be glass on the west (facing corridor)
> and opaque elsewhere. Alcove X is empty; alcove Y has a desk + chair
> facing west with a monitor + laptop + papers.
>
> ```
> [paste the grid]
> ```

The AI will confirm any ambiguity via `AskUserQuestion` (name, wall
material, room-specific interactions, quest hookup, etc.) before
writing code.

## What the AI will do in code

Given a grid and a name, the AI:

1. Adds one `THE_[NAME]` block to `gameConstants.ts` with:
   - `westX`, `eastX`, `northZ`, `southZ` (perimeter bounds)
   - Any doorway `centerZ` (or `centerX`) + `width`
   - Any sub-region config (alcoves, sub-rooms) as separate constants
     following the `THE_[NAME]_[FEATURE]` naming convention
2. Creates `src/game/scene/The[Name].tsx` (or edits an existing scene
   file if the grid modifies one), rendering:
   - Floor slab(s) — one per rect if the room is L-shaped
   - Perimeter walls, respecting glass/opaque markers
   - Doorway lintels for every `d` / `D`
   - `<Door>` slabs where appropriate (open glass doors match project
     convention for interior openings)
   - Furniture and props at the marked cells, brown palette by default
3. Mounts `<The[Name]>` inside `<Physics>` in
   `src/game/scene/OfficeScene.tsx`.
4. Registers a `'the-[name]'` zone in `Player.tsx`'s `ZoneManager` if
   the room warrants one (all rooms do so far).
5. Updates `docs/assets-and-content.md` and `CLAUDE.md` with the new
   room's coordinates and any new components.

## Wall-material defaults

The project's glass storefront convention:

- **Any wall shared with a walkable space** (corridor, another room)
  renders as glass, both sides coplanar, `divisions={1}` so no interior
  mullions. This is TheLab's west wall, TheStation's west wall, alcove
  fronts, etc.
- **Any wall facing the exterior** (or facing a room you specifically
  want private, like Alcove A in TheStation) stays opaque.
- Grid marker `W` on a wall column defaults to glass if the neighboring
  cell is a walkable room; the AI will ask if ambiguous.

## Naming conventions (recap)

- **Room component / file**: `The[Name].tsx` for themed rooms
  (`TheBakery`, `TheLab`, `TheStation`) or `[Direction]Corridor.tsx`
  for walking spaces (`CentralCorridor`, `EastCorridor`).
- **Constants**: `THE_[NAME]` and `THE_[NAME]_[FEATURE]`
  (`THE_LAB.westX`, `THE_STATION_ALCOVES.bays`, etc.).
- **Zone id**: `'the-[name]'` (kebab-case, no prefix).
- **Sub-rooms** rendered inline in a parent room's component get their
  own constant block (`THE_BOARDROOM` lives inside `<TheStation>`) and
  their own zone id, registered before the parent zone so the more
  specific rect wins.

## Tips for good grids

- **Leave a 1 m clearance in front of each door** — the player is 0.88 m
  wide, so doors flush against walls perpendicular to them are hard to
  approach.
- **Alcoves are typically 5–6 m along their long axis, 3–5 m deep** —
  enough room for a single-sitter workstation with clearance.
- **Big meeting tables are 3 m × 5 m for 4 sitters**, 4 m × 5 m for 6.
- **Wall-mounted TVs are 4 m × 1.6 m** by default; tell the AI if you
  want a different size.
- **You don't need to place every cell perfectly** — the AI will pick
  reasonable positions and rotations for furniture inside your marked
  regions. Grid cells are guidance, not pixel-perfect placement.
- **When in doubt, over-annotate**. The wall-summary paragraph at the
  bottom of a grid is worth its weight in bug reports avoided.
