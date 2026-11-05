// Ported from nuxt.com `app/components/nuxters/NuxtersWorld.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, input, output, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PODIUM } from '../leaderboard/leaderboard-grid';
import { RankShield } from '../leaderboard/rank-shield';
import { countryName, type ContributorsMap, type ContributorSummary, type CountryStats } from '@angularians/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixArrowUpLine, remixCloseLine, remixSearchLine } from '@ng-icons/remixicon';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { avatarUrl, flagUrl, formatNumber, matchesCountry } from '../leaderboard/format';
import { Globe } from './globe';

/** People shown on the card of a country. */
const CARD_TILES = 12;

@Component({
  selector: 'app-world',
  imports: [Globe, RankShield, HlmButton, HlmInputGroupImports, HlmSkeleton, HlmTooltip, NgIcon, NgTemplateOutlet, RouterLink],
  providers: [provideIcons({ remixArrowUpLine, remixCloseLine, remixSearchLine })],
  host: { class: 'grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12' },
  template: `
    <ng-template #card let-shown>
      <div class="rounded-lg border bg-background p-4 shadow-lg">
        <div class="flex items-center gap-3">
          <img [src]="flag(shown.code)" alt="" width="40" height="40" class="size-10 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">{{ name(shown.code) }}</p>
            <p class="text-sm text-muted-foreground">{{ number(shown.count) }} <span class="brand text-primary">{{ shown.count === 1 ? 'Angularian' : 'Angularians' }}</span> · #{{ rankOf(shown.code) }} country</p>
          </div>
          <button hlmBtn variant="ghost" size="icon-sm" type="button" aria-label="Show all countries" (click)="select.emit(null)">
            <ng-icon name="remixCloseLine" aria-hidden="true" />
          </button>
        </div>
        <ul class="mt-4 grid grid-cols-6 gap-2" [attr.aria-busy]="!people().length || null" [attr.aria-label]="'Best ranked from ' + name(shown.code)">
          @for (tile of tiles(); track $index) {
            <li class="aspect-square">
              @if (tile) {
                <a [routerLink]="['/', tile.username]" [hlmTooltip]="tile.username + ' · #' + number(tile.rank)" [attr.aria-label]="tile.username + ', #' + number(tile.rank)" class="block size-full overflow-hidden rounded-md bg-muted ring-1 ring-border transition hover:ring-primary">
                  <img [src]="avatar(tile)" alt="" width="56" height="56" loading="lazy" class="size-full object-cover" />
                </a>
              } @else {
                <div hlmSkeleton class="size-full rounded-md"></div>
              }
            </li>
          }
        </ul>
        <button hlmBtn variant="link" class="mt-3 px-0 text-muted-foreground hover:text-foreground" type="button" (click)="leaderboard.emit()">
          <span>See the {{ shown.count === 1 ? '' : number(shown.count) + ' ' }}<span class="brand text-primary">{{ shown.count === 1 ? 'Angularian' : 'Angularians' }}</span> from {{ name(shown.code) }}</span>
          <ng-icon name="remixArrowUpLine" aria-hidden="true" />
        </button>
      </div>
    </ng-template>

    <!-- The card floats on the globe: picking a country moves nothing on the page -->
    <!-- \`when\`, not \`on viewport\`: Angular's viewport trigger creates its IntersectionObserver during server rendering too
         (after-render hooks run there in this app), where none exists. -->
    <div #globeBox class="relative mx-auto aspect-square w-full max-w-[36rem]">
      @defer (when inView()) {
        <app-globe [countries]="map().countries" [selected]="selected()" (select)="select.emit($event)" />
      } @placeholder {
        <div class="size-full rounded-full bg-muted/50 ring-1 ring-border"></div>
      }
      @if (current(); as shown) {
        <div class="absolute right-0 bottom-0 w-80 max-sm:hidden">
          <ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ $implicit: shown }" />
        </div>
      }
    </div>

    <div class="flex min-w-0 flex-col gap-3 rounded-xl bg-muted/40 p-4 ring-1 ring-border">
      <div hlmInputGroup>
        <input hlmInputGroupInput type="search" autocomplete="off" aria-label="Search a country" placeholder="Search a country" [value]="query()" (input)="search($event)" />
        <hlm-input-group-addon><ng-icon name="remixSearchLine" aria-hidden="true" /></hlm-input-group-addon>
      </div>
      <ol class="-mx-1 flex max-h-100 flex-col gap-1 overflow-y-auto p-1 pt-2" [class.lg:h-100]="query().trim()" aria-label="Countries, from the most contributors">
        @for (item of shownCountries(); track item.code) {
          <li>
            <button
              type="button"
              [class]="'relative flex w-full items-center gap-3 overflow-hidden rounded-md px-2 py-2 text-left ' + (medal(item.code)?.ring.replace('ring-2', 'ring-1') ?? '')"
              class=" text-sm transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-pressed:bg-primary/15 aria-pressed:ring-1 aria-pressed:ring-primary/40"
              [attr.aria-pressed]="item.code === selected()"
              (click)="select.emit(item.code === selected() ? null : item.code)"
            >
              <span data-rank class="relative grid w-7 shrink-0 place-items-center"><span class="sr-only">Rank </span>
                @if (medal(item.code); as place) {
                  <app-rank-shield [rank]="rankOf(item.code)" metal="" [podium]="true" [class]="'h-8 w-7 text-sm ' + place.text" />
                } @else {
                  <span class="brand relative top-[0.09em] text-base leading-none text-muted-foreground">{{ number(rankOf(item.code)) }}</span>
                }
              </span>
              <img [src]="flag(item.code)" alt="" width="24" height="24" loading="lazy" class="relative size-6 shrink-0" />
              <span class="relative min-w-0 flex-1">
                <span class="block truncate">{{ name(item.code) }}</span>
                <span class="mt-1 block h-1 rounded-full bg-primary/60" [style.width.%]="barWidth(item)"></span>
              </span>
              <span class="relative text-muted-foreground tabular-nums">{{ number(item.count) }}</span>
            </button>
          </li>
        } @empty {
          <li class="py-2 text-center text-sm text-muted-foreground" role="status">No country found</li>
        }
      </ol>
      <p class="text-xs text-muted-foreground">
        From the location on each GitHub profile, matched to a country: {{ number(map().located) }} of {{ number(map().total) }} <span class="brand text-primary">Angularians</span> set one.
      </p>
    </div>

    <!-- Phones: the globe is too small to float on, and often scrolled away from the list. A card at the bottom of the screen. -->
    @if (current(); as shown) {
      <div class="sticky bottom-4 z-10 sm:hidden">
        <ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ $implicit: shown }" />
      </div>
    }
  `,
})
export class World {
  private readonly globeBox = viewChild.required<ElementRef<HTMLElement>>('globeBox');
  /** Set once the globe's box nears the screen, in the browser only: then the globe loads. */
  protected readonly inView = signal(false);

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        this.inView.set(true);
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        this.inView.set(true);
        observer.disconnect();
      }, { rootMargin: '200px' });
      observer.observe(this.globeBox().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  readonly map = input.required<ContributorsMap>();
  readonly selected = input<string | null>(null);
  /** The best ranked contributors of the selected country: the first page of its board, empty while it loads. */
  readonly people = input<ContributorSummary[]>([]);
  readonly select = output<string | null>();
  /** "See the N contributors": scroll up to the board, already filtered. */
  readonly leaderboard = output<void>();

  protected readonly current = computed(() => this.map().countries.find(item => item.code === this.selected()) ?? null);
  /** One tile per person shown, known from the count: the card keeps its size while they load. */
  protected readonly tiles = computed(() => Array.from({ length: Math.min(CARD_TILES, this.current()?.count ?? 0) }, (_, index) => this.people()[index] ?? null));
  /** Countries with the same count share a rank: 1, 2, 2, 4. */
  private readonly ranks = computed(() => {
    const firstAt = new Map<number, number>();
    return new Map(this.map().countries.map((item, index) => {
      if (!firstAt.has(item.count)) firstAt.set(item.count, index + 1);
      return [item.code, firstAt.get(item.count)!];
    }));
  });

  protected readonly query = signal('');
  protected readonly shownCountries = computed(() => {
    return this.map().countries.filter(item => matchesCountry(item.code, this.query()));
  });

  protected readonly name = countryName;
  protected readonly number = formatNumber;
  protected readonly flag = flagUrl;
  protected readonly avatar = (person: ContributorSummary) => avatarUrl(person.githubId, 56);
  protected readonly rankOf = (code: string) => this.ranks().get(code) ?? 0;

  private readonly largest = computed(() => this.map().countries[0]?.count ?? 1);
  protected readonly barWidth = (item: CountryStats) => Math.max(2, item.count / this.largest() * 100);
  protected readonly medal = (code: string) => PODIUM[this.rankOf(code)] ?? null;

  protected search(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
