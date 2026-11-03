// Ported from nuxt.com `app/pages/nuxters/index.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, effect, inject, linkedSignal, untracked } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { injectServerFn, type RouteMeta } from '@analogjs/router';
import { countryCode, countryName, DEFAULT_PERIOD, isPeriod, periodPhrase, PULL_REQUEST_POINTS, type Period } from '@angular-contributors/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBookOpen, lucideBrushCleaning, lucideCalendar, lucideGitPullRequest, lucideRocket, lucideUsers, lucideWrench } from '@ng-icons/lucide';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { getContributorsMap, getLeaderboard } from '../data/contributors.server';
import { PageGrid } from '../layout/page-grid';
import { PageHero } from '../layout/page-hero';
import { PageSection } from '../layout/page-section';
import { ContributorSearch } from '../leaderboard/contributor-search';
import { CountrySelect } from '../leaderboard/country-select';
import { formatDate, formatNumber, plural } from '../leaderboard/format';
import { LeaderboardGrid } from '../leaderboard/leaderboard-grid';
import { PeriodTabs } from '../leaderboard/period-tabs';
import { World } from '../world/world';

const SITE_DESCRIPTION = 'Everyone whose pull requests landed in angular/angular since 2014, ranked by what they shipped: features, fixes, docs and chores.';

export const routeMeta = {
  title: 'Angular Contributors',
  meta: [{ name: 'description', content: SITE_DESCRIPTION }],
} satisfies RouteMeta;

@Component({
  selector: 'app-home',
  imports: [
    ContributorSearch, CountrySelect, HlmBadge, HlmButton, HlmCardImports, HlmSkeleton, LeaderboardGrid, NgIcon,
    PageGrid, PageHero, PageSection, PeriodTabs, World,
  ],
  providers: [provideIcons({ lucideBookOpen, lucideBrushCleaning, lucideCalendar, lucideGitPullRequest, lucideRocket, lucideUsers, lucideWrench })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero [description]="description">
      <span heroHeadline hlmBadge variant="outline" class="mb-4">Community project · updated every night</span>
      <span heroTitle class="bg-linear-to-r from-brand-from to-brand-to bg-clip-text text-transparent">Angular Contributors</span>
      <ng-container heroActions>
        <a hlmBtn href="#how-it-works">How the score works</a>
        <a hlmBtn variant="outline" href="https://github.com/angular/angular/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">How to contribute</a>
      </ng-container>
    </app-page-hero>

    <app-page-section sectionId="leaderboard">
      <h2 class="sr-only">Leaderboard</h2>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <app-period-tabs [period]="period()" [periods]="board()?.periods ?? []" (periodChange)="setPeriod($event)" />
        <div class="flex flex-col gap-3 sm:flex-row">
          <app-country-select [countries]="map.value()?.countries ?? []" [value]="country()" (valueChange)="setCountry($event)" />
          <app-contributor-search [period]="period()" />
        </div>
      </div>

      @if (board(); as page) {
        <ul class="mt-4 mb-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground" aria-label="This leaderboard">
          <li class="flex items-center gap-1.5"><ng-icon name="lucideUsers" aria-hidden="true" /><span><strong class="font-semibold text-foreground tabular-nums">{{ number(page.total) }}</strong> {{ page.total === 1 ? 'contributor' : 'contributors' }}{{ page.country ? ' from ' + countryLabel(page.country) : '' }}</span></li>
          <li class="flex items-center gap-1.5"><ng-icon name="lucideGitPullRequest" aria-hidden="true" /><span><strong class="font-semibold text-foreground tabular-nums">{{ number(page.landedPullRequests) }}</strong> landed {{ page.landedPullRequests === 1 ? 'PR' : 'PRs' }} {{ phrase(page.period) }}</span></li>
          @if (page.collectedAt) {
            <li class="flex items-center gap-1.5"><ng-icon name="lucideCalendar" aria-hidden="true" /><span>Updated {{ date(page.collectedAt) }}</span></li>
          }
        </ul>

        <div [class.opacity-60]="leaderboard.isLoading()" class="transition-opacity" [attr.aria-busy]="leaderboard.isLoading()">
          @if (page.total) {
            <app-leaderboard-grid [page]="page" />
          } @else {
            <p class="py-12 text-center text-muted-foreground">No landed pull requests {{ phrase(page.period) }}{{ page.country ? ' from ' + countryLabel(page.country) : '' }} yet.</p>
          }
        </div>
      } @else if (leaderboard.error()) {
        <p role="alert" class="py-12 text-center text-destructive">The leaderboard could not be loaded. Try again in a moment.</p>
      } @else {
        <div class="mt-10 grid grid-cols-5 gap-3 sm:grid-cols-8 sm:gap-4 md:grid-cols-10" aria-hidden="true">
          @for (cell of placeholders; track cell) {
            <div hlmSkeleton class="aspect-square rounded-lg"></div>
          }
        </div>
      }
    </app-page-section>

    @if (map.value(); as world) {
      @if (world.countries.length) {
        <app-page-section sectionId="world" title="Contributors around the world" [description]="worldDescription(world.countries.length)">
          <app-world
            [map]="world"
            [selected]="country()"
            [people]="board()?.country === country() ? board()?.items ?? [] : []"
            (select)="pickInWorld($event)"
            (leaderboard)="showLeaderboard()"
          />
        </app-page-section>
      }
    }

    <app-page-section sectionId="how-it-works" title="How the score works" description="Every pull request that landed in angular/angular counts, on the day it landed, for its author. Its type comes from the title (feat, fix, docs…), the convention the repository already enforces.">
      <app-page-grid class="lg:grid-cols-4">
        @for (way of ways; track way.title) {
          <section hlmCard>
            <div hlmCardHeader>
              <ng-icon [name]="way.icon" class="text-primary" size="22" aria-hidden="true" />
              <h3 hlmCardTitle>{{ way.title }}</h3>
              <p hlmCardDescription>{{ way.description }}</p>
            </div>
            <div hlmCardContent>
              <p class="text-3xl font-semibold tabular-nums">{{ way.points }} <span class="text-base font-normal text-muted-foreground">pts</span></p>
            </div>
          </section>
        }
      </app-page-grid>
      <p class="mt-6 max-w-3xl text-sm text-muted-foreground">
        Most PRs from 2017 to 2025 show as closed on GitHub, not merged: Angular's merge tooling pushes the commits itself and adds
        <code class="rounded bg-muted px-1 py-0.5 text-xs">PR Close #N</code> to them. Those count as landed too. Bots are left out.
      </p>
    </app-page-section>

    <app-page-section>
      <div class="rounded-xl border bg-muted/40 p-8 sm:p-10">
        <h2 class="text-2xl font-semibold tracking-tight">Want to be on the board?</h2>
        <p class="mt-2 max-w-2xl text-muted-foreground">Fix a bug, improve the docs or ship a feature. Every landed pull request counts, and the board updates every night.</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <a hlmBtn href="https://github.com/angular/angular/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener"><ng-icon name="lucideBookOpen" aria-hidden="true" />Contributing guide</a>
          <a hlmBtn variant="outline" href="https://github.com/angular/angular/contribute" target="_blank" rel="noopener">Good first issues</a>
        </div>
      </div>
    </app-page-section>
  `,
})
export default class Home {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  /** `?period=` and `?country=` are the state: shareable, and kept on reload. Unknown values fall back. */
  private readonly requestedPeriod = injectQueryParams(params => (isPeriod(params['period']) ? (params['period'] as Period) : null));
  protected readonly country = injectQueryParams(params => countryCode(params['country']));
  protected readonly period = computed(() => this.requestedPeriod() ?? DEFAULT_PERIOD);

  protected readonly leaderboard = injectServerFn(getLeaderboard, () => ({ period: this.period(), country: this.country(), page: 1 }));
  /** Countries of the same period, for the filter and the globe. */
  protected readonly map = injectServerFn(getContributorsMap, () => ({ period: this.period() }));
  /** The last board stays on screen, dimmed, while the next one loads: no jump to skeletons. */
  protected readonly board = linkedSignal<ReturnType<typeof this.leaderboard.value>, ReturnType<typeof this.leaderboard.value>>({
    source: () => this.leaderboard.value(),
    computation: (value, previous) => value ?? previous?.value,
  });

  protected readonly description = SITE_DESCRIPTION;
  protected readonly placeholders = Array.from({ length: 30 }, (_, index) => index);
  protected readonly ways = [
    { title: 'Features', description: 'feat and perf PRs: new APIs, capabilities and speed.', icon: 'lucideRocket', points: PULL_REQUEST_POINTS.feat },
    { title: 'Fixes', description: 'fix PRs: bugs found and fixed.', icon: 'lucideWrench', points: PULL_REQUEST_POINTS.fix },
    { title: 'Docs', description: 'docs PRs: guides, API docs and examples on angular.dev.', icon: 'lucideBookOpen', points: PULL_REQUEST_POINTS.docs },
    { title: 'Chores', description: 'refactor, test, build, ci, release and reverts.', icon: 'lucideBrushCleaning', points: PULL_REQUEST_POINTS.chore },
  ];
  protected readonly number = formatNumber;
  protected readonly phrase = periodPhrase;
  protected readonly date = formatDate;
  protected readonly countryLabel = countryName;

  /**
   * The board sits above the globe and changes height with the country (a small one has a few avatars):
   * a pick on the globe keeps the globe where it is on screen once that board renders. The top of the world
   * section when the pick was made, or `null`.
   */
  private keepWorldAt: number | null = null;

  constructor() {
    afterRenderEffect(() => {
      const page = this.board();
      untracked(() => {
        if (this.keepWorldAt === null || page?.country !== this.country()) return;
        const top = document.getElementById('world')?.getBoundingClientRect().top;
        if (top !== undefined && top !== this.keepWorldAt) scrollBy({ top: top - this.keepWorldAt, behavior: 'instant' });
        this.keepWorldAt = null;
      });
    });

    // A shared `?period=` link gets its own title and description; the plain page keeps the generic ones.
    effect(() => {
      const page = this.leaderboard.value();
      const shared = this.requestedPeriod() && page?.total ? page : null;
      const title = shared ? `Top Angular contributors ${periodPhrase(shared.period)}` : 'Angular Contributors';
      const description = shared
        ? `${plural(shared.total, 'person', 'people')} landed ${plural(shared.landedPullRequests, 'pull request', 'pull requests')} in angular/angular ${periodPhrase(shared.period)}.`
        : SITE_DESCRIPTION;
      this.title.setTitle(title);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
    });
  }

  /** Same page, no new history entry, scroll position kept. The default period leaves the URL clean. */
  protected setPeriod(period: Period): void {
    void this.router.navigate([], { queryParams: { period: period === DEFAULT_PERIOD ? null : period }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected worldDescription(countries: number): string {
    return `Contributors from ${formatNumber(countries)} countries ${periodPhrase(this.period())}. Pick a country to see its best ranked contributors.`;
  }

  /** A pick on the globe or its list: the globe stays where it is on screen. */
  protected pickInWorld(country: string | null): void {
    this.keepWorldAt = document.getElementById('world')?.getBoundingClientRect().top ?? null;
    this.setCountry(country);
  }

  /** From the country card: up to the board, already filtered on that country. */
  protected showLeaderboard(): void {
    this.keepWorldAt = null;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('leaderboard')?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' });
  }

  protected setCountry(country: string | null): void {
    void this.router.navigate([], { queryParams: { country }, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
