/**
 * After `build`, for Netlify only (netlify.toml sets NITRO_PRESET=netlify): make sure the server function is in a
 * folder Netlify reads by itself, whatever the site's base or package directory.
 *
 * - On Netlify (NETLIFY=true), Analog already writes it to netlify/functions/server, the folder netlify.toml
 *   points `functions` at. Nothing to do.
 * - Anywhere else (a local `netlify build`), Nitro writes it to dist/analog/server: copy it to
 *   .netlify/functions-internal/server, Netlify's internal functions folder.
 */
import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.env['NITRO_PRESET'] !== 'netlify') process.exit(0)

const app = join(dirname(fileURLToPath(import.meta.url)), '..')
const exists = (path: string) => stat(path).then(() => true, () => false)

if (await exists(join(app, 'netlify/functions/server/server.mjs'))) {
  console.log('Netlify function: netlify/functions/server (the `functions` folder of netlify.toml)')
  process.exit(0)
}

const from = join(app, 'dist/analog/server')
const to = join(app, '.netlify/functions-internal/server')
if (!(await exists(join(from, 'server.mjs')))) {
  throw new Error(`No Netlify function in netlify/functions/server or ${from}: is Nitro's netlify preset on?`)
}
await rm(to, { recursive: true, force: true })
await mkdir(dirname(to), { recursive: true })
await cp(from, to, { recursive: true, verbatimSymlinks: true })
console.log(`Netlify function: ${from} → ${to}`)
