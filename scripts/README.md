# scripts/

Offline tooling for experient-quest. Not shipped with the app — its
`node_modules/` lives here and is ignored by the root `.gitignore`.

## Install

```bash
cd scripts && npm install
```

## optimize-glb

Prunes unused animation clips, then applies Meshopt (default) or Draco
geometry compression. Overwrites the input in place and stashes the
pre-script file as `<name>.glb.bak` next to it.

### Interactive

```bash
npm run optimize-glb                                        # menu
npm run optimize-glb -- public/assets/employees/foo.glb     # direct
```

Walks through: contents summary → clip picker → compression picker → run.

### Non-interactive

```bash
node scripts/optimize-glb.mjs <path> --inspect
# prints a JSON report (size, meshes, textures, clip names + durations)
# and exits without writing anything

node scripts/optimize-glb.mjs <path> \
  --keep=all|none|<comma-separated-indices> \
  --compression=meshopt|draco|none
# runs the pipeline with no prompts
```

`--keep` indices are 1-based and match the `index` field from
`--inspect` output. `--compression` defaults to `meshopt` if omitted.

### Claude slash command

`.claude/commands/optimize-glb.md` drives the non-interactive mode:
Claude inspects the file, checks which clips are actually referenced by
the loading component, asks you to confirm the keep-set + compression,
then runs the script.

```
/optimize-glb                                       (asks which GLB)
/optimize-glb public/assets/employees/foo.glb       (direct)
```

Meshopt and Draco output are both decoded by drei's `useGLTF` without
loader changes. KTX2/Basis textures are not written by this script.

## optimize-png

Downsizes pixel-art PNGs to a max side length using nearest-neighbor
(preserves crisp pixels), palette-quantizes to indexed PNG8, and
recompresses at max zlib effort. Overwrites the input in place and
stashes the pre-script file as `<name>.png.bak` next to it.

Path-agnostic — the script only takes one PNG at a time. Loop it if
you're processing a directory.

### Interactive

```bash
npm run optimize-png                                          # menu
npm run optimize-png -- public/assets/employees/foo.png       # direct
```

Walks through: metadata summary → max-size picker → palette picker → run.

### Non-interactive

```bash
node scripts/optimize-png.mjs <path> --inspect
# prints JSON (size, width, height, channels, hasAlpha, colorspace)
# and exits without writing anything

node scripts/optimize-png.mjs <path> \
  --max=<pixels> \
  --palette=on|off \
  --colors=<2..256>
# runs the pipeline with no prompts
```

Defaults: `--max=768` (3×DPR headroom for a 192-px CSS frame),
`--palette=on`, `--colors=256`.

### Claude slash command

`.claude/commands/optimize-png.md` drives the non-interactive mode:
Claude inspects the target(s), reads `DialogueOverlay.css` to pick a
sensible max size, and loops the script over every matching PNG.

```
/optimize-png                                       (asks which PNGs)
/optimize-png public/assets/employees/               (whole directory)
/optimize-png public/assets/player/youngvz.png       (single file)
```
