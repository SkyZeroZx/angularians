// PR type rules ported from nuxt/nuxters `scripts/collect-contributors.ts` (MIT, Copyright (c) 2023 Nuxt).
import { isBotAccount } from './bots.ts'
import type { GitHubUser, LandedPullRequest, PullRequestType } from './types.ts'

/**
 * Conventional commit prefixes, as angular/angular enforces them on PR titles
 * (build, ci, docs, feat, fix, perf, refactor, release, test), plus the ones other repos use.
 * Added to the Nuxters list: `release` and `revert` count as chores, so neither falls back to `feat`.
 */
const TITLE_TYPE_PATTERNS: Array<[RegExp, PullRequestType]> = [
  [/^docs[\s(:!]/i, 'docs'],
  [/^fix[\s(:!]/i, 'fix'],
  [/^feat[\s(:!]/i, 'feat'],
  [/^perf[\s(:!]/i, 'feat'],
  [/^chore[\s(:!]/i, 'chore'],
  [/^ci[\s(:!]/i, 'chore'],
  [/^build[\s(:!]/i, 'chore'],
  [/^test[\s(:!]/i, 'chore'],
  [/^refactor[\s(:!]/i, 'chore'],
  [/^style[\s(:!]/i, 'chore'],
  [/^release[\s(:!]/i, 'chore'],
  [/^revert[\s(:!"]/i, 'chore'],
]

const LABEL_TYPE_MAP: Record<string, PullRequestType> = {
  documentation: 'docs',
  docs: 'docs',
  bug: 'fix',
  fix: 'fix',
  feature: 'feat',
  feat: 'feat',
  enhancement: 'feat',
  chore: 'chore',
  maintenance: 'chore',
  dependencies: 'chore',
}

/** The type from the title prefix, then from the labels. Neither: `feat`, as in Nuxters. */
export function inferPullRequestType(title: string, labels: ReadonlyArray<{ name?: string | null }> = []): PullRequestType {
  const trimmed = title.trim()
  for (const [pattern, type] of TITLE_TYPE_PATTERNS) {
    if (pattern.test(trimmed)) return type
  }
  for (const label of labels) {
    const type = LABEL_TYPE_MAP[label.name?.toLowerCase() ?? '']
    if (type) return type
  }
  return 'feat'
}

/** `feat(core, compiler)!: …` → `core, compiler`. */
const SCOPE_RE = /^\s*[a-z]+\(([^)]+)\)!?:/i

/** The packages a PR title names, lowercased: `fix(router): …` → `['router']`. Empty without a scope. */
export function pullRequestScopes(title: string): string[] {
  const match = SCOPE_RE.exec(title)
  if (!match) return []
  return [...new Set(match[1]!.split(/[,\s]+/).map(scope => scope.trim().toLowerCase()).filter(scope => /^[a-z0-9][a-z0-9.-]*$/.test(scope)))]
}

const PR_CLOSE_RE = /^PR Close #(\d+)\s*$/gm

/**
 * The PR numbers a commit message closes. angular/angular's merge tool lands a PR by pushing its commits
 * to the main branch with a `PR Close #N` line in each, then closes the PR: GitHub shows it as closed, not merged.
 */
export function prCloseNumbers(message: string): number[] {
  const numbers = new Set<number>()
  for (const match of message.matchAll(PR_CLOSE_RE)) numbers.add(Number(match[1]))
  return [...numbers]
}

/** A pull request as `GET /repos/{owner}/{repo}/pulls?state=all` lists it, the fields used here. */
export interface PullRequestInput {
  number: number
  title: string
  user: { login?: string | null, id?: number | null } | null
  labels?: ReadonlyArray<{ name?: string | null }>
  merged_at: string | null
}

/** A commit of the main branch, the fields used here. */
export interface CommitInput {
  message: string
  /** ISO date the commit landed (the committer date). */
  date: string
}

/**
 * The pull requests that landed, each once:
 * - GitHub marks it merged: it landed on `merged_at`.
 * - Otherwise, a commit on the main branch has `PR Close #N` for it: it landed on the earliest such commit.
 *   A PR of several commits has the line in each, and still counts once.
 * PRs by bots, or by deleted accounts, are left out.
 */
export function landedPullRequests(pulls: Iterable<PullRequestInput>, commits: Iterable<CommitInput>): LandedPullRequest[] {
  const closedOn = new Map<number, number>()
  for (const commit of commits) {
    const time = Date.parse(commit.date)
    if (Number.isNaN(time)) continue
    for (const number of prCloseNumbers(commit.message)) {
      const earliest = closedOn.get(number)
      if (earliest === undefined || time < earliest) closedOn.set(number, time)
    }
  }

  const landed = new Map<number, LandedPullRequest>()
  for (const pull of pulls) {
    if (landed.has(pull.number)) continue
    const author = toUser(pull.user)
    if (!author) continue
    const closed = closedOn.get(pull.number)
    const landedAt = pull.merged_at ?? (closed === undefined ? null : new Date(closed).toISOString())
    if (!landedAt) continue
    landed.set(pull.number, {
      number: pull.number,
      author,
      type: inferPullRequestType(pull.title, pull.labels),
      scopes: pullRequestScopes(pull.title),
      landedAt,
    })
  }
  return [...landed.values()].sort((a, b) => a.number - b.number)
}

function toUser(user: PullRequestInput['user']): GitHubUser | null {
  const login = user?.login
  const id = user?.id
  if (!login || typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0 || isBotAccount(login)) return null
  return { login, id }
}
