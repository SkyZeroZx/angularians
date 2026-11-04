import type { Period } from '@angularians/shared'

const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })

export const formatNumber = (value: number): string => number.format(value)
export const formatPoints = (score: number): string => `${number.format(score)} ${score === 1 ? 'pt' : 'pts'}`
export const plural = (count: number, one: string, many: string): string => `${number.format(count)} ${count === 1 ? one : many}`
/** UTC, so the server and the browser print the same day (no hydration mismatch). */
export const formatDate = (iso: string): string => date.format(new Date(iso))

/**
 * A GitHub avatar by account id: stable across renames, served by GitHub's CDN.
 * `size` is in CSS pixels; GitHub gets twice that for 2x screens.
 */
export function avatarUrl(githubId: number, size: number): string {
  return `https://avatars.githubusercontent.com/u/${githubId}?s=${size * 2}&v=4`
}

/** The avatar at 1× and 2×: a screen of 1 device pixel per CSS pixel downloads a quarter of the 2× pixels. */
export function avatarSrcset(githubId: number, size: number): string {
  const url = (pixels: number) => `https://avatars.githubusercontent.com/u/${githubId}?s=${pixels}&v=4`
  return `${url(size)} 1x, ${url(size * 2)} 2x`
}

/** The profile opens on the period of the board it was picked from (all time is its default). */
export function profileQuery(period: Period, country: string | null = null): Record<string, string> {
  // The country only takes the profile's back link to the board it came from.
  return { ...(period === 'all' ? {} : { period }), ...(country ? { country } : {}) }
}

/** A round flag (circle-flags, copied to public/flags by scripts/copy-flags.ts). */
export function flagUrl(code: string): string {
  return `/flags/${code.toLowerCase()}.svg`
}
