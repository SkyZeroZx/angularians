import type { Contributor } from '@angular-contributors/shared'
import * as v from 'valibot'
import type { DataBundle } from './bundle'
import { ContributorsData, MAX_PAGE_SIZE } from './contributors'
import { ContributorInput, LeaderboardInput, MapInput, queryNumber, SearchInput } from './schemas'

const row = (githubId: number, username: string, rank: number, feat: number): Contributor => ({
  githubId, username, rank, score: feat * 7, pullRequests: { feat, fix: 0, docs: 0, chore: 0, all: feat }, firstContributionAt: '2016-01-01T00:00:00.000Z',
})

const all = [row(1, 'crisbeto', 1, 50), row(2, 'Cristina', 2, 40), row(3, 'atscott', 3, 30), row(4, 'bob', 4, 20), row(5, 'christian', 5, 10)]
const bundle: DataBundle = {
  meta: { collectedAt: '2026-11-03T05:13:36.895Z', partial: false, repos: ['angular/angular'] },
  periods: {
    'all': all,
    '12m': [row(3, 'atscott', 1, 9), row(1, 'crisbeto', 2, 5)],
    '30d': [],
    '2015': [row(4, 'bob', 1, 1)],
  },
  profiles: [
    { githubId: 1, username: 'crisbeto', name: 'Kristiyan', website: null, socialAccounts: [], country: 'BG' },
    { githubId: 2, username: 'Cristina', name: null, website: 'https://example.com/', socialAccounts: [], country: 'TR' },
    { githubId: 4, username: 'bob', name: 'Robert Builder', website: null, socialAccounts: [], country: 'TR' },
  ],
}
const data = new ContributorsData(bundle)

describe('ContributorsData', () => {
  it('offers the periods with contributors, in display order', () => {
    expect(data.periods).toEqual(['12m', 'all', '2015'])
    expect(data.hasPeriod('30d')).toBe(true)
  })

  it('pages the leaderboard and totals the landed PRs', () => {
    const page = data.leaderboard({ period: 'all', page: 2, pageSize: 2 })
    expect(page.items.map(item => item.username)).toEqual(['atscott', 'bob'])
    expect(page).toMatchObject({ period: 'all', country: null, total: 5, landedPullRequests: 150, collectedAt: '2026-11-03T05:13:36.895Z' })
    expect(data.leaderboard({ period: 'all', page: 99 }).items).toEqual([])
    expect(data.leaderboard({ period: 'all', pageSize: 10_000 }).items).toHaveLength(Math.min(5, MAX_PAGE_SIZE))
    expect(data.leaderboard({ period: '2014' })).toMatchObject({ total: 0, items: [] })
  })

  it('filters by country and keeps the overall ranks', () => {
    const page = data.leaderboard({ period: 'all', country: 'TR' })
    expect(page.items.map(item => [item.username, item.rank])).toEqual([['Cristina', 2], ['bob', 4]])
    expect(page.total).toBe(2)
  })

  it('builds a profile from every period, case-insensitively, with its links', () => {
    expect(data.profile('CRISBETO')).toMatchObject({
      username: 'crisbeto',
      rank: 1,
      name: 'Kristiyan',
      country: 'BG',
      periods: [{ period: '12m', rank: 2, score: 35 }, { period: 'all', rank: 1, score: 350 }],
    })
    expect(data.profile('atscott')).toMatchObject({ name: null, country: null, socialAccounts: [] })
    expect(data.profile('nobody')).toBeNull()
  })

  it('searches prefixes first, then usernames and names containing the query', () => {
    expect(data.search('cris').map(item => item.username)).toEqual(['crisbeto', 'Cristina'])
    expect(data.search('  CHR ').map(item => item.username)).toEqual(['christian'])
    expect(data.search('builder').map(item => item.username)).toEqual(['bob'])
    expect(data.search('t').map(item => item.username)).toEqual(['crisbeto', 'Cristina', 'atscott', 'bob', 'christian'])
    expect(data.search('', 8)).toEqual([])
    expect(data.search('c', 1).map(item => item.username)).toEqual(['crisbeto'])
  })

  it('counts contributors by country with the best ranked first', () => {
    expect(data.map('all')).toEqual({
      period: 'all',
      total: 5,
      located: 3,
      countries: [{ code: 'TR', count: 2, top: ['Cristina', 'bob'] }, { code: 'BG', count: 1, top: ['crisbeto'] }],
    })
    expect(data.map('30d')).toEqual({ period: '30d', total: 0, located: 0, countries: [] })
  })
})

describe('schemas', () => {
  it('defaults the leaderboard to the last 12 months, page 1, everyone', () => {
    expect(v.parse(LeaderboardInput, {})).toEqual({ period: '12m', country: null, page: 1 })
    expect(v.parse(LeaderboardInput, { period: '2016', country: 'tr', page: 3 })).toEqual({ period: '2016', country: 'TR', page: 3 })
  })

  it('rejects unknown periods, countries, pages and usernames', () => {
    for (const input of [{ period: '7d' }, { period: '2013' }, { country: 'XX' }, { page: 0 }, { page: 1.5 }, { page: '2' }]) {
      expect(v.safeParse(LeaderboardInput, input).success).toBe(false)
    }
    for (const username of ['', '-bob', 'bob-', 'a--b', 'a'.repeat(40), 'bob/../x', 'bob smith']) {
      expect(v.safeParse(ContributorInput, { username }).success).toBe(false)
    }
    expect(v.safeParse(ContributorInput, { username: 'Angular-Bob-2' }).success).toBe(true)
    expect(v.safeParse(MapInput, { period: 'week' }).success).toBe(false)
    expect(v.safeParse(SearchInput, { q: 'x'.repeat(101) }).success).toBe(false)
  })

  it('reads numbers from query strings, and nothing else', () => {
    expect(queryNumber('2')).toBe(2)
    expect(queryNumber('2.5')).toBe('2.5')
    expect(queryNumber('-1')).toBe('-1')
    expect(queryNumber(undefined)).toBeUndefined()
  })
})
