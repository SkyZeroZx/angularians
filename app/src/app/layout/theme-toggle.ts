import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { ThemeService } from '../theme.service';

/** One button between dark (the default) and light. The icon and label say what a click switches to. */
@Component({
  selector: 'app-theme-toggle',
  imports: [HlmButton, NgIcon],
  providers: [provideIcons({ lucideMoon, lucideSun })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button hlmBtn variant="ghost" size="icon" type="button" [attr.aria-label]="label()" [attr.title]="label()" (click)="theme.toggle()">
      <ng-icon [name]="theme.dark() ? 'lucideSun' : 'lucideMoon'" aria-hidden="true" />
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService)
  protected readonly label = computed(() => (this.theme.dark() ? 'Switch to the light theme' : 'Switch to the dark theme'))
}
