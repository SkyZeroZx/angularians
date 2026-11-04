import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The Angularians mark: the Angular shield cut in two along the right leg of a sharp A. The piece with the A sits
 * a step lower, the wing beside it a step higher, so the two only fit one way; the A runs out through the bottom
 * of the shield. One flat brand colour, built from its construction in `app/scripts/logo/build.py`
 * (`--parts` gives the two pieces and their moves).
 * Adapted from the Angular shield the way the Angular press kit invites communities to, and kept distinct from the
 * Angular logo itself: our own A, the diagonal cut, the step, no gradient.
 *
 * `animated`: the mark assembles once (a whole shield that splits, the wing rising into its step), and the wing
 * lifts a little more on hover. Nothing moves for people who ask for reduced motion.
 */
@Component({
  selector: 'app-logo-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block', '[class.animated]': 'animated()' },
  styles: `
    :host {
      --piece-x: 0.129px;
      --piece-y: -0.836px;
      --wing-x: -0.129px;
      --wing-y: 0.836px;
    }
    .piece,
    .wing {
      transition: transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    @media (prefers-reduced-motion: no-preference) {
      :host(.animated) svg {
        animation: logo-appear 360ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }
      :host(.animated) .piece {
        animation: logo-piece 760ms 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }
      :host(.animated) .wing {
        animation: logo-wing 760ms 260ms cubic-bezier(0.34, 1.5, 0.5, 1) both;
      }
      :host(.animated:hover) .wing,
      :host-context(.group:hover):host(.animated) .wing,
      :host-context(a:hover):host(.animated) .wing,
      :host-context(a:focus-visible):host(.animated) .wing {
        transform: translateY(-1px);
      }
    }
    @keyframes logo-appear {
      from { opacity: 0; transform: scale(0.85); }
    }
    /* Both pieces start where they belong in the whole shield, then move into their step. */
    @keyframes logo-piece {
      from { transform: translate(var(--piece-x), var(--piece-y)); }
    }
    @keyframes logo-wing {
      from { transform: translate(var(--wing-x), var(--wing-y)); }
    }
  `,
  template: `
    <svg viewBox="0 0 24 24" class="size-full overflow-visible" aria-hidden="true" style="transform-origin: center">
      <path class="piece" fill="var(--color-brand-from)" d="M2.52 6.01L2.45 6.05L2.4 6.12L2.35 6.19L2.32 6.26L2.31 6.34L2.31 6.43L3.69 18.31L3.71 18.39L3.74 18.47L3.78 18.54L3.84 18.59L3.91 18.64L5.46 19.5L11.87 5.93L18.29 19.5L19.34 18.91L11.69 2.71L2.59 5.97ZM11.74 22.98L11.83 23L11.91 23L12 22.98L12.08 22.95L16.1 20.71L14.35 17L9.39 17L7.64 20.71L11.66 22.95ZM13.4 15L11.87 11.76L10.34 15Z" />
      <path class="wing" fill="var(--color-brand-from)" d="M11.94 1.04L19.6 17.24L20.09 16.97L20.16 16.92L20.22 16.86L20.26 16.8L20.29 16.72L20.31 16.64L21.69 4.75L21.69 4.67L21.68 4.59L21.65 4.51L21.6 4.44L21.55 4.38L21.48 4.33L21.41 4.3L12.27 1.03L12.2 1.01L12.13 1L12.06 1.01L11.98 1.03Z" />
    </svg>
  `,
})
export class LogoMark {
  readonly animated = input(false, { transform: booleanAttribute });
}
