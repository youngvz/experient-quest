/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` controls the URL prefix baked into asset paths at build time.
// - GitHub Pages project site: '/experient-quest/' (default here)
// - Custom domain / S3+CloudFront at the root: set DEPLOY_BASE=/
// See docs/deployment-and-security.md for the full matrix.
const base = process.env.DEPLOY_BASE ?? '/experient-quest/'

export default defineConfig({
  base,
  plugins: [react()],
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
