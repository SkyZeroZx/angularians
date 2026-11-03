/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    analog({
      // No static pages: `/` reads `?period=` and `?country=`, so a build-time `index.html` would show the
      // default board for every shared link until the browser corrected it. Every page is server-rendered.
      prerender: { routes: [] },
      nitro: {
        routeRules: {
          // Pages change with the data, once a night with a new deploy (which clears the CDN): browsers revalidate,
          // the CDN keeps a page an hour and may serve a stale one for a day while it refreshes it.
          // 400s and 404s too: they only change with the data. The API routes set their own, longer browser cache.
          '/**': { headers: { 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' } },
          // Hashed file names: never change.
          '/assets/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
        },
      },
    }),
    tailwindcss(),
    // The Spartan helm components are `@spartan-ng/helm/*` paths in tsconfig.json (src/ui).
    tsconfigPaths(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
  },
}));
