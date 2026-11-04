import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Container } from './container';

/**
 * The top of a page (Nuxt UI `UPageHero`, as on nuxt.com/nuxters): a heading, a description and optional actions,
 * with an optional card beside them on wide screens (`heroAside`), over a soft glow of the brand colour.
 */
@Component({
  selector: 'app-page-hero',
  imports: [Container],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block isolate overflow-hidden' },
  styles: `
    .glow {
      background:
        radial-gradient(60% 100% at 20% 0%, color-mix(in oklch, var(--color-brand-from) 22%, transparent), transparent 70%),
        radial-gradient(45% 80% at 80% 0%, color-mix(in oklch, var(--color-brand-to) 14%, transparent), transparent 70%);
    }
  `,
  template: `
    <div class="glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem]" aria-hidden="true"></div>
    <app-container class="grid items-center gap-10 pt-16 pb-12 sm:pt-24 sm:pb-16 lg:grid-cols-2 lg:gap-16">
      <div>
        <ng-content select="[heroHeadline]" />
        <h1 class="text-4xl font-medium tracking-tight text-balance sm:text-5xl">
          <ng-content select="[heroTitle]" />{{ title() }}
        </h1>
        @if (description()) {
          <p class="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">{{ description() }}</p>
        }
        <div class="mt-8 flex flex-wrap gap-3 empty:hidden"><ng-content select="[heroActions]" /></div>
        <ng-content />
      </div>
      <ng-content select="[heroAside]" />
    </app-container>
  `,
})
export class PageHero {
  readonly title = input('')
  readonly description = input<string | null>(null)
}
