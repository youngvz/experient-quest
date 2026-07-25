---
id: lazy-load-rapier-behind-title-screen
status: backlog
created: 2026-07-25
owner: unassigned
depends-on:
  - title-screen
---

# Lazy-load Rapier behind the title screen

## Why

`rapier-*.js` is the largest chunk we ship: **~2.26 MB raw / ~850 kB gzipped**
(build output on 2026-07-25). It sits on the critical path to first
interactive frame because `<Physics>` is imported at the top of
`OfficeWorld.tsx`.

Once we add a title screen, we have a natural gate: the user is on a static
DOM screen and doesn't need physics yet. Deferring the Rapier download until
they press "Start" gets the title screen paint down to essentially just the
React + entry chunk (~30 kB gzipped), and hides the Rapier fetch behind a
`requestIdleCallback` prefetch so pressing Start still feels instant.

## Scope

- Add `phase: 'title' | 'playing'` to `src/game/state/gameStore.ts`.
- New `src/components/TitleScreen/` — pure DOM, no `<Canvas>`. Renders while
  `phase === 'title'`.
- Move `<Physics>` and everything under it into a lazy-loaded module (e.g.
  `PhysicsWorld.tsx` or keep it inside `OfficeWorld.tsx`, which is already
  lazy-loaded from `OfficeScene.tsx`).
- Gate the `<GameCanvas />` (or the world subtree) on `phase === 'playing'`.
- Idle-prefetch the world chunk from the title screen via
  `requestIdleCallback` (fallback to `setTimeout(..., 200)` for Safari).
- Defer `useGLTF.preload(...)` calls in `OfficeWorld` behind the same gate
  (already effect-scoped, but confirm they don't fire before mount).

## Non-goals

- Intro flow / cutscene (TBD, tracked separately once designed).
- Reduced-motion or quality-profile UI on the title screen (belongs with
  a11y work in `docs/accessibility.md`).
- Splitting Rapier further inside its own chunk (rapier3d-compat WASM is
  what it is).

## Acceptance criteria

- First paint on cold load shows the title screen without downloading the
  `rapier-*.js` chunk (verify in DevTools Network panel).
- Pressing Start transitions to the game with no perceptible delay on a
  warm cache; on a cold press, a brief loading state is acceptable.
- `npm run build` still passes; the Rapier chunk is still isolated in its
  own file (existing `manualChunks` config in `vite.config.ts:22-32`).
- Playwright smoke updated to click "Start" before asserting canvas
  renders. Zero new console errors.
- No regressions in `npm run test` or `npm run lint`.

## Implementation notes

- Rapier is already in its own manual chunk — see
  [vite.config.ts:22-32](../../vite.config.ts). No bundler changes needed.
- `OfficeScene.tsx` already lazy-imports `OfficeWorld`. The simplest
  approach is to render `<OfficeScene>` only when `phase === 'playing'`;
  everything downstream is already code-split.
- Watch for StrictMode double-mount when wiring the phase transition —
  the same gotcha noted for `InteractionManager` in CLAUDE.md applies to
  any zone/interaction registration that lives inside the world subtree.

## Rough estimate

~100 lines. One PR. Bundles cleanly with the title screen implementation.

## Related

- Parent feature: title screen (not yet in backlog).
- Reference: build log discussion 2026-07-25 (Rolldown chunk size warning
  on `rapier-*.js`).
