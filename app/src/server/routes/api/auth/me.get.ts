import { defineEventHandler } from 'h3'
import { contributorsData } from '../../../data/store'
import { authConfig, authSession, setSignedInHint, type SignedIn } from '../../../auth/session'

/** `GET /api/auth/me`: who is signed in, their profile and badges, for the home page card. Never cached: it is per person. */
export default defineEventHandler(async (event): Promise<SignedIn> => {
  const config = authConfig()
  if (!config) {
    setSignedInHint(event, false)
    return { enabled: false, user: null }
  }
  const { data } = await authSession(event, config.password)
  // The hint follows the session: an expired session clears it, a live one keeps it (and sets it for sessions from
  // before the hint existed).
  setSignedInHint(event, Boolean(data.githubId && data.login))
  if (!data.githubId || !data.login) return { enabled: true, user: null }
  const data_ = contributorsData()
  // By GitHub id: stable when the account is renamed.
  const angularian = data_.profileById(data.githubId)
  const badges = [
    ...(angularian && (angularian.pullRequests.all || angularian.helpfulIssues || angularian.helpfulComments) ? ['Angularian'] : []),
    ...(data_.isTeamMember(data.githubId) ? ['Angular team'] : []),
  ]
  return { enabled: true, user: { githubId: data.githubId, login: angularian?.username ?? data.login, angularian, badges } }
})
