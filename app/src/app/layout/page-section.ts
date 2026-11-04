import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Container } from './container';

/** A titled block of a page (Nuxt UI `UPageSection`). `sectionId` makes it a link target. */
@Component({
  selector: 'app-page-section',
  imports: [Container],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block scroll-mt-20', '[attr.id]': 'sectionId()', '[attr.aria-labelledby]': 'title() ? headingId() : null' },
  template: `
    <app-container [class]="flush() ? 'pb-12 sm:pb-16' : 'py-12 sm:py-16'">
      @if (title()) {
        <header class="mb-8">
          <h2 [id]="headingId()" class="text-2xl font-medium tracking-tight sm:text-3xl">{{ title() }}</h2>
          @if (description()) {
            <p class="mt-2 max-w-2xl text-pretty text-muted-foreground">{{ description() }}</p>
          }
        </header>
      }
      <ng-content />
    </app-container>
  `,
})
export class PageSection {
  readonly title = input('')
  readonly description = input<string | null>(null)
  readonly sectionId = input<string | null>(null)
  /** No top padding: the section continues the one above (the leaderboard under the hero, as on Nuxters). */
  readonly flush = input(false)

  protected headingId() {
    return `${this.sectionId() ?? 'section'}-title`
  }
}
