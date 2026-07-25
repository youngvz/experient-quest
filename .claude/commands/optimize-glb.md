---
description: Interactively prune animation clips and compress a GLB via scripts/optimize-glb.mjs
argument-hint: [path-to-glb]
---

Drive `scripts/optimize-glb.mjs` on the user's behalf so they don't have
to deal with terminal piping into an interactive Node prompt.

Follow this flow. Do not skip steps.

## 1. Resolve the target GLB

- If `$ARGUMENTS` is non-empty, treat it as the target path (relative to
  the repo root or absolute). Skip to step 2.
- Otherwise, list all GLBs the script knows about:
  ```
  find public/assets -type f -name "*.glb" -not -name "*.bak"
  ```
  If exactly one file exists, use it. Otherwise present the list to the
  user with `AskUserQuestion` and ask which one to optimize.

## 2. Inspect the file (non-destructive)

Run:

```
node scripts/optimize-glb.mjs <path> --inspect
```

This prints a JSON report with size, mesh/triangle/material/texture
counts, and every animation clip's `index`, `name`, and
`durationSeconds`. Parse the JSON.

## 3. Ask which clips to keep

Read the corresponding component (`src/game/scene/Player.tsx`,
`src/game/scene/Employee.tsx`, or the caller of `useGLTF(<path>)`) to
see which clip names are actually referenced — patterns like
`clipPatterns={[/wave/i, /idle/i]}` or explicit `.getAnimationClip(...)`
calls. Suggest a keep-set that covers every referenced pattern and
mention the ones you plan to drop.

Then use `AskUserQuestion` with the suggested keep-set as the
recommended option so the user can confirm or override. Present clip
choices as a multi-select of names — do NOT expose the raw numeric
indices to the user. Translate their selection back to a comma-separated
list of `index` values (from the JSON report) for `--keep=`.

If the user picks nothing, ask a confirmation question before dropping
every clip.

## 4. Ask about compression

Default: **Meshopt**. Drei's `useGLTF` in this repo handles Meshopt and
Draco natively with no loader changes. Only fall back to `none` if the
user explicitly asks; recommend against Draco unless they know the file
is static (no skinning), since Meshopt decodes faster.

Skip the question and use `meshopt` if the user's original request made
their preference obvious ("just meshopt it", etc.).

## 5. Run the optimizer

```
node scripts/optimize-glb.mjs <path> --keep=<indices> --compression=<meshopt|draco|none>
```

The script writes the optimized GLB to `<path>` and stashes the pre-run
file as `<path>.bak` (already gitignored). It prints a before/after
size summary — surface that summary to the user verbatim.

## 6. Report

Tell the user:

- Original size → new size (percent saved)
- Which clips were kept (by name) and how many were dropped
- Compression used
- Where the backup lives
- A one-line reminder: `npm run dev` and walk up to the character to
  confirm it still animates. If size looks off (< 10% reduction, or the
  file grew), suggest re-inspecting — the file may already be optimized.

## Notes

- Never invoke the script without `--keep` and `--compression`. The
  fully interactive prompt doesn't work through Claude's Bash tool
  (macOS pipe EOF closes readline early).
- `$ARGUMENTS` is: $ARGUMENTS
