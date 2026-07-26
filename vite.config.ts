/// <reference types="vitest/config" />
import { readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` controls the URL prefix baked into asset paths at build time.
// - GitHub Pages project site: '/experient-quest/' (default here)
// - Custom domain / S3+CloudFront at the root: set DEPLOY_BASE=/
// See docs/deployment-and-security.md for the full matrix.
const base = process.env.DEPLOY_BASE ?? '/experient-quest/'

// scripts/optimize-{glb,png}.mjs stash pre-optimization backups next to
// their inputs as *.bak. Those live in public/ so the scripts can find
// them for rollback, but Vite copies public/ verbatim into dist/ — this
// plugin evicts them from the built output.
function stripBackupsFromDist(): Plugin {
  return {
    name: 'strip-backup-files',
    apply: 'build',
    async closeBundle() {
      const outDir = path.resolve(__dirname, 'dist')
      const removed: string[] = []
      async function walk(dir: string) {
        const entries = await readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) await walk(full)
          else if (entry.name.endsWith('.bak')) {
            await rm(full)
            removed.push(path.relative(outDir, full))
          }
        }
      }
      try {
        await walk(outDir)
      } catch {
        return
      }
      if (removed.length) {
        this.info?.(`strip-backup-files: removed ${removed.length} .bak file(s) from dist/`)
      }
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), stripBackupsFromDist()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@react-three/rapier') || id.includes('@dimforge/rapier3d-compat')) {
            return 'rapier'
          }
          if (id.includes('@react-three/fiber')) return 'r3f'
          if (id.includes('@react-three/drei')) return 'drei'
          if (id.includes('three-stdlib') || /[\\/]three[\\/]/.test(id)) return 'three'
          if (id.includes('zustand')) return 'state'
          if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
