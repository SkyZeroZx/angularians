// A colour picker for trying brand colours on the live site: for signed-in people, in their browser only. It sets the
// theme's primary colour (the buttons, the word Angularians, the mark) and derives the mark's grid shades from it.
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCopy, lucidePalette, lucideRotateCcw } from '@ng-icons/lucide';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';

const STORAGE_KEY = 'angularians-brand';
const PRESETS: Array<{ name: string, hex: string }> = [
  { name: 'Forest green (dark theme)', hex: '#5eb572' },
  { name: 'Forest green (light theme)', hex: '#14632e' },
  { name: 'Amber gold', hex: '#f9ad26' },
  { name: 'Our old red', hex: '#e5194b' },
  { name: 'Deep turquoise', hex: '#00a8a9' },
  { name: 'Emerald', hex: '#47be8b' },
  { name: 'Violet', hex: '#9e71fd' },
  { name: 'Angular magenta', hex: '#e8179b' },
];

const rgbOf = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
function hslOf(hex: string): [number, number, number] {
  const [r, g, b] = rgbOf(hex).map(v => v / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, Math.round(l * 100)];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round((h * 60 + 360) % 360), Math.round(s * 100), Math.round(l * 100)];
}
/** White or near-black text on the colour, whichever reads better (WCAG relative luminance). */
function textOn(hex: string): string {
  const lum = rgbOf(hex).map(v => v / 255).map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const l = 0.2126 * lum[0]! + 0.7152 * lum[1]! + 0.0722 * lum[2]!;
  return (1.05 / (l + 0.05)) >= ((l + 0.05) / 0.05) ? '#fafafa' : '#18181b';
}
const VALID = /^#[0-9a-f]{6}$/i;

@Component({
  selector: 'app-brand-picker',
  imports: [HlmPopoverImports, NgIcon],
  providers: [provideIcons({ lucideCheck, lucideCopy, lucidePalette, lucideRotateCcw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex' },
  template: `
    <hlm-popover align="end" sideOffset="8">
      <button hlmPopoverTrigger type="button" aria-label="Try a brand colour" title="Try a brand colour"
        class="grid size-9 place-items-center rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <ng-icon name="lucidePalette" aria-hidden="true" />
      </button>
      <div hlmPopoverContent *hlmPopoverPortal="let ctx" class="w-72 gap-3 p-3">
        <p class="text-sm font-medium">Try a brand colour</p>
        <div class="flex items-center gap-3">
          <input type="color" class="size-10 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5" aria-label="Pick a colour"
            [value]="shown()" (input)="pick($any($event.target).value)" />
          <label class="flex flex-1 items-center gap-1 rounded-md border px-2 py-1.5 font-mono text-sm">
            <span class="text-muted-foreground">#</span>
            <input class="w-full bg-transparent outline-none" maxlength="7" aria-label="Hex code" spellcheck="false"
              [value]="shown().slice(1)" (change)="typed($any($event.target).value)" />
          </label>
          <button type="button" class="grid size-8 place-items-center rounded-md hover:bg-muted" [attr.aria-label]="copied() ? 'Copied' : 'Copy the hex code'" (click)="copy()">
            <ng-icon [name]="copied() ? 'lucideCheck' : 'lucideCopy'" aria-hidden="true" />
          </button>
        </div>
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-xs">
          <dt class="text-muted-foreground">Hex</dt><dd>{{ shown().toUpperCase() }}</dd>
          <dt class="text-muted-foreground">RGB</dt><dd>{{ rgb() }}</dd>
          <dt class="text-muted-foreground">HSL</dt><dd>{{ hsl() }}</dd>
        </dl>
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="Presets">
          @for (preset of presets; track preset.hex) {
            <button type="button" class="size-6 rounded-full ring-offset-2 ring-offset-background hover:ring-2 hover:ring-ring"
              [class.ring-2]="preset.hex === shown()" [class.ring-foreground]="preset.hex === shown()"
              [style.background]="preset.hex" [attr.aria-label]="preset.name + ', ' + preset.hex" [title]="preset.name + ' ' + preset.hex"
              (click)="pick(preset.hex)"></button>
          }
        </div>
        <button type="button" class="flex items-center gap-2 self-start rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" (click)="reset()">
          <ng-icon name="lucideRotateCcw" aria-hidden="true" /> Back to the brand colour
        </button>
        <p class="text-xs text-muted-foreground">Only in your browser: nobody else sees it.</p>
      </div>
    </hlm-popover>
  `,
})
export class BrandPicker {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly presets = PRESETS;
  /** The colour tried, or null for the site's own. */
  protected readonly colour = signal<string | null>(null);
  protected readonly copied = signal(false);
  /** What the picker shows: the colour tried, or the brand's own (the theme's primary). */
  protected readonly shown = computed(() => this.colour() ?? PRESETS[0]!.hex);
  protected readonly rgb = computed(() => rgbOf(this.shown()).join(', '));
  protected readonly hsl = computed(() => { const [h, s, l] = hslOf(this.shown()); return `${h}, ${s}%, ${l}%`; });

  constructor() {
    if (!this.browser) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && VALID.test(saved)) this.colour.set(saved.toLowerCase());
    }
    catch { /* storage blocked: the brand colour */ }
    effect(() => {
      const style = this.document.documentElement.style;
      const hex = this.colour();
      const vars = ['--primary', '--primary-foreground', '--ring', '--mark-1', '--mark-2', '--mark-3'];
      if (!hex) { for (const v of vars) style.removeProperty(v); return; }
      style.setProperty('--primary', hex);
      style.setProperty('--primary-foreground', textOn(hex));
      style.setProperty('--ring', `color-mix(in oklch, ${hex} 60%, transparent)`);
      // The grid's shades, from dark to the colour itself, as the brand's are.
      style.setProperty('--mark-1', `color-mix(in oklch, ${hex} 38%, black)`);
      style.setProperty('--mark-2', `color-mix(in oklch, ${hex} 62%, black)`);
      style.setProperty('--mark-3', hex);
    });
  }

  protected pick(hex: string): void {
    if (!VALID.test(hex)) return;
    this.colour.set(hex.toLowerCase());
    try { localStorage.setItem(STORAGE_KEY, hex.toLowerCase()); } catch { /* not remembered */ }
  }

  protected typed(value: string): void {
    this.pick('#' + value.trim().replace(/^#/, ''));
  }

  protected reset(): void {
    this.colour.set(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* nothing to forget */ }
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shown().toUpperCase());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    }
    catch { /* clipboard blocked */ }
  }
}
