/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

// `--mode app` builds the one-file app (see scripts/build-app.mjs): no service worker, every asset inlined.
// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  ...(mode === 'app' && {
    build: { outDir: '.app-build', assetsInlineLimit: Number.MAX_SAFE_INTEGER, cssCodeSplit: false, modulePreload: false },
  }),
  define: { __APP_VERSION__: JSON.stringify(process.env.APP_VERSION ?? pkg.version) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      disable: mode === 'app',
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Marketing-KPI-Rechner',
        short_name: 'KPI-Rechner',
        lang: 'de',
        description: 'Offline-Rechner für Marketing-KPIs: Online, TV, Radio, Print, Out-of-Home und Mailing.',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'] },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
}))
