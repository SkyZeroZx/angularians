import { booleanAttribute, Component, input } from '@angular/core';

/**
 * The Angularians mark: the Angular shield cut in two along the right leg of a rough-cut A (the capital A of
 * Norse Bold). The left piece holds the A, which cuts through the shield from its tip out through its bottom; the
 * right piece is a contribution graph, in greens and the grey of empty days. Built by `app/scripts/logo/build.py`;
 * its colours are the theme's (`--color-brand-from`, `--mark-*` in styles.css). Lifted 3.5%: the bright A half hangs
 * lower than the grid, so next to a word the eye centres on it, not on the box (0.85 of 24 units).
 *
 * `compact`: for small sizes (badges), where the theme's dark greens and grey would vanish into a tinted background:
 * the graph in shades of the text's colour (`currentColor`), faint for empty days, full for the busiest.
 */
@Component({
  selector: 'app-logo-mark',
  host: { class: 'inline-block', '[class.compact]': 'compact()' },
  styleUrl: './logo-mark.css',
  templateUrl: './logo-mark.html',
})
export class LogoMark {
  readonly compact = input(false, { transform: booleanAttribute });
}
