import { defineEventHandler } from 'h3';
import { cacheJson, parseQuery } from '../../../data/http';
import { MapInput, queryString } from '../../../data/schemas';
import { contributorsData } from '../../../data/store';

/** `GET /api/map/contributors?period=12m`: contributors by country, for the globe. */
export default defineEventHandler((event) => {
  const { period } = parseQuery(event, MapInput, query => ({ period: queryString(query['period']) }));
  cacheJson(event);
  return contributorsData().map(period);
});
