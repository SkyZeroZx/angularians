/** A path of this site, or `/`: never another origin (`//evil.example`, `https://…`). */
export function safeReturnTo(value: unknown): string {
  return typeof value === 'string' && /^\/(?!\/)[^\\]*$/.test(value) ? value : '/'
}
