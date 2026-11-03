/**
 * After `build`, on Netlify only (netlify.toml sets NITRO_PRESET=netlify): copy the server function that Nitro
 * wrote to dist/analog/server into .netlify/functions-internal/server, the folder Netlify always reads next to
 * the app. A `functions` path in netlify.toml is resolved from the site's base directory instead, and pointed
 * nowhere when that was `app/`: every page and API route was a 404.
 */
import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.env['NITRO_PRESET'] !== 'netlify') process.exit(0)

const app = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(app, 'dist/analog/server')
const to = join(app, '.netlify/functions-internal/server')

await stat(join(from, 'server.mjs')).catch(() => {
  throw new Error(`No Netlify function at ${from}/server.mjs: is Nitro's netlify preset on?`)
})
await rm(to, { recursive: true, force: true })
await mkdir(dirname(to), { recursive: true })
await cp(from, to, { recursive: true, verbatimSymlinks: true })
console.log(`Netlify function: ${from} → ${to}`)
