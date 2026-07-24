# Architecture

## Core principle

Treat the application as two cooperating layers:

1. **Product and UI layer**: React routes, menus, HUD, overlays, settings, loading screens, presentation content, and accessibility.
2. **Simulation and rendering layer**: R3F scene objects, Rapier physics, animation mixers, mutable transforms, camera behavior, and per-frame systems.

React describes structure. It should not become the game loop.

## Recommended source layout

The tree below is the target state. The repo currently has a subset of it
(`src/{app,components,game/{constants,events,interactions,scene,state},hooks}`).
Grow into these folders as the concrete need arises — do not do a wholesale
migration ahead of the feature that needs it. See CLAUDE.md's
"Current vs aspirational" section for the authoritative snapshot.

```text
src/
  app/
    providers/
    screens/
    router/
  ui/
    hud/
    menus/
    overlays/
    accessibility/
  game/
    bootstrap/
      preload.ts
      quality.ts
      telemetry.ts
    core/
      constants.ts
      events.ts
      math.ts
      time.ts
      types.ts
    state/
      game-store.ts
      ui-store.ts
    input/
      actions.ts
      keyboard.ts
      pointer.ts
      touch.ts
      gamepad.ts
    camera/
    audio/
    assets/
      asset-manifest.ts
      loaders.ts
    entities/
      player/
      employees/
      props/
      triggers/
    systems/
      interaction-system.ts
      animation-system.ts
      presentation-system.ts
      spawn-system.ts
    physics/
      world.tsx
      colliders.ts
      queries.ts
    navigation/
    scenes/
    content/
      meetings/
      levels/
      prefabs/
```

Do not create a generic `components/` folder that mixes HUD buttons, player controllers, physics colliders, and scene content.

## State boundaries

### React state

Use for:

- Menus and modal visibility
- Route-level loading state
- Selected settings
- Text and presentation overlays
- Accessibility preferences
- Low-frequency UI state

### Zustand

Use for:

- Current presentation stop
- Interaction target
- Player mode
- Scene progression
- Loaded content configuration
- Saveable or inspectable gameplay state

Use selectors. Avoid subscribing a large scene subtree to the full store.

### Mutable refs

Use for:

- Per-frame transforms
- Velocity working values
- Camera targets
- Animation weights
- Cached temporary vectors, quaternions, and matrices

### Rapier

Use as the authority for:

- Collision geometry
- Character movement correction
- Contact and overlap queries
- Dynamic props
- Trigger volumes where physics queries are appropriate

## Component responsibilities

A scene component may assemble entities but should not own all gameplay logic.

Prefer:

```text
MainScene
  OfficeEnvironment
  PlayerEntity
  EmployeeBillboards
  PresentationStations
  CameraSystem
  InteractionPrompt
```

Keep behavior in named hooks or systems rather than deeply nested anonymous `useFrame` callbacks.

## Data-driven presentation content

Meeting content is data, not hardcoded scene branches. The current schema
lives in `src/game/interactions/interactionTypes.ts` as `PresentationStop`
with a discriminated `content` union (`new-hires`, `projects`, `events`,
`joke`, `media`). New stops should extend `presentationStops` in that file
and add a matching renderer branch in
`src/components/ContentOverlay/ContentOverlay.tsx` (`StopBody`).

The scene places stations by iterating `presentationStops` and registering
each with the `InteractionManager`; see `src/game/scene/Player.tsx`. If a
new stop needs different geometry (e.g. a billboard rather than a TV),
add its 3D representation as a sibling scene primitive under
`src/game/scene/` and reference the stop's `position` from
`interactionTypes.ts`.

## Dependency policy

Add a package only when it removes meaningful complexity or provides a mature subsystem.

Good default dependencies:

- R3F and Drei
- Rapier
- Zustand
- glTF-Transform tooling
- Vitest and Playwright

Require explicit justification for:

- XState
- Postprocessing libraries
- Runtime navmesh generation
- ECS frameworks
- Multiplayer/network libraries
- A full server framework

## Error boundaries and fallbacks

Provide:

- A route-level error boundary
- Suspense/loading UI for critical assets
- A placeholder mesh or sprite for failed optional assets
- A readable error state when the main scene cannot initialize
- A non-3D fallback summary for critical presentation content when practical
