# CLAUDE.md

## Project purpose

Build a web-based, interactive technology-meeting game using React, TypeScript, Three.js, React Three Fiber, and Drei.

The intended visual approach is hybrid:

- A low-poly 3D office environment
- 2D pixel-art or illustrated employee characters rendered as billboards
- Simple 3D props for desks, TVs, walls, signs, decorations, and interactive objects
- Fully rigged 3D characters only for the player or important presenters

Optimize for a polished, reliable browser experience rather than a general-purpose game engine.

## Default technical direction

Unless an existing repository clearly dictates otherwise, use:

- React 19
- TypeScript with strict mode
- Vite
- Three.js
- `@react-three/fiber` v9
- Current compatible `@react-three/drei`
- `@react-three/rapier` v2
- Zustand for gameplay state
- GLB/glTF 2.0 for shipped 3D assets
- Vitest for unit tests
- Playwright for browser flows

Do not add Next.js, XState, runtime navmesh generation, multiplayer infrastructure, or a backend unless the task actually requires them.

## Commands

```bash
npm run dev            # start Vite dev server
npm run build          # tsc -b && vite build
npm run preview        # preview the production build
npm run test           # run vitest once
npm run test:watch     # vitest in watch mode
npm run test:e2e       # playwright smoke suite (dev server auto-started)
npm run test:e2e:install  # first-time: install Playwright browsers
npm run lint           # oxlint (not eslint)
npm run format         # prettier --write .
npm run optimize-glb   # scripts/optimize-glb.mjs — prune clips + Meshopt/Draco compress a GLB
npm run optimize-png   # scripts/optimize-png.mjs — resize + palette-quantize a pixel-art PNG
npm run backlog:sync   # regenerate features/backlog/README.md index from item frontmatter
npm run backlog:check  # verify the backlog index is up to date (CI-friendly, exits non-zero on drift)
```

Slash commands `/optimize-glb` and `/optimize-png` drive the scripts
end-to-end (inspect → confirm choices → run). See `scripts/README.md`.

## Current vs aspirational

The docs in `docs/` describe a target-state architecture. Some parts already
exist in `src/`; others are documented as growth targets. Match what's there
before proposing a large migration.

**Exists today:**

- `src/app/` (`App.tsx`, `App.css`) — app shell
- `src/components/{GameCanvas,InteractionPrompt,ContentOverlay}/` — HTML/DOM UI
- `src/game/constants/gameConstants.ts` — tuning constants, room dimensions,
  doorway positions, spawn point, camera + zoom clamps, corridor geometry
  (`CENTRAL_CORRIDOR`, `EAST_CORRIDOR`, `CORRIDOR_POCKET`)
- `src/game/events/{GameEventBus,gameEvents}.ts` — typed R3F ↔ React bus
- `src/game/interactions/{InteractionManager,interactionTypes}.ts` —
  `PresentationStop` schema + 2D-rect XZ-plane zone manager. Zones **must**
  be registered from a `useEffect` (not `useMemo`) — see the StrictMode
  note in the player controller section below.
- `src/game/scene/` — R3F primitives. Wall/door building blocks
  (`WallPanel`, `DoorHeader`, `DoorBlocker`, `Door`) live in
  `wallPrimitives.tsx` + `Door.tsx`. Rooms:
  `ConferenceFloor`, `ConferenceRoom`, `TheBakery`, `CentralCorridor`,
  `EastCorridor`, `CorridorPocket`, `TheLab`, `TheStation`, `TheGarage`,
  `Exterior`.
  `TheStation` contains a sub-room (`The Boardroom`) rendered inline;
  `TheGarage` is a 54 × 12 m room whose west wall is coplanar with the
  central corridor's east wall (glass, like Lab/Station) and whose
  interior is split into a north strip, an east–west circulation aisle,
  and a south strip by vertical partition walls;
  `TheLab` and `TheStation` both carry interior alcove strips wired via
  their own constants blocks. Room-specific composites:
  `TheBakeryCabinets`, `TheLabCabinets`, `Whiteboards` (conference +
  alcove), `Televisions` (main + alcove), `ConferenceChairs`,
  `ConferenceLaptops`, `ConferenceTable`. Kitchen-style cabinet rows
  share the reusable `CabinetRow` component. Reusable prop primitives
  (singular): `Chair`, `Desk`, `Laptop`, `Monitor`, `Paper`, `Whiteboard`,
  `Television`. Characters:
  `Player` (dynamic Rapier RigidBody + rigged GLB from
  `public/assets/player/youngvz.glb`), `Employee` (fixed collider
  NPC that loads a GLB and loops a configurable animation clip; e.g.
  `distasi.glb` at `public/assets/employees/`). Wiring: `OfficeScene`,
  `interactionZones`.
- `src/game/state/gameStore.ts` — Zustand starter store (`activeStopId`, `completedStopIds`, `activeZone`)
- `src/game/zones/ZoneManager.ts` — engine-agnostic XZ-rect zone tracker
  (mirrors `InteractionManager`'s pattern). Used by `Player.tsx` to update
  `activeZone` when the player crosses into corridor/branch rects.
- `src/game/scene/LazyBranch.tsx` — Suspense wrapper that mounts children
  only when `activeZone` matches its `zone` prop. Pair with `React.lazy`
  for code-split branch scenes; unmount frees GLBs/textures.
- `src/hooks/{useKeyboard,useMouseLook,useGameEvents}.ts` — `useKeyboard`
  exposes a mutable ref for held keys (WASD movement, `R` for run toggle,
  `Q`/`E` for camera yaw, `+`/`-` for camera zoom) plus edge consumers
  (`consumeInteract` for `F`, `consumeRoll` for `Space`, `consumeWave`
  for `C`). Arrow keys default to **camera control** (`↑`/`↓` zoom,
  `←`/`→` yaw) and can be flipped back to movement at runtime by setting
  `arrowKeyMode: 'movement'` on `useGameStore` — a future settings UI
  will expose this toggle. The hook reads the mode synchronously via
  `useGameStore.getState()` on each key event, so no re-registration is
  needed when the mode changes.
- `tests/InteractionManager.test.ts` — Vitest unit
- `tests/e2e/smoke.spec.ts` — Playwright smoke (canvas renders, no console errors)

Naming conventions in `src/game/scene/`:

- **Rooms end in the space type**: `ConferenceRoom`, `TheBakery`,
  `CentralCorridor`, `EastCorridor`, `CorridorPocket`, `TheLab`,
  `TheStation`. Walking spaces are "corridors", not "hallways".
  Themed / named rooms use `The[Name]` (`TheBakery`, `TheLab`,
  `TheStation`, and sub-rooms like The Boardroom).
- **Primitives are singular** (`Chair`, `Desk`, `Whiteboard`, `Television`);
  **room-specific bundled sets are named `[Room][Plural]`**
  (`ConferenceChairs`, `ConferenceLaptops`, `TheBakeryCabinets`,
  `TheLabCabinets`, `Whiteboards` and `Televisions` when the set spans
  multiple rooms).
- **String IDs are kebab-case with no `kind-` prefix**. Presentation-stop
  ids: `events-tv`, `distasi`. Zone ids: `office` (fallback),
  `central-corridor`, `the-lab`, `the-station`, `the-boardroom`.
  Quest ids: `weekly-status-meeting`. The container each id lives in
  already disambiguates its type.

Player controller notes: it's a **dynamic** RigidBody with Y-translation and
all rotations **locked** and `gravityScale=0` — driven with
`body.setLinvel(...)`, not a kinematic character controller. Animation
clips (idle / walk / run / roll / wave) are all `.play()`'d once and
crossfaded by weight in `useFrame`; the base locomotion is muted while an
action clip is active. Roll (`Space`) captures the current XZ velocity at
takeoff so a standing-start roll still travels; wave (`C`) is a static
one-shot. Camera zoom is a multiplicative scale on `CAMERA_DISTANCE`/
`CAMERA_HEIGHT`, clamped to `[CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX]`.

**StrictMode + InteractionManager gotcha:** register zones inside the
same `useEffect` whose cleanup calls `manager.clearZones()`. If zones are
registered in `useMemo` and cleared from a separate effect, StrictMode's
dev-mode simulated mount → cleanup → remount cycle empties the manager
permanently (the effect re-runs but `useMemo` doesn't). Symptom: fresh
loads never fire prompts, HMR does because it recreates the component.

Exterior doorways are sealed by `<DoorBlocker>` (invisible full-height
collider); the interior conference-room doorway stays open. When adding
level transitions, swap `DoorBlocker` for a sensor collider that emits a
`gameEvents` message.

Layout beyond the conference room:

- **`TheBakery`** — south of the conference room (Z ∈ [+7, +20]) with
  desks, kitchen (`TheBakeryCabinets`), and NE alcoves. Player spawn
  door is on the west corridor's south wall; the bakery's own south
  door is sealed.
- **`CentralCorridor`** — long N–S corridor west of the office
  (X ∈ [−13, −10], Z ∈ [−70, +20]). Player spawn sits just south of
  its south door. East wall renders as glass along every room's
  Z-span (bakery / lab / station); each room's own west wall is also
  glass on the same plane, so both surfaces read as storefront from
  either side. Alcove A in TheStation (Z ∈ [−62, −57]) is the one
  exception — its west stretch is opaque.
- **`CorridorPocket`** — 6×6 open T-junction (X ∈ [−10, −4], Z ∈
  [−16, −10]) that flows south into `EastCorridor`. Distasi lives here.
- **`EastCorridor`** — east-running corridor above the conference room
  (X ∈ [−10, +10], Z ∈ [−10, −7]) reached through the pocket. Its
  east door is open; north wall shared with `TheLab`'s south boundary.
- **`NorthEastCorridor`** — second east-running corridor threading the
  gap between `TheLab` and `TheStation`. Enters the central corridor
  through a 6×7 pocket (X ∈ [−10, −4], Z ∈ [−39, −32]) coplanar with
  both rooms' walls, then narrows to a 3 m corridor (X ∈ [−4, +20],
  Z ∈ [−39, −36]) pulled flush against `TheStation`'s south wall.
  The 4 m strip between the corridor's south edge (Z=−36) and
  `TheLab`'s north wall (Z=−32) is intentional dead space for future
  content. Ends at an open, passable glass door at X=+20.
- **`TheArchive`** — small non-enterable storefront filling the gap
  in the north-east corridor's north wall east of `TheStation`
  (X ∈ [+14, +20], Z ∈ [−45, −39]). Closed glass storefront door on
  the corridor-facing south wall; desk + laptop + papers + whiteboard
  visible through the glass. West wall is coplanar with `TheStation`'s
  east strip and owned by that component.
- **`TheLab`** — first branch room off the central corridor at Z=−24.
  L-shaped (SW corner bitten out by the pocket + east corridor), 20 m
  wide × 22 m long. Interior east strip has three alcoves (A / B / C);
  A and B are furnished workstations; C is empty. `TheLabCabinets`
  is a kitchen row against Alcove A's west partition.
- **`TheStation`** — second branch room at Z=−42. L-shaped (NE corner
  clipped), 24 m wide × 23 m long. Three north-side alcoves (A / B / C,
  A and B furnished with south-facing workstations, C empty) and three
  east-side alcoves (D / E / F, all furnished with west-facing
  workstations). F is expanded west to share its west wall with
  **The Boardroom** — an enclosed sub-room inside TheStation at
  X ∈ [−4, +5], Z ∈ [−48, −39], with a wall-mounted TV facing a
  4-seat meeting table. Two solo workstations sit against The
  Station's west (glass) wall in the main floor.
- **`TheGarage`** — third branch room off the central corridor's east
  wall, north of TheStation. 54 m × 12 m rectangle (X ∈ [−10, +44],
  Z ∈ [−74, −62]). Entry through an open glass door on the corridor's
  east wall at Z=−65.5; a dead-end door on the east perimeter at
  Z=−67.5 opens into the aisle but leads nowhere yet. South wall is
  coplanar with TheStation's north wall (TheStation owns X ∈ [−10,
  +14]; TheGarage draws only the X ∈ [+14, +44] slice). Interior
  layout: a **north strip** (Z ∈ [−74, −69]) whose west portion
  (X ∈ [−10, +5]) is one enclosed office with a south-facing 2 m
  door at X=−1.5; a **3 m E–W circulation aisle** (Z ∈ [−69, −66])
  open across the full 54 m; and a **south strip** (Z ∈ [−66, −62]).
  Three vertical partition walls at X=+14, +23, +32 cut through both
  strips (but not the aisle), creating cubicle bays. The corridor's
  east wall was shortened from Z=−100 to Z=−74 (the old wider Garage
  + conference sub-room was replaced by this layout).

All room-to-room walls that face a walkable space render as glass
storefront (both surfaces glass, coplanar) with `divisions={1}` so the
panes are unbroken. Opaque perimeter walls face the exterior. Room
components own their own floor slabs; `ConferenceFloor` is the only
one currently split into its own file.

Adding NPCs: use `<Employee url=... position=[x,0,z] rotationY={r}
clipPatterns={[/wave/i, ...]} />`. The component auto-fits the GLB to
`PLAYER_HEIGHT` and internally lifts the RigidBody so callers pass a
floor-level y (`0`). To make an NPC interactable, add a matching
`PresentationStop` to `presentationStops` with a zone that overlaps the
NPC's approach path (their own collider prevents you from standing on
their exact XZ, so keep the zone forgiving).

**Targets, not required yet** (do not migrate wholesale):

- The `src/game/{bootstrap,core,state,input,camera,audio,assets,entities,systems,physics,navigation,scenes,content}` tree in `docs/architecture.md`. Add subfolders as the concrete need arises.
- Quality profile module, route-level error boundary, loading screen.
- Content for `new-hires` / `projects` / `joke` stops (schema exists in `interactionTypes.ts`; only `events-tv` is populated).
- Full Playwright coverage list in `docs/testing.md` — one smoke spec is the current baseline; add checks incrementally.
- Device-agnostic input (pointer / touch / gamepad adapters producing named
  actions). Keyboard is the only source today.
- Authored office GLB replacing the primitives-plus-constants scene.

## Non-negotiable architecture rules

1. Keep React UI and the real-time game simulation separate.
2. Never use React `setState` for per-frame movement or animation updates.
3. Keep `useFrame` callbacks lean, delta-time based, and allocation-conscious.
4. Use refs, Rapier state, and selective Zustand subscriptions in hot paths.
5. Ship GLB assets, not FBX or OBJ.
6. Treat all imported or AI-generated assets as untrusted until reviewed, optimized, and validated.
7. Prefer simple gameplay and authored content over premature engine abstractions.
8. Build keyboard accessibility and reduced-motion behavior into UI work.
9. Preserve mobile performance through quality profiles, DPR caps, and conservative lighting.
10. Do not silently introduce new dependencies. Explain why each dependency is needed.

## Documentation routing

Load only the documents relevant to the current task.

| Task involves | Read first |
|---|---|
| Overall structure, new modules, refactors, folder placement | `docs/architecture.md` |
| Player movement, interactions, camera, input, NPCs, animations | `docs/gameplay-systems.md` |
| Office maps, GLB files, Blender, sprites, billboards, asset imports, AI asset tools | `docs/assets-and-content.md` |
| Building a new room, editing an existing room, placing furniture / walls / doors via ASCII grid | `docs/room-authoring.md` |
| Current floor plan / furniture layout of an existing room (before editing it) | `docs/layouts/<room>-floor.md` + `docs/layouts/<room>-furniture.md` |
| FPS, draw calls, memory, mobile devices, quality settings | `docs/performance.md` |
| Unit tests, E2E tests, acceptance criteria, regression coverage | `docs/testing.md` |
| Hosting, CDN, headers, CORS, CSP, caching, release checks | `docs/deployment-and-security.md` |
| Planning a feature or deciding what belongs in the MVP | `docs/delivery-plan.md` |
| Accessibility: focus, keyboard traversal, reduced motion, captions | `docs/accessibility.md` |
| File naming, folder rules, import order, comment and commit style | `docs/conventions.md` |

For tasks spanning multiple areas, read the smallest useful combination. Do not load every document by default.

## Implementation workflow

Before coding:

1. Inspect the existing repository and package versions.
2. Identify the user-visible behavior and acceptance criteria.
3. Determine which documentation routes apply.
4. Reuse existing patterns before creating new abstractions.
5. Call out assumptions when art assets, controls, or expected behavior are missing.

While coding:

1. Make the smallest coherent change.
2. Keep simulation logic testable outside React where practical.
3. Avoid temporary allocations in frame loops.
4. Add loading, failure, and fallback states for assets.
5. Keep important constants and tuning values named and centralized.
6. Add comments only for non-obvious constraints or tradeoffs.

Before finishing:

1. Run type checking, linting, and relevant tests.
2. Confirm assets load from a production-like path.
3. Check keyboard controls and basic responsive behavior.
4. Check whether the change makes any documentation stale or leaves a
   gap. Re-scan the docs listed in the routing table above for the areas
   you touched. Update them when the change:
   - alters or removes behavior a doc currently describes,
   - adds a new command, script, slash command, or dependency that a
     reader would reasonably expect to find in the relevant doc,
   - changes a public interface, file path, or convention referenced
     elsewhere.
   Do NOT edit docs for internal-only refactors, work-in-progress
   experiments, or details already implicit in the code. If a doc could
   be updated but isn't clearly warranted, mention it in the final
   report instead of editing.
5. State what was changed, what was tested, whether docs were updated
   (or explicitly why not), and any remaining risks.

## Project-specific product guidance

This is an interactive presentation experience, not an open-world game. Favor:

- A guided route through the office
- Clear interaction prompts
- Scripted stops such as new hires, project updates, upcoming events, and a joke-of-the-week area
- Fast startup and predictable behavior
- Short, reusable scenes and data-driven content
- Graceful fallbacks when a model, texture, video, or audio file fails

Avoid:

- Complex combat systems
- Large physics-heavy environments
- Fully simulated crowds
- Rigged 3D models for every employee
- Expensive real-time lighting when baked or simple lighting works
- Content embedded directly inside scene components when it can be data-driven

## Definition of done

A feature is complete when:

- It meets the requested user behavior
- It follows the routed documentation
- It does not introduce per-frame React re-rendering
- It has reasonable loading and error handling
- It is usable with keyboard input where relevant
- It has appropriate tests or a documented reason tests are not useful
- It does not materially regress startup time or runtime performance
