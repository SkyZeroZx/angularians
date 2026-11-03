import { defineEventHandler } from 'h3';
import { cacheJson, parseQuery } from '../../../data/http';
import { queryString, SearchInput } from '../../../data/schemas';
import { contributorsData } from '../../../data/store';

/** `GET /api/search/contributors?q=cris`: up to 8 all-time contributors, prefix matches first. */
export default defineEventHandler((event) => {
  const { q } = parseQuery(event, SearchInput, query => ({ q: queryString(query['q']) ?? '' }));
  cacheJson(event);
  return contributorsData().search(q);
});
