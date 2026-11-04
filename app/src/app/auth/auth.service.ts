import { isPlatformBrowser } from '@angular/common'
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core'
import type { SignedIn } from '../../server/auth/session'

/**
 * Who is signed in, asked in the browser only: pages are cached for everyone, so they never carry it.
 * `null` until known (and on the server).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly state = signal<SignedIn | null>(null)

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return
    fetch('/api/auth/me', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then(response => (response.ok ? response.json() as Promise<SignedIn> : { enabled: false, user: null }))
      .then(state => this.state.set(state), () => this.state.set({ enabled: false, user: null }))
  }

  /** Sign in, then come back to this path. */
  loginUrl(returnTo: string): string {
    return `/api/auth/login?${new URLSearchParams({ returnTo })}`
  }
}
