/** The public address of the site: shared links, the README card, og:image (which must be absolute). */
export const SITE_URL = 'https://angularians.dev'

/** The page's canonical URL, absolute (a relative one resolves to whichever host served the page, a preview deploy too). */
export function setCanonical(document: Document, path: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.setAttribute('href', `${SITE_URL}${path}`)
}
