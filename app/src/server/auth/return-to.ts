/** A path of this site, or `/`: never another origin (`//evil.example`, `https://…`). */
export function safeReturnTo(value: unknown): string {
  return typeof value === 'string' && /^\/(?!\/)[^\\]*$/.test(value) ? value : '/'
}

/** Where sign-in ends: the page it started from, or from the home page your profile, if you have contributions. */
export function afterSignIn(returnTo: string | undefined, username: string | null): string {
  if (returnTo && returnTo !== '/') return returnTo
  return username ? `/${encodeURIComponent(username)}` : '/'
}
