/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';

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
        // The two fonts of the Angularian card (src/server/card), inlined in the server: about 60 KB.
        // And the brand font, Norse Bold, for the word "Angularian": downloaded by scripts/fetch-fonts.ts before the
        // build (its licence does not let us commit it), about 30 KB. Without it the cards set the word in Inter.
        serverAssets: [
          { baseName: 'card-fonts', dir: fileURLToPath(new URL('./src/server/card/fonts', import.meta.url)) },
          { baseName: 'brand-font', dir: fileURLToPath(new URL('./public/fonts', import.meta.url)) },
        ],
        routeRules: {
          // Pages change with the data, once a night with a new deploy (which clears the CDN): browsers revalidate,
          // the CDN keeps a page an hour and may serve a stale one for a day while it refreshes it.
          // 400s and 404s too: they only change with the data. The API routes set their own, longer browser cache.
          // Netlify-Vary: a copy per value of the signed-in hint cookie (app/src/app/auth/hint.ts), whose pages start
          // with the signed-in card's skeleton; every other cookie is ignored by the cache.
          '/**': { headers: { 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400', 'netlify-vary': 'cookie=angularians-signed-in' } },
          // Sign-in: per person, with cookies. Never in a shared cache.
          '/api/auth/**': { headers: { 'cache-control': 'private, no-store' } },
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
