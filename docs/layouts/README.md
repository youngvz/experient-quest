# Room Layouts

Frozen ASCII layouts for every authored room. Each room gets two files:

- `<room>-floor.md` — the **floor plan**: walls, doors, glass, wall
  material only. No furniture. This is the shell you edit when you want
  to move a wall, add an alcove, or change how doorways sit.
- `<room>-furniture.md` — the **furniture map**: same grid overlaid
  with furniture, props, wall-mounted TVs / whiteboards / paintings,
  and NPCs. This is what you edit when the walls are settled and you
  want to fill or rearrange the room.

Both files use the grid conventions from
[../room-authoring.md](../room-authoring.md): 1 cell = 1 m, X across
(east +, west -), Z down (south +, north -). One character per cell,
using the single-char legend below.

## Universal legend

```
.  open floor          T  desk / table       V  wall TV
#  opaque wall         h  chair              B  whiteboard
G  glass wall          L  laptop             P  painting
D  entry door (open)   M  monitor            c  filing cabinet
d  interior door open  p  paper              k  kitchen cabinet row
x  interior door closed m  mug               S  sofa
=  wall owned by       b  bush / planter     w  water cooler
   another room                              f  fax   t  telephone
```

Wall-mounted items (`V B P`) sit on the wall row itself, replacing one
`#` cell in that row. Chairs and TVs can carry a facing suffix
(`^ v < >`) if the direction matters and can't be inferred from an
adjacent desk.

## When to update

- **Layout files are documentation, not source of truth.** The code
  in `src/game/constants/gameConstants.ts` + the scene component is
  the truth. These files exist to make the ASCII iteration loop
  fast — sketch, discuss, port.
- Update the matching layout file when you change a room's walls or
  furniture in code, so a future turn can read it and know the
  current shape without re-deriving from the scene component.
- If the code and the layout drift, trust the code — but flag the
  drift and re-sync the layout in the same turn.

## Index

- **The Garage** — [floor](./the-garage-floor.md) · [furniture](./the-garage-furniture.md)

Add other rooms here as they're documented. Keep filenames
`<kebab-name>-{floor,furniture}.md` so tooling can pair them.
