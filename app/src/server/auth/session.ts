import { createError, getRequestURL, useSession, type H3Event } from 'h3'

/**
 * Sign in with GitHub, through the `angularians-collector` GitHub App's user authorization (OAuth web flow).
 * Only who you are is kept: your GitHub id and login, in a sealed, http-only cookie. GitHub's access token is used
 * once, to ask who signed in, and never stored.
 *
 * Netlify environment variables: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET (32+ characters).
 */
export interface AuthSession {
  githubId?: number
  login?: string
  /** The OAuth `state` of a sign-in in progress, against forged callbacks. */
  state?: string
  /** Where to go after signing in: a path of this site. */
  returnTo?: string
}

/** What `GET /api/auth/me` answers. */
export interface SignedIn {
  /** False when the site has no sign-in set up: the button is not shown. */
  enabled: boolean
  /** Rank and score all time, `null` with no contribution yet. */
  user: { githubId: number, login: string, rank: number | null, score: number | null } | null
}

const MAX_AGE = 60 * 60 * 24 * 30

export function authConfig(): { clientId: string, clientSecret: string, password: string } | null {
  const clientId = process.env['GITHUB_CLIENT_ID']
  const clientSecret = process.env['GITHUB_CLIENT_SECRET']
  const password = process.env['SESSION_SECRET']
  if (!clientId || !clientSecret || !password || password.length < 32) return null
  return { clientId, clientSecret, password }
}

export function requireAuthConfig(): NonNullable<ReturnType<typeof authConfig>> {
  const config = authConfig()
  if (!config) throw createError({ statusCode: 503, statusMessage: 'Sign-in is not set up on this site' })
  return config
}

export function authSession(event: H3Event, password: string) {
  return useSession<AuthSession>(event, {
    password,
    name: 'angularians-session',
    maxAge: MAX_AGE,
    cookie: { httpOnly: true, sameSite: 'lax', path: '/', secure: getRequestURL(event).protocol === 'https:' },
  })
}

export function callbackUrl(event: H3Event): string {
  return `${getRequestURL(event).origin}/api/auth/callback`
}
