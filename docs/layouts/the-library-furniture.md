# TheLibrary — Furniture map

Five focus desks against the west wall (facing west, i.e. backs to
the corridor), 2 filing cabinets butted together against the north
wall, 2 whiteboards on the N and S walls, a painting on the N wall,
and NPC "tenant" doing focus work.

Source of truth: `src/game/scene/TheLibrary.tsx` +
`src/game/constants/gameConstants.ts::THE_LIBRARY_DESKS` +
`THE_LIBRARY_WHITEBOARDS`.

Note: the constants block's comment says "Six individual focus desks"
but the array only defines 5 — code/comment drift.

## Grid

```
              -19       -16    -13
               v         v      v
        col:   0         3      6
Z=-22        ###B######c#####    ← whiteboard @ (-16); 2 filing cabinets @ (-14, -21.5) (-13.5, -21.5); painting @ (-16.5)
Z=-21        #..............G
Z=-20        #.Y............G    ← "tenant" NPC at (-15, -20), facing whiteboard
Z=-19        #.T....h.......G    ← Desk 0 (-18, -19.5), chair (-16.6, -19.5) west-facing; has mug @ (-17.9, -19)
Z=-18        #..............G
Z=-17        #.T....h.......G    ← Desk 1 (-18, -16.5)
Z=-16        #..............G
Z=-15        #..............G
Z=-14        #.T....h.......G    ← Desk 2 (-18, -13.5); has telephone @ (-17.85, -13.95)
Z=-13        #..............G
Z=-12        #..............G
Z=-11        #.T....h.......G    ← Desk 3 (-18, -10.5)
Z=-10        #..............G
Z=-9         #..............D
Z=-8         #.T....h.......D    ← Desk 4 (-18, -7.5)
Z=-7         #..............G
Z=-6         #..............G
Z=-5         #..............G
Z=-4         ###B############    ← S-wall whiteboard @ (-16)
```

## Legend

Symbols from [./README.md](./README.md):

```
.  open floor       T  desk
#  opaque wall      h  chair
G  glass wall       B  wall whiteboard
D  open door        c  filing cabinet
Y  NPC (tenant)     m  mug (see table)
                    t  telephone (see table)
```

## What's placed

### Focus desks (`THE_LIBRARY_DESKS`)

Five desks along the west wall (X=-18). Each is 1.6 × 0.75 × 1.4 with
a chair on the +X side at X=-16.6 facing west (rotationY=-π/2), so
the sitter's back is to the corridor. Each desk gets 2 papers.

| # | Desk center | Monitor? | Extra props |
|---|---|---|---|
| 0 | (-18, -19.5) | no | Laptop only; **mug** at (-17.9, -19.0) |
| 1 | (-18, -16.5) | yes | Laptop + monitor |
| 2 | (-18, -13.5) | no | Laptop only; **telephone** at (-17.85, -13.95), rotationY=+π/2 |
| 3 | (-18, -10.5) | yes | Laptop + monitor |
| 4 | (-18, -7.5) | no | Laptop only |

### Filing cabinets

Two cabinets butted together against the north wall (touching bodies,
no gap):

| Position | Rotation | Drawers |
|---|---|---|
| (-14, -21.5) | 0 (faces +Z south) | 2 |
| (-13.5, -21.5) | 0 | 2 |

### NPCs

| NPC | Position | Rotation | State |
|---|---|---|---|
| "tenant" employee | (-15, 0, -20) | π (faces -Z north) | Idle-only clips (looking at the N-wall whiteboard) |

### Wall-mounted props

| Item | Wall | Center | Size | Facing |
|---|---|---|---|---|
| Painting | North wall (Z=-22) | X=-16.5, Y=1.7 | 1.1 × 0.8 | +Z (south, into room) |
| Whiteboard (N) | North wall (Z=-22) | X=-16, Y=1.5 | 3 × 1.5 | +Z |
| Whiteboard (S) | South wall (Z=-4) | X=-16, Y=1.5 | 3 × 1.5 | -Z (north, into room) |

## Related

- Floor plan: [the-library-floor.md](./the-library-floor.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheLibrary.tsx`
