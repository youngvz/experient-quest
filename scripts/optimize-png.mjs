#!/usr/bin/env node
// PNG optimizer — resizes with nearest-neighbor (preserves pixel-art
// crispness), palette-quantizes to indexed PNG8, and recompresses at
// max zlib effort. Overwrites the input in place with a .png.bak of
// the original.
//
// Path-agnostic: takes any .png. The caller (CLI or slash command) is
// responsible for enumerating multiple files.
//
// Two modes:
//
//   Interactive (default) — walks you through inspect → size picker
//   → palette picker. Run from the repo root:
//     npm run optimize-png
//     npm run optimize-png -- public/assets/employees/foo.png
//
//   Non-interactive (for scripting / slash commands):
//     node scripts/optimize-png.mjs <path> --inspect
//       Prints a JSON summary (size, width, height, channels, hasAlpha)
//       and exits without writing anything.
//     node scripts/optimize-png.mjs <path> \
//       --max=<pixels> --palette=on|off --colors=<N>
//       Runs the pipeline with no prompts. Defaults: --max=768
//       --palette=on --colors=256.

import { writeFile, readdir, stat, rename, access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import sharp from 'sharp'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS_ROOT = path.join(REPO_ROOT, 'public', 'assets')

const DEFAULTS = { max: 768, palette: true, colors: 256 }

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))
  const nonInteractive =
    flags.inspect ||
    flags.max !== undefined ||
    flags.palette !== undefined ||
    flags.colors !== undefined

  const rl = nonInteractive ? null : createInterface({ input, output })
  try {
    const inputPath = await resolveInputPath(rl, positional[0])
    const originalBytes = (await stat(inputPath)).size
    const meta = await sharp(inputPath).metadata()

    if (flags.inspect) {
      console.log(JSON.stringify(inspectionReport(inputPath, originalBytes, meta), null, 2))
      return
    }

    if (!nonInteractive) {
      console.log('')
      console.log(`Loading ${path.relative(REPO_ROOT, inputPath)} (${fmtBytes(originalBytes)})`)
      printInspection(meta)
    }

    const max = nonInteractive
      ? parseIntFlag(flags.max, 'max', DEFAULTS.max)
      : await pickMaxInteractive(rl)
    const palette = nonInteractive
      ? parseBoolFlag(flags.palette, 'palette', DEFAULTS.palette)
      : await pickPaletteInteractive(rl)
    const colors = nonInteractive
      ? clampColors(parseIntFlag(flags.colors, 'colors', DEFAULTS.colors))
      : DEFAULTS.colors

    if (!nonInteractive) {
      console.log('')
      console.log(`Optimizing at max=${max}, palette=${palette ? 'on' : 'off'}, colors=${colors}…`)
    }

    const outputBuffer = await sharp(inputPath)
      .resize(max, max, { fit: 'inside', kernel: 'nearest', withoutEnlargement: true })
      .png({
        palette,
        colors,
        quality: 100,
        effort: 10,
        compressionLevel: 9,
      })
      .toBuffer()

    const outMeta = await sharp(outputBuffer).metadata()
    const backupPath = await stashBackup(inputPath)
    await writeFile(inputPath, outputBuffer)

    console.log('')
    console.log('Done.')
    console.log('----------------------------------------------')
    console.log(`  Before:      ${fmtBytes(originalBytes)}  ${meta.width}x${meta.height}`)
    console.log(
      `  After:       ${fmtBytes(outputBuffer.byteLength)}  ${outMeta.width}x${outMeta.height}  ` +
        `(${fmtDelta(originalBytes, outputBuffer.byteLength)}, saved ${fmtBytes(originalBytes - outputBuffer.byteLength)})`,
    )
    console.log(`  Max:         ${max}px`)
    console.log(`  Palette:     ${palette ? `on (${colors} colors)` : 'off'}`)
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
    else if (tok.startsWith('--max=')) flags.max = tok.slice('--max='.length)
    else if (tok.startsWith('--palette=')) flags.palette = tok.slice('--palette='.length)
    else if (tok.startsWith('--colors=')) flags.colors = tok.slice('--colors='.length)
    else if (tok.startsWith('--')) throw new Error(`Unknown flag: ${tok}`)
    else positional.push(tok)
  }
  return { positional, flags }
}

function parseIntFlag(value, name, fallback) {
  if (value === undefined) return fallback
  const n = Number.parseInt(String(value), 10)
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid --${name}="${value}" (expected a positive integer)`)
  }
  return n
}

function parseBoolFlag(value, name, fallback) {
  if (value === undefined) return fallback
  const v = String(value).trim().toLowerCase()
  if (v === 'on' || v === 'true' || v === '1' || v === 'yes') return true
  if (v === 'off' || v === 'false' || v === '0' || v === 'no') return false
  throw new Error(`Invalid --${name}="${value}" (expected on|off)`)
}

function clampColors(n) {
  if (n < 2) return 2
  if (n > 256) return 256
  return n
}

async function resolveInputPath(rl, argvPath) {
  if (argvPath) {
    const resolved = path.isAbsolute(argvPath)
      ? argvPath
      : path.resolve(REPO_ROOT, argvPath)
    if (!resolved.toLowerCase().endsWith('.png')) {
      throw new Error(`Not a .png file: ${resolved}`)
    }
    if (resolved.toLowerCase().endsWith('.png.bak')) {
      throw new Error(`Refusing to optimize a .bak backup: ${resolved}`)
    }
    await access(resolved, fsConstants.R_OK)
    return resolved
  }

  if (!rl) throw new Error('No input path provided (required in non-interactive mode)')

  const candidates = await findPngs(ASSETS_ROOT)
  if (candidates.length === 0) {
    throw new Error(`No .png files found under ${ASSETS_ROOT}`)
  }

  console.log('PNGs under public/assets/:')
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

async function findPngs(root) {
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
      } else if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith('.png') &&
        !entry.name.toLowerCase().endsWith('.png.bak')
      ) {
        out.push(full)
      }
    }
  }
  await walk(root)
  return out.sort()
}

function inspectionReport(inputPath, sizeBytes, meta) {
  return {
    path: path.relative(REPO_ROOT, inputPath),
    sizeBytes,
    width: meta.width ?? null,
    height: meta.height ?? null,
    channels: meta.channels ?? null,
    hasAlpha: meta.hasAlpha ?? null,
    colorspace: meta.space ?? null,
  }
}

function printInspection(meta) {
  console.log('')
  console.log('Contents:')
  console.log(`  Dimensions: ${meta.width ?? '?'}x${meta.height ?? '?'}`)
  console.log(`  Channels:   ${meta.channels ?? '?'}`)
  console.log(`  Alpha:      ${meta.hasAlpha ? 'yes' : 'no'}`)
  console.log(`  Colorspace: ${meta.space ?? '?'}`)
}

async function pickMaxInteractive(rl) {
  console.log('')
  console.log('Max side length (px). Portrait CSS frame is 192px on desktop, 96px on mobile.')
  console.log(`  [Enter] Default ${DEFAULTS.max} (3×DPR + headroom)`)
  console.log('  or type a number, e.g. 512')
  const answer = (await rl.question(`Max [${DEFAULTS.max}]: `)).trim()
  if (answer === '') return DEFAULTS.max
  const n = Number.parseInt(answer, 10)
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid max: ${answer}`)
  return n
}

async function pickPaletteInteractive(rl) {
  console.log('')
  console.log('Palette quantization (indexed PNG8) — big savings for pixel-art.')
  console.log('  [1] on  (default, recommended)')
  console.log('  [2] off (truecolor RGBA)')
  const answer = (await rl.question('Pick [1]: ')).trim()
  if (answer === '' || answer === '1') return true
  if (answer === '2') return false
  throw new Error(`Invalid selection: ${answer}`)
}

async function stashBackup(inputPath) {
  const backupPath = `${inputPath}.bak`
  try {
    await access(backupPath, fsConstants.F_OK)
  } catch {
    await rename(inputPath, backupPath)
    return backupPath
  }
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

main().catch((err) => {
  console.error('')
  console.error(err?.message ?? err)
  process.exitCode = 1
})
