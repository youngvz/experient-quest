# Assets and Content

## Hybrid visual strategy

Use the cheapest asset type that communicates the idea well.

| Content | Preferred representation | Where |
|---|---|---|
| Office shell, walls, floor, rooms | Low-poly 3D GLB (aspirational; primitives today) | `src/game/scene/` |
| Desks, chairs, TVs, signs, plants, decor | Simple reusable 3D props | `src/game/scene/` |
| Most employees | 2D transparent sprites or illustrated billboards | `public/assets/employees/` (future) |
| Rigged NPC (e.g. Distasi) | Rigged GLB via `<Employee>` | `public/assets/employees/*.glb` |
| Player character | Rigged GLB | `public/assets/player/youngvz.glb` |
| Important presenter | Rigged GLB or a high-quality animated billboard | `public/assets/employees/` |
| Slides, project updates, events | React overlay or texture on an in-world screen | `src/components/ContentOverlay/` |
| New-hire wall | Billboard cards or a UI panel anchored in 3D | future |

Do not turn every employee into a rigged 3D model.

## Current layout (data-driven primitives)

The office is not authored as a single GLB yet — it's built from primitive
meshes placed by data. Dimensions, doorway positions, and prop placements
live as exported constants in `src/game/constants/gameConstants.ts`, and each
scene component reads from those constants.

Coordinate system: world units are metres. `+X` is east, `+Z` is south, `+Y`
is up. The conference room is centered on the origin; the The Bakery
runs south of it.

Building blocks (all in `src/game/scene/`):

- Wall/door primitives (`wallPrimitives.tsx`, `Door.tsx`):
  `<WallPanel>` — opaque or transmissive glass segment.
  `<DoorHeader>` — lintel spanning a doorway; no collider.
  `<DoorBlocker>` — invisible full-height collider for exterior doorways
  the player can't cross yet (swap for a sensor collider when adding
  level transitions).
  `<Door>` — visible glass door slab with pull handle; optional collider;
  optional open pose.
- Reusable prop primitives (singular): `<Desk>`, `<Chair>`, `<Laptop>`,
  `<Monitor>`, `<Paper>`, `<Television>`, `<Whiteboard>`.
- Room-specific composites (plural or `[Room][Plural]`):
  `<TheBakeryCabinets>`, `<TheLabCabinets>`, `<Whiteboards>` (conference
  + alcove), `<Televisions>` (main + alcove), `<ConferenceChairs>`,
  `<ConferenceLaptops>`, `<ConferenceTable>`.
- Reusable composite: `<CabinetRow>` — kitchen-style base cabinets +
  optional sink; both `<TheBakeryCabinets>` and `<TheLabCabinets>`
  wrap it with a config picking wall side, count, and sink index.
- `<Employee>` — rigged NPC that loads a GLB, autofits height, plays one
  looping clip (regex-picked via `clipPatterns`), and stands as a fixed
  collider. Callers pass a floor-level `y` (typically `0`).
- Room-level containers: `<ConferenceFloor>`, `<ConferenceRoom>`,
  `<TheBakery>`, `<CentralCorridor>`, `<EastCorridor>`,
  `<CorridorPocket>`, `<TheLab>`, `<TheStation>`, `<Exterior>`.
  `<TheStation>` also renders The Boardroom (an inline sub-room) and
  the two east-strip alcoves; `<TheLab>` renders its three east-strip
  alcoves inline.

Layout beyond the conference room:

- `<TheBakery>` — The Bakery (Z ∈ [+7, +20]) with desks, kitchen, and
  two NE alcove offices.
- `<CentralCorridor>` — long N–S corridor west of the office
  (X ∈ [−13, −10], Z ∈ [−70, +20]) reached through The Bakery's west
  doorway. Its south door is where the player spawns. East wall has
  parametric openings for `THE_BAKERY_WEST_DOOR`, the dead-end door,
  `THE_LAB.doorCenterZ`, `THE_STATION.doorCenterZ`, and `BRANCH_DOORS`,
  plus a full-height gap for `CORRIDOR_POCKET`. Segments that lie
  inside an adjacent room's Z-span render as glass so the wall reads
  as a continuous storefront wherever the corridor meets a room. The
  wall is broken at "seams" (each room's north/south wall Z-values)
  so the glass-vs-opaque predicate matches cleanly on each segment.
- `<CorridorPocket>` — 6×6 open pocket bulging east off the central
  corridor (X ∈ [−10, −4], Z ∈ [−16, −10]); houses a workbench + stools
  and Distasi.
- `<EastCorridor>` — east-running corridor above the conference room
  (X ∈ [−10, +10], Z ∈ [−10, −7]) reached through the pocket. Its west
  end and the pocket's south side are one continuous open span. North
  wall doubles as `<TheLab>`'s south boundary; a doorway there opens
  into TheLab at X=+3.
- `<TheLab>` — first branch room, L-shaped, X ∈ [−10, +10], Z ∈
  [−32, ...]. Corridor doorway at Z=−24. Interior east strip has three
  alcoves (A / B / C, each 5 m deep) with west-facing doorways; A and B
  are furnished workstations. Kitchen row `<TheLabCabinets>` sits
  against Alcove A's outside (west) partition.
- `<TheStation>` — second branch room, L-shaped (NE corner clipped),
  X ∈ [−10, +14], Z ∈ [−62, −39]. Corridor doorway at Z=−42. Three
  north-side alcoves (A / B / C, A and B furnished with south-facing
  workstations, glass south walls; C empty and opaque). Three
  east-side alcoves (D / E / F, west-facing doorways, D and E and F
  all furnished; F is expanded west to reach The Boardroom). Two solo
  workstations against the west (glass) wall.
- **The Boardroom** — enclosed sub-room inside TheStation at
  X ∈ [−4, +5], Z ∈ [−48, −39], rendered inline by `<TheStation>`.
  West wall glass with an open door at Z=−42; north and east walls
  opaque. Wall-mounted TV on the north wall faces a 4-seat brown
  meeting table.

Zone ids (registered in `Player.tsx`): `office` (fallback),
`central-corridor`, `the-lab`, `the-station`, `the-boardroom`. Zones
are registered most-specific-first so The Boardroom wins on
first-match over TheStation.

Glass storefront pattern: wherever a walkable room meets another
walkable space, both surfaces on the shared plane render as glass
with `divisions={1}`. Perimeter walls facing the exterior stay
opaque. `WallPanel` auto-inserts vertical mullions in glass panes
every ~4 m; pass `divisions={1}` to skip them for clean panes.

Recipe — add a new room:

1. Add its geometry as a constants object in `gameConstants.ts` (walls,
   doorway centre + width, prop positions).
2. Write a component under `src/game/scene/` that reads those constants and
   emits `<WallPanel>` / `<DoorHeader>` / prop calls.
3. Mount the component inside `<Physics>` in
   `src/game/scene/OfficeScene.tsx`.

Doorway rule: an opening in a wall is two `<WallPanel>`s with a gap between
them and a `<DoorHeader>` for the lintel. If it's exterior and the player
must not pass through, add a `<DoorBlocker>` centred on the opening too.

When a single authored office GLB replaces this, treat it as a shell plus a
set of invisible collider meshes (`<CuboidCollider>` inside `<RigidBody
type="fixed" />`) — and drop the constants that the shell now embeds. Until
then, the data-driven approach makes it cheap to iterate on layout.

## Prop conventions (Laptop as reference)

`src/game/scene/Laptop.tsx` is the reference prop: `[x, z]` position +
`deskTopY`, everything else built in a local `<group>` at
`[x, deskTopY, z]` so inner meshes stay origin-relative.

- Accept `position: [x, z]` + `deskTopY` (not full `[x, y, z]`) when the prop
  sits on a surface — the caller shouldn't know your mesh's internal offsets.
- Rotate the group, not individual meshes.
- Use `meshStandardMaterial` with `roughness`; add `metalness` only for
  something that reads as metal. `MeshPhysicalMaterial` (transmission) only
  when needed for glass.
- `castShadow` on visible props; `receiveShadow` on floors/desks. Emissive
  screens shouldn't cast shadows — they render as opaque black.
- Props that block the player go inside `<RigidBody type="fixed"
  colliders="cuboid">` (see `Desk.tsx`). Decorative items on a desk (papers,
  laptops, mugs) don't need colliders — the desk itself blocks.
- Emissive screens: dark bezel mesh + inner emissive plane offset by ~1 mm
  along the screen's normal, e.g. `emissive="#3fa4ff" emissiveIntensity={0.35}`.
- Expose an optional `scale?: number` if the same prop appears at different
  sizes on different desks — cleaner than wrapping every call in a `<group
  scale={…}>`.

## Canonical formats

Shipping formats:

- `.glb` for 3D geometry, rigs, and clips
- `.ktx2` where texture compression is worth the pipeline cost
- `.png` or `.webp` for transparent 2D characters and UI art
- `.json` or TypeScript modules for presentation data
- Browser-supported compressed audio formats with a fallback when necessary

Do not ship FBX or OBJ to the browser. Convert source files during the offline pipeline.

## 3D pipeline

```text
Source or generated model
  -> Blender cleanup
  -> glTF 2.0 / GLB export
  -> glTF-Validator
  -> glTF-Transform optimization
  -> texture compression where appropriate
  -> size and metadata checks
  -> versioned public asset path
```

Use Meshopt as the normal starting point for geometry compression. Use Draco selectively for static geometry when its size benefit justifies decode cost.

`scripts/optimize-glb.mjs` (also `npm run optimize-glb` or the
`/optimize-glb` slash command) implements the "glTF-Transform
optimization" step — prunes unused animation clips and applies Meshopt
or Draco compression in one pass.

## 2D pixel-art raster pipeline

Character portraits and other pixel-art PNGs are AI-upscaled at authoring
time, so the source raster is usually much larger than the CSS render
target. Resize before shipping — a 3×DPR headroom over the largest CSS
size is plenty (portraits render into a 192-px frame today; 768 px cover
3×DPR retina).

```text
Source PNG (any size)
  -> nearest-neighbor resize to max side length (default 768 px)
  -> palette quantization (indexed PNG8, 256 colors)
  -> zlib max effort
  -> versioned public asset path
```

Nearest-neighbor is critical — Lanczos or bicubic anti-alias the pixels
and defeat `image-rendering: pixelated` in CSS. See `docs/performance.md`
"Textures" section (*"Resize textures to their actual display needs"*).

`scripts/optimize-png.mjs` (also `npm run optimize-png` or the
`/optimize-png` slash command) implements this pipeline. It's path-
agnostic — pass any `.png` and it overwrites in place with a `.png.bak`
backup. Rerun with `--palette=off` if a specific file bands on soft
alpha edges.

## Blender conventions

- Keep scale and orientation consistent.
- Apply or deliberately manage transforms.
- Use descriptive node and material names.
- Separate render meshes, collision meshes, and navmeshes.
- Store runtime metadata in custom properties exported to glTF `extras`.
- Organize animation clips using actions or NLA tracks.
- Avoid excessive material count.
- Prefer shared atlases or reusable materials for low-poly office kits.

Example metadata:

```json
{
  "kind": "presentationStation",
  "stationId": "new-hires",
  "interactionLabel": "Meet the new hires"
}
```

## Runtime loading

Use `useGLTF` or `useLoader` so assets participate in loader caching.

Use `gltfjsx` for important reusable models when typed node access, material replacement, animation access, or conditional meshes improve maintainability.

Preload only critical assets:

- Office shell
- Player model
- First presentation stop
- Essential UI fonts and icons

Stream optional decorations, later stops, and non-critical media after the initial scene is usable.

## Billboard characters

Recommended implementation:

- A plane or sprite with transparent texture
- A fixed world-space size appropriate to the office scale
- Camera-facing rotation, optionally constrained to the Y axis
- Separate collider or interaction volume
- Texture atlases when many characters share dimensions
- Optional 2-6 frame idle animation, not large sprite sheets by default

Handle transparency carefully. Test overlapping billboards, depth sorting, outlines, and shadows on representative devices.

## Asset sourcing

Strong starting sources:

- Kenney for CC0 prototyping and simple production assets
- Quaternius for stylized low-poly environments and props
- Mixamo for temporary humanoid rigs and clips

Track provenance for every external asset:

```ts
export interface AssetProvenance {
  assetId: string
  source: string
  creator?: string
  license: string
  acquiredAt: string
  commercialUseAllowed: boolean
  attributionRequired: boolean
  modifications?: string[]
}
```

Do not merge assets with unclear commercial rights.

## AI-assisted assets

AI tools are suitable for first passes, concepts, and source material.

Potential uses:

- Meshy or Tripo for initial 3D props and character concepts
- DeepMotion or Rokoko for video-to-animation
- Avaturn for avatar-style characters when its visual style and license fit

Required review before shipping:

1. Confirm commercial usage rights for the account and generated output.
2. Inspect topology, normals, UVs, and material count.
3. Remove hidden or unnecessary geometry.
4. Normalize scale and transforms.
5. Simplify textures and resize them.
6. Standardize skeleton and clip names.
7. Export clean GLB.
8. Validate and optimize.
9. Test on low-end mobile hardware.

Do not adopt Ready Player Me as a new service dependency. Its official services were discontinued in January 2026.

## Content authoring

Keep business content separate from scene code.

Suggested structure:

```text
src/game/content/meetings/
  2026-technology-status.ts
  people.ts
  projects.ts
  events.ts
public/assets/
  employees/
  office/
  props/
  player/
  presenters/
  media/
```

Content records should reference asset IDs from an asset manifest rather than hardcoded URLs spread through components.
