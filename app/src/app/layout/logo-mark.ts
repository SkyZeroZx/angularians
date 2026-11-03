import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The Angularians mark: a rounded A with a spark (a rank, a star), in the brand gradient.
 * Our own mark, not the Angular shield: this is a community project, it does not use Google's trademarks as its logo.
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
      <!-- The A: two legs and a crossbar, with the counter cut out (even-odd) -->
      <path
        fill="url(#logo-mark-gradient)"
        fill-rule="evenodd"
        stroke="url(#logo-mark-gradient)"
        stroke-width="1.6"
        stroke-linejoin="round"
        d="M10.4 3.6h3.2l6.2 16.6h-3.6l-1.3-3.6H9.1l-1.3 3.6H4.2zM12 8.4l-2 5.4h4z"
      />
      <!-- The spark: a rank, a star -->
      <path fill="url(#logo-mark-gradient)" d="M20 1.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </svg>
  `,
})
export class LogoMark {}
