import { ChangeDetectionStrategy, Component } from '@angular/core';

let nextId = 0;

/**
 * The Angularians mark: the shield cut in two along the right leg of a sharp A. The piece with the A sits a step
 * lower, the wing beside it a step higher, so the two only fit one way. One flat brand colour.
 * Adapted from the Angular shield the way the Angular press kit invites communities to, and kept distinct from the
 * Angular logo itself: our own A, the diagonal cut, the step, no gradient.
 */
@Component({
  selector: 'app-logo-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  template: `
    <svg viewBox="0 0 24 24" class="size-full" aria-hidden="true">
      <defs>
        <clipPath [attr.id]="id + '-a'"><path d="M-4 -4H8.97L24.08 28H-4Z" /></clipPath>
        <clipPath [attr.id]="id + '-w'"><path d="M8.97 -4H28V28H24.08Z" /></clipPath>
        <mask [attr.id]="id" maskUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28">
          <rect x="-2" y="-2" width="28" height="28" fill="#000" />
          <g transform="translate(12 12) scale(.9) translate(-12 -12)">
            <!-- The piece with the A, a step lower -->
            <g transform="translate(-0.5 0.67)">
              <g [attr.clip-path]="'url(#' + id + '-a)'">
                <path [attr.d]="shield" fill="#fff" stroke="#fff" stroke-width="1" stroke-linejoin="round" />
                <path fill="#000" d="M12 5.6 18.9 20.2H15.7L14.09 16.8H9.91L8.3 20.2H5.1ZM12 12.37 10.94 14.6H13.06Z" />
              </g>
            </g>
            <!-- The wing, a step higher -->
            <g transform="translate(0.5 -0.67)">
              <g [attr.clip-path]="'url(#' + id + '-w)'">
                <path [attr.d]="shield" fill="#fff" stroke="#fff" stroke-width="1" stroke-linejoin="round" />
              </g>
            </g>
          </g>
        </mask>
      </defs>
      <rect x="-2" y="-2" width="28" height="28" fill="var(--color-brand-from)" [attr.mask]="'url(#' + id + ')'" />
    </svg>
  `,
})
export class LogoMark {
  /** Unique per instance: the header and the footer can both show the mark. */
  protected readonly id = `logo-mark-${nextId++}`;
  protected readonly shield = 'M12 .8 22.6 4.6 21 18.4 12 23.4 3 18.4 1.4 4.6Z';
}
