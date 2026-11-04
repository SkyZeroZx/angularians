import { defineEventHandler, sendRedirect } from 'h3'
import { authConfig, authSession, setSignedInHint } from '../../../auth/session'

/** `POST /api/auth/logout` (a form, so no other site can sign you out with a link). */
export default defineEventHandler(async (event) => {
  const config = authConfig()
  if (config) await (await authSession(event, config.password)).clear()
  setSignedInHint(event, false)
  return sendRedirect(event, '/', 303)
})
