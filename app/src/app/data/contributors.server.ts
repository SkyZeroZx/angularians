import { serverFn } from '@analogjs/router/server'
import { ContributorInput, LeaderboardInput, MapInput, SearchInput } from '../../server/data/schemas'
import { contributorsData } from '../../server/data/store'

/**
 * The page data. During SSR these run in-process and their results are transferred to the browser;
 * after hydration they are POSTs to an opaque server-function URL. The public JSON API is `/api/*`.
 * Invalid input is rejected by the schema before the handler runs.
 */

export const getLeaderboard = serverFn(LeaderboardInput, ({ period, country, badges, page }) =>
  contributorsData().leaderboard({ period, country, badges, page }))

/** `null` when the username has no contribution: the page shows "not found". */
export const getContributor = serverFn(ContributorInput, ({ username }) => contributorsData().profile(username))

export const searchContributors = serverFn(SearchInput, ({ q, country }) => contributorsData().search(q, { country }))

export const getContributorsMap = serverFn(MapInput, ({ period }) => contributorsData().map(period))
