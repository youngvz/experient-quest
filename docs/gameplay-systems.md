# Gameplay Systems

## Player controller

Use a kinematic character controller with a simple capsule or similar collider.

Do not model the player as an unconstrained dynamic rigid body. The controller should own move-and-slide behavior, slope handling, stair stepping, grounding, and obstacle correction.

Recommended flow per frame:

1. Read normalized input actions.
2. Compute desired movement using delta time.
3. Rotate movement relative to the intended camera or world frame.
4. Ask Rapier for corrected movement.
5. Apply the corrected translation.
6. Derive speed, grounded state, and animation state from the result.
7. Update the camera target.

Use continuous collision detection only for fast projectiles or exceptional objects.

## Input abstraction

All physical inputs should map to named actions.

```ts
export type GameAction =
  | 'moveForward'
  | 'moveBackward'
  | 'moveLeft'
  | 'moveRight'
  | 'interact'
  | 'confirm'
  | 'cancel'
  | 'pause'
  | 'advancePresentation'
```

Keyboard, pointer, touch, and gamepad adapters may produce these actions. Gameplay systems should not know which device produced them.

Provide sensible defaults:

- WASD and arrow keys for movement
- `E`, Enter, or Space for interaction
- Escape for pause or closing overlays
- Visible control hints

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

Drive animation from gameplay state, not raw keys.

Recommended locomotion states:

- idle
- walk
- run, only if the experience needs it
- turn or pivot, optional
- interact
- wave or present, for important characters

For rigged characters:

- Load clips from GLB
- Bind through Drei `useAnimations`
- Use short cross-fades
- Centralize clip naming
- Validate missing clips and provide fallback behavior

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
