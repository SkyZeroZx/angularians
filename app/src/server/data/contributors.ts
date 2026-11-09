// Ported in spirit from the nuxt.com Nuxters API routes (`server/api/nuxters/*`, `server/api/map/nuxters.get.ts`,
// `server/api/search/nuxters.get.ts`), MIT, Copyright (c) 2022-2023 NuxtLabs. Here they read an in-memory
// bundle instead of a database.
import {
  sortPeriods,
  type BadgeFilter,
  type BadgeMatch,
  type Contributor,
  type ContributorProfile,
  type ContributorsMap,
  type EncodedCalendar,
  type ContributorSummary,
  type CountryStats,
  type LeaderboardPage,
  type Period,
  type ProfileRecord,
} from '@angularians/shared'
import { indexBadges, type BadgeIndex } from '../../app/profile/badge-filters'
import { earnedBadges } from '../../app/profile/earned-badges'
import type { DataBundle } from './bundle'

/** 10 rows of the 10-column avatar grid. */
export const DEFAULT_PAGE_SIZE = 100
export const MAX_PAGE_SIZE = 100
export const SEARCH_LIMIT = 8
const TOP_PER_COUNTRY = 3

export interface LeaderboardQuery {
  period: Period
  country?: string | null
  badges?: readonly string[]
  /** Keep anyone with at least one of the badges, or only those with all of them. */
  match?: BadgeMatch
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
  private readonly packages: Map<number, Array<{ name: string, pullRequests: number }>>
  private readonly calendar: EncodedCalendar
  private readonly team: Set<number>
  /** GitHub id → username, all time. */
  private readonly usernames: Map<number, string>
  /** Old username, lowercased → GitHub id. */
  private readonly renames: Map<string, number>
  private badgeIndex?: BadgeIndex

  constructor(bundle: DataBundle) {
    this.byPeriod = new Map(Object.entries(bundle.periods))
    // Only periods with someone in them are offered: an empty year is not worth a tab.
    this.periods = sortPeriods([...this.byPeriod].filter(([, rows]) => rows.length).map(([period]) => period))
    this.collectedAt = bundle.meta?.collectedAt ?? null
    this.profiles = new Map(bundle.profiles.map(profile => [profile.githubId, profile]))
    this.packages = new Map(bundle.packages.map(record => [record.githubId, record.packages]))
    this.calendar = bundle.calendar
    this.team = new Set(bundle.team.map(member => member.githubId))
    this.usernames = new Map((this.byPeriod.get('all') ?? []).map(row => [row.githubId, row.username]))
    this.renames = new Map(bundle.renames.map(record => [record.username.toLowerCase(), record.githubId]))
    for (const [period, rows] of this.byPeriod) {
      this.byUsername.set(period, new Map(rows.map(row => [row.username.toLowerCase(), row])))
    }
  }

  /** The profile of a GitHub account by id: stable when the account is renamed. `null` when it has no contribution. */
  profileById(githubId: number): ContributorProfile | null {
    const username = this.usernames.get(githubId)
    return username ? this.profile(username) : null
  }

  isTeamMember(githubId: number): boolean {
    return this.team.has(githubId)
  }

  hasPeriod(period: Period): boolean {
    return this.byPeriod.has(period)
  }

  /**
   * What the sitemap lists: the profiles of everyone with a merged PR, best ranked first, and the countries that have
   * contributors. At most `limit` profiles (a sitemap file holds 50,000 URLs).
   */
  sitemap(limit: number): { usernames: string[], countries: string[] } {
    const all = this.byPeriod.get('all') ?? []
    const usernames = all.filter(row => row.pullRequests.all > 0).slice(0, limit).map(row => row.username)
    const countries = [...new Set(all.map(row => this.countryOf(row.githubId)).filter(code => code !== null))].sort()
    return { usernames, countries }
  }

  /** The current username of someone who had `username` before, `null` when nobody did or it is still theirs. */
  renamedTo(username: string): string | null {
    const id = this.renames.get(username.toLowerCase())
    const current = id === undefined ? undefined : this.usernames.get(id)
    return current && current.toLowerCase() !== username.toLowerCase() ? current : null
  }

  countryOf(githubId: number): string | null {
    return this.profiles.get(githubId)?.country ?? null
  }

  /** One page of a period, optionally of one country or some badges: `rank` stays the global one, `countryRank` is the place in the country. */
  leaderboard({ period, country = null, badges = [], match = 'any', page = 1, pageSize = DEFAULT_PAGE_SIZE }: LeaderboardQuery): LeaderboardPage {
    const all = this.byPeriod.get(period) ?? []
    const inCountry = country ? all.filter(row => this.countryOf(row.githubId) === country) : all
    const holders = badges.map(key => this.indexedBadges().holders.get(key))
    const rows = badges.length ? inCountry.filter(row => holders[match === 'all' ? 'every' : 'some'](people => people?.has(row.githubId))) : inCountry
    const size = Math.min(Math.max(1, Math.floor(pageSize)), MAX_PAGE_SIZE)
    const start = (Math.max(1, Math.floor(page)) - 1) * size
    // Ties share a place, as they share a global rank.
    const places = new Map<number, number>()
    inCountry.forEach((row, index) => places.set(row.githubId, index && inCountry[index - 1].rank === row.rank ? places.get(inCountry[index - 1].githubId)! : index + 1))
    const total = (count: (row: Contributor) => number) => rows.reduce((sum, row) => sum + count(row), 0)
    return {
      period,
      country,
      badges: [...badges],
      match,
      periods: this.periods,
      total: rows.length,
      landedPullRequests: total(row => row.pullRequests.all),
      issues: total(row => row.issues),
      comments: total(row => row.comments),
      reviewComments: total(row => row.reviewComments),
      items: rows.slice(start, start + size).map((row) => {
        const item = this.namedSummary(row)
        return country ? { ...item, countryRank: places.get(row.githubId) } : item
      }),
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
        if (!row) return []
        const { githubId: _id, username: _username, firstContributionAt: _first, ...stats } = row
        return [{ period, ...stats }]
      }),
      name: links?.name ?? null,
      website: links?.website ?? null,
      socialAccounts: links?.socialAccounts ?? [],
      country: links?.country ?? null,
      packages: this.packages.get(allTime.githubId) ?? [],
      team: this.team.has(allTime.githubId),
      calendar: this.calendar[allTime.githubId] ?? [],
      collectedAt: this.collectedAt,
    }
  }

  /** All-time contributors by username: prefix matches first, then anywhere in the username or name, by rank. */
  search(query: string, { country = null, limit = SEARCH_LIMIT }: { country?: string | null, limit?: number } = {}): ContributorSummary[] {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const prefix: Contributor[] = []
    const other: Contributor[] = []
    for (const row of this.byPeriod.get('all') ?? []) {
      if (country && this.countryOf(row.githubId) !== country) continue
      const username = row.username.toLowerCase()
      if (username.startsWith(q)) prefix.push(row)
      else if (username.includes(q) || this.profiles.get(row.githubId)?.name?.toLowerCase().includes(q)) other.push(row)
      if (prefix.length >= limit) break
    }
    return [...prefix, ...other].slice(0, limit).map(toSummary)
  }

  private namedSummary(row: Contributor): ContributorSummary {
    const name = this.profiles.get(row.githubId)?.name?.trim()
    return { ...toSummary(row), ...(name ? { name } : {}) }
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
      badges: this.badgeFilters(rows),
    }
  }

  private badgeFilters(rows: readonly Contributor[]): BadgeFilter[] {
    const { filters, holders } = this.indexedBadges()
    const inPeriod = new Set(rows.map(row => row.githubId))
    return filters.map(filter => ({ ...filter, count: [...holders.get(filter.key)!].filter(id => inPeriod.has(id)).length }))
  }

  /** Worked out from the all-time rows the first time it is needed, then kept. */
  private indexedBadges(): BadgeIndex {
    return this.badgeIndex ??= indexBadges((this.byPeriod.get('all') ?? []).map(row => ({ githubId: row.githubId, badges: earnedBadges(this.profile(row.username)!) })))
  }
}

function toSummary({ githubId, username, rank, score }: Contributor): ContributorSummary {
  return { githubId, username, rank, score }
}
