// Ported from nuxt/nuxters `scripts/collect-contributors.ts` (MIT, Copyright (c) 2023 Nuxt).

/**
 * Bot accounts without `[bot]` or `-bot` in their login.
 * Add more from the `Possible bots` line a collection run prints.
 */
export const KNOWN_BOT_ACCOUNTS: readonly string[] = [
  'codecov-io',
  'codecov-commenter',
  // Found in the first angular/angular run: dependency and docs updates.
  'angular-robot',
]

/** GitHub apps (`renovate[bot]`), `-bot` accounts, the `ghost` of deleted accounts, and the known list. */
export function isBotAccount(login: string | null | undefined): boolean {
  if (!login) return true
  const lower = login.toLowerCase()
  return KNOWN_BOT_ACCOUNTS.includes(lower) || lower.includes('[bot]') || lower.endsWith('-bot') || lower === 'ghost'
}
