import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { RouteMeta } from '@analogjs/router';
import { injectResponse } from '@analogjs/router/tokens';
import { HlmButton } from '@spartan-ng/helm/button';
import { PageSection } from '../layout/page-section';

export const routeMeta = {
  title: 'Page not found · Angular Contributors',
  meta: [{ name: 'robots', content: 'noindex' }],
} satisfies RouteMeta;

@Component({
  selector: 'app-not-found',
  imports: [HlmButton, PageSection, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-section title="Page not found" description="This page does not exist.">
      <a hlmBtn routerLink="/">Back to the leaderboard</a>
    </app-page-section>
  `,
})
export default class NotFound {
  constructor() {
    // A real 404 for crawlers and link checkers, not a 200 with an error message.
    const response = injectResponse();
    if (response) response.statusCode = 404;
  }
}
