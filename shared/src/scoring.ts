// Weights ported from nuxt/nuxters `computeScore`, breakdown from nuxt.com `nuxterScoreBreakdown`
// (MIT, Copyright (c) 2023 Nuxt, Copyright (c) 2022-2023 NuxtLabs). v1 counts landed PRs only: no issues,
// comments, reactions or core bonus.
import { allPeriods, periodsFor } from './periods.ts'
import type { ContributorRecord, LandedPullRequest, Period, PullRequestCounts, PullRequestType } from './types.ts'

export const PULL_REQUEST_POINTS: Readonly<Record<PullRequestType, number>> = {
  feat: 7,
  fix: 5,
  docs: 4,
  chore: 3,
}

export const emptyCounts = (): PullRequestCounts => ({ feat: 0, fix: 0, docs: 0, chore: 0, all: 0 })

export function score(counts: PullRequestCounts): number {
  return counts.feat * PULL_REQUEST_POINTS.feat
    + counts.fix * PULL_REQUEST_POINTS.fix
    + counts.docs * PULL_REQUEST_POINTS.docs
    + counts.chore * PULL_REQUEST_POINTS.chore
}

export interface ScoreRow {
  type: PullRequestType
  label: string
  /** A Lucide icon name (`@ng-icons/lucide`: `lucideRocket`…). */
  icon: string
  points: number
  amount: number
  total: number
}

const ROWS: ReadonlyArray<Omit<ScoreRow, 'points' | 'amount' | 'total'>> = [
  { type: 'feat', label: 'Feature PRs', icon: 'rocket' },
  { type: 'fix', label: 'Fix PRs', icon: 'wrench' },
  { type: 'docs', label: 'Docs PRs', icon: 'book-open' },
  { type: 'chore', label: 'Chore PRs', icon: 'brush-cleaning' },
]

/** One row per PR type, sorted by total (ties in the fixed order above). The totals add up to the score. */
export function scoreBreakdown(counts: PullRequestCounts): ScoreRow[] {
  return ROWS
    .map((row) => {
      const points = PULL_REQUEST_POINTS[row.type]
      const amount = counts[row.type]
      return { ...row, points, amount, total: amount * points }
    })
    .sort((a, b) => b.total - a.total)
}

/** Score, then username: the order of every contributor file and of the leaderboard. */
export function compareRecords(a: Pick<ContributorRecord, 'score' | 'username'>, b: Pick<ContributorRecord, 'score' | 'username'>): number {
  return b.score - a.score || a.username.localeCompare(b.username)
}

/**
 * The contributor files of a collection run: every landed PR counts in all time, its rolling windows
 * and its year, for its author. Every period gets an entry, even an empty one, so readers can rely on it.
 * Contributors are keyed by GitHub id: a renamed account keeps its PRs, under its latest login.
 */
export function buildContributorRecords(pulls: Iterable<LandedPullRequest>, now: Date): Map<Period, ContributorRecord[]> {
  const byPeriod = new Map<Period, Map<number, ContributorRecord>>(allPeriods(now).map(period => [period, new Map()]))
  const first = new Map<number, number>()
  const latest = new Map<number, { login: string, time: number }>()

  for (const pull of pulls) {
    const time = Date.parse(pull.landedAt)
    const id = pull.author.id
    if (!Number.isNaN(time)) {
      if (time < (first.get(id) ?? Infinity)) first.set(id, time)
      if (time >= (latest.get(id)?.time ?? -Infinity)) latest.set(id, { login: pull.author.login, time })
    }
    for (const period of periodsFor(pull.landedAt, now)) {
      let contributors = byPeriod.get(period)
      if (!contributors) {
        contributors = new Map()
        byPeriod.set(period, contributors)
      }
      let record = contributors.get(id)
      if (!record) {
        record = { githubId: id, username: pull.author.login, score: 0, pullRequests: emptyCounts(), firstContributionAt: null }
        contributors.set(id, record)
      }
      record.pullRequests[pull.type] += 1
      record.pullRequests.all += 1
    }
  }

  const files = new Map<Period, ContributorRecord[]>()
  for (const [period, contributors] of byPeriod) {
    const records = [...contributors.values()].map((record) => {
      const firstTime = first.get(record.githubId)
      return {
        ...record,
        username: latest.get(record.githubId)?.login ?? record.username,
        score: score(record.pullRequests),
        firstContributionAt: firstTime === undefined ? null : new Date(firstTime).toISOString(),
      }
    })
    files.set(period, records.sort(compareRecords))
  }
  return files
}
