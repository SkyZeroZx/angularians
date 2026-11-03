import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The page width and side gutters (Nuxt UI `UContainer`: 90rem, so 1376px of content on wide screens). */
@Component({
  selector: 'app-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mx-auto block w-full max-w-[90rem] px-4 sm:px-6 lg:px-8' },
  template: `<ng-content />`,
})
export class Container {}
