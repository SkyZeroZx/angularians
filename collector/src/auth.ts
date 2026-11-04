/**
 * The token of every request. A GitHub App (`COLLECT_APP_ID` and `COLLECT_APP_KEY`, its private key) has its own
 * 5,000 requests an hour, besides the personal token's; its installation tokens last an hour, so a run of several
 * hours gets a new one 10 minutes before the last one ends. Without the App: `GITHUB_TOKEN`, or none.
 */
import { createSign } from 'node:crypto'

const API = 'https://api.github.com'
const REFRESH_BEFORE_MS = 10 * 60 * 1000

let cached: { token: string, expiresAt: number } | null = null

export function usesApp(env = process.env): boolean {
  return Boolean(env['COLLECT_APP_ID'] && env['COLLECT_APP_KEY'])
}

export function hasToken(env = process.env): boolean {
  return usesApp(env) || Boolean(env['GITHUB_TOKEN'])
}

/** The JWT a GitHub App signs its own requests with: RS256, valid 9 minutes (GitHub allows 10), issued a minute early for clock drift. */
export function appJwt(appId: string, privateKey: string, now = Date.now()): string {
  const seconds = Math.floor(now / 1000)
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iat: seconds - 60, exp: seconds + 9 * 60, iss: appId })}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey).toString('base64url')
  return `${unsigned}.${signature}`
}

async function appRequest<T>(path: string, jwt: string, method = 'GET'): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { 'accept': 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': 'angularians-collector', 'authorization': `Bearer ${jwt}` },
  })
  const body = await response.text()
  if (!response.ok) throw new Error(`GitHub App: ${response.status} for ${path}: ${body.slice(0, 300)}`)
  return JSON.parse(body) as T
}

/** A new installation token of the App, from its installation on the repository the workflow runs in. */
async function installationToken(env: NodeJS.ProcessEnv, now: number): Promise<{ token: string, expiresAt: number }> {
  // Secrets pasted from a file can come with `\n` written out, or Windows line ends.
  const key = env['COLLECT_APP_KEY']!.replace(/\\n/g, '\n').replace(/\r/g, '').trim()
  const jwt = appJwt(env['COLLECT_APP_ID']!.trim(), key, now)
  const repo = env['GITHUB_REPOSITORY'] ?? 'erkamyaman/angularians'
  const installation = await appRequest<{ id: number }>(`/repos/${repo}/installation`, jwt)
  const { token, expires_at } = await appRequest<{ token: string, expires_at: string }>(`/app/installations/${installation.id}/access_tokens`, jwt, 'POST')
  return { token, expiresAt: Date.parse(expires_at) }
}

export async function currentToken(env = process.env, now = Date.now()): Promise<string | undefined> {
  if (!usesApp(env)) return env['GITHUB_TOKEN']
  if (!cached || cached.expiresAt - now < REFRESH_BEFORE_MS) {
    cached = await installationToken(env, now)
    console.log(`GitHub App token, valid until ${new Date(cached.expiresAt).toISOString()}`)
  }
  return cached.token
}

/** Tests only. */
export function resetTokenCache(): void {
  cached = null
}
