import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

/** Same key as the inline script in index.html, which applies the theme before the first paint. */
export const THEME_STORAGE_KEY = 'theme';
const ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

/**
 * Light, dark, or the system setting, as the `dark` class on <html> (Spartan's dark variant).
 * On the server nothing is known: the page renders light and the inline script corrects it before paint.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly systemDark = signal(false)

  readonly preference = signal<ThemePreference>('system')
  readonly dark = computed(() => this.preference() === 'dark' || (this.preference() === 'system' && this.systemDark()))

  constructor() {
    if (!this.browser) return
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (isPreference(stored)) this.preference.set(stored)
    }
    catch {
      // Storage can be blocked: the system setting still applies.
    }

    const view = this.document.defaultView
    // Missing in some old browsers (and jsdom): light, unless a choice was saved.
    const media = typeof view?.matchMedia === 'function' ? view.matchMedia('(prefers-color-scheme: dark)') : null
    if (media) {
      this.systemDark.set(media.matches)
      const listener = (event: MediaQueryListEvent) => this.systemDark.set(event.matches)
      media.addEventListener('change', listener)
      inject(DestroyRef).onDestroy(() => media.removeEventListener('change', listener))
    }

    effect(() => {
      const root = this.document.documentElement
      root.classList.toggle('dark', this.dark())
      root.style.colorScheme = this.dark() ? 'dark' : 'light'
    })
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference)
    try {
      if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, preference)
    }
    catch {
      // Not remembered, still applied.
    }
  }

  /** System → light → dark → system. */
  cycle(): void {
    this.set(ORDER[(ORDER.indexOf(this.preference()) + 1) % ORDER.length]!)
  }
}
