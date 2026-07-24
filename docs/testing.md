# Testing

## Testing goals

Test business behavior and user journeys more heavily than pixel-perfect 3D rendering.

Use:

- Vitest for pure logic and data validation
- React Testing Library for UI behavior where appropriate
- Playwright for browser-level flows
- Storybook for isolated HUD, menus, and presentation overlays when the project includes it

## Unit-test candidates

Prioritize tests for:

- Presentation sequence reducers
- Interaction target ranking
- Input mapping
- Asset manifest validation
- Content schema validation
- Quality-profile selection
- Save and restore logic
- Camera transition request logic
- Animation state selection
- Math helpers and thresholds

Keep these systems independent of React and Three.js objects when practical.

## Browser flows

Run with `npm run test:e2e` — Playwright starts the Vite dev server via
`playwright.config.ts`. First-time setup on a new machine or in CI:
`npm run test:e2e:install`.

Current baseline (in `tests/e2e/`):

1. `smoke.spec.ts` — app boots without page errors and the R3F canvas is visible with non-zero size.

Target coverage to add as features land:

1. Loading screen resolves to the office scene.
2. Keyboard movement changes the player position.
3. The first interaction prompt appears.
4. Activating a station opens its content.
5. Closing or completing the station returns control.
6. Pause and resume work.
7. Reduced-motion preference changes relevant behavior.
8. A failed optional asset shows a fallback rather than breaking the scene.
9. The layout remains usable at representative mobile and desktop sizes.

## Visual testing

Use visual regression primarily for:

- HUD
- Menus
- Presentation cards
- New-hire panels
- Event panels
- Loading and error screens
- Responsive overlay layouts

Do not make fragile full-scene pixel comparisons the primary game test. GPU, browser, driver, and timing differences can produce noise.

For 3D scene screenshots, stabilize:

- Camera position
- Time or animation state
- Random seeds
- Quality profile
- Canvas dimensions
- Asset load completion

## Asset-pipeline tests

CI should verify:

- GLB validation succeeds
- File size is within the declared budget
- Required `extras` metadata exists
- Forbidden source formats are not in production asset folders
- Texture dimensions stay within policy
- Asset IDs are unique
- Manifest URLs resolve during a production build test
- AI-generated assets have provenance records

## Acceptance criteria format

For each feature, describe:

```text
Given [starting state]
When [user action]
Then [observable result]
And [important fallback or constraint]
```

Example:

```text
Given the player is near the new-hire wall
When the player presses the interact key
Then the new-hire panel opens and player movement is paused
And closing the panel restores movement and the previous camera mode
```

## Manual device checks

Before a major demo:

- Desktop Chrome
- Desktop Safari
- A representative iPhone
- A representative Android phone
- Keyboard-only navigation through overlays
- Sound muted and sound enabled
- Slow network or cold cache
- Reduced-motion mode
- Projector or meeting-room display resolution
