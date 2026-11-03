import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContributorsAccumulator } from '@angularians/shared'
import { collectActivity, walkCappedList } from '../src/activity.ts'
import { retryTiming } from '../src/github.ts'

const ann = { login: 'ann', id: 1 }
const bot = { login: 'angular-robot', id: 2 }
const at = (day: string) => `2026-${day}T00:00:00Z`

type Page = { items: unknown[], next?: string }
let pages: Record<string, Page> = {}
let urls: string[] = []

/** Pages by key: the endpoint (`issues`, `issues/comments`, `pulls/comments`), `+since` when asked from a date, or a `next` link. */
function stubGitHub(routes: Record<string, Page>): void {
  pages = routes
  urls = []
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    urls.push(input)
    const url = new URL(input)
    let key = url.pathname.startsWith('/next/') ? url.pathname.slice('/next/'.length) : url.pathname.replace('/repos/angular/angular/', '')
    if (!url.pathname.startsWith('/next/') && url.searchParams.has('since') && pages[`${key}+${url.searchParams.get('since')}`]) key = `${key}+${url.searchParams.get('since')}`
    const page = pages[key]
    if (!page) return new Response('[]', { status: 200 })
    const headers = new Headers(page.next ? { link: `<https://api.github.com/next/${page.next}>; rel="next"` } : {})
    return new Response(JSON.stringify(page.items), { status: 200, headers })
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe('collectActivity', () => {
  const now = new Date('2026-11-03T00:00:00Z')
  const routes = (): Record<string, Page> => ({
    'issues': { items: [{ user: ann, created_at: at('10-01'), state_reason: 'completed', comments: 1, reactions: { total_count: 0 } }], next: 'issues-2' },
    'issues-2': { items: [
      { user: ann, created_at: at('10-02'), pull_request: {}, reactions: { total_count: 4 } },
      { user: ann, created_at: at('08-01'), comments: 0, reactions: { total_count: 0 } },
    ] },
    'issues/comments': { items: [
      { id: 10, user: ann, created_at: at('10-03'), updated_at: at('10-03'), reactions: { total_count: 3 } },
      { id: 11, user: bot, created_at: at('10-03'), updated_at: at('10-03') },
    ] },
    'pulls/comments': { items: [{ id: 20, user: ann, created_at: at('10-04'), updated_at: at('10-04') }, { id: 21, user: ann, created_at: at('10-05'), updated_at: at('10-05') }] },
  })

  it('streams issues (and PR reactions), comments and review comments into the scores, every page', async () => {
    stubGitHub(routes())
    const accumulator = new ContributorsAccumulator(now)
    const stats = await collectActivity({ owner: 'angular', name: 'angular' }, null, accumulator)
    expect(stats).toEqual({ issues: 2, pullRequestItems: 1, comments: 2, reviewComments: 2, pages: 4 })
    expect(urls.map(url => new URL(url).pathname)).toEqual([
      '/repos/angular/angular/issues', '/next/issues-2', '/repos/angular/angular/issues/comments', '/repos/angular/angular/pulls/comments',
    ])
    expect(urls[0]).toContain('state=all')
    // The capped lists are walked in update order.
    expect(urls[2]).toContain('sort=updated')
    // 2 issues (1 helpful), PR reactions 4 + comment reactions 3, 1 helpful comment of 1, 2 review comments; the bot is left out.
    expect(accumulator.records().get('all')).toEqual([expect.objectContaining({
      username: 'ann', issues: 2, helpfulIssues: 1, comments: 1, helpfulComments: 1, reviewComments: 2, reactions: 7,
      score: Math.round(2 + 3 + 0.5 + 2 + 2 + 0.7),
    })])
  })

  it('with `since`, asks GitHub for items updated since and counts the ones created since', async () => {
    stubGitHub(routes())
    const stats = await collectActivity({ owner: 'angular', name: 'angular' }, new Date(at('09-01')), new ContributorsAccumulator(now))
    expect(urls[0]).toContain(`since=${encodeURIComponent('2026-09-01T00:00:00.000Z')}`)
    expect(stats.issues).toBe(1) // the one from 08-01 is left out
  })
})

describe('walkCappedList', () => {
  it('continues from the last update when a window hits the page cap, without counting an item twice', async () => {
    const comment = (id: number, day: string) => ({ id, created_at: at(day), updated_at: at(day) })
    stubGitHub({
      // Window 1: capped after 2 pages (cap 2 here, 300 on GitHub).
      'issues/comments': { items: [comment(1, '01-01'), comment(2, '01-02')], next: 'w1-2' },
      'w1-2': { items: [comment(3, '01-03'), comment(4, '01-04')] },
      // Window 2, from 01-04: item 4 again (same update time), then new ones, not capped.
      [`issues/comments+${new Date(at('01-04')).toISOString()}`]: { items: [comment(4, '01-04'), comment(5, '01-05')] },
    })
    const ids: number[] = []
    for await (const page of walkCappedList<{ id: number, created_at: string, updated_at: string }>('/repos/angular/angular/issues/comments', {}, null, 2)) {
      ids.push(...page.map(item => item.id))
    }
    expect(ids).toEqual([1, 2, 3, 4, 5])
    expect(urls).toHaveLength(3)
  })

  it('continues from the last update with smaller pages when GitHub keeps failing a page', async () => {
    retryTiming.scale = 0
    const comment = (id: number, day: string) => ({ id, created_at: at(day), updated_at: at(day) })
    const asked: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: string) => {
      const url = new URL(input)
      asked.push(`${url.pathname} ${url.searchParams.get('per_page') ?? ''} ${url.searchParams.get('since') ?? ''}`.trim())
      if (url.pathname === '/next/broken') return new Response('{"message":"Server Error"}', { status: 502 })
      if (url.searchParams.get('since')) return new Response(JSON.stringify([comment(2, '01-02'), comment(3, '01-03')]))
      return new Response(JSON.stringify([comment(1, '01-01'), comment(2, '01-02')]), { headers: { link: '<https://api.github.com/next/broken>; rel="next"' } })
    }))
    const ids: number[] = []
    try {
      for await (const page of walkCappedList<{ id: number, created_at: string, updated_at: string }>('/repos/angular/angular/pulls/comments', {}, null)) {
        ids.push(...page.map(item => item.id))
      }
    }
    finally {
      retryTiming.scale = 1
    }
    expect(ids).toEqual([1, 2, 3])
    expect(asked[0]).toBe('/repos/angular/angular/pulls/comments 100')
    expect(asked.at(-1)).toBe(`/repos/angular/angular/pulls/comments 50 ${new Date(at('01-02')).toISOString()}`)
  })

  it('gives up on a failing page at the smallest page size', async () => {
    retryTiming.scale = 0
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 502 })))
    const walk = async () => {
      for await (const _page of walkCappedList('/repos/angular/angular/pulls/comments', {}, null)) { /* drain */ }
    }
    try {
      await expect(walk()).rejects.toThrow(/GitHub 502/)
      // 100, 50 and 25 per page, each with its own retries.
      expect(vi.mocked(fetch).mock.calls.map(([url]) => new URL(url as string).searchParams.get('per_page'))).toEqual(['100', '100', '100', '100', '100', '100', '50', '50', '50', '50', '50', '50', '25', '25', '25', '25', '25', '25'])
    }
    finally {
      retryTiming.scale = 1
    }
  })

  it('stops instead of looping when a capped window brings nothing new', async () => {
    stubGitHub({
      'issues/comments': { items: [{ id: 1, created_at: at('01-01'), updated_at: at('01-01') }], next: 'same' },
      'same': { items: [] },
      [`issues/comments+${new Date(at('01-01')).toISOString()}`]: { items: [{ id: 1, created_at: at('01-01'), updated_at: at('01-01') }], next: 'same' },
    })
    const walk = async () => {
      for await (const _page of walkCappedList('/repos/angular/angular/issues/comments', {}, null, 2)) { /* drain */ }
    }
    await expect(walk()).rejects.toThrow(/without progress/)
  })
})
