import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The Angularians mark: a shield split in two, the right half a step higher (moving up the leaderboard), in one
 * flat brand colour. Adapted from the Angular shield the way the Angular press kit invites communities to, and kept
 * distinct from the Angular logo itself: no A, no gradient.
 */
@Component({
  selector: 'app-logo-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  template: `
    <svg viewBox="0 0 24 24" class="size-full" aria-hidden="true">
      <path fill="var(--color-brand-from)" d="M10.81 3.36V23.7L2.71 19.2 1.27 6.78ZM13.19.48 22.73 3.9 21.49 16.32 13.19 20.82Z" />
    </svg>
  `,
})
export class LogoMark {}
