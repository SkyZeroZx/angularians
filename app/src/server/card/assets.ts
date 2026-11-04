import { useStorage } from 'nitropack/runtime'
import type { CardFonts } from './card'

let fonts: Promise<CardFonts> | undefined

/** The two fonts of the cards, from the server assets (`nitro.serverAssets` in vite.config.ts); loaded once, retried on failure. */
export function cardFonts(): Promise<CardFonts> {
  return (fonts ??= (async () => {
    const storage = useStorage('assets:card-fonts')
    const [regular, semibold] = await Promise.all([
      storage.getItemRaw<Buffer>('inter-latin-400-normal.woff'),
      storage.getItemRaw<Buffer>('inter-latin-600-normal.woff'),
    ])
    if (!regular || !semibold) throw new Error('The card fonts are missing from the server assets')
    return { regular, semibold }
  })().catch((error: unknown) => {
    fonts = undefined
    throw error
  }))
}

/** An avatar as a data URL, or `null`: a card still renders without it. `pixels`: its size on the card, ×2. */
export async function avatarData(githubId: number, pixels = 352): Promise<string | null> {
  try {
    const response = await fetch(`https://avatars.githubusercontent.com/u/${githubId}?s=${pixels}&v=4`, { signal: AbortSignal.timeout(5000) })
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !/^image\/(png|jpeg|gif|webp)$/.test(type)) return null
    return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`
  }
  catch {
    return null
  }
}
