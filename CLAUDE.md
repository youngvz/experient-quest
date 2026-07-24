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
```

## Current vs aspirational

The docs in `docs/` describe a target-state architecture. Some parts already
exist in `src/`; others are documented as growth targets. Match what's there
before proposing a large migration.

**Exists today:**

- `src/app/` (`App.tsx`, `App.css`) — app shell
- `src/components/{GameCanvas,InteractionPrompt,ContentOverlay}/` — HTML/DOM UI
- `src/game/constants/gameConstants.ts` — tuning constants, room dimensions,
  doorway positions, spawn point, camera + zoom clamps, corridor geometry
  (`WEST_CORRIDOR`, `EAST_CORRIDOR`, `CORRIDOR_POCKET`)
- `src/game/events/{GameEventBus,gameEvents}.ts` — typed R3F ↔ React bus
- `src/game/interactions/{InteractionManager,interactionTypes}.ts` —
  `PresentationStop` schema + 2D-rect XZ-plane zone manager. Zones **must**
  be registered from a `useEffect` (not `useMemo`) — see the StrictMode
  note in the player controller section below.
- `src/game/scene/` — R3F primitives. Environment: `Floor`, `Walls`
  (`WallPanel`, `DoorHeader`, `DoorBlocker`), `Hallway`, `WestCorridor`,
  `EastCorridor`, `CorridorPocket`, `Exterior`, `Cabinets`, `Whiteboard`,
  `Television`. Furniture: `Desk`, `Chairs`, `ConferenceTable`,
  `ConferenceLaptops`. Decor: `Laptop`, `Monitor`, `Paper`. Characters:
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
  exposes a mutable ref for held keys (WASD/arrows, `R` for run toggle,
  `Q`/`E` for camera yaw, `+`/`-` for camera zoom) plus edge consumers
  (`consumeInteract` for `F`, `consumeRoll` for `Space`, `consumeWave`
  for `C`).
- `tests/InteractionManager.test.ts` — Vitest unit
- `tests/e2e/smoke.spec.ts` — Playwright smoke (canvas renders, no console errors)

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

Layout beyond the conference room: the south hallway's west doorway opens
into the long `WestCorridor` (X ∈ [−13, −10]). Near the top of that
corridor a 6×6 pocket (`CORRIDOR_POCKET`) bulges east, and from that
pocket the `EastCorridor` runs east along the top of the conference room.
Pocket and east corridor share their boundary — the wall is carved out so
they read as one continuous L-shaped space. The east corridor's east
doorway stands open (no blocker).

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
4. State what was changed, what was tested, and any remaining risks.

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
