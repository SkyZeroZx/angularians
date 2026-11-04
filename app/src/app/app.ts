import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { SiteFooter } from './layout/site-footer';
import { SiteHeader } from './layout/site-header';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteFooter, SiteHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-dvh flex-col' },
  template: `
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring">Skip to content</a>
    <app-site-header />
    <main id="main" class="flex-1">
      <router-outlet />
    </main>
    <app-site-footer />
  `,
})
export class App {
  // Created with the app, so a saved light theme applies from the start.
  private readonly theme = inject(ThemeService)

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
        path = next
      }
    })
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe())
  }
}
