import type { ContributorProfile } from '@angularians/shared'
import { createError, deleteCookie, getCookie, getRequestURL, setCookie, useSession, type H3Event } from 'h3'
import { SIGNED_IN_HINT } from '../../app/auth/hint'

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

/** What `GET /api/auth/me` answers (nuxt.com's `NuxterMe`, without Discord). */
export interface SignedIn {
  /** False when the site has no sign-in set up: the card says so instead of offering a sign-in that fails. */
  enabled: boolean
  user: {
    githubId: number
    login: string
    /** The signed-in account's profile, by GitHub id; `null` with no contribution yet. */
    angularian: ContributorProfile | null
    /** `Angularian` (a merged PR, a helpful issue or a helpful comment), `Angular team`. */
    badges: string[]
  } | null
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

/** The hint cookie (`app/auth/hint.ts`): set while signed in, cleared otherwise. Readable by the page, it holds no data. */
export function setSignedInHint(event: H3Event, signedIn: boolean): void {
  if (signedIn) {
    setCookie(event, SIGNED_IN_HINT, '1', { path: '/', sameSite: 'lax', secure: getRequestURL(event).protocol === 'https:', maxAge: MAX_AGE })
  }
  else if (getCookie(event, SIGNED_IN_HINT)) {
    deleteCookie(event, SIGNED_IN_HINT, { path: '/' })
  }
}

export function callbackUrl(event: H3Event): string {
  return `${getRequestURL(event).origin}/api/auth/callback`
}
