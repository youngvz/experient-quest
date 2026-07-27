# TheCommons — Furniture map

Two 4-chair meeting tables, a sofa against the west wall, a water
cooler in the SW corner, a filing cabinet near the NE glass, two
paintings on the west wall, a whiteboard on the north wall, and a TV
on the south wall.

Source of truth: `src/game/scene/TheCommons.tsx` +
`src/game/constants/gameConstants.ts::THE_COMMONS_TABLES` +
`THE_COMMONS_WHITEBOARD` + `THE_COMMONS_TV`.

## Grid

```
              -19       -16    -13
               v         v      v
        col:   0         3      6
Z=+2         ######B#########    ← whiteboard on N wall centerX=-16
Z=+3         #..............c    ← filing cabinet (-13.6, +3.4)
Z=+4         #..............G
Z=+5         #P.....h.......G    ← Table A: N chair (-16, +4.6); painting on W wall centerZ=+5
Z=+6         #....h.T.h.....G    ← Table A center (-16, +6.5), 1.8 × 1.8
Z=+7         #......h.......G    ← Table A: S chair (-16, +8.4) at row Z=+8
Z=+8         #......h.......G
Z=+9         #..............G
Z=+10        #.....S........x    ← Sofa @ (-18.4, +10), 3-seat, faces east
Z=+11        #.....S........x
Z=+12        #..............G
Z=+13        #......h.......G    ← Table B: N chair (-16, +11.6)
Z=+14        #....h.T.h.....G    ← Table B center (-16, +13.5)
Z=+15        #P.....h.......G    ← Table B: S chair (-16, +15.4); painting on W wall centerZ=+15
Z=+16        #..............G
Z=+17        #.w............G    ← water cooler @ (-18.2, +16.5)
Z=+18        ######V#########    ← TV on S wall centerX=-16
```

## Legend

Symbols from [./README.md](./README.md):

```
.  open floor       T  table            V  wall TV
#  opaque wall      h  chair            B  wall whiteboard
G  glass wall       S  sofa             P  wall painting
x  closed door      c  filing cabinet   w  water cooler
```

## What's placed

### Meeting tables (`THE_COMMONS_TABLES`)

Two square 1.8 × 1.8 m tables with 4 chairs each (one per cardinal
side, facing in).

**Table A** — center (-16, +6.5):

| Chair | Position | Facing |
|---|---|---|
| North | (-16, +4.6) | +Z (south) |
| South | (-16, +8.4) | -Z (north) |
| West | (-17.9, +6.5) | +X (east) |
| East | (-14.1, +6.5) | -X (west) |
| 2 papers + 1 white mug | on table | — |

**Table B** — center (-16, +13.5):

| Chair | Position | Facing |
|---|---|---|
| North | (-16, +11.6) | +Z |
| South | (-16, +15.4) | -Z |
| West | (-17.9, +13.5) | +X |
| East | (-14.1, +13.5) | -X |
| 2 papers + 1 black mug | on table | — |

### Standalone furniture

| Item | Position | Notes |
|---|---|---|
| Sofa | (-18.4, +10), rotationY=+π/2 | 3-seat, sitters face east; flush against west wall |
| Water cooler | (-18.2, +16.5), rotationY=+π/2 | Spigot faces east; SW corner |
| Filing cabinet | (-13.6, +3.4), rotationY=-π/2 | 3 drawers face west; NE-ish corner near the glass. **Note:** the code comment calls it "against the south wall" but the position sits near the north — comment/position drift |

### Wall-mounted props

| Item | Wall | Center | Size | Facing |
|---|---|---|---|---|
| Painting 1 | West wall (X=-19) | Z=+5, Y=1.7 | 1.2 × 0.9 | +X (east, into room) |
| Painting 2 | West wall (X=-19) | Z=+15, Y=1.7 | 1.4 × 1.0 | +X (east, into room) |
| Whiteboard | North wall (Z=+2) | X=-16, Y=1.5 | 3.5 × 1.6 | +Z (south, into room) |
| TV | South wall (Z=+18) | X=-16, Y=1.6 | 3.2 × 1.4 × 0.12 | -Z (north, into room) |

## Related

- Floor plan: [the-commons-floor.md](./the-commons-floor.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheCommons.tsx`
