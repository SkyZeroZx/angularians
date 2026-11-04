import { defineEventHandler } from 'h3';
import { cacheJson, parseQuery } from '../../../data/http';
import { queryString, SearchInput } from '../../../data/schemas';
import { contributorsData } from '../../../data/store';

/** `GET /api/search/contributors?q=cris&country=TR`: up to 8 all-time contributors, prefix matches first. */
export default defineEventHandler((event) => {
  const { q, country } = parseQuery(event, SearchInput, query => ({
    q: queryString(query['q']) ?? '',
    country: queryString(query['country']) || undefined,
  }));
  cacheJson(event);
  return contributorsData().search(q, { country });
});
