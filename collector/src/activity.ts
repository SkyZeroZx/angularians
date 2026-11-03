// Ported from nuxt/nuxters `collectIssues` and `collectComments` (MIT, Copyright (c) 2023 Nuxt), plus inline review
// comments. Every page is counted as it arrives: a full run of angular/angular streams ~500,000 comments.
import type { CommentInput, ContributorsAccumulator, IssueInput } from '@angularians/shared'
import { paginate } from './github.ts'

type Repo = { owner: string, name: string }

export interface ActivityStats {
  issues: number
  pullRequestItems: number
  comments: number
  reviewComments: number
  pages: number
}

/** Pages between two progress lines in the log. */
const PROGRESS_EVERY = 100

/**
 * Issues (and the PRs the issues API also lists, for their reactions), conversation comments on both,
 * and inline review comments, newest last. With `since` (test runs), only items created since then.
 */
export async function collectActivity({ owner, name }: Repo, since: Date | null, accumulator: ContributorsAccumulator): Promise<ActivityStats> {
  const stats: ActivityStats = { issues: 0, pullRequestItems: 0, comments: 0, reviewComments: 0, pages: 0 }
  const params = (extra: Record<string, string>) => `?${new URLSearchParams({ per_page: '100', ...(since ? { since: since.toISOString() } : {}), ...extra })}`
  // `since` filters on the last update: an old item updated since would be counted.
  const created = (item: { created_at: string }) => !since || Date.parse(item.created_at) >= since.getTime()

  const streams: Array<[string, string, (item: IssueInput & CommentInput) => void]> = [
    ['issues', `/repos/${owner}/${name}/issues${params({ state: 'all', sort: 'created', direction: 'asc' })}`, (item) => {
      accumulator.addIssue(item)
      if (item.pull_request) stats.pullRequestItems++
      else stats.issues++
    }],
    ['comments', `/repos/${owner}/${name}/issues/comments${params({ sort: 'created', direction: 'asc' })}`, (item) => {
      accumulator.addComment(item)
      stats.comments++
    }],
    ['review comments', `/repos/${owner}/${name}/pulls/comments${params({ sort: 'created', direction: 'asc' })}`, (item) => {
      accumulator.addReviewComment(item)
      stats.reviewComments++
    }],
  ]

  // One stream after the other: GitHub asks for no concurrent requests (secondary rate limits).
  for (const [label, url, add] of streams) {
    let pages = 0
    for await (const page of paginate<IssueInput & CommentInput>(url)) {
      for (const item of page) if (created(item)) add(item)
      pages++
      stats.pages++
      if (pages % PROGRESS_EVERY === 0) console.log(`  ${label}: ${pages} pages`)
    }
    console.log(`  ${label}: done, ${pages} pages`)
  }
  return stats
}
