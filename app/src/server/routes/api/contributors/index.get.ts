import { defineEventHandler } from 'h3';
import { cacheJson, parseQuery } from '../../../data/http';
import { LeaderboardInput, queryNumber, queryString } from '../../../data/schemas';
import { contributorsData } from '../../../data/store';

/** `GET /api/contributors?period=12m&country=TR&page=1`: one page (100) of the leaderboard. */
export default defineEventHandler((event) => {
  const { period, country, page } = parseQuery(event, LeaderboardInput, query => ({
    period: queryString(query['period']),
    country: queryString(query['country']) || undefined,
    page: queryNumber(queryString(query['page'])),
  }));
  cacheJson(event);
  return contributorsData().leaderboard({ period, country, page });
});
