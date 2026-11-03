import { createError, defineEventHandler, getRouterParam } from 'h3';
import * as v from 'valibot';
import { cacheJson } from '../../../data/http';
import { UsernameSchema } from '../../../data/schemas';
import { contributorsData } from '../../../data/store';

/** `GET /api/contributors/:username`: all-time stats, every period, and profile links. */
export default defineEventHandler((event) => {
  const username = v.safeParse(UsernameSchema, getRouterParam(event, 'username', { decode: true }));
  if (!username.success) throw createError({ statusCode: 400, statusMessage: 'Not a GitHub username' });
  const profile = contributorsData().profile(username.output);
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'No landed pull requests for this username' });
  cacheJson(event);
  return profile;
});
