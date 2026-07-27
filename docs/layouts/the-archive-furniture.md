# TheArchive — Furniture map

Single desk + chair visible through the glass storefront, whiteboard
mounted on the interior north wall.

Source of truth: `src/game/scene/TheArchive.tsx` +
`src/game/constants/gameConstants.ts::THE_ARCHIVE`.

## Grid

```
              +14       +17     +20
               v         v      v
        col:   0         3      6
Z=-45        ######B#########    ← whiteboard on N wall @ centerX=+17
Z=-44        S..............#
Z=-43        S...h..........#    ← chair @ (+17, -43.4), faces south
Z=-42        S...T..........#    ← desk @ (+17, -42), 1.6 × 1.4
Z=-41        S...T.L........#    ← laptop on desk
Z=-40        S..............#
Z=-39        ######xxx######
```

## Legend

Symbols from [./README.md](./README.md):

```
.  open floor       T  desk
#  opaque wall      h  chair
B  wall whiteboard  L  laptop
S  wall coplanar with TheStation (owned there)
x  closed glass storefront door
```

## What's placed

| Item | Position | Size / Details |
|---|---|---|
| Desk | (+17, -42), Y=0.75 | 1.6 × 1.4, brown top, dark legs |
| Chair | (+17, 0, -43.4), rotationY=0 | Faces +Z (south toward the storefront) |
| Laptop | (+17, -41.9), rotationY=0 | On desk |
| Paper (1) | (+16.65, -42.15), rot 0.4 | On desk |
| Paper (2) | (+17.4, -41.8), rot -0.3 | On desk |
| Whiteboard | North wall (Z=-45), centerX=+17, centerY=1.5 | 3 × 1.5, faces south (+Z into room) |

## Related

- Floor plan: [the-archive-floor.md](./the-archive-floor.md)
- Grid workflow: [../room-authoring.md](../room-authoring.md)
- Code: `src/game/scene/TheArchive.tsx`
