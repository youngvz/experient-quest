# Accessibility

CLAUDE.md lists accessibility as non-negotiable. This document is the how.

## Overlays and focus

`src/components/ContentOverlay/ContentOverlay.tsx` is the canonical pattern. New overlays must match its behavior:

- Root panel uses `role="dialog"` and `aria-modal="true"`.
- Title is an `<h2>` with an `id`, referenced from `aria-labelledby`.
- On open: remember `document.activeElement`, then focus the primary close/dismiss control.
- On close: restore focus to the remembered element, or fall back to `#game-container`.
- Escape closes the overlay.
- Clicking the backdrop closes; clicks inside the panel do not bubble.
- Movement, input consumption, and interaction detection pause while an overlay is open (already handled by the `overlay:closed` / `controlsDisabled` chain — do not duplicate).

A single close control is enough — no full focus trap is required for the current overlay shape. If a future overlay adds more than one focusable control, wrap them with a proper focus trap (start from the pattern above, add `Tab` cycling).

## Keyboard traversal

- Every actionable UI element must be reachable via keyboard alone.
- Never rely on hover to reveal a control that has no keyboard equivalent.
- Preserve visible focus styles — do not blanket-remove `:focus` outlines. If replacing the default outline, use `:focus-visible` with a clearly contrasting ring.
- Keep the WASD/E/Escape scheme documented in the README as the authoritative controls list; controls hints in the UI must stay in sync.

## Reduced motion

Honor `prefers-reduced-motion: reduce`. When it is set, dampen or disable:

- Camera sway and idle bob.
- Long camera transitions between stops (jump-cut instead).
- Decorative sprite/billboard idle animation.
- Screen shake and parallax.

Player movement itself is user-driven and stays enabled. Do not gate core interaction on this preference.

Implementation notes:

- Prefer a small `useReducedMotion()` hook backed by `matchMedia('(prefers-reduced-motion: reduce)')` and its `change` event, so scenes can subscribe once.
- Route the flag into R3F systems through the Zustand store (or a `useRef` mirror) rather than props that trigger re-renders.

## Text, contrast, and captions

- Body text meets WCAG AA contrast (≥ 4.5:1) against the panel background. Verify when introducing new color tokens.
- Provide captions or transcripts for any audio or video content once audio ships (see `docs/gameplay-systems.md` — Audio).
- Any in-world text rendered on 3D surfaces should have an accessible fallback in the overlay UI when it carries meeting-critical information.

## Testing hooks

When Playwright coverage grows, add checks for:

- The interaction prompt is announced (`aria-live="polite"`, already in place).
- Escape closes the overlay and focus returns to the previously focused element.
- A `prefers-reduced-motion: reduce` context does not break the boot or interaction flow.
- Tab order through the overlay is predictable.
