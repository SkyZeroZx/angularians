import { describe, expect, it } from 'vitest'
import { buildContributorRecords, score, scoreBreakdown } from '../src/scoring.ts'
import type { LandedPullRequest, PullRequestType } from '../src/types.ts'

describe('score', () => {
  it('weighs landed PRs like Nuxters: feat 7, fix 5, docs 4, chore 3', () => {
    expect(score({ feat: 1, fix: 0, docs: 0, chore: 0, all: 1 })).toBe(7)
    expect(score({ feat: 2, fix: 3, docs: 4, chore: 5, all: 14 })).toBe(14 + 15 + 16 + 15)
  })
})

describe('scoreBreakdown', () => {
  it('has one row per type, sorted by total, adding up to the score', () => {
    const counts = { feat: 1, fix: 0, docs: 3, chore: 1, all: 5 }
    const rows = scoreBreakdown(counts)
    expect(rows.map(row => [row.type, row.amount, row.points, row.total])).toEqual([
      ['docs', 3, 4, 12],
      ['feat', 1, 7, 7],
      ['chore', 1, 3, 3],
      ['fix', 0, 5, 0],
    ])
    expect(rows.reduce((sum, row) => sum + row.total, 0)).toBe(score(counts))
  })
})

const now = new Date('2026-11-03T12:00:00Z')
let number = 0
const pr = (login: string, id: number, type: PullRequestType, landedAt: string): LandedPullRequest =>
  ({ number: ++number, author: { login, id }, type, landedAt })

describe('buildContributorRecords', () => {
  const files = buildContributorRecords([
    pr('alice', 1, 'feat', '2026-10-20T00:00:00Z'), // 30d, 12m, 2026
    pr('alice', 1, 'docs', '2016-05-01T00:00:00Z'), // 2016
    pr('bob', 2, 'fix', '2026-01-15T00:00:00Z'), // 12m, 2026
    pr('bob', 2, 'fix', '2025-12-01T00:00:00Z'), // 12m, 2025
    pr('carol', 3, 'chore', '2014-09-18T00:00:00Z'), // 2014
  ], now)

  it('writes every period, even the empty ones', () => {
    expect([...files.keys()].slice(0, 4)).toEqual(['all', '30d', '12m', '2014'])
    expect(files.get('2026')).toBeDefined()
    expect(files.get('2015')).toEqual([])
  })

  it('counts each PR in all time, its rolling windows and its year', () => {
    expect(files.get('all')?.map(r => [r.username, r.score, r.pullRequests.all])).toEqual([
      ['alice', 11, 2],
      ['bob', 10, 2],
      ['carol', 3, 1],
    ])
    expect(files.get('30d')?.map(r => r.username)).toEqual(['alice'])
    expect(files.get('12m')?.map(r => [r.username, r.score])).toEqual([['bob', 10], ['alice', 7]])
    expect(files.get('2025')?.map(r => r.username)).toEqual(['bob'])
    expect(files.get('2016')?.[0]?.pullRequests).toEqual({ feat: 0, fix: 0, docs: 1, chore: 0, all: 1 })
  })

  it('keeps the first landed PR across all periods', () => {
    expect(files.get('30d')?.[0]?.firstContributionAt).toBe('2016-05-01T00:00:00.000Z')
  })

  it('ranks ties by username', () => {
    const tied = buildContributorRecords([pr('zed', 9, 'fix', '2026-01-01T00:00:00Z'), pr('amy', 8, 'fix', '2026-01-01T00:00:00Z')], now)
    expect(tied.get('all')?.map(r => r.username)).toEqual(['amy', 'zed'])
  })

  it('keeps a renamed account as one contributor, under its latest login', () => {
    const renamed = buildContributorRecords([pr('old-name', 7, 'feat', '2020-01-01T00:00:00Z'), pr('new-name', 7, 'fix', '2024-01-01T00:00:00Z')], now)
    expect(renamed.get('all')).toEqual([
      { githubId: 7, username: 'new-name', score: 12, pullRequests: { feat: 1, fix: 1, docs: 0, chore: 0, all: 2 }, firstContributionAt: '2020-01-01T00:00:00.000Z' },
    ])
    expect(renamed.get('2020')?.[0]?.username).toBe('new-name')
  })
})
