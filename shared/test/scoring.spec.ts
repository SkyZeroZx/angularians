import { describe, expect, it } from 'vitest'
import { buildContributorRecords, ContributorsAccumulator, emptyActivity, emptyCounts, score, scoreBreakdown, type CommentInput, type IssueInput } from '../src/scoring.ts'
import type { LandedPullRequest, PullRequestType } from '../src/types.ts'

const stats = (prs: Partial<Record<PullRequestType, number>>, activity: Partial<ReturnType<typeof emptyActivity>> = {}) => {
  const pullRequests = { ...emptyCounts(), ...prs }
  pullRequests.all = pullRequests.feat + pullRequests.fix + pullRequests.docs + pullRequests.chore
  return { pullRequests, ...emptyActivity(), ...activity }
}

describe('score', () => {
  it('weighs landed PRs like Nuxters: feat 7, fix 5, docs 4, chore 3', () => {
    expect(score(stats({ feat: 1 }))).toBe(7)
    expect(score(stats({ feat: 2, fix: 3, docs: 4, chore: 5 }))).toBe(14 + 15 + 16 + 15)
  })

  it('weighs the rest like Nuxters, review comments at 1, and rounds the sum once', () => {
    expect(score(stats({}, { helpfulIssues: 1, issues: 1 }))).toBe(4)
    expect(score(stats({}, { helpfulComments: 1, comments: 1 }))).toBe(3) // 2 + 0.5 = 2.5 → 3
    expect(score(stats({}, { reviewComments: 3 }))).toBe(3)
    expect(score(stats({}, { comments: 3, reactions: 4 }))).toBe(2) // 1.5 + 0.4 = 1.9 → 2
    expect(score(stats({}, { reactions: 4 }))).toBe(0)
  })
})

describe('scoreBreakdown', () => {
  it('has one row per type, sorted by total, adding up to the score', () => {
    const counts = stats({ feat: 1, docs: 3, chore: 1 }, { issues: 2, helpfulIssues: 1, comments: 7, helpfulComments: 1, reviewComments: 4, reactions: 12 })
    const rows = scoreBreakdown(counts)
    expect(rows.slice(0, 4).map(row => [row.key, row.amount, row.points, row.total])).toEqual([
      ['docs', 3, 4, 12],
      ['feat', 1, 7, 7],
      ['reviewComments', 4, 1, 4],
      ['comments', 7, 0.5, 3.5],
    ])
    expect(rows).toHaveLength(10)
    expect(rows.find(row => row.key === 'reactions')?.total).toBe(1.2)
    expect(Math.round(rows.reduce((sum, row) => sum + row.total, 0))).toBe(score(counts))
  })
})

const now = new Date('2026-11-03T12:00:00Z')
let number = 0
const pr = (login: string, id: number, type: PullRequestType, landedAt: string, scopes: string[] = []): LandedPullRequest =>
  ({ number: ++number, author: { login, id }, type, scopes, landedAt })
const user = (login: string, id: number) => ({ login, id })

describe('buildContributorRecords (landed PRs only)', () => {
  const files = buildContributorRecords([
    pr('alice', 1, 'feat', '2026-10-20T00:00:00Z'), // 30d, 12m, 2026
    pr('alice', 1, 'docs', '2016-05-01T00:00:00Z'), // 2016
    pr('bob', 2, 'fix', '2026-01-15T00:00:00Z'), // 12m, 2026
    pr('bob', 2, 'fix', '2025-12-01T00:00:00Z'), // 12m, 2025
    pr('carol', 3, 'chore', '2014-09-18T00:00:00Z'), // 2014
  ], now)

  it('writes every period, even the empty ones', () => {
    expect([...files.keys()].slice(0, 4)).toEqual(['all', '30d', '12m', '2014'])
    expect(files.get('2015')).toEqual([])
  })

  it('counts each PR in all time, its rolling windows and its year', () => {
    expect(files.get('all')?.map(r => [r.username, r.score, r.pullRequests.all])).toEqual([['alice', 11, 2], ['bob', 10, 2], ['carol', 3, 1]])
    expect(files.get('30d')?.map(r => r.username)).toEqual(['alice'])
    expect(files.get('12m')?.map(r => [r.username, r.score])).toEqual([['bob', 10], ['alice', 7]])
    expect(files.get('2016')?.[0]?.pullRequests).toEqual({ feat: 0, fix: 0, docs: 1, chore: 0, all: 1 })
    expect(files.get('all')?.[0]).toMatchObject(emptyActivity())
  })

  it('keeps the first contribution across all periods, and ranks ties by username', () => {
    expect(files.get('30d')?.[0]?.firstContributionAt).toBe('2016-05-01T00:00:00.000Z')
    const tied = buildContributorRecords([pr('zed', 9, 'fix', '2026-01-01T00:00:00Z'), pr('amy', 8, 'fix', '2026-01-01T00:00:00Z')], now)
    expect(tied.get('all')?.map(r => r.username)).toEqual(['amy', 'zed'])
  })

  it('keeps a renamed account as one contributor, under its latest login', () => {
    const renamed = buildContributorRecords([pr('old-name', 7, 'feat', '2020-01-01T00:00:00Z'), pr('new-name', 7, 'fix', '2024-01-01T00:00:00Z')], now)
    expect(renamed.get('all')).toEqual([{
      githubId: 7, username: 'new-name', score: 12, pullRequests: { feat: 1, fix: 1, docs: 0, chore: 0, all: 2 }, ...emptyActivity(), firstContributionAt: '2020-01-01T00:00:00.000Z',
    }])
  })
})

describe('ContributorsAccumulator', () => {
  const issue = (author: ReturnType<typeof user> | null, extra: Partial<IssueInput> = {}): IssueInput =>
    ({ user: author, created_at: '2026-10-25T00:00:00Z', comments: 0, reactions: { total_count: 0 }, state_reason: null, ...extra })
  const comment = (author: ReturnType<typeof user> | null, reactions = 0, created_at = '2026-10-25T00:00:00Z'): CommentInput =>
    ({ user: author, created_at, reactions: { total_count: reactions } })

  it('counts issues, helpful when completed, with 3+ reactions or 5+ comments, and their reactions', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addIssue(issue(user('ann', 1)))
    acc.addIssue(issue(user('ann', 1), { state_reason: 'completed' }))
    acc.addIssue(issue(user('ann', 1), { state_reason: 'not_planned', reactions: { total_count: 3 } }))
    acc.addIssue(issue(user('ann', 1), { comments: 5 }))
    acc.addIssue(issue(user('ann', 1), { comments: 4, reactions: { total_count: 2 } }))
    expect(acc.records().get('30d')?.[0]).toMatchObject({ username: 'ann', issues: 5, helpfulIssues: 3, reactions: 5, score: 15 }) // 5 + 9 + 0.5 = 14.5 → 15
  })

  it('counts a PR in the issues list for its reactions only', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addIssue(issue(user('pat', 2), { pull_request: {}, reactions: { total_count: 10 }, comments: 9 }))
    expect(acc.records().get('all')?.[0]).toMatchObject({ username: 'pat', issues: 0, helpfulIssues: 0, reactions: 10, score: 1, firstContributionAt: null })
  })

  it('counts comments, helpful with 3+ reactions, and review comments at 1 point', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addComment(comment(user('cy', 3), 2))
    acc.addComment(comment(user('cy', 3), 3))
    acc.addReviewComment(comment(user('cy', 3), 9))
    expect(acc.records().get('all')?.[0]).toMatchObject({ comments: 2, helpfulComments: 1, reviewComments: 1, reactions: 5, score: Math.round(1 + 2 + 1 + 0.5) })
  })

  it('leaves out bots and deleted accounts', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addComment(comment(user('angular-robot', 4), 5))
    acc.addComment(comment(user('google-cla[bot]', 5)))
    acc.addReviewComment(comment(null))
    acc.addIssue(issue(user('ghost', 10137)))
    expect(acc.records().get('all')).toEqual([])
  })

  it('combines PRs and activity, dates each in its periods, and keeps the first contribution', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addLandedPullRequest(pr('dee', 6, 'fix', '2026-10-30T00:00:00Z'))
    acc.addComment(comment(user('dee', 6), 0, '2019-03-01T00:00:00Z'))
    acc.addReviewComment(comment(user('dee', 6), 0, '2025-06-01T00:00:00Z'))
    const files = acc.records()
    expect(files.get('all')?.[0]).toMatchObject({ score: 7, comments: 1, reviewComments: 1, firstContributionAt: '2019-03-01T00:00:00.000Z' })
    expect(files.get('30d')?.[0]).toMatchObject({ score: 5, comments: 0, reviewComments: 0 })
    expect(files.get('2019')?.[0]).toMatchObject({ comments: 1 })
    expect(files.get('2025')?.[0]).toMatchObject({ reviewComments: 1 })
  })
})

describe('ContributorsAccumulator.packages', () => {
  it('counts the packages of each contributor\'s merged PRs, all time, most first', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addLandedPullRequest(pr('ann', 2, 'fix', '2016-01-01T00:00:00Z', ['router']))
    acc.addLandedPullRequest(pr('ann', 2, 'feat', '2026-10-30T00:00:00Z', ['core', 'router']))
    acc.addLandedPullRequest(pr('ann', 2, 'docs', '2026-10-30T00:00:00Z'))
    acc.addLandedPullRequest(pr('bob', 1, 'fix', '2026-10-30T00:00:00Z', ['forms']))
    acc.addLandedPullRequest(pr('cy', 3, 'chore', '2026-10-30T00:00:00Z'))
    expect(acc.packages()).toEqual([
      { githubId: 1, packages: [{ name: 'forms', pullRequests: 1 }] },
      { githubId: 2, packages: [{ name: 'router', pullRequests: 2 }, { name: 'core', pullRequests: 1 }] },
    ])
  })
})
