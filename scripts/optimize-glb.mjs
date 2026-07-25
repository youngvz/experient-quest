#!/usr/bin/env node
// GLB optimizer — prunes animation clips and applies Meshopt / Draco
// geometry compression via glTF-Transform. Writes back in place with a
// .bak of the original.
//
// Two modes:
//
//   Interactive (default) — walks you through inspect → clip picker →
//   compression picker. Run from the repo root:
//     npm run optimize-glb
//     npm run optimize-glb -- public/assets/employees/foo.glb
//
//   Non-interactive (for scripting / slash-commands):
//     node scripts/optimize-glb.mjs <file> --inspect
//       Prints a JSON summary (size, meshes, textures, animation clip
//       names + durations) and exits without writing anything.
//     node scripts/optimize-glb.mjs <file> \
//       --keep=all|none|1,3,5 --compression=meshopt|draco|none
//       Runs the pipeline with no prompts.

import { writeFile, readdir, stat, rename, access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import {
  prune,
  dedup,
  resample,
  draco,
  meshopt,
} from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'
import draco3d from 'draco3dgltf'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS_ROOT = path.join(REPO_ROOT, 'public', 'assets')

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))
  const nonInteractive =
    flags.inspect || flags.keep !== undefined || flags.compression !== undefined

  const rl = nonInteractive ? null : createInterface({ input, output })
  try {
    const inputPath = await resolveInputPath(rl, positional[0])
    const originalBytes = (await stat(inputPath)).size

    const io = await createIO()
    const doc = await io.read(inputPath)

    if (flags.inspect) {
      console.log(JSON.stringify(inspectionReport(inputPath, originalBytes, doc), null, 2))
      return
    }

    if (!nonInteractive) {
      console.log('')
      console.log(`Loading ${path.relative(REPO_ROOT, inputPath)} (${fmtBytes(originalBytes)})`)
      printInspection(doc)
    }

    const originalClipCount = doc.getRoot().listAnimations().length

    if (nonInteractive) {
      applyClipSelection(doc, flags.keep ?? 'all')
    } else {
      await pickClipsInteractive(rl, doc)
    }

    const compressionChoice = nonInteractive
      ? normalizeCompression(flags.compression ?? 'meshopt')
      : await pickCompressionInteractive(rl)

    if (!nonInteractive) {
      console.log('')
      console.log('Optimizing…')
    }

    // prune + dedup are always safe wins; resample bakes constant tracks
    // out of the surviving animations losslessly.
    await doc.transform(prune(), dedup(), resample())

    if (compressionChoice === 'meshopt') {
      await MeshoptEncoder.ready
      await MeshoptDecoder.ready
      await doc.transform(
        meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
      )
    } else if (compressionChoice === 'draco') {
      await doc.transform(
        draco({ encodeSpeed: 5, decodeSpeed: 5 }),
      )
    }

    const outputBuffer = await io.writeBinary(doc)
    const backupPath = await stashBackup(inputPath)
    await writeFile(inputPath, outputBuffer)

    const finalBytes = outputBuffer.byteLength
    const finalClipCount = doc.getRoot().listAnimations().length

    console.log('')
    console.log('Done.')
    console.log('----------------------------------------------')
    console.log(`  Before:      ${fmtBytes(originalBytes)}`)
    console.log(
      `  After:       ${fmtBytes(finalBytes)}  ` +
        `(${fmtDelta(originalBytes, finalBytes)}, saved ${fmtBytes(originalBytes - finalBytes)})`,
    )
    console.log(`  Clips:       ${originalClipCount} → ${finalClipCount}`)
    console.log(`  Compression: ${compressionLabel(compressionChoice)}`)
    if (backupPath) {
      console.log(`  Backup:      ${path.relative(REPO_ROOT, backupPath)}`)
    } else {
      console.log('  Backup:      (skipped — existing .bak preserved)')
    }
    console.log('----------------------------------------------')
  } finally {
    rl?.close()
  }
}

function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (const tok of argv) {
    if (tok === '--inspect') flags.inspect = true
    else if (tok.startsWith('--keep=')) flags.keep = tok.slice('--keep='.length)
    else if (tok.startsWith('--compression=')) flags.compression = tok.slice('--compression='.length)
    else if (tok.startsWith('--')) throw new Error(`Unknown flag: ${tok}`)
    else positional.push(tok)
  }
  return { positional, flags }
}

async function resolveInputPath(rl, argvPath) {
  if (argvPath) {
    const resolved = path.isAbsolute(argvPath)
      ? argvPath
      : path.resolve(REPO_ROOT, argvPath)
    if (!resolved.toLowerCase().endsWith('.glb')) {
      throw new Error(`Not a .glb file: ${resolved}`)
    }
    await access(resolved, fsConstants.R_OK)
    return resolved
  }

  if (!rl) throw new Error('No input path provided (required in non-interactive mode)')

  const candidates = await findGlbs(ASSETS_ROOT)
  if (candidates.length === 0) {
    throw new Error(`No .glb files found under ${ASSETS_ROOT}`)
  }

  console.log('GLBs under public/assets/:')
  for (const [i, file] of candidates.entries()) {
    const size = (await stat(file)).size
    console.log(`  [${i + 1}] ${path.relative(REPO_ROOT, file)}  (${fmtBytes(size)})`)
  }
  const answer = (await rl.question('Pick one: ')).trim()
  const index = Number.parseInt(answer, 10) - 1
  if (Number.isNaN(index) || index < 0 || index >= candidates.length) {
    throw new Error(`Invalid selection: ${answer}`)
  }
  return candidates[index]
}

async function findGlbs(root) {
  const out = []
  async function walk(dir) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.glb')) {
        out.push(full)
      }
    }
  }
  await walk(root)
  return out.sort()
}

async function createIO() {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'meshopt.decoder': MeshoptDecoder,
      'meshopt.encoder': MeshoptEncoder,
    })
  await MeshoptDecoder.ready
  return io
}

function inspectionReport(inputPath, sizeBytes, doc) {
  const root = doc.getRoot()
  const meshes = root.listMeshes()
  const textures = root.listTextures()
  const animations = root.listAnimations()

  let triCount = 0
  for (const mesh of meshes) {
    for (const prim of mesh.listPrimitives()) {
      const indices = prim.getIndices()
      if (indices) triCount += indices.getCount() / 3
      else {
        const pos = prim.getAttribute('POSITION')
        if (pos) triCount += pos.getCount() / 3
      }
    }
  }

  let textureBytes = 0
  for (const tex of textures) {
    const img = tex.getImage()
    if (img) textureBytes += img.byteLength
  }

  return {
    path: path.relative(REPO_ROOT, inputPath),
    sizeBytes,
    meshes: meshes.length,
    triangles: Math.round(triCount),
    materials: root.listMaterials().length,
    textures: { count: textures.length, bytes: textureBytes },
    animations: animations.map((anim, i) => ({
      index: i + 1,
      name: anim.getName() || `(unnamed #${i + 1})`,
      durationSeconds: clipDuration(anim),
    })),
  }
}

function clipDuration(anim) {
  let duration = 0
  for (const sampler of anim.listSamplers()) {
    const inputAccessor = sampler.getInput()
    if (!inputAccessor) continue
    const arr = inputAccessor.getArray()
    if (!arr || arr.length === 0) continue
    const last = arr[arr.length - 1]
    if (last > duration) duration = last
  }
  return Number(duration.toFixed(3))
}

function printInspection(doc) {
  const root = doc.getRoot()
  const meshes = root.listMeshes()
  const materials = root.listMaterials()
  const textures = root.listTextures()
  const animations = root.listAnimations()

  let triCount = 0
  for (const mesh of meshes) {
    for (const prim of mesh.listPrimitives()) {
      const indices = prim.getIndices()
      if (indices) triCount += indices.getCount() / 3
      else {
        const pos = prim.getAttribute('POSITION')
        if (pos) triCount += pos.getCount() / 3
      }
    }
  }

  let textureBytes = 0
  for (const tex of textures) {
    const img = tex.getImage()
    if (img) textureBytes += img.byteLength
  }

  console.log('')
  console.log('Contents:')
  console.log(`  Meshes:     ${meshes.length}`)
  console.log(`  Triangles:  ${Math.round(triCount).toLocaleString()}`)
  console.log(`  Materials:  ${materials.length}`)
  console.log(`  Textures:   ${textures.length}  (${fmtBytes(textureBytes)})`)
  console.log(`  Animations: ${animations.length}`)
}

function applyClipSelection(doc, spec) {
  const animations = doc.getRoot().listAnimations()
  if (animations.length === 0) return
  const keep = parseKeepSpec(spec, animations.length)
  animations.forEach((anim, i) => {
    if (!keep.has(i)) anim.dispose()
  })
}

function parseKeepSpec(spec, total) {
  const s = String(spec).trim().toLowerCase()
  if (s === '' || s === 'all') return new Set(Array.from({ length: total }, (_, i) => i))
  if (s === 'none') return new Set()
  const keep = new Set(
    s.split(',')
      .map((tok) => Number.parseInt(tok.trim(), 10) - 1)
      .filter((n) => Number.isInteger(n) && n >= 0 && n < total),
  )
  if (keep.size === 0) throw new Error(`No valid clip indices in --keep="${spec}" (1..${total})`)
  return keep
}

async function pickClipsInteractive(rl, doc) {
  const animations = doc.getRoot().listAnimations()
  if (animations.length === 0) {
    console.log('')
    console.log('No animation clips to prune.')
    return
  }

  console.log('')
  console.log('Animation clips:')
  animations.forEach((anim, i) => {
    const name = anim.getName() || `(unnamed #${i + 1})`
    console.log(`  [${i + 1}] ${name}  (${clipDuration(anim).toFixed(2)}s)`)
  })

  const answer = (
    await rl.question('Keep which clips? (e.g. "1,3", "all", "none"): ')
  )
    .trim()
    .toLowerCase()

  if (answer === 'none') {
    const confirm = (
      await rl.question('Drop every clip? Rigged characters usually need at least one. [y/N]: ')
    )
      .trim()
      .toLowerCase()
    if (confirm !== 'y' && confirm !== 'yes') {
      console.log('Keeping all clips.')
      return
    }
  }

  applyClipSelection(doc, answer === '' ? 'all' : answer)
  console.log(`Kept ${doc.getRoot().listAnimations().length} clip(s).`)
}

async function pickCompressionInteractive(rl) {
  console.log('')
  console.log('Geometry compression:')
  console.log('  [1] Meshopt   (recommended — decoded by drei out of the box)')
  console.log('  [2] Draco     (smaller for static meshes; CDN decoder)')
  console.log('  [3] None')
  const answer = (await rl.question('Pick [1]: ')).trim()
  if (answer === '' || answer === '1') return 'meshopt'
  if (answer === '2') return 'draco'
  if (answer === '3') return 'none'
  throw new Error(`Invalid selection: ${answer}`)
}

function normalizeCompression(value) {
  const v = String(value).trim().toLowerCase()
  if (v === '' || v === 'meshopt') return 'meshopt'
  if (v === 'draco') return 'draco'
  if (v === 'none') return 'none'
  throw new Error(`Invalid --compression="${value}" (expected meshopt|draco|none)`)
}

async function stashBackup(inputPath) {
  const backupPath = `${inputPath}.bak`
  try {
    await access(backupPath, fsConstants.F_OK)
  } catch {
    await rename(inputPath, backupPath)
    return backupPath
  }
  // .bak already exists — that's the pristine original. Preserve it.
  console.log(
    `Existing backup at ${path.relative(REPO_ROOT, backupPath)}; leaving it untouched.`,
  )
  return null
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function fmtDelta(before, after) {
  if (before === 0) return '0%'
  const pct = ((after - before) / before) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function compressionLabel(choice) {
  if (choice === 'meshopt') return 'Meshopt'
  if (choice === 'draco') return 'Draco'
  return 'none'
}

main().catch((err) => {
  console.error('')
  console.error(err?.message ?? err)
  process.exitCode = 1
})
