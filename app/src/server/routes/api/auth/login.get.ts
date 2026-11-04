import { randomUUID } from 'node:crypto'
import { defineEventHandler, getQuery, sendRedirect } from 'h3'
import { safeReturnTo } from '../../../auth/return-to'
import { authSession, callbackUrl, requireAuthConfig } from '../../../auth/session'

/** `GET /api/auth/login?returnTo=/path`: off to GitHub to sign in. */
export default defineEventHandler(async (event) => {
  const config = requireAuthConfig()
  const session = await authSession(event, config.password)
  const state = randomUUID()
  await session.update({ state, returnTo: safeReturnTo(getQuery(event)['returnTo']) })
  const url = new URL('https://github.com/login/oauth/authorize')
  url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: callbackUrl(event), state }).toString()
  return sendRedirect(event, url.toString(), 302)
})
