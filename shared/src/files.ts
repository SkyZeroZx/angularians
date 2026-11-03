// Ported from nuxt.com `shared/utils/nuxters.ts` (`parseNuxtersFile`, `parseNuxterProfilesFile`, `safeNuxterUrl`)
// and nuxt/nuxters `saveContributors` (MIT, Copyright (c) 2022-2023 NuxtLabs, Copyright (c) 2023 Nuxt).
import { countryCode } from './countries.ts'
import { compareRecords, emptyCounts, score } from './scoring.ts'
import type { Contributor, ProfileRecord, PullRequestCounts, SocialAccount } from './types.ts'

/** The all-time profiles of the contributors: not a period. */
export const PROFILES_FILE = 'profiles.json'

/** One record per line: valid JSON, readable diffs, and about half the size of indented JSON. */
export function toJsonLines(records: readonly unknown[]): string {
  return `[\n${records.map(record => JSON.stringify(record)).join(',\n')}\n]\n`
}

function count(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0
}

function githubId(value: unknown): number | null {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const MAX_TEXT_LENGTH = 200
/** GitHub logins are 39 characters at most. */
const MAX_LOGIN_LENGTH = 39
const MAX_SOCIAL_ACCOUNTS = 10

function text(value: unknown, max = MAX_TEXT_LENGTH): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null
}

/**
 * Validate a contributor file and rank it: score, then username.
 * The score is recomputed from the PR counts, so the file cannot rank anyone higher than their PRs.
 * Invalid entries and duplicates are skipped, not fatal: one bad record must not block the import.
 */
export function parseContributorsFile(data: unknown): Contributor[] {
  if (!Array.isArray(data)) throw new TypeError('A contributors file must be an array')

  const contributors: Contributor[] = []
  const seen = new Set<number>()
  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const id = githubId(record['githubId'])
    const username = text(record['username'], MAX_LOGIN_LENGTH)
    if (id === null || !username || seen.has(id)) continue
    seen.add(id)

    const prs = (record['pullRequests'] && typeof record['pullRequests'] === 'object' ? record['pullRequests'] : {}) as Record<string, unknown>
    const pullRequests: PullRequestCounts = { ...emptyCounts(), feat: count(prs['feat']), fix: count(prs['fix']), docs: count(prs['docs']), chore: count(prs['chore']) }
    pullRequests.all = pullRequests.feat + pullRequests.fix + pullRequests.docs + pullRequests.chore

    const first = typeof record['firstContributionAt'] === 'string' ? new Date(record['firstContributionAt']) : null
    contributors.push({
      githubId: id,
      username,
      rank: 0,
      score: score(pullRequests),
      pullRequests,
      firstContributionAt: first && !Number.isNaN(first.getTime()) ? first.toISOString() : null,
    })
  }

  contributors.sort(compareRecords)
  contributors.forEach((contributor, index) => {
    contributor.rank = index + 1
  })
  return contributors
}

/** An `http(s)` URL, normalized, or `null`: profile links are user input, rendered as `href`. */
export function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  }
  catch {
    return null
  }
}

/**
 * Validate `profiles.json`. Invalid entries and links are skipped, not fatal, and so is a profile
 * left with no name, website, social account or country.
 */
export function parseProfilesFile(data: unknown): ProfileRecord[] {
  if (!Array.isArray(data)) throw new TypeError(`${PROFILES_FILE} must be an array`)

  const profiles: ProfileRecord[] = []
  const seen = new Set<number>()
  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const id = githubId(record['githubId'])
    const username = text(record['username'], MAX_LOGIN_LENGTH)
    if (id === null || !username || seen.has(id)) continue

    const socialAccounts: SocialAccount[] = []
    for (const account of Array.isArray(record['socialAccounts']) ? record['socialAccounts'] : []) {
      if (socialAccounts.length >= MAX_SOCIAL_ACCOUNTS) break
      if (!account || typeof account !== 'object') continue
      const { provider, url, displayName } = account as Record<string, unknown>
      const href = safeUrl(url)
      if (typeof provider !== 'string' || !/^[a-z]{1,32}$/.test(provider) || !href) continue
      socialAccounts.push({ provider, url: href, displayName: text(displayName) ?? href })
    }

    const name = text(record['name'])
    const website = safeUrl(record['website'])
    const country = countryCode(record['country'])
    if (!name && !website && !socialAccounts.length && !country) continue
    seen.add(id)
    profiles.push({ githubId: id, username, name, website, socialAccounts, country })
  }
  return profiles
}
