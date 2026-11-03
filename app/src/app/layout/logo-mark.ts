import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Our own mark, not the Angular logo: a stack of three bars (a leaderboard) in the brand gradient.
 * This is a community project, so it does not use Google's trademarks as its logo.
 */
@Component({
  selector: 'app-logo-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  template: `
    <svg viewBox="0 0 24 24" class="size-full" aria-hidden="true">
      <defs>
        <linearGradient id="logo-mark-gradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="var(--color-brand-from)" />
          <stop offset="1" stop-color="var(--color-brand-to)" />
        </linearGradient>
      </defs>
      <rect x="3" y="11" width="5" height="10" rx="1.5" fill="url(#logo-mark-gradient)" opacity="0.7" />
      <rect x="9.5" y="4" width="5" height="17" rx="1.5" fill="url(#logo-mark-gradient)" />
      <rect x="16" y="14" width="5" height="7" rx="1.5" fill="url(#logo-mark-gradient)" opacity="0.5" />
    </svg>
  `,
})
export class LogoMark {}
