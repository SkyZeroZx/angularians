import { defineEventHandler } from 'h3';
import { parseBadgeKeys } from '../../../../app/profile/card-badges';
import { cacheJson, parseQuery } from '../../../data/http';
import { LeaderboardInput, queryNumber, queryString } from '../../../data/schemas';
import { contributorsData } from '../../../data/store';

/** `GET /api/contributors?period=12m&country=TR&badges=angular-gde,github-star&page=1`: one page (100) of the leaderboard. */
export default defineEventHandler((event) => {
  const { period, country, badges, page } = parseQuery(event, LeaderboardInput, query => ({
    period: queryString(query['period']),
    country: queryString(query['country']) || undefined,
    badges: parseBadgeKeys(queryString(query['badges'])),
    page: queryNumber(queryString(query['page'])),
  }));
  cacheJson(event);
  return contributorsData().leaderboard({ period, country, badges, page });
});
