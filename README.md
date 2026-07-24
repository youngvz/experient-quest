# Experient Quest — Office RPG Prototype

A browser-based top-down office RPG prototype. It's the seed of an interactive
technology status meeting: walk around a small office, interact with a
television, and see meeting content in a React overlay.

The prototype uses **React + TypeScript + Vite** for the UI shell and **Phaser
4** (the successor to Phaser 3, with compatible APIs for the surface used here)
for the game world.

## Setup

```bash
npm install
npm run dev
```

Open the printed local URL. No binary assets are required — all placeholder art
is generated in the boot scene.

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

## Architecture

React owns the app shell, the interaction prompt, and the content overlay.
Phaser owns the game world (map, player, physics, camera, interaction detection).
They communicate through a small typed event bus (`src/game/events/GameEventBus.ts`)
so neither side imports the other's components.

```
React (HTML)                       Phaser (canvas)
─ App shell                        ─ Scenes (Boot, Office)
─ GameCanvas (mounts Phaser once)  ─ Player entity
─ InteractionPrompt                ─ Placeholder textures + map
─ ContentOverlay                   ─ InteractionManager
        ▲                                  │
        │      typed event bus             │
        └──────────────────────────────────┘
```

Key events on the bus:

- `interaction:available` — Phaser → React: show the prompt
- `interaction:unavailable` — Phaser → React: hide the prompt
- `interaction:triggered` — Phaser → React: open the overlay
- `overlay:closed` — React → Phaser: resume player + interactions

## Current Prototype

- Placeholder 20×14 tile office room, generated in code (no Tiled required).
- Placeholder player rectangle with a facing marker.
- WASD + arrow-key movement, normalized diagonals.
- Arcade-physics collisions with walls, desk, and television.
- Invisible interaction zone in front of the television.
- HTML prompt when the player is in range.
- React modal overlay (with ESC + close-button dismiss) showing placeholder
  Technology Status Meeting content.
- Movement pauses while the overlay is open; `E` must be released and pressed
  again before opening the same overlay a second time.
- One unit test (`tests/InteractionManager.test.ts`) covers the interaction
  logic without needing a Phaser renderer.

## Asset Replacement

### Player sprite sheet

Add a `public/assets/characters/player.png` (32×48 frames, four directional rows
of walk animation) and update `BootScene.preload` to load it:

```ts
this.load.spritesheet('player', '/assets/characters/player.png', {
  frameWidth: 32,
  frameHeight: 48,
})
```

Then move animation definitions and `sprite.anims.play(...)` calls into `Player`
in place of the current facing-marker logic.

### Room → Tiled map

Replace `OfficeScene.createFloor` / `createWalls` / `createDesk` / `createTv`
with `this.make.tilemap(...)`. Interactions and spawn points should come from
Tiled object layers whose objects carry `interactionId` and `prompt` properties;
map them into `InteractionManager.registerZone` the same way the placeholder
does today.

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

- Custom employee sprite sheets and animations.
- Tiled-authored office map with foreground layers and lighting.
- New-hire billboard interaction with dynamic content.
- NPC dialogue system (joke-of-the-week character, project-update rooms).
- Scripted presentation sequence for the events television.
- Ambient audio and interaction sound effects.
- Touch controls and mobile scaling.
- Save state (localStorage).
- Small minigames (e.g., coffee-round path puzzle).
