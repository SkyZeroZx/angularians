import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Container } from './container';

@Component({
  selector: 'app-site-footer',
  imports: [Container],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block border-t' },
  template: `
    <app-container class="flex flex-col gap-2 py-8 text-sm text-muted-foreground">
      <p>
        <strong class="font-medium text-foreground">Community project, not affiliated with Google or the Angular team.</strong>
        Angular is a trademark of Google LLC.
      </p>
      <p>
        Counts merged pull requests, issues, comments and code reviews in
        <a class="underline underline-offset-4 hover:text-foreground" href="https://github.com/angular/angular" target="_blank" rel="noopener">angular/angular</a>,
        <a class="underline underline-offset-4 hover:text-foreground" href="https://github.com/angular/components" target="_blank" rel="noopener">components</a>,
        <a class="underline underline-offset-4 hover:text-foreground" href="https://github.com/angular/angular-cli" target="_blank" rel="noopener">angular-cli</a> and
        <a class="underline underline-offset-4 hover:text-foreground" href="https://github.com/angular/dev-infra" target="_blank" rel="noopener">dev-infra</a>,
        updated nightly. Inspired by and ported from
        <a class="underline underline-offset-4 hover:text-foreground" href="https://nuxt.com/nuxters" target="_blank" rel="noopener">Nuxters</a>
        (MIT, © NuxtLabs and Nuxt). Country data from
        <a class="underline underline-offset-4 hover:text-foreground" href="https://www.geonames.org" target="_blank" rel="noopener">GeoNames</a>
        (CC BY 4.0).
      </p>
      <p>
        Built by <a class="font-medium text-foreground underline-offset-4 hover:underline" href="https://erkamyaman.dev" target="_blank" rel="noopener">Erkam Yaman</a>.
        <a class="underline underline-offset-4 hover:text-foreground" href="https://github.com/erkamyaman/angularians" target="_blank" rel="noopener">Source on GitHub</a>.
      </p>
    </app-container>
  `,
})
export class SiteFooter {}
