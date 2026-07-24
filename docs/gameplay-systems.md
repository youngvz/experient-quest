# Gameplay Systems

## Player controller

Current implementation (`src/game/scene/Player.tsx`):

- A **dynamic** Rapier `RigidBody` with a `CapsuleCollider` sized to
  `PLAYER_HEIGHT` / `PLAYER_RADIUS`.
- Y-translation and all rotations are **locked** (`enabledRotations={[false,
  false, false]}`, `enabledTranslations={[true, false, true]}`), gravity is
  disabled (`gravityScale={0}`), and `linearDamping` is 4. This gives us
  planar XZ movement without needing a kinematic character controller.
- Movement is written each frame with `body.setLinvel({ x, y: 0, z }, true)`.
  Diagonals are normalised; running speed is toggled with **R**.
- Interactions are XZ-plane 2D rects (see `InteractionManager` and
  `src/game/scene/interactionZones.ts`), fed the RigidBody's `translation()`.

If we ever need slopes, stairs, or grounded jump physics, migrate to Rapier's
kinematic character controller — but the office is flat, so the dynamic-body
+ locks approach is intentionally simpler.

Per-frame flow (all in `Player.tsx`'s single `useFrame`):

1. Read camera yaw and zoom from the keyboard ref (`Q`/`E` yaw, `+`/`-`
   zoom), clamped to `[CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX]`.
2. Handle one-shot triggers (`consumeRoll` / `consumeWave`). Rolls capture
   the current XZ velocity at takeoff so they travel from a standstill too.
3. If an action is active, lock input-driven movement; rolls still apply
   their captured takeoff velocity.
4. Otherwise read the keyboard ref, build `(vx, vz)`, rotate by the camera
   yaw, normalise, apply speed.
5. `body.setLinvel(...)` and, from `body.translation()`, update the
   `InteractionManager`, the `ZoneManager`, and the camera target.
6. Rotate the visual mesh to face motion (`atan2(vx, vz)`); lerp animation
   clip weights toward their targets.

Continuous collision detection is not enabled — no fast projectiles yet.

## Input abstraction

Input lives in one place: `src/hooks/useKeyboard.ts`. It exposes a mutable
ref for continuous keys and edge-triggered `consume*` functions for
one-shots.

Current bindings:

| Action | Keys | Kind |
| --- | --- | --- |
| Move | `WASD` / `Arrow keys` | continuous (`state.current.{forward,back,left,right}`) |
| Run (toggle) | `R` | toggle (`state.current.running`) |
| Interact | `F` | edge-triggered (`consumeInteract()`) |
| Roll | `Space` | edge-triggered (`consumeRoll()`) |
| Wave | `C` | edge-triggered (`consumeWave()`) |
| Orbit camera | `Q` / `E` | continuous (`state.current.{yawLeft,yawRight}`) |
| Zoom camera | `+` / `-` (or `=`, numpad) | continuous (`state.current.{zoomIn,zoomOut}`) |
| Close overlay | `Escape` / close button | handled by `ContentOverlay` |

Camera yaw also accepts right/middle-mouse drag and two-finger horizontal
scroll on trackpads — see `useMouseLook`. All three sources write to the
same `yaw` ref so they compose without conflict. Zoom is keyboard-only
today; it scales `CAMERA_DISTANCE` and `CAMERA_HEIGHT` together so the
pitch angle stays fixed, clamped to `[CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX]`.

Rules the hook already enforces:

- `event.repeat` is filtered so held keys don't spam edges.
- `Space` calls `preventDefault()` to stop page scroll.
- `onBlur` clears all state so focus loss can't leave a key stuck.
- Consumers of the interact edge must call `consumeInteract()` — the hook
  guards against re-firing until keyup.

Adding a new edge-triggered binding — end-to-end pattern (`KeyG` →
`bowPressed` + `consumeBow`):

```ts
// useKeyboard.ts
const BOW_KEYS = new Set(['KeyG'])
// …
else if (BOW_KEYS.has(event.code)) s.bowPressed = true
// …
const consumeBow = () => {
  const s = state.current
  if (!s.bowPressed) return false
  s.bowPressed = false
  return true
}
return { state, /* … */, consumeBow }
```

```ts
// Player.tsx (inside useFrame)
if (!controlsDisabled && consumeBow() && clipRefs.bowName) {
  action.kind = 'bow'
  action.remaining = ACTION_HOLD.bow
  actions[clipRefs.bowName]?.reset()
}
```

The rest of the game still couples to specific keys today — a
device-agnostic `GameAction` layer (keyboard + pointer + touch + gamepad
adapters) is a future goal, not the current state.

## Interaction model

Interactions are XZ-plane rectangles today, not raycasts. Each
`PresentationStop` in `src/game/interactions/interactionTypes.ts` declares
a world `position` and an `interactionZone` size; the scene passes those
through `getStopZoneRect` and registers them with an `InteractionManager`.
Each frame, `Player.tsx` calls `manager.update(x, z)` with the player's XZ
position; the manager emits `interaction:available` / `unavailable`
events via `gameEvents` when the active zone changes, and `trigger()`
fires `interaction:triggered` when the player presses `F`.

Only one zone is active at a time (first-match wins). Approach paths
matter: if an interactable NPC has a physics collider, its own capsule
prevents the player from standing on its exact XZ, so the zone should
either sit in front of them or be wide enough to catch the player at
their stopping distance.

```ts
// interactionTypes.ts — Distasi in the corridor pocket
{
  id: 'distasi',
  label: 'Distasi',
  prompt: 'Press F to talk to Distasi',
  overlayTitle: 'Distasi',
  intro: '…',
  position: [-8, 0, -13],           // XZ rect center
  interactionZone: { size: [10, 8] }, // covers the pocket + approaches
  content: { type: 'events', events: [] },
}
```

**StrictMode gotcha (repeated here because it costs hours).** Register
zones from a `useEffect` whose cleanup calls `manager.clearZones()`:

```ts
useEffect(() => {
  for (const stop of presentationStops) {
    manager.registerZone(getStopZoneRect(stop), stop)
  }
  return () => manager.clearZones()
}, [manager])
```

Do **not** register inside `useMemo` with cleanup in a separate effect.
StrictMode dev-mode simulates a mount → cleanup → remount cycle to catch
effect leaks; the cleanup empties the manager, the remount reruns
effects but not `useMemo`, so the manager stays empty forever. Fresh
loads then never fire any prompt, HMR does because it rebuilds the
component and re-runs `useMemo`. Same principle applies to any
"populate an external structure on mount" pattern.

For future work: a two-stage design (physics overlap → facing/raycast
selection) is worth reconsidering when we ship many stations close
together and the rect-only model produces ties. Today the room is
sparse enough that rects are the right shape.

## Camera

Current implementation: a third-person polar-orbit camera driven from
`Player.tsx`.

- Position is `(player.x + CAMERA_DISTANCE·sin(yaw), CAMERA_HEIGHT,
  player.z + CAMERA_DISTANCE·cos(yaw))`, so yaw=0 puts the camera due
  south of the player looking north.
- `yaw` is a mutable ref owned by `src/hooks/useMouseLook.ts` — right-click
  (or middle-click) drag adds `dx * MOUSE_LOOK_SENSITIVITY` radians per
  pixel. The hook also suppresses the browser context menu so the popup
  can't appear mid-drag.
- Camera position lerps toward the polar target with frame-rate-independent
  exponential smoothing (`1 - Math.exp(-delta * 12)`); `lookAt` targets the
  player each frame.
- Movement input is rotated by the same `yaw` so W is always "away from
  the camera" (see the `ix`/`iz` → `vx`/`vz` rotation in `Player.tsx`).

Only `Player.tsx` writes to the camera. If a presentation station ever
needs a scripted framing move, add a camera subsystem that owns the camera
and takes requests — don't sprinkle `camera.position` writes across
components.

Keyboard zoom is already wired (`+`/`-` scale distance and height together,
clamped to `[CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX]`). Yaw is unclamped today.

For future camera work, prefer:

- Constrained yaw when a presentation demands specific framing.
- Scroll-to-zoom via the mouse-wheel event if trackpad users want a
  smoother option alongside the current keyboard bindings.
- Scripted transitions when entering a presentation station, with a
  reliable reset path after the overlay closes.
- Optional camera modes (over-the-shoulder, first-person via
  `PointerLockControls`).

## Animation

Drive animation from gameplay state, not raw keys. Player clips live on a
single armature and crossfade by weight — never by stop-and-play.

Player clips are selected by regex against the loaded GLB's clip names, so
the code doesn't hardcode any specific clip name. The current player GLB
is `public/assets/player/youngvz.glb`.

How the player picks clips at load time (`Player.tsx`):

```ts
const idle = pickClip(gltf.animations, [/idle/i, /stand/i, /breath/i])
const walk = pickClip(gltf.animations, [/walk/i, /move/i])
const run = pickClip(gltf.animations, [/run/i, /sprint/i])
const roll = pickClip(gltf.animations, [/roll/i, /dodge/i])
const wave = pickClip(gltf.animations, [/wave/i, /greet/i, /hello/i])
```

Missing clips are tolerated — `pickClip` returns `null`, and every clip
consumer optional-chains. A GLB missing e.g. run falls back to walk while
sprinting. In DEV, `Player.tsx` logs the GLB's clip names to the console
on load so a mismatched clip is easy to spot.

NPC clips work the same way. `Employee` takes a `clipPatterns` prop
(defaults to idle-family regexes); pass e.g.
`clipPatterns={[/wave/i, /greet/i, /hello/i]}` to loop a wave animation
instead of idle.

How clip weights are driven in `useFrame`:

- All clips are `.play()`'d once with weight 0 (idle at 1) — mixer keeps
  advancing them; only weight changes.
- Each frame, compute target weights (idle=1 when not moving; walk/run based
  on speed + `isRunning`; action clip = 1 while active).
- Base locomotion is muted while an action is playing so the action clip
  drives the whole armature (`baseGain = locked ? 0 : 1`).
- Lerp current weight toward target with `delta * 8` for a short crossfade.

Missing-clip handling: every clip lookup is nullable and every consumer
guards with optional chaining, so a GLB missing e.g. `Man_Run` falls back to
walk while sprinting instead of crashing.

For 2D employee billboards (future):

- Use idle frames or subtle looping animation sparingly.
- Keep the plane facing the camera or use a constrained billboard behavior.
- Disable depth-write or tune alpha handling only when needed to prevent
  sorting artifacts.
- Keep interaction hit areas separate from transparent visual bounds when
  necessary.

## NPCs

Most employee characters do not need simulated navigation.

Prefer these levels of complexity:

1. **Static rigged GLB** via `<Employee>` — loads a GLB, auto-fits its
   height, plays one looping clip (configurable via `clipPatterns`),
   and stands as a fixed collider so the player can't walk through them.
   Callers pass a floor-level `y` (typically `0`); the component lifts
   the RigidBody internally.
2. Static billboard sprite at a station (not implemented yet).
3. Short scripted movement along authored waypoints.
4. Authored navmesh with `three-pathfinding`.
5. Runtime navmesh generation only when maps or obstacles truly require it.

Avoid building generalized crowd AI for the initial experience.

Example — Distasi in the corridor pocket, waving instead of idling:

```tsx
<Suspense fallback={null}>
  <Employee
    url="/assets/employees/distasi.glb"
    position={[-9.5, 0, -12]}
    rotationY={0}
    clipPatterns={[/wave/i, /greet/i, /hello/i]}
  />
</Suspense>
```

To make the NPC interactable, add a `PresentationStop` for them (see the
Interaction model section above).

## Presentation progression

Use an explicit progression model:

```ts
export type PresentationPhase =
  | 'exploring'
  | 'approaching'
  | 'presenting'
  | 'completed'
```

A station may:

- Freeze or dampen player movement
- Move the camera to a framing position
- Open a React overlay or activate an in-world screen
- Advance after explicit user input
- Mark itself complete
- Return control and camera ownership to exploration

Keep presentation order configurable. Support both guided sequencing and free exploration when feasible.

## Audio

Create audio only after a user gesture unlocks browser playback.

Provide:

- Global mute
- Independent music and effects levels when audio is substantial
- Captions or text equivalents for spoken or important prerecorded material
- Graceful behavior when autoplay is blocked
