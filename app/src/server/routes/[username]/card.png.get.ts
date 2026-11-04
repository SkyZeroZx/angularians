import { createError, defineEventHandler, getQuery, getRouterParam, setResponseHeader } from 'h3'
import * as v from 'valibot'
import { avatarData, cardFonts } from '../../card/assets'
import { cardPeriod, cardTree, renderCard } from '../../card/card'
import { UsernameSchema } from '../../data/schemas'
import { contributorsData } from '../../data/store'

/**
 * `GET /:username/card.png?period=2025`: the Angularian card, for GitHub profile READMEs and the profile's link
 * preview. The URL never changes; the numbers do, every night.
 */
export default defineEventHandler(async (event) => {
  const username = v.safeParse(UsernameSchema, getRouterParam(event, 'username', { decode: true }))
  if (!username.success) throw createError({ statusCode: 400, statusMessage: 'Not a GitHub username' })
  const profile = contributorsData().profile(username.output)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'No contributions for this username' })

  const period = cardPeriod(profile, getQuery(event)['period'])
  const png = await renderCard(cardTree(profile, period, await avatarData(profile.githubId)), await cardFonts())
  setResponseHeader(event, 'content-type', 'image/png')
  // A day in shared caches (GitHub's image proxy too): each night's deploy clears the CDN.
  setResponseHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
  return png
})
