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
