# TheAtrium — Furniture map

South zone: conference nook with a 4-seat table, TV on the west wall.
Middle zone divider: whiteboard on the west wall. North zone: staggered
2×2 pod of solo desks with laptops + monitors + papers.

Source of truth: `src/game/scene/TheAtrium.tsx` +
`src/game/constants/gameConstants.ts::THE_ATRIUM_CONFERENCE` +
`THE_ATRIUM_WHITEBOARD_WEST` + `THE_ATRIUM_POD_DESKS`.

## Grid

```
              -19       -16    -13
               v         v      v
        col:   0         3      6
Z=-55        ################
Z=-54        #..............G
Z=-53        #......h.......G    ← S-side chair (-16, -52), faces +Z
Z=-52        #.....TTT......G
Z=-51        #....hTTTh.....G    ← W chair (-17.7) faces east; E chair (-14.3) faces west
Z=-50        #V...TTT.......G    ← Conference table @ (-16, -50); TV on W wall centerZ=-50
Z=-49        #.....TTT......G
Z=-48        #......h.......G    ← N-side chair (-16, -48), faces -Z
Z=-47        #..............G
Z=-46        #..............G
Z=-45        #..............x
Z=-44        #..............x
Z=-43        #..............G
Z=-42        #B.............G    ← W-wall whiteboard @ centerZ=-42 (zone divider)
Z=-41        #..............G
Z=-40        #..............G
Z=-39        #..............G
Z=-38        #..............G
Z=-37        #.T....h.......G    ← Desk 0 (-17.4, -37), chair (-16.3, -37) west-facing
Z=-36        #..............G
Z=-35        #......h.T.....G    ← Desk 1 (-14.6, -35), chair (-15.7, -35) east-facing
Z=-34        #..............G
Z=-33        #..............G
Z=-32        #..............G
Z=-31        #.T....h.......G    ← Desk 2 (-17.4, -31)
Z=-30        #......h.T.....G    ← Desk 3 (-14.6, -30)
Z=-29        #..............G
Z=-28        ################
```

## Legend

Symbols from [./README.md](./README.md):

```
.  open floor       T  table / desk    V  wall TV
#  opaque wall      h  chair           B  wall whiteboard
G  glass wall
x  closed door
```

## What's placed

### South zone — conference nook (`THE_ATRIUM_CONFERENCE`)

| Item | Position | Size / Details |
|---|---|---|
| Table | (-16, -50), Y=0.75 | 2.4 × 3.2, brown top, dark legs |
| Chair (E) | (-14.3, -50), rotationY=-π/2 | Faces west |
| Chair (W) | (-17.7, -50), rotationY=+π/2 | Faces east |
| Chair (N) | (-16, -48), rotationY=π | Faces south |
| Chair (S) | (-16, -52), rotationY=0 | Faces north |
| 2 papers | on table | Hand-authored positions |
| Wall TV | West wall (X=-19), centerZ=-50, centerY=1.6 | 2.6 × 1.4 × 0.12, faces east (+X into room) |

### Zone divider — whiteboard on west wall (`THE_ATRIUM_WHITEBOARD_WEST`)

| Wall | Center | Size | Facing |
|---|---|---|---|
| West wall (X=-19) | Z=-42, Y=1.5 | 3.5 × 1.6 | +X (east, into room) |

### North zone — desk pod (`THE_ATRIUM_POD_DESKS`)

Four 1.4 × 0.75 × 1.6 solo desks. West column faces east (chairs on
+X side of the desks); east column faces west. Z positions
staggered so the two columns don't line up:

| Desk # | Desk center | Chair | Sitter faces | Laptop + monitor | Papers |
|---|---|---|---|---|---|
| 0 | (-17.4, -37) | (-16.3, -37, -π/2) | West (-X) | Yes, both | 1 |
| 1 | (-14.6, -35) | (-15.7, -35, +π/2) | East (+X) | Yes, both | 1 |
| 2 | (-17.4, -31) | (-16.3, -31, -π/2) | West | Yes, both | 1 |
| 3 | (-14.6, -30) | (-15.7, -30, +π/2) | East | Yes, both | 1 |

## Related

- Floor plan: [the-atrium-floor.md](./the-atrium-floor.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheAtrium.tsx`
