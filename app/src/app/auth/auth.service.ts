import { isPlatformBrowser } from '@angular/common'
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core'
import type { SignedIn } from '../../server/auth/session'

/** Remembered in the browser: whether this visitor was signed in last time, to size the card before we know. */
const SIGNED_IN_HINT = 'angularians-signed-in'

/**
 * Who is signed in, asked in the browser only: pages are cached for everyone, so they never carry it.
 * `null` until known (and on the server).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly state = signal<SignedIn | null>(null)
  /** Signed in on the last visit: the card keeps the signed-in height while it loads. */
  readonly wasSignedIn = signal(false)

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return
    try {
      this.wasSignedIn.set(localStorage.getItem(SIGNED_IN_HINT) === '1')
    }
    catch {
      // Storage can be blocked: the signed-out size, the most likely one.
    }
    fetch('/api/auth/me', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then(response => (response.ok ? response.json() as Promise<SignedIn> : { enabled: false, user: null }))
      .then(state => this.remember(state), () => this.remember({ enabled: false, user: null }))
  }

  private remember(state: SignedIn): void {
    this.state.set(state)
    try {
      if (state.user) localStorage.setItem(SIGNED_IN_HINT, '1')
      else localStorage.removeItem(SIGNED_IN_HINT)
    }
    catch {
      // Not remembered: the next visit guesses signed out.
    }
  }

  /** Sign in, then come back to this path. */
  loginUrl(returnTo: string): string {
    return `/api/auth/login?${new URLSearchParams({ returnTo })}`
  }
}
