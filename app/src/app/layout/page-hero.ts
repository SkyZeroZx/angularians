import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Container } from './container';

/** The top of a page: a heading, a description, and optional actions (Nuxt UI `UPageHero`). */
@Component({
  selector: 'app-page-hero',
  imports: [Container],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block border-b' },
  template: `
    <app-container class="py-16 sm:py-20">
      <ng-content select="[heroHeadline]" />
      <h1 class="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
        <ng-content select="[heroTitle]" />{{ title() }}
      </h1>
      @if (description()) {
        <p class="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">{{ description() }}</p>
      }
      <div class="mt-8 flex flex-wrap gap-3 empty:hidden"><ng-content select="[heroActions]" /></div>
      <ng-content />
    </app-container>
  `,
})
export class PageHero {
  readonly title = input('')
  readonly description = input<string | null>(null)
}
