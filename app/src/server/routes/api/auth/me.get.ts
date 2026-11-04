import { defineEventHandler } from 'h3'
import { contributorsData } from '../../../data/store'
import { authConfig, authSession, type SignedIn } from '../../../auth/session'

/** `GET /api/auth/me`: who is signed in, and their all-time rank. Never cached: it is per person. */
export default defineEventHandler(async (event): Promise<SignedIn> => {
  const config = authConfig()
  if (!config) return { enabled: false, user: null }
  const { data } = await authSession(event, config.password)
  if (!data.githubId || !data.login) return { enabled: true, user: null }
  const profile = contributorsData().profile(data.login)
  // The login on record must be the same account: a renamed or reused login is someone else's board entry.
  const own = profile && profile.githubId === data.githubId ? profile : null
  return { enabled: true, user: { githubId: data.githubId, login: data.login, rank: own?.rank ?? null, score: own?.score ?? null } }
})
