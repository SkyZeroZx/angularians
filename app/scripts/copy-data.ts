/**
 * After `build`: copy the data bundle into the server's folder, where `src/server/data/store.ts` reads it at runtime.
 * Netlify ships every file of the function folder with it.
 */
import { copyFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = join(dirname(fileURLToPath(import.meta.url)), '..')
const data = join(app, 'src/server/data/bundle.generated.json')
const exists = (path: string) => stat(path).then(() => true, () => false)

// Nitro writes the server to dist/analog/server, or on Netlify to netlify/functions/server.
const servers = ['dist/analog/server', 'netlify/functions/server'].map(dir => join(app, dir))
let copied = 0
for (const server of servers) {
  if (!(await exists(server))) continue
  await copyFile(data, join(server, 'bundle.generated.json'))
  console.log(`Data: ${server}/bundle.generated.json`)
  copied++
}
if (!copied) throw new Error(`No server folder to copy the data to (${servers.join(', ')})`)
