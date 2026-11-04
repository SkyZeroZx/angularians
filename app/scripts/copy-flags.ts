/**
 * Before `dev`, `build` and `test`: copy the round flag of every country the site can show from the circle-flags
 * package (MIT, https://github.com/HatScripts/circle-flags) to public/flags/<code>.svg. Generated, not committed.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { COUNTRIES } from '@angularians/shared'

const here = dirname(fileURLToPath(import.meta.url))
const source = join(dirname(createRequire(import.meta.url).resolve('circle-flags/package.json')), 'flags')
const target = join(here, '../public/flags')

await mkdir(target, { recursive: true })
const missing: string[] = []
for (const code of Object.keys(COUNTRIES)) {
  const file = `${code.toLowerCase()}.svg`
  await copyFile(join(source, file), join(target, file)).catch(() => missing.push(code))
}
console.log(`Flags: ${Object.keys(COUNTRIES).length - missing.length} copied to public/flags${missing.length ? `, none for ${missing.join(' ')}` : ''}`)
