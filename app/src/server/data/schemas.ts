import { countryCode, DEFAULT_PERIOD, isPeriod } from '@angularians/shared'
import * as v from 'valibot'

/** GitHub logins: letters, digits and single hyphens, 39 characters at most. */
const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

export const PeriodSchema = v.pipe(v.string(), v.check(value => isPeriod(value), 'Unknown period'))
export const CountrySchema = v.pipe(
  v.string(),
  v.transform(value => countryCode(value)),
  v.check(value => value !== null, 'Unknown country code'),
)
export const UsernameSchema = v.pipe(v.string(), v.regex(USERNAME_RE, 'Not a GitHub username'))

export const LeaderboardInput = v.object({
  period: v.optional(PeriodSchema, DEFAULT_PERIOD),
  country: v.optional(v.nullable(CountrySchema), null),
  page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10_000)), 1),
})
export type LeaderboardInput = v.InferInput<typeof LeaderboardInput>

export const ContributorInput = v.object({ username: UsernameSchema })
export const SearchInput = v.object({ q: v.pipe(v.string(), v.trim(), v.maxLength(100)) })
export const MapInput = v.object({ period: v.optional(PeriodSchema, DEFAULT_PERIOD) })

/** Query strings are strings: `?page=2` → `2`. Anything else stays as is for the schema to reject. */
export function queryNumber(value: unknown): unknown {
  return typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value
}

/** A single query parameter: `?a=1&a=2` is not a valid request. */
export function queryString(value: unknown): unknown {
  return Array.isArray(value) ? undefined : value
}
