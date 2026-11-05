import { Component, computed, input } from '@angular/core';
import { Container } from './container';

const brandParts = (text: string) => text.split(/(Angularians?)/)

/** A titled block of a page (Nuxt UI `UPageSection`). `sectionId` makes it a link target. */
@Component({
  selector: 'app-page-section',
  imports: [Container],
  host: { class: 'block scroll-mt-20', '[attr.id]': 'sectionId()', '[attr.aria-labelledby]': 'title() ? headingId() : null' },
  template: `
    <app-container [class]="flush() ? 'pb-12 sm:pb-16' : 'py-12 sm:py-16'">
      @if (title()) {
        <header class="mb-8">
          <h2 [id]="headingId()" [class]="viking() ? 'brand text-3xl sm:text-4xl' : 'text-2xl font-medium tracking-tight sm:text-3xl'">
            @for (part of titleParts(); track $index) {
              @if ($odd) { <span class="brand text-primary">{{ part }}</span> } @else { {{ part }} }
            }
            <ng-content select="[sectionTitleNote]" />
          </h2>
          @if (description()) {
            <p class="mt-2 max-w-2xl text-pretty text-muted-foreground">
              <ng-content select="[sectionDescriptionLead]" />
              @for (part of descriptionParts(); track $index) {
                @if ($odd) { <span class="brand text-primary">{{ part }}</span> } @else { {{ part }} }
              }
            </p>
          }
        </header>
      }
      <ng-content />
    </app-container>
  `,
})
export class PageSection {
  readonly title = input('')
  /** The whole title in the brand font. */
  readonly viking = input(false)
  /** Every other part is the word "Angularian(s)", in the brand font. */
  protected readonly titleParts = computed(() => brandParts(this.title()))
  readonly description = input<string | null>(null)
  protected readonly descriptionParts = computed(() => brandParts(this.description() ?? ''))
  readonly sectionId = input<string | null>(null)
  /** No top padding: the section continues the one above (the leaderboard under the hero, as on Nuxters). */
  readonly flush = input(false)

  protected headingId() {
    return `${this.sectionId() ?? 'section'}-title`
  }
}
