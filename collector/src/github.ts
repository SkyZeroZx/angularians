/**
 * A small GitHub REST/GraphQL client on `fetch`: auth, `Link` pagination, and waits on rate limits.
 * `GITHUB_TOKEN` is optional for search, required for GraphQL.
 */

const API = 'https://api.github.com'
const USER_AGENT = 'angularians-collector'
const MAX_ATTEMPTS = 6
/** A rate-limit wait longer than this fails the run instead: the next nightly run starts over. */
const MAX_WAIT_MS = 65 * 60 * 1000

export class GitHubError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function headers(token: string | undefined): Record<string, string> {
  return {
    'accept': 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': USER_AGENT,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  }
}

/** How long to wait before retrying a response, or `null` when retrying will not help. */
export function retryDelay(status: number, responseHeaders: Headers, attempt: number, now = Date.now()): number | null {
  const retryAfter = Number(responseHeaders.get('retry-after'))
  if (retryAfter > 0) return retryAfter * 1000
  const remaining = responseHeaders.get('x-ratelimit-remaining')
  const reset = Number(responseHeaders.get('x-ratelimit-reset'))
  if ((status === 403 || status === 429) && remaining === '0' && reset > 0) {
    return Math.max(1000, reset * 1000 - now + 1000)
  }
  // Secondary rate limits come without a reset time: back off.
  if (status === 429 || status === 403) return responseHeaders.has('x-ratelimit-remaining') ? 60_000 * attempt : null
  if (status >= 500) return 2000 * 2 ** attempt
  return null
}

export async function request(url: string, init: RequestInit = {}, token = process.env['GITHUB_TOKEN']): Promise<Response> {
  const target = url.startsWith('http') ? url : `${API}${url}`
  for (let attempt = 1; ; attempt++) {
    let response: Response
    try {
      response = await fetch(target, { ...init, headers: { ...headers(token), ...init.headers as Record<string, string> } })
    }
    catch (error) {
      if (attempt >= MAX_ATTEMPTS) throw error
      await sleep(2000 * 2 ** attempt)
      continue
    }
    if (response.ok) return response
    const delay = retryDelay(response.status, response.headers, attempt)
    const body = await response.text()
    if (delay === null || attempt >= MAX_ATTEMPTS || delay > MAX_WAIT_MS) {
      throw new GitHubError(response.status, `GitHub ${response.status} for ${target}: ${body.slice(0, 300)}`)
    }
    console.warn(`GitHub ${response.status}, retrying in ${Math.round(delay / 1000)}s (${target})`)
    await sleep(delay)
  }
}

/**
 * A JSON response and its headers. The body is read inside the retries: on a long run GitHub sometimes closes
 * the connection mid-body ("other side closed"), which `fetch` only reports while reading it.
 */
export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<{ data: T, headers: Headers }> {
  for (let attempt = 1; ; attempt++) {
    const response = await request(url, init)
    try {
      return { data: JSON.parse(await response.text()) as T, headers: response.headers }
    }
    catch (error) {
      if (attempt >= MAX_ATTEMPTS) throw error
      console.warn(`Reading ${url} failed (${error instanceof Error ? error.message : error}), retrying`)
      await sleep(2000 * 2 ** attempt)
    }
  }
}

export async function getJson<T>(url: string): Promise<T> {
  return (await fetchJson<T>(url)).data
}

/** The `rel="next"` URL of a `Link` header. */
export function nextLink(link: string | null): string | null {
  for (const part of link?.split(',') ?? []) {
    const match = /<([^>]+)>\s*;\s*rel="next"/.exec(part)
    if (match) return match[1]!
  }
  return null
}

/** Every page of a list endpoint, one array per page. */
export async function* paginate<T>(url: string): AsyncGenerator<T[]> {
  let next: string | null = url
  while (next) {
    const { data, headers } = await fetchJson<T[]>(next)
    yield data
    next = nextLink(headers.get('link'))
  }
}

export async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<{ data: T | null, errors?: Array<{ type?: string, message?: string }> }> {
  if (!process.env['GITHUB_TOKEN']) throw new GitHubError(401, 'GraphQL needs GITHUB_TOKEN')
  return (await fetchJson<{ data: T | null, errors?: Array<{ type?: string, message?: string }> }>('/graphql', { method: 'POST', body: JSON.stringify({ query, variables }) })).data
}
