# Delivery Plan

## Product goal

Deliver a short, polished, guided interactive office experience for a technology status meeting. The product succeeds when it communicates updates clearly and feels playful without becoming fragile or difficult to operate live.

## MVP scope

### Required

- Browser-hosted application
- Low-poly office scene
- Controllable player
- Collision with walls and major props
- Camera follow behavior
- Interaction prompt
- At least four presentation station types:
  - New hires
  - Project updates
  - Upcoming events
  - Joke of the week
- Data-driven meeting content
- Loading and error states
- Keyboard controls
- Basic mobile/responsive support
- A guided path or clear visual cues

### Strongly preferred

- 2D employee billboards
- One rigged or animated player character
- Scripted camera framing at stations
- Progress indicator or map
- Audio toggle
- Reduced-motion mode
- Presenter mode that can advance content predictably

### Defer

- Multiplayer
- User accounts
- General-purpose level editor
- Dynamic crowd simulation
- Fully rigged employee roster
- Procedural map generation
- Runtime navmesh generation
- Complex inventory or combat

## Suggested implementation order

### Phase 1: Foundation

Done:

- Vite, React, R3F, Drei, Rapier, Zustand, Vitest, and Playwright installed
- Canvas shell and typed R3F ↔ React event bus
- `PresentationStop` content schema and starter Zustand store

Still to do in this phase:

- Loading screen
- Route-level error boundary
- Quality profile selection (device detection + user override)

### Phase 2: First playable room

- Import a graybox office GLB
- Add collisions
- Implement player movement and camera
- Add one interactable screen
- Open a React overlay from the 3D interaction

### Phase 3: Presentation framework

- Define presentation station data
- Add new-hire, project, event, and joke renderers
- Add camera transition and movement lock behavior
- Track completed stops

### Phase 4: Hybrid art pass

- Replace graybox with low-poly office assets
- Add instanced props
- Add employee billboards
- Add player or presenter animation
- Optimize and validate assets

### Phase 5: Hardening

- Add Playwright critical-path coverage
- Test mobile quality profiles
- Add reduced motion and audio gating
- Configure deployment headers and caching
- Rehearse the full meeting flow on the actual presentation hardware

## Feature decision rules

Choose the simplest implementation that supports the meeting.

- Use an overlay rather than rendering complex HTML into a 3D texture.
- Use a billboard rather than a rigged model for background employees.
- Use authored waypoints rather than navmesh pathfinding for short scripted movement.
- Use a fixed scene rather than level streaming unless load measurements require it.
- Use one reliable camera mode plus scripted station shots rather than free-orbit complexity.

## Demo readiness checklist

- The app boots from a clean browser session
- The first meaningful screen appears quickly
- Every station can be completed in sequence
- Controls are visible before the user needs them
- Presenter can recover from an accidental camera or movement state
- Audio is optional
- All critical content is available even if optional media fails
- A direct URL or restart control resets the experience
- The deployed version is pinned and not changing on meeting day
- A fallback deck, PDF, or static summary exists for operational safety
