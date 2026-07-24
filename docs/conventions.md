# Conventions

Small, boring rules so contributors and Claude sessions don't reinvent them.

## File and folder naming

- **React components**: `PascalCase` folder containing a matching `PascalCase.tsx` and colocated `PascalCase.css` — e.g. `src/components/InteractionPrompt/InteractionPrompt.tsx` + `InteractionPrompt.css`.
- **Scene primitives (R3F)**: `PascalCase.tsx` files directly under `src/game/scene/` — no folder unless the primitive grows extra files (its own hook, its own material module).
- **Logic modules and constants**: `camelCase.ts` — e.g. `src/game/interactions/interactionTypes.ts`, `src/game/constants/gameConstants.ts`.
- **Hooks**: `useThing.ts`, camelCase, under `src/hooks/`.
- **Types-only files**: allowed when a shared shape has no runtime code (`someThingTypes.ts`).

Don't create a generic `components/` catch-all for scene entities. UI-only DOM components live under `src/components/`; 3D entities live under `src/game/scene/` or `src/game/entities/` if you introduce it.

## When a subfolder is warranted

Give something its own folder when at least one is true:

- It has more than one file that belongs together (`.tsx` + `.css`, or component + its own hook).
- It's the natural home for future files (a station renderer that will grow tests, sub-parts, or fixtures).

Otherwise leave it as a single file next to its peers.

## Import order

Blank line between groups. Within a group, editor order is fine — don't hand-sort:

1. React and standard library
2. Third-party packages (`@react-three/*`, `three`, `zustand`, etc.)
3. Internal absolute-ish imports (starting `..`)
4. Sibling relative imports (`./`)
5. Stylesheet import last

Example:

```ts
import { useCallback, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { gameEvents } from '../../game/events/GameEventBus'
import { StopBody } from './StopBody'
import './ContentOverlay.css'
```

## Comments

Default to no comments. Add a comment only when the **why** is not obvious from the code: a hidden constraint, a subtle invariant, a browser workaround, or a design decision a future reader would try to "clean up."

- Don't restate what the code does.
- Don't reference the task, PR, or ticket that produced the code — that belongs in commit messages.
- Keep them one line where possible. Long docstrings are almost never needed.

## Commits

- Short imperative subject, capitalized, no trailing period: `Replace Phaser 2D with react-three-fiber 3D scene`.
- Body only when the change needs justification the diff can't show (perf tradeoff, invariant restored, breaking change).
- Group unrelated changes into separate commits when practical.

## TypeScript

- `strict` mode is on. Prefer `unknown` + narrowing over `any`.
- Use discriminated unions for variant content (see `PresentationStop.content`).
- Prefer inferred return types on internal functions; annotate public APIs.
- `verbatimModuleSyntax` is on — use `import type { ... }` for type-only imports.

## Styling

- Component CSS lives next to the component.
- Prefer real CSS (no CSS-in-JS runtime). Custom properties for theming when needed.
- Avoid deep selector nesting; use flat class names on the component root.
