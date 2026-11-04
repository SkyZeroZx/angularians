import { createError, defineEventHandler, getQuery, getRouterParam, setResponseHeader } from 'h3'
import { useStorage } from 'nitropack/runtime'
import * as v from 'valibot'
import { cardPeriod, cardTree, renderCard, type CardFonts } from '../../card/card'
import { UsernameSchema } from '../../data/schemas'
import { contributorsData } from '../../data/store'

let fonts: Promise<CardFonts> | undefined

async function loadFonts(): Promise<CardFonts> {
  const storage = useStorage('assets:card-fonts')
  const [regular, semibold] = await Promise.all([
    storage.getItemRaw<Buffer>('inter-latin-400-normal.woff'),
    storage.getItemRaw<Buffer>('inter-latin-600-normal.woff'),
  ])
  if (!regular || !semibold) throw new Error('The card fonts are missing from the server assets')
  return { regular, semibold }
}

/** The avatar as a data URL, or `null`: the card still renders without it. */
async function avatar(githubId: number): Promise<string | null> {
  try {
    const response = await fetch(`https://avatars.githubusercontent.com/u/${githubId}?s=352&v=4`, { signal: AbortSignal.timeout(5000) })
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !/^image\/(png|jpeg|gif|webp)$/.test(type)) return null
    return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`
  }
  catch {
    return null
  }
}

/**
 * `GET /:username/card.png?period=2025`: the Angularian card, for GitHub profile READMEs and the profile's link
 * preview. The URL never changes; the numbers do, every night.
 */
export default defineEventHandler(async (event) => {
  const username = v.safeParse(UsernameSchema, getRouterParam(event, 'username', { decode: true }))
  if (!username.success) throw createError({ statusCode: 400, statusMessage: 'Not a GitHub username' })
  const profile = contributorsData().profile(username.output)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'No contributions for this username' })

  // Loaded once; a failed load is tried again on the next request.
  const loading = (fonts ??= loadFonts().catch((error: unknown) => {
    fonts = undefined
    throw error
  }))
  const period = cardPeriod(profile, getQuery(event)['period'])
  const png = await renderCard(cardTree(profile, period, await avatar(profile.githubId)), await loading)
  setResponseHeader(event, 'content-type', 'image/png')
  // A day in shared caches (GitHub's image proxy too): each night's deploy clears the CDN.
  setResponseHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
  return png
})
