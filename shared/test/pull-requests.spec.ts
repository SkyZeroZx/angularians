import { describe, expect, it } from 'vitest'
import { inferPullRequestType, landedPullRequests, packageRepo, prCloseNumbers, pullRequestScopes, type PullRequestInput } from '../src/pull-requests.ts'
import { isBotAccount } from '../src/bots.ts'

describe('inferPullRequestType', () => {
  it.each([
    ['feat(core): add input signals', 'feat'],
    ['perf(compiler): faster template parsing', 'feat'],
    ['fix(router): keep the query params', 'fix'],
    ['fix!: drop Node 18', 'fix'],
    ['docs: fix a typo', 'docs'],
    ['docs(docs-infra): new sidebar', 'docs'],
    ['refactor(core): split the scheduler', 'chore'],
    ['build: update to bazel 7', 'chore'],
    ['ci: cache the npm folder', 'chore'],
    ['test(forms): cover async validators', 'chore'],
    ['release: cut the v19.0.0 release', 'chore'],
    ['Revert "feat(core): add input signals"', 'chore'],
    ['revert: fix(router): keep the query params', 'chore'],
    ['  feat: leading spaces', 'feat'],
  ] as const)('%s → %s', (title, type) => {
    expect(inferPullRequestType(title)).toBe(type)
  })

  it('does not read a prefix inside a word', () => {
    expect(inferPullRequestType('fixture cleanup', [{ name: 'docs' }])).toBe('docs')
    expect(inferPullRequestType('feature flags')).toBe('feat')
    expect(inferPullRequestType('testing', [{ name: 'maintenance' }])).toBe('chore')
  })

  it('falls back to the labels, then to feat', () => {
    expect(inferPullRequestType('Update README', [{ name: 'Documentation' }])).toBe('docs')
    expect(inferPullRequestType('Something', [{ name: 'area: core' }, { name: 'bug' }])).toBe('fix')
    expect(inferPullRequestType('Something', [{ name: null }])).toBe('feat')
    expect(inferPullRequestType('Something')).toBe('feat')
  })
})

describe('prCloseNumbers', () => {
  it('reads every PR Close line of a commit message, once each', () => {
    const message = [
      'docs: fix capitalization in elements docs (#32917) (#32936)',
      '',
      'PR Close #32917',
      '',
      'PR Close #32936',
      'PR Close #32936',
    ].join('\n')
    expect(prCloseNumbers(message)).toEqual([32917, 32936])
  })

  it('ignores mentions that are not a PR Close line', () => {
    expect(prCloseNumbers('fix: something (#123)\n\nFixes #456\nSee PR Close #789 above')).toEqual([])
    expect(prCloseNumbers('pr close #1')).toEqual([])
    expect(prCloseNumbers('fix: x\n\nSame as PR Close #789')).toEqual([])
  })
})

const user = (login: string, id: number) => ({ login, id })
const pull = (number: number, title: string, author: PullRequestInput['user'], mergedAt: string | null = null): PullRequestInput =>
  ({ number, title, user: author, labels: [], merged_at: mergedAt })

describe('landedPullRequests', () => {
  it('counts PRs GitHub marks merged, on their merge date', () => {
    expect(landedPullRequests([pull(1, 'feat: a', user('alice', 1), '2025-03-01T10:00:00Z')], [])).toEqual([
      { number: 1, author: user('alice', 1), type: 'feat', scopes: [], landedAt: '2025-03-01T10:00:00Z' },
    ])
  })

  it('counts closed PRs with a PR Close commit, on the earliest such commit, crediting the PR author', () => {
    const commits = [
      { message: 'fix(core): second commit\n\nPR Close #2', date: '2019-05-02T00:00:00Z' },
      { message: 'fix(core): first commit\n\nPR Close #2', date: '2019-05-01T00:00:00Z' },
    ]
    expect(landedPullRequests([pull(2, 'fix(core): two commits', user('bob', 2))], commits)).toEqual([
      { number: 2, author: user('bob', 2), type: 'fix', scopes: ['core'], landedAt: '2019-05-01T00:00:00.000Z' },
    ])
  })

  it('prefers the merge date when a PR has both', () => {
    const [landed] = landedPullRequests(
      [pull(3, 'docs: x', user('carol', 3), '2025-01-02T00:00:00Z')],
      [{ message: 'PR Close #3', date: '2025-01-01T00:00:00Z' }],
    )
    expect(landed?.landedAt).toBe('2025-01-02T00:00:00Z')
  })

  it('leaves out closed PRs that never landed, bots, deleted accounts, duplicates and bad dates', () => {
    const pulls = [
      pull(4, 'feat: closed without landing', user('dave', 4)),
      pull(5, 'chore(deps): update', user('renovate[bot]', 5), '2025-01-01T00:00:00Z'),
      pull(6, 'feat: from a deleted account', null, '2025-01-01T00:00:00Z'),
      pull(7, 'feat: ghost', user('ghost', 10137), '2025-01-01T00:00:00Z'),
      pull(8, 'feat: listed twice', user('erin', 8), '2025-01-01T00:00:00Z'),
      pull(8, 'feat: listed twice', user('erin', 8), '2025-01-01T00:00:00Z'),
      pull(9, 'feat: bad commit date', user('frank', 9)),
    ]
    const landed = landedPullRequests(pulls, [{ message: 'PR Close #9', date: 'not a date' }])
    expect(landed.map(pr => pr.number)).toEqual([8])
  })
})

describe('isBotAccount', () => {
  it.each(['renovate[bot]', 'dependabot[bot]', 'angular-robot', 'some-bot', 'ghost', 'codecov-io', 'Codecov-Commenter', '', null, undefined])('%s is a bot', (login) => {
    expect(isBotAccount(login)).toBe(true)
  })

  it.each(['alice', 'robot-fan', 'botanist'])('%s is not a bot', (login) => {
    expect(isBotAccount(login)).toBe(false)
  })
})

describe('pullRequestScopes', () => {
  it.each([
    ['fix(router): keep the query params', ['router']],
    ['feat(core, compiler): input signals', ['core', 'compiler']],
    ['feat(Core)!: drop zone.js', ['core']],
    ['docs(docs-infra): new sidebar', ['docs-infra']],
    ['refactor(zone.js): clean up', ['zone.js']],
    ['build: update to bazel 7', []],
    ['Revert "fix(router): x"', []],
    ['fix(): empty', []],
  ] as const)('%s → %j', (title, scopes) => {
    expect(pullRequestScopes(title)).toEqual(scopes)
  })
})

describe('pullRequestScopes in other repositories', () => {
  it.each([
    ['angular/components', 'fix(material/button, cdk/overlay): focus', ['@angular/material', '@angular/cdk']],
    ['angular/components', 'fix(material/select): a\nfix(material/core): b', ['@angular/material']],
    ['angular/components', 'docs(multiple): typos', []],
    ['angular/components', 'feat(google-maps): add a marker clusterer', ['@angular/google-maps']],
    ['angular/angular-cli', 'fix(@angular/build): keep the base href', ['@angular/build']],
    ['angular/angular-cli', 'feat(@schematics/angular, @angular/cli): ai config', ['@schematics/angular', '@angular/cli']],
    ['angular/angular-cli', 'build: update dependency', []],
    ['angular/angular-cli', 'fix(build): no package', []],
    ['angular/dev-infra', 'fix(ng-dev): release notes', []],
    // angular/angular is unchanged: no npm-style names.
    ['angular/angular', 'fix(@angular/core): x', []],
  ])('%s: %s', (repo, title, scopes) => {
    expect(pullRequestScopes(title, repo)).toEqual(scopes)
  })
})

describe('packageRepo', () => {
  it.each([
    ['router', 'angular/angular'],
    ['@angular/material', 'angular/components'],
    ['@angular/cdk', 'angular/components'],
    ['@angular/build', 'angular/angular-cli'],
    ['@schematics/angular', 'angular/angular-cli'],
  ])('%s → %s', (name, repo) => expect(packageRepo(name)).toBe(repo))
})
