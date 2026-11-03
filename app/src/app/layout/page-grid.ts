import { ChangeDetectionStrategy, Component } from '@angular/core';

/** A responsive grid of cards (Nuxt UI `UPageGrid`). */
@Component({
  selector: 'app-page-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' },
  template: `<ng-content />`,
})
export class PageGrid {}
