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
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
