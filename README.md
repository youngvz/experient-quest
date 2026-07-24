# Experient Quest — Office RPG Prototype (3D)

A browser-based office RPG prototype. Walk around a small office, approach
interactive objects like the wall TV, and see meeting content in a React
overlay. Seed of an interactive technology status meeting.

Stack: **React + TypeScript + Vite**, **@react-three/fiber** (three.js) for
the 3D scene, **@react-three/rapier** for physics, **drei** for GLB/animation
helpers.

## Setup

```bash
npm install
npm run dev
```

## Commands

```bash
npm run dev             # start Vite dev server
npm run build           # type-check + production build
npm run preview         # preview the production build
npm run test            # vitest once
npm run test:watch      # vitest in watch mode
npm run test:e2e        # playwright smoke (dev server auto-started)
npm run test:e2e:install  # first-time: install Playwright browsers
npm run lint            # oxlint
npm run format          # prettier --write .
```

## Controls

```text
Move            WASD / Arrow keys
Run (toggle)    R
Jump            Space          — plays Man_RunningJump, carries velocity
Clap            C
Sit             X              — near a chair; press again to stand
Interact        E              — opens overlay in range of a stop
Close overlay   Escape / Close button
```

The camera is a fixed-offset third-person follow. Movement is world-relative
(W always moves the same direction). Movement is locked during jump / clap /
sit. The player can't leave the office — exterior doorways are sealed by
invisible `DoorBlocker` colliders (interior doorways stay open).

## Architecture at a glance

React owns the app shell, prompt, and overlay. R3F owns the 3D scene, physics,
and camera. They communicate through a typed event bus
(`src/game/events/GameEventBus.ts`) so neither side imports the other's
components.

```
React (HTML)                        R3F (canvas)
─ App shell                         ─ OfficeScene
─ GameCanvas (hosts <Canvas>)       ─ Floor / Walls / Hallway / …
─ InteractionPrompt                 ─ Player (Rapier capsule + GLB + camera)
─ ContentOverlay                    ─ InteractionManager (XZ-plane zones)
        ▲                                   │
        └───── typed event bus ─────────────┘
```

Events on the bus: `interaction:available` / `interaction:unavailable` /
`interaction:triggered` (R3F → React), `overlay:closed` (React → R3F).

## Docs

The `docs/` folder is the reference for detailed implementation, conventions,
and design notes:

| Task | Read first |
| --- | --- |
| Overall structure, new modules, refactors | [architecture.md](docs/architecture.md) |
| Player movement, camera, interactions, animations, NPCs | [gameplay-systems.md](docs/gameplay-systems.md) |
| Office layout, GLB imports, sprites, asset pipeline | [assets-and-content.md](docs/assets-and-content.md) |
| FPS, draw calls, mobile devices, quality profiles | [performance.md](docs/performance.md) |
| Unit + E2E testing, acceptance criteria | [testing.md](docs/testing.md) |
| Hosting, CDN, headers, CSP, releases | [deployment-and-security.md](docs/deployment-and-security.md) |
| Planning a feature, deciding what belongs in the MVP | [delivery-plan.md](docs/delivery-plan.md) |
| Accessibility: focus, keyboard, reduced motion, captions | [accessibility.md](docs/accessibility.md) |
| File naming, folder rules, import order, commit style | [conventions.md](docs/conventions.md) |

Working with an AI coding assistant? Start from
[CLAUDE.md](CLAUDE.md) — it's the routing document that points at the right
doc per task.

## What's in the box today

- Multi-room layout: 20×14 m conference room + south hallway with desk
  clusters, kitchen counter with sink, and a two-office NE alcove.
- Rigged GLB player with `Man_Idle` / `Man_Walk` / `Man_Run` blending, plus
  one-shot `Man_RunningJump` / `Man_Clapping` and toggleable `Man_Sitting`.
- Rapier physics: dynamic capsule player, static geometry, sealed exterior
  doorways.
- Fixed-offset third-person camera that lerps toward the player.
- One interaction zone in front of the east-wall TV; React modal overlay
  (ESC + close-button dismiss) with placeholder content.
- Unit tests for `InteractionManager` + Playwright smoke test.

## Future

- Level transitions on doorway exit (swap `DoorBlocker` for a sensor collider).
- Employee NPCs (billboards + optional rigged presenters).
- Camera modes: over-the-shoulder, first-person.
- Additional interactables (new-hires, jokes, project rooms).
- Audio + captions, touch controls, localStorage save state.
