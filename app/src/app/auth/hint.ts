/**
 * A cookie, not a secret: "this browser was signed in". The session itself is the sealed, http-only cookie. The
 * server reads this one to draw the signed-in card's skeleton (and the avatar's place) from the first paint, so a
 * returning visitor never sees the signed-out card flash; Netlify's CDN keeps a copy of each page for each value.
 */
export const SIGNED_IN_HINT = 'angularians-signed-in'

/** Whether a `Cookie` header (or `document.cookie`) has the hint. */
export function hasSignedInHint(cookies: string | null | undefined): boolean {
  return (cookies ?? '').split(';').some(part => part.trim() === `${SIGNED_IN_HINT}=1`)
}
