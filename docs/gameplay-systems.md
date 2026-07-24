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

1. Handle one-shot triggers (`consumeJump` / `consumeClap` / `consumeSitToggle`).
2. If an action is active, lock input-driven movement; jumps still apply their
   captured takeoff velocity, sits snap to the nearest `SIT_SPOTS` entry.
3. Otherwise read the keyboard ref, build `(vx, vz)`, normalise, apply speed.
4. `body.setLinvel(...)` and, from `body.translation()`, update the
   `InteractionManager` and camera target.
5. Rotate the visual mesh to face motion (`atan2(vx, vz)`); lerp animation
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
| Interact | `E` | edge-triggered (`consumeInteract()`) |
| Jump | `Space` | edge-triggered (`consumeJump()`) |
| Clap | `C` | edge-triggered (`consumeClap()`) |
| Sit | `X` | edge-triggered (`consumeSitToggle()`) |
| Close overlay | `Escape` / close button | handled by `ContentOverlay` |

Rules the hook already enforces:

- `event.repeat` is filtered so held keys don't spam edges.
- `Space` calls `preventDefault()` to stop page scroll.
- `onBlur` clears all state so focus loss can't leave a key stuck.
- Consumers of the interact edge must call `consumeInteract()` — the hook
  guards against re-firing until keyup.

Adding a new binding — end-to-end pattern (`KeyG` → `wavePressed` +
`consumeWave`):

```ts
// useKeyboard.ts
const WAVE_KEYS = new Set(['KeyG'])
// …
else if (WAVE_KEYS.has(event.code)) s.wavePressed = true
// …
const consumeWave = () => {
  const s = state.current
  if (!s.wavePressed) return false
  s.wavePressed = false
  return true
}
return { state, /* … */, consumeWave }
```

```ts
// Player.tsx (inside useFrame)
if (!controlsDisabled && consumeWave() && clipRefs.waveName) {
  action.kind = 'wave'
  action.remaining = ACTION_HOLD.wave
  actions[clipRefs.waveName]?.reset()
}
```

The rest of the game still couples to specific keys today — a
device-agnostic `GameAction` layer (keyboard + pointer + touch + gamepad
adapters) is a future goal, not the current state.

## Interaction model

Use a two-stage interaction check:

1. **Candidate detection** through a short physics overlap or distance query.
2. **Selection validation** through facing direction, line of sight, or a camera raycast.

Each target should expose semantic metadata:

```ts
export interface InteractionTarget {
  id: string
  type: 'screen' | 'person' | 'door' | 'prop' | 'trigger'
  label: string
  maxDistance: number
  enabled: boolean
  onInteract: () => void | Promise<void>
}
```

Only show one primary prompt at a time. Resolve ties using distance, visibility, and facing angle.

## Camera

Use Drei `CameraControls` or a small camera subsystem built around it.

For the office presentation experience, prefer:

- A slightly elevated third-person or isometric-style view
- Soft follow behavior
- Constrained zoom and rotation
- Scripted transitions when entering a presentation station
- A reliable reset path after an overlay or cinematic movement

Do not let multiple components mutate the camera independently. Route camera requests through a single subsystem.

## Animation

Drive animation from gameplay state, not raw keys. Player clips live on a
single armature and crossfade by weight — never by stop-and-play.

Current player clip inventory (`public/assets/player/character.glb`):

- Locomotion — `Man_Idle`, `Man_Walk`, `Man_Run`
- One-shots — `Man_RunningJump` (used for jump), `Man_Clapping`
- Toggle — `Man_Sitting`
- Available but unwired — `Man_Death`, `Man_Jump`, `Man_Punch`, `Man_Standing`,
  `Man_SwordSlash`

How the player picks clips at load time (`Player.tsx`):

```ts
const idle = pickClip(gltf.animations, [/idle/i, /stand/i, /breath/i])
const walk = pickClip(gltf.animations, [/walk/i, /move/i])
const run = pickClip(gltf.animations, [/run/i, /sprint/i])
// running-jump preferred; regex-guard so /run/ doesn't grab it for locomotion
const jump = jumpCandidates.find((c) => /running.?jump|run.?jump/i.test(c.name))
```

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

For 2D employee billboards:

- Use idle frames or subtle looping animation sparingly
- Keep the plane facing the camera or use a constrained billboard behavior
- Disable depth-write or tune alpha handling only when needed to prevent sorting artifacts
- Keep interaction hit areas separate from transparent visual bounds when necessary

## NPCs

Most employee characters do not need simulated navigation.

Prefer these levels of complexity:

1. Static billboard at a station
2. Short scripted movement along authored waypoints
3. Authored navmesh with `three-pathfinding`
4. Runtime navmesh generation only when maps or obstacles truly require it

Avoid building generalized crowd AI for the initial experience.

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
