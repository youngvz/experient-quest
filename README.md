# Experient Quest — Office RPG Prototype (3D)

A browser-based office RPG prototype rendered in 3D. It's the seed of an
interactive technology status meeting: walk around a small office, approach a
television, and see meeting content in a React overlay.

Stack: **React + TypeScript + Vite** for the UI shell, **react-three-fiber**
(three.js) for the 3D scene, and **@react-three/rapier** for physics.

## Setup

```bash
npm install
npm run dev
```

Open the printed local URL. No binary assets are required — the office is
built from primitive meshes.

## Commands

```bash
npm run dev          # start Vite dev server
npm run build        # type-check + production build
npm run preview      # preview the production build
npm run test         # run vitest once
npm run test:watch   # run vitest in watch mode
npm run lint         # run oxlint
npm run format       # run prettier
```

## Controls

```text
Move:          WASD or Arrow Keys
Interact:      E
Close overlay: Escape (or Close button)
```

The camera is a fixed-offset third-person follow. Movement is relative to the
world (not to the camera), so W always moves the player in the same direction —
easy to reason about for a prototype.

## Architecture

React owns the app shell, the interaction prompt, and the content overlay.
react-three-fiber owns the 3D scene (meshes, lighting, camera, player, physics).
They communicate through a small typed event bus
(`src/game/events/GameEventBus.ts`) so neither side imports the other's
components.

```
React (HTML)                        R3F (canvas)
─ App shell                         ─ OfficeScene
─ GameCanvas (hosts <Canvas>)       ─ Floor / Walls / Desk / Television
─ InteractionPrompt                 ─ Player (kinematic + camera follow)
─ ContentOverlay                    ─ InteractionManager (XZ-plane zone check)
        ▲                                   │
        │       typed event bus             │
        └───────────────────────────────────┘
```

Key events on the bus:

- `interaction:available` — R3F → React: show the prompt
- `interaction:unavailable` — R3F → React: hide the prompt
- `interaction:triggered` — R3F → React: open the overlay
- `overlay:closed` — React → R3F: resume player + interactions

## Current Prototype

- 20×14 metre office built from primitive meshes (floor, four walls, desk, TV).
- Ambient + directional + hemisphere lighting; the TV screen self-illuminates.
- Third-person camera with a fixed offset that lerps toward the player.
- WASD + arrow-key movement, normalized diagonals; player rotates to face motion.
- Rapier physics: dynamic capsule player collides with static walls, desk, and TV.
- Invisible interaction zone in front of the television (2D rect on the XZ plane).
- HTML prompt when the player is in range.
- React modal overlay (ESC + close-button dismiss) showing placeholder
  Technology Status Meeting content.
- Movement pauses while the overlay is open; `E` must be released and pressed
  again before opening the same overlay a second time.
- One unit test (`tests/InteractionManager.test.ts`) covers the interaction
  logic — the manager stays engine-agnostic (2D rect + XZ point), so the same
  tests worked on the Phaser 2D prototype and still work in 3D.

## Asset Replacement

### Player mesh → glTF character

Drop a `.glb` (T-pose or animated) into `public/assets/characters/`, load it
with drei's `useGLTF`, and swap the capsule mesh in `src/game/scene/Player.tsx`:

```tsx
const { scene, animations } = useGLTF('/assets/characters/employee.glb')
```

For animated walk cycles use `useAnimations` from drei and play a clip when the
player's velocity is non-zero.

### Room primitives → authored 3D model

For a single authored office, export the whole room as a `.glb` and drop it
into the scene alongside a set of invisible collider meshes (`<CuboidCollider>`
inside `<RigidBody type="fixed" />`). If you want a grid-based level editor,
drive the wall/desk/TV placement from a JSON layout file instead of the
hard-coded constants in `gameConstants.ts`.

### Interaction content

Content lives in `src/game/interactions/interactionTypes.ts` in a plain object
keyed by `InteractionId`. Add new IDs, update the union type, and add the
matching zone in the scene.

Future content-block model (documented but not yet wired):

```ts
type ContentBlock =
  | { type: 'text'; value: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'list'; items: string[] }
  | { type: 'video'; src: string }
  | { type: 'action'; label: string; actionId: string }
```

## Future Enhancements

- Custom employee glTF characters + walk animations.
- Authored office room model with lighting and materials.
- Camera modes: over-the-shoulder, first-person (`PointerLockControls`).
- Additional interactables (new-hire billboard, joke NPC, project-update rooms).
- NPC dialogue system.
- Scripted presentation sequence for the events television (playing a texture
  video on the TV plane).
- Ambient audio and interaction sound effects.
- Touch controls and mobile scaling.
- Save state (localStorage).
- Small minigames.
