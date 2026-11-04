/**
 * Before `dev` and `build`: download the hero's display font, Norse Bold by Joël Carrouché, to public/fonts/.
 *
 * Its licence (free for personal and commercial use, and for embedding in web pages) does not let us share the
 * font file itself, so it is not in this repository: it is fetched from its download page and served unmodified
 * to visitors as a web font. Not fatal: without it the title falls back to a serif.
 */
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateRawSync } from 'node:zlib'

const URL = 'https://www.1001fonts.com/download/norse.zip'
const FILE = 'Norse-Bold.otf'
const target = join(dirname(fileURLToPath(import.meta.url)), '../public/fonts', FILE)

/** One file out of a zip archive, by its name, from the central directory. */
function unzipFile(zip: Buffer, name: string): Buffer | null {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  if (end < 0) return null
  let offset = zip.readUInt32LE(end + 16)
  for (let i = 0, count = zip.readUInt16LE(end + 10); i < count; i++) {
    const method = zip.readUInt16LE(offset + 10)
    const size = zip.readUInt32LE(offset + 20)
    const nameLength = zip.readUInt16LE(offset + 28)
    const local = zip.readUInt32LE(offset + 42)
    const entry = zip.toString('utf8', offset + 46, offset + 46 + nameLength)
    if (entry === name || entry.endsWith(`/${name}`)) {
      const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28)
      const data = zip.subarray(start, start + size)
      return method === 0 ? Buffer.from(data) : method === 8 ? inflateRawSync(data) : null
    }
    offset += 46 + nameLength + zip.readUInt16LE(offset + 30) + zip.readUInt16LE(offset + 32)
  }
  return null
}

// The folder is always there: the server build reads it (nitro.serverAssets), with or without the font.
await mkdir(dirname(target), { recursive: true })
if (existsSync(target)) {
  console.log(`Fonts: ${FILE} already in public/fonts`)
}
else {
  try {
    const response = await fetch(URL, { signal: AbortSignal.timeout(30_000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const font = unzipFile(Buffer.from(await response.arrayBuffer()), FILE)
    if (!font) throw new Error(`no ${FILE} in the archive`)
    await writeFile(target, font)
    console.log(`Fonts: downloaded ${FILE} (${Math.round(font.length / 1024)} KB) to public/fonts`)
  }
  catch (error) {
    console.warn(`Fonts: could not download ${FILE} from ${URL}, the hero title falls back to a serif:`, error instanceof Error ? error.message : error)
  }
}
