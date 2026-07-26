---
description: Resize and palette-compress one or more PNGs via scripts/optimize-png.mjs
argument-hint: [path-or-dir]
---

Drive `scripts/optimize-png.mjs` on the user's behalf. The script is
path-agnostic — this command is responsible for enumerating files when
the user hands over a directory or nothing at all.

Follow this flow. Do not skip steps.

## 1. Resolve target PNGs

- If `$ARGUMENTS` is a single `.png` file, that's the only target.
- If it's a directory, enumerate every non-`.bak` PNG under it:
  ```
  find <dir> -type f -name "*.png" -not -name "*.png.bak"
  ```
- If `$ARGUMENTS` is empty, do the same over `public/assets/` and use
  `AskUserQuestion` (multi-select on relative paths) to let the user
  narrow the set. Offer "all of them" as one option.

If the resolved set is empty, stop and say so.

## 2. Inspect each file (non-destructive)

For each target, run:

```
node scripts/optimize-png.mjs <path> --inspect
```

Parse the JSON — you'll get `sizeBytes`, `width`, `height`, `channels`,
`hasAlpha`, `colorspace`. Aggregate the totals (count, total bytes,
distinct dimensions). If every file already has `max(width, height) <=
768`, tell the user the set is likely already optimized and confirm
before proceeding.

## 3. Pick a max size

Read `src/components/DialogueOverlay/DialogueOverlay.css` to see the
actual CSS render size for portraits (currently `192px` desktop,
`96px` mobile). Multiply by 3 for retina headroom and round: `--max=768`
is the recommended default and covers 3×DPR.

If the user already named a size in their request ("resize to 512" etc.),
skip the prompt. Otherwise offer:

- `768` — 3×DPR + headroom (recommended)
- `512` — tight, 2×DPR only
- `1024` — conservative, 4×DPR-ready

via `AskUserQuestion`.

## 4. Pick palette mode

Default: `--palette=on`. Pixel-art with a small color count is a big win
here. Only turn palette off if the user says the portrait needs full
truecolor or reports banding after a prior run.

Skip the question by default. Ask only if the user's message hinted at
soft/photographic content ("photo portrait", "gradient", "smooth
shading").

## 5. Run the optimizer

Loop over each target:

```
node scripts/optimize-png.mjs <path> --max=<N> --palette=<on|off> --colors=256
```

One invocation per file — the script does not accept multiple positional
arguments. The script overwrites `<path>` in place and stashes the
pre-run file as `<path>.bak` (already gitignored). Each call prints a
before/after summary.

## 6. Report

Surface:

- Per-file: `<name>: <before> → <after>  (<delta>%)`
- Totals: files processed, cumulative bytes before/after, cumulative
  saved
- Where backups landed
- One-line verify tip: `npm run dev`, open any dialogue (walk up to
  Distasi in the corridor pocket and press Enter) to eyeball a portrait.
  Look for banding on soft alpha edges — if visible, offer to re-run
  the affected file with `--palette=off`.

If any file grew or saved <5%, flag it — likely already optimized.

## Notes

- Never invoke the script without at least one flag. Interactive
  readline breaks through Claude's Bash tool (macOS pipe EOF).
- The script refuses paths ending in `.png.bak` — safe to loop over
  `find` output without filtering.
- `.png.bak` is gitignored globally.
- `$ARGUMENTS` is: $ARGUMENTS
