import { type Contributor, emptyActivity } from '@angularians/shared'
import type { DataBundle } from './bundle'
import { ContributorsData, MAX_PAGE_SIZE } from './contributors'

const row = (githubId: number, username: string, rank: number, feat: number, comments = 0): Contributor => ({
  githubId, username, rank, score: feat * 7, pullRequests: { feat, fix: 0, docs: 0, chore: 0, all: feat },
  ...emptyActivity(), issues: 1, comments, reviewComments: 2, firstContributionAt: '2016-01-01T00:00:00.000Z',
})

const all = [row(1, 'crisbeto', 1, 50, 7), row(2, 'Cristina', 2, 40), row(3, 'atscott', 3, 30), row(4, 'bob', 4, 20), row(5, 'christian', 5, 10)]
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
  packages: [{ githubId: 1, packages: [{ name: 'core', pullRequests: 40 }, { name: 'router', pullRequests: 10 }] }],
  team: [{ githubId: 1, username: 'crisbeto' }],
  calendar: { 1: [4433, 3, 4434, 1] },
  renames: [],
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
    expect(page).toMatchObject({ period: 'all', country: null, total: 5, landedPullRequests: 150, issues: 5, comments: 7, reviewComments: 10, collectedAt: '2026-11-03T05:13:36.895Z' })
    expect(data.leaderboard({ period: 'all', page: 99 }).items).toEqual([])
    expect(data.leaderboard({ period: 'all', pageSize: 10_000 }).items).toHaveLength(Math.min(5, MAX_PAGE_SIZE))
    expect(data.leaderboard({ period: '2014' })).toMatchObject({ total: 0, items: [] })
  })

  it('filters by country and keeps the overall ranks', () => {
    const page = data.leaderboard({ period: 'all', country: 'TR' })
    expect(page.items.map(item => [item.username, item.rank])).toEqual([['Cristina', 2], ['bob', 4]])
    expect(page.items.map(item => item.countryRank)).toEqual([1, 2])
    expect(data.leaderboard({ period: 'all' }).items[0].countryRank).toBeUndefined()
    expect(page.total).toBe(2)
  })

  it('builds a profile from every period, case-insensitively, with its links', () => {
    expect(data.profile('CRISBETO')).toMatchObject({
      username: 'crisbeto',
      rank: 1,
      name: 'Kristiyan',
      country: 'BG',
      team: true,
      packages: [{ name: 'core', pullRequests: 40 }, { name: 'router', pullRequests: 10 }],
      periods: [{ period: '12m', rank: 2, score: 35, issues: 1, reviewComments: 2 }, { period: 'all', rank: 1, score: 350, comments: 7 }],
    })
    expect(data.profile('atscott')).toMatchObject({ name: null, country: null, socialAccounts: [], packages: [], team: false })
    expect(data.profile('nobody')).toBeNull()
  })

  it('sends a person their days for the graph, and none before the collector wrote them', () => {
    expect(data.profile('crisbeto')).toMatchObject({ calendar: [4433, 3, 4434, 1], collectedAt: '2026-11-03T05:13:36.895Z' })
    expect(data.profile('atscott')?.calendar).toEqual([])
    expect(new ContributorsData({ ...bundle, calendar: {} }).profile('crisbeto')?.calendar).toEqual([])
  })

  it('keeps the days out of the leaderboard and the search, which only the profile needs', () => {
    expect(data.leaderboard({ period: 'all' }).items.some(item => 'calendar' in item)).toBe(false)
    expect(data.search('cris').some(item => 'calendar' in item)).toBe(false)
  })

  it('searches prefixes first, then usernames and names containing the query', () => {
    expect(data.search('cris').map(item => item.username)).toEqual(['crisbeto', 'Cristina'])
    expect(data.search('  CHR ').map(item => item.username)).toEqual(['christian'])
    expect(data.search('builder').map(item => item.username)).toEqual(['bob'])
    expect(data.search('t').map(item => item.username)).toEqual(['crisbeto', 'Cristina', 'atscott', 'bob', 'christian'])
    expect(data.search('', { limit: 8 })).toEqual([])
    expect(data.search('c', { limit: 1 }).map(item => item.username)).toEqual(['crisbeto'])
  })

  it('adds the profile name to a leaderboard row when there is one', () => {
    const items = data.leaderboard({ period: 'all', pageSize: 3 }).items
    expect(items[0]).toMatchObject({ username: 'crisbeto', name: 'Kristiyan' })
    expect(items[1]).not.toHaveProperty('name')
    expect(data.search('crisbeto')[0]).not.toHaveProperty('name')
  })

  it('searches only the selected country', () => {
    expect(data.search('cris', { country: 'TR' }).map(item => item.username)).toEqual(['Cristina'])
    expect(data.search('builder', { country: 'TR' }).map(item => item.username)).toEqual(['bob'])
    expect(data.search('cris', { country: 'BG' }).map(item => item.username)).toEqual(['crisbeto'])
    expect(data.search('atscott', { country: 'TR' })).toEqual([])
    expect(data.search('cris', { country: null }).map(item => item.username)).toEqual(['crisbeto', 'Cristina'])
  })

  it('counts contributors by country with the best ranked first', () => {
    expect(data.map('all')).toMatchObject({
      period: 'all',
      total: 5,
      located: 3,
      countries: [{ code: 'TR', count: 2, top: ['Cristina', 'bob'] }, { code: 'BG', count: 1, top: ['crisbeto'] }],
    })
    expect(data.map('30d')).toMatchObject({ period: '30d', total: 0, located: 0, countries: [] })
  })

  it('counts the Angular team members GitHub keeps private as team members', () => {
    const MARK = 2554588
    const withMark = new ContributorsData({ ...bundle, periods: { ...bundle.periods, all: [...all, row(MARK, 'MarkTechson', 6, 5)] } })
    expect(withMark.isTeamMember(MARK)).toBe(true)
    expect(withMark.profile('MarkTechson')?.team).toBe(true)
    expect(withMark.leaderboard({ period: 'all', badges: ['angular-team'] }).items.map(item => item.username)).toEqual(['crisbeto', 'MarkTechson'])
  })

  describe('badges', () => {
    const GDE = 44946000
    const badged = new ContributorsData({
      ...bundle,
      periods: { 'all': [row(1, 'lead', 1, 50), row(2, 'plain', 2, 40), row(GDE, 'expert', 3, 30)], '12m': [row(GDE, 'expert', 1, 9)], '30d': [], '2015': [row(2, 'plain', 1, 1)] },
      profiles: [1, 2, GDE].map(githubId => ({ githubId, username: `user${githubId}`, name: null, website: null, socialAccounts: [], country: 'TR' })),
    })

    it('shows anyone with at least one of the badges and keeps their ranks', () => {
      const page = badged.leaderboard({ period: 'all', badges: ['angular-team', 'angular-gde'] })
      expect(page.items.map(item => [item.username, item.rank])).toEqual([['lead', 1], ['expert', 3]])
      expect(page).toMatchObject({ total: 2, badges: ['angular-team', 'angular-gde'] })
    })

    it('can ask for people who hold every one of the badges', () => {
      const page = badged.leaderboard({ period: 'all', badges: ['angular-team', 'top-10-all-time'], match: 'all' })
      expect(page.items.map(item => item.username)).toEqual(['lead'])
      expect(page).toMatchObject({ total: 1, match: 'all' })
      expect(badged.leaderboard({ period: 'all', badges: ['angular-team', 'angular-gde'], match: 'all' }).total).toBe(0)
    })

    it('keeps the place in the country when both filters are on', () => {
      const page = badged.leaderboard({ period: 'all', country: 'TR', badges: ['angular-gde'] })
      expect(page.items.map(item => [item.username, item.countryRank])).toEqual([['expert', 3]])
    })

    it('counts a badge in every period, for whoever is in that period', () => {
      expect(badged.leaderboard({ period: '12m', badges: ['angular-team', 'angular-gde'] }).items.map(item => item.username)).toEqual(['expert'])
    })

    it('counts only the holders who are in the period', () => {
      const count = (period: '12m' | '30d', key: string) => badged.map(period).badges.find(filter => filter.key === key)?.count
      expect(count('12m', 'angular-gde')).toBe(1)
      expect(count('12m', 'number-one')).toBe(0)
      expect(count('30d', 'angular-gde')).toBe(0)
    })

    it('finds nobody for a badge nobody holds', () => {
      expect(badged.leaderboard({ period: 'all', badges: ['no-such-badge'] })).toMatchObject({ total: 0, items: [] })
    })

    it('leaves the board whole without badges', () => {
      expect(badged.leaderboard({ period: 'all' })).toMatchObject({ total: 3, badges: [] })
    })

    it('offers the badges people hold, by label, with how many hold them', () => {
      const filters = badged.map('all').badges
      expect(filters.find(filter => filter.key === 'angular-gde')).toMatchObject({ label: 'Angular GDE', group: 'Recognitions', count: 1 })
      expect(filters.find(filter => filter.key === 'number-one')).toMatchObject({ label: '#1 of a year', count: 1 })
      expect(filters.map(filter => filter.label)).toEqual(filters.map(filter => filter.label).sort((a, b) => a.localeCompare(b)))
    })
  })
})
