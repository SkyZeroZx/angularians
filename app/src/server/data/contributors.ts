// Ported in spirit from the nuxt.com Nuxters API routes (`server/api/nuxters/*`, `server/api/map/nuxters.get.ts`,
// `server/api/search/nuxters.get.ts`), MIT, Copyright (c) 2022-2023 NuxtLabs. Here they read an in-memory
// bundle instead of a database.
import {
  sortPeriods,
  type Contributor,
  type ContributorProfile,
  type ContributorsMap,
  type ContributorSummary,
  type CountryStats,
  type LeaderboardPage,
  type Period,
  type ProfileRecord,
} from '@angularians/shared'
import type { DataBundle } from './bundle'

/** 10 rows of the 10-column avatar grid. */
export const DEFAULT_PAGE_SIZE = 100
export const MAX_PAGE_SIZE = 100
export const SEARCH_LIMIT = 8
const TOP_PER_COUNTRY = 3

export interface LeaderboardQuery {
  period: Period
  country?: string | null
  /** 1-based */
  page?: number
  pageSize?: number
}

/** Indexes over a bundle, built once per server instance. */
export class ContributorsData {
  readonly periods: Period[]
  readonly collectedAt: string | null
  private readonly byPeriod: Map<Period, Contributor[]>
  /** Period → lowercased username → contributor */
  private readonly byUsername = new Map<Period, Map<string, Contributor>>()
  private readonly profiles: Map<number, ProfileRecord>

  constructor(bundle: DataBundle) {
    this.byPeriod = new Map(Object.entries(bundle.periods))
    // Only periods with someone in them are offered: an empty year is not worth a tab.
    this.periods = sortPeriods([...this.byPeriod].filter(([, rows]) => rows.length).map(([period]) => period))
    this.collectedAt = bundle.meta?.collectedAt ?? null
    this.profiles = new Map(bundle.profiles.map(profile => [profile.githubId, profile]))
    for (const [period, rows] of this.byPeriod) {
      this.byUsername.set(period, new Map(rows.map(row => [row.username.toLowerCase(), row])))
    }
  }

  hasPeriod(period: Period): boolean {
    return this.byPeriod.has(period)
  }

  countryOf(githubId: number): string | null {
    return this.profiles.get(githubId)?.country ?? null
  }

  /** One page of a period, optionally of one country. Ranks stay the global ones: "#12 overall, 1st in TR". */
  leaderboard({ period, country = null, page = 1, pageSize = DEFAULT_PAGE_SIZE }: LeaderboardQuery): LeaderboardPage {
    const all = this.byPeriod.get(period) ?? []
    const rows = country ? all.filter(row => this.countryOf(row.githubId) === country) : all
    const size = Math.min(Math.max(1, Math.floor(pageSize)), MAX_PAGE_SIZE)
    const start = (Math.max(1, Math.floor(page)) - 1) * size
    return {
      period,
      country,
      periods: this.periods,
      total: rows.length,
      landedPullRequests: rows.reduce((sum, row) => sum + row.pullRequests.all, 0),
      items: rows.slice(start, start + size).map(toSummary),
      collectedAt: this.collectedAt,
    }
  }

  /** All-time stats, every period the contributor is in, and their profile links. `null` when unknown. */
  profile(username: string): ContributorProfile | null {
    const key = username.toLowerCase()
    const allTime = this.byUsername.get('all')?.get(key)
    if (!allTime) return null
    const links = this.profiles.get(allTime.githubId)
    return {
      ...allTime,
      periods: this.periods.flatMap((period) => {
        const row = this.byUsername.get(period)?.get(key)
        return row ? [{ period, rank: row.rank, score: row.score, pullRequests: row.pullRequests }] : []
      }),
      name: links?.name ?? null,
      website: links?.website ?? null,
      socialAccounts: links?.socialAccounts ?? [],
      country: links?.country ?? null,
    }
  }

  /** All-time contributors by username: prefix matches first, then anywhere in the username or name, by rank. */
  search(query: string, limit = SEARCH_LIMIT): ContributorSummary[] {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const prefix: Contributor[] = []
    const other: Contributor[] = []
    for (const row of this.byPeriod.get('all') ?? []) {
      const username = row.username.toLowerCase()
      if (username.startsWith(q)) prefix.push(row)
      else if (username.includes(q) || this.profiles.get(row.githubId)?.name?.toLowerCase().includes(q)) other.push(row)
      if (prefix.length >= limit) break
    }
    return [...prefix, ...other].slice(0, limit).map(toSummary)
  }

  /** Contributors of a period by country, from the most to the fewest, each with its best ranked usernames. */
  map(period: Period): ContributorsMap {
    const rows = this.byPeriod.get(period) ?? []
    const countries = new Map<string, CountryStats>()
    let located = 0
    // Rows are ranked, so the first ones seen in a country are its best.
    for (const row of rows) {
      const code = this.countryOf(row.githubId)
      if (!code) continue
      located++
      let stats = countries.get(code)
      if (!stats) {
        stats = { code, count: 0, top: [] }
        countries.set(code, stats)
      }
      stats.count++
      if (stats.top.length < TOP_PER_COUNTRY) stats.top.push(row.username)
    }
    return {
      period,
      total: rows.length,
      located,
      countries: [...countries.values()].sort((a, b) => b.count - a.count || a.code.localeCompare(b.code)),
    }
  }
}

function toSummary({ githubId, username, rank, score }: Contributor): ContributorSummary {
  return { githubId, username, rank, score }
}
