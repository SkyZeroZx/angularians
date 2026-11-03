import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMonitor, lucideMoon, lucideSun } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { ThemeService } from '../theme.service';

const LABELS = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' } as const

/** One button: system → light → dark. The label says the current theme and what a click does. */
@Component({
  selector: 'app-theme-toggle',
  imports: [HlmButton, NgIcon],
  providers: [provideIcons({ lucideMonitor, lucideMoon, lucideSun })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button hlmBtn variant="ghost" size="icon" type="button" [attr.aria-label]="label()" [attr.title]="label()" (click)="theme.cycle()">
      <ng-icon [name]="icon()" aria-hidden="true" />
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService)
  protected readonly icon = computed(() => ({ system: 'lucideMonitor', light: 'lucideSun', dark: 'lucideMoon' })[this.theme.preference()])
  protected readonly label = computed(() => `${LABELS[this.theme.preference()]} (click to change)`)
}
