import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContributorsAccumulator } from '@angularians/shared'
import { collectActivity } from '../src/activity.ts'

const ann = { login: 'ann', id: 1 }
const bot = { login: 'angular-robot', id: 2 }
const at = (day: string) => `2026-${day}T00:00:00Z`

/** The three list endpoints, the issues one on two pages (a `Link` header to the second). */
const pages: Record<string, { items: unknown[], next?: string }> = {
  issues: { items: [{ user: ann, created_at: at('10-01'), state_reason: 'completed', comments: 1, reactions: { total_count: 0 } }], next: 'issues-2' },
  'issues-2': { items: [
    { user: ann, created_at: at('10-02'), pull_request: {}, reactions: { total_count: 4 } },
    { user: ann, created_at: at('08-01'), comments: 0, reactions: { total_count: 0 } },
  ] },
  'issues/comments': { items: [{ user: ann, created_at: at('10-03'), reactions: { total_count: 3 } }, { user: bot, created_at: at('10-03') }] },
  'pulls/comments': { items: [{ user: ann, created_at: at('10-04') }, { user: ann, created_at: at('10-05') }] },
}

function stubGitHub(): string[] {
  const urls: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    urls.push(input)
    const key = input.includes('/next/') ? input.split('/next/')[1]! : input.match(/angular\/(issues\/comments|pulls\/comments|issues)\?/)![1]!
    const page = pages[key]!
    const headers = new Headers(page.next ? { link: `<https://api.github.com/next/${page.next}>; rel="next"` } : {})
    return new Response(JSON.stringify(page.items), { status: 200, headers })
  }))
  return urls
}

afterEach(() => vi.unstubAllGlobals())

describe('collectActivity', () => {
  const now = new Date('2026-11-03T00:00:00Z')

  it('streams issues (and PR reactions), comments and review comments into the scores, every page', async () => {
    const urls = stubGitHub()
    const accumulator = new ContributorsAccumulator(now)
    const stats = await collectActivity({ owner: 'angular', name: 'angular' }, null, accumulator)
    expect(stats).toEqual({ issues: 2, pullRequestItems: 1, comments: 2, reviewComments: 2, pages: 4 })
    expect(urls.map(url => url.replace('https://api.github.com', '').split('?')[0])).toEqual([
      '/repos/angular/angular/issues', '/next/issues-2', '/repos/angular/angular/issues/comments', '/repos/angular/angular/pulls/comments',
    ])
    expect(urls[0]).toContain('state=all')
    // 2 issues (1 helpful), PR reactions 4 + comment reactions 3, 1 helpful comment of 1, 2 review comments; the bot is left out.
    expect(accumulator.records().get('all')).toEqual([expect.objectContaining({
      username: 'ann', issues: 2, helpfulIssues: 1, comments: 1, helpfulComments: 1, reviewComments: 2, reactions: 7,
      score: Math.round(2 + 3 + 0.5 + 2 + 2 + 0.7),
    })])
  })

  it('with `since`, asks GitHub for items updated since and counts the ones created since', async () => {
    const urls = stubGitHub()
    const accumulator = new ContributorsAccumulator(now)
    const stats = await collectActivity({ owner: 'angular', name: 'angular' }, new Date(at('09-01')), accumulator)
    expect(urls[0]).toContain(`since=${encodeURIComponent(at('09-01').replace('Z', '.000Z'))}`)
    expect(stats.issues).toBe(1) // the one from 08-01 is left out
  })
})
