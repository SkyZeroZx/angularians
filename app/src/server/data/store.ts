import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DataBundle } from './bundle'
import { ContributorsData } from './contributors'

/**
 * What `scripts/bundle-data.ts` writes next to this file, and the build copies next to the server
 * (`scripts/copy-data.ts`). Read at runtime, not imported: a full angular/angular run is ~25 MB of JSON, and compiled
 * into the server bundle (as an object or as one string) it runs the server build out of memory.
 */
export const DATA_FILE = 'bundle.generated.json'

let data: ContributorsData | undefined

/**
 * The data file in this module's folder or the closest folder above it, or in `src/server/data` of one of those:
 * dev runs this from the source and from `dist/.nitro/dev`, a build from the server's root.
 */
function findDataFile(): string {
  let dir = dirname(fileURLToPath(import.meta.url))
  for (;;) {
    for (const file of [join(dir, DATA_FILE), join(dir, 'src/server/data', DATA_FILE)]) {
      if (existsSync(file)) return file
    }
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`No ${DATA_FILE} above ${fileURLToPath(import.meta.url)}: run scripts/bundle-data.ts`)
    dir = parent
  }
}

/** The contributors of the bundled `data/`, read and indexed on first use. Shared by API routes and server functions. */
export function contributorsData(): ContributorsData {
  data ??= new ContributorsData(JSON.parse(readFileSync(findDataFile(), 'utf8')) as DataBundle)
  return data
}
