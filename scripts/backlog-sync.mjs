#!/usr/bin/env node
// Regenerates the index table in features/backlog/README.md from the
// frontmatter of each features/backlog/*.md file. Run with --check to
// verify the index is up to date without writing (exit 1 if stale).

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')
const BACKLOG_DIR = join(REPO_ROOT, 'features', 'backlog')
const README = join(BACKLOG_DIR, 'README.md')
const START = '<!-- BACKLOG:START -->'
const END = '<!-- BACKLOG:END -->'

const STATUS_ORDER = ['in-progress', 'next', 'backlog', 'blocked', 'done']

function parseFrontmatter(text, file) {
  if (!text.startsWith('---\n')) {
    throw new Error(`${file}: missing YAML frontmatter`)
  }
  const end = text.indexOf('\n---', 4)
  if (end === -1) throw new Error(`${file}: unterminated frontmatter`)
  const block = text.slice(4, end)
  const meta = { 'depends-on': [] }
  let key = null
  for (const rawLine of block.split('\n')) {
    if (!rawLine.trim()) continue
    const listMatch = rawLine.match(/^\s+-\s+(.+)$/)
    if (listMatch && key) {
      meta[key].push(listMatch[1].trim())
      continue
    }
    const kv = rawLine.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/)
    if (!kv) continue
    key = kv[1]
    const value = kv[2].trim()
    if (value === '') {
      meta[key] = []
    } else {
      meta[key] = value
    }
  }
  return meta
}

function firstHeading(text) {
  const match = text.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function collectItems() {
  const files = readdirSync(BACKLOG_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort()
  return files.map((file) => {
    const path = join(BACKLOG_DIR, file)
    const text = readFileSync(path, 'utf8')
    const meta = parseFrontmatter(text, file)
    const title = firstHeading(text) ?? meta.id ?? file.replace(/\.md$/, '')
    const status = meta.status ?? 'backlog'
    const deps = Array.isArray(meta['depends-on']) ? meta['depends-on'] : []
    return { file, title, status, deps }
  })
}

function renderTable(items) {
  const sorted = [...items].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status)
    const bi = STATUS_ORDER.indexOf(b.status)
    const aRank = ai === -1 ? STATUS_ORDER.length : ai
    const bRank = bi === -1 ? STATUS_ORDER.length : bi
    if (aRank !== bRank) return aRank - bRank
    return a.title.localeCompare(b.title)
  })
  const rows = sorted.map(
    (item) =>
      `| ${item.status} | [${item.title}](./${item.file}) | ${
        item.deps.length ? item.deps.join(', ') : '—'
      } |`,
  )
  return [
    START,
    '| Status | Item | Depends on |',
    '|---|---|---|',
    ...rows,
    END,
  ].join('\n')
}

function replaceBlock(readme, block) {
  const startIdx = readme.indexOf(START)
  const endIdx = readme.indexOf(END)
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(
      `README.md is missing ${START} / ${END} markers — restore them before running sync.`,
    )
  }
  return readme.slice(0, startIdx) + block + readme.slice(endIdx + END.length)
}

function main() {
  const check = process.argv.includes('--check')
  const items = collectItems()
  const table = renderTable(items)
  const current = readFileSync(README, 'utf8')
  const next = replaceBlock(current, table)
  if (check) {
    if (next !== current) {
      console.error(
        'features/backlog/README.md is out of date. Run `npm run backlog:sync`.',
      )
      process.exit(1)
    }
    return
  }
  if (next === current) {
    console.log('features/backlog/README.md already up to date.')
    return
  }
  writeFileSync(README, next)
  console.log(`Updated features/backlog/README.md (${items.length} item${items.length === 1 ? '' : 's'}).`)
}

main()
