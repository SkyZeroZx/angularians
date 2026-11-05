import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { SiteFooter } from './layout/site-footer';
import { SiteHeader } from './layout/site-header';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteFooter, SiteHeader],
  host: { class: 'flex min-h-dvh flex-col' },
  template: `
    <a href="#main" (click)="skipToMain($event)" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring">Skip to content</a>
    <app-site-header />
    <main id="main" tabindex="-1" class="flex-1 outline-none">
      <router-outlet />
    </main>
    <app-site-footer />
  `,
})
export class App {
  // Created with the app, so a saved light theme applies from the start.
  private readonly theme = inject(ThemeService)

  /** `<base href="/">` would send a plain `#main` link to the home page. */
  protected skipToMain(event: Event): void {
    event.preventDefault()
    document.getElementById('main')?.focus()
  }

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return
    // A new page starts at the top. Only when the page itself changes: a period or a country on the same page
    // (query parameters) keeps the place, and back and forward keep the browser's own.
    const router = inject(Router)
    let path = location.pathname
    let back = false
    const subscription = router.events.subscribe(event => {
      if (event instanceof NavigationStart) back = event.navigationTrigger === 'popstate'
      if (event instanceof NavigationEnd) {
        const next = event.urlAfterRedirects.split(/[?#]/)[0]!
        if (next !== path && !back && !location.hash) window.scrollTo({ top: 0 })
        // A new page: keyboard and screen reader users carry on from its start.
        if (next !== path) document.getElementById('main')?.focus({ preventScroll: true })
        path = next
      }
    })
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe())
  }
}
