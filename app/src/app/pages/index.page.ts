// Ported from nuxt.com `app/pages/nuxters/index.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { DOCUMENT } from '@angular/common';
import { afterRenderEffect, Component, computed, effect, inject, linkedSignal, untracked } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { injectServerFn, type RouteMeta } from '@analogjs/router';
import { countryCode, countryName, DEFAULT_PERIOD, isPeriod, periodPhrase, type Period } from '@angularians/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixArrowRightUpLine, remixCalendarLine, remixChatHeartLine, remixGroupLine } from '@ng-icons/remixicon';
import { octComment, octGitMerge, octIssueOpened } from '@ng-icons/octicons';
import { vikingLongship } from '../layout/viking-icons';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { getContributorsMap, getLeaderboard } from '../data/contributors.server';
import { PageGrid } from '../layout/page-grid';
import { AngularLogo } from '../layout/angular-logo';
import { LogoMark } from '../layout/logo-mark';
import { PageHero } from '../layout/page-hero';
import { PageSection } from '../layout/page-section';
import { ContributorSearch } from '../leaderboard/contributor-search';
import { CountrySelect } from '../leaderboard/country-select';
import { NextUpdate } from '../leaderboard/next-update';
import { MeCard } from '../leaderboard/me-card';
import { ScoreRules } from '../leaderboard/score-rules';
import { setCanonical, SITE_URL } from '../site';
import { formatDate, formatNumber, plural } from '../leaderboard/format';
import { JoinLinks } from '../leaderboard/join-links';
import { LeaderboardGrid } from '../leaderboard/leaderboard-grid';
import { PeriodTabs } from '../leaderboard/period-tabs';
import { World } from '../world/world';

const SITE_DESCRIPTION = 'Everyone who has contributed to Angular since 2014, ranked: merged pull requests, issues, comments and code reviews in angular/angular, Components, the CLI, dev-infra and Domino.';

export const routeMeta = {
  title: 'Angularians',
  meta: [{ name: 'description', content: SITE_DESCRIPTION }],
} satisfies RouteMeta;

@Component({
  selector: 'app-home',
  imports: [
    JoinLinks,
    AngularLogo, ContributorSearch, CountrySelect, HlmButton, HlmCardImports, HlmSkeleton, LeaderboardGrid, LogoMark, MeCard, NextUpdate, NgIcon, ScoreRules,
    PageGrid, PageHero, PageSection, PeriodTabs, World,
  ],
  providers: [provideIcons({ vikingLongship, remixArrowRightUpLine, remixCalendarLine, octIssueOpened, octGitMerge, octComment, remixChatHeartLine, remixGroupLine })],
  template: `
    <app-page-hero>
      <span heroTitle class="flex items-center gap-3">
        <app-logo-mark class="size-16 shrink-0 translate-y-[3.5%] min-[360px]:size-22 sm:size-32 lg:size-27 xl:size-36 2xl:size-38" />
        <span class="flex min-w-0 flex-col gap-1 sm:gap-2">
          <span class="brand text-5xl leading-none whitespace-nowrap text-brand-from sm:text-7xl lg:text-6xl xl:text-[5.5rem] 2xl:text-8xl">Angularians </span>
          <span class="brand text-xl text-muted-foreground sm:text-3xl lg:text-2xl xl:text-3xl">Carve your name in <span class="whitespace-nowrap text-primary">ng-halla</span></span>
        </span>
      </span>
      <!-- @container: the card's height follows its own width -->
      <span heroDescription>
        Every
        <!-- Angular as it calls itself: its logo (the press kit's), the name highlighted -->
        <a href="https://angular.dev" target="_blank" rel="noopener" class="ml-1 inline-flex items-baseline gap-1.5 font-medium whitespace-nowrap text-foreground transition-opacity hover:opacity-80 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"><app-angular-logo class="size-[1.1em] self-center" />Angular contributor</a>’s pull request, issue and review is remembered here, in <span class="brand text-primary">ng-halla</span>.
        <span class="max-sm:hidden">Take your seat among the <span class="brand text-primary">Angularians</span> and earn your place in the saga.</span>
      </span>
      <ng-container heroActions>
        <app-score-rules />
        <a hlmBtn variant="outline" href="https://github.com/angular/angular/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener"><ng-icon name="vikingLongship" size="1.5rem" aria-hidden="true" /> How to contribute</a>
      </ng-container>
      <div heroAside class="@container"><app-me-card /></div>
    </app-page-hero>

    <app-page-section sectionId="leaderboard" [flush]="true">
      <h2 class="sr-only">Leaderboard</h2>
      <!-- One row from lg: tabs, the country select and search do not fit side by side on a tablet -->
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <app-period-tabs [period]="period()" [periods]="board()?.periods ?? []" (periodChange)="setPeriod($event)" />
        <div class="grid grid-cols-2 gap-3 sm:flex">
          <app-country-select [countries]="map.value()?.countries ?? []" [value]="country()" (valueChange)="setCountry($event)" />
          <app-contributor-search [period]="period()" [country]="country()" />
        </div>
      </div>

      @if (board(); as page) {
        <ul class="mt-4 mb-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground" [attr.aria-label]="'Contributions ' + phrase(page.period)">
          <li class="flex items-center gap-1.5"><ng-icon name="remixGroupLine" aria-hidden="true" /><span><strong class="font-semibold text-foreground tabular-nums">{{ number(page.total) }}</strong> {{ page.total === 1 ? 'contributor' : 'contributors' }}{{ page.country ? ' from ' + countryLabel(page.country) : '' }}</span></li>
          <li class="flex items-center gap-1.5"><ng-icon name="octGitMerge" class="text-[#8250DF] dark:text-[#A371F7]" aria-hidden="true" /><span><strong class="font-semibold text-foreground tabular-nums">{{ number(page.landedPullRequests) }}</strong> merged {{ page.landedPullRequests === 1 ? 'PR' : 'PRs' }}</span></li>
          <li class="flex items-center gap-1.5"><ng-icon name="octIssueOpened" class="text-[#1A7F37] dark:text-[#3FB950]" aria-hidden="true" /><span><strong class="font-semibold text-foreground tabular-nums">{{ number(page.issues) }}</strong> {{ page.issues === 1 ? 'issue' : 'issues' }}</span></li>
          <li class="flex items-center gap-1.5"><ng-icon name="octComment" class="text-[#0969DA] dark:text-[#58A6FF]" aria-hidden="true" /><span><strong class="font-semibold text-foreground tabular-nums">{{ number(page.comments + page.reviewComments) }}</strong> {{ page.comments + page.reviewComments === 1 ? 'comment' : 'comments' }}</span></li>
          <li class="text-xs sm:ml-auto"><app-next-update [collectedAt]="page.collectedAt" /></li>
        </ul>

        <div [class.opacity-60]="leaderboard.isLoading()" class="transition-opacity" [attr.aria-busy]="leaderboard.isLoading()">
          @if (page.total) {
            <app-leaderboard-grid [page]="page" />
          } @else {
            <p class="py-12 text-center text-muted-foreground">No contributions {{ phrase(page.period) }}{{ page.country ? ' from ' + countryLabel(page.country) : '' }} yet.</p>
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
        <app-page-section sectionId="world" title="Angularians around the world" [viking]="true" [description]="worldDescription(world.countries.length)">
          <span sectionTitleNote>in <span class="brand text-primary">ng-halla</span></span>
          <span sectionDescriptionLead class="font-medium text-foreground"><app-angular-logo class="mr-1 size-5 align-text-bottom" />Angular contributors</span>
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

    <app-page-section>
      <header class="mx-auto mb-10 max-w-3xl text-center">
        <h2 class="brand text-4xl text-balance sm:text-5xl">How to become an <span class="text-primary">Angularian</span></h2>
        <p class="mt-4 text-lg text-pretty text-muted-foreground">Become an <span class="ml-1 inline-flex items-baseline gap-1.5 font-medium whitespace-nowrap text-foreground"><app-angular-logo class="size-5 translate-y-[0.15em]" />Angular contributor</span> with one of these, in angular/angular, angular/components, angular/angular-cli, angular/dev-infra or angular/domino, and unlock the <span class="inline-flex h-7 items-center gap-1 rounded-md bg-primary/10 px-2 align-middle text-sm font-medium text-primary"><app-logo-mark class="size-6" compact /><span class="brand leading-none">Angularian</span></span> badge.</p>
      </header>
      <app-page-grid>
        @for (way of becomeWays; track way.title) {
          <a [href]="way.url" target="_blank" rel="noopener" hlmCard class="transition hover:bg-muted/40">
            <div hlmCardHeader>
              <!-- The profile's stat colours: pink PRs, sky issues, violet comments -->
              <span [class]="'grid size-11 place-items-center rounded-lg bg-current/10 ' + way.color"><ng-icon [name]="way.icon" size="24" aria-hidden="true" /></span>
              <h3 hlmCardTitle class="mt-3 text-lg">{{ way.title }}</h3>
              <p hlmCardDescription>{{ way.description }}</p>
              <p class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">{{ way.action }} <ng-icon name="remixArrowRightUpLine" aria-hidden="true" /></p>
            </div>
          </a>
        }
      </app-page-grid>
    </app-page-section>

    <app-page-section>
      <section class="rounded-xl bg-muted/40 px-6 py-12 text-center ring-1 ring-border sm:px-12 sm:py-16" aria-labelledby="join-title">
        <h2 id="join-title" class="brand text-4xl text-balance sm:text-5xl">Ready to <span class="text-primary">carve</span> your name?</h2>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">Help shape the future of <a href="https://angular.dev" target="_blank" rel="noopener" class="ml-1 inline-flex items-baseline gap-1.5 font-medium whitespace-nowrap text-foreground transition-opacity hover:opacity-80 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"><app-angular-logo class="size-[1.1em] self-center" />Angular</a>, and take your seat in <span class="brand text-primary">ng-halla</span>.</p>
        <div class="@container mt-8"><app-join-links /></div>
      </section>
    </app-page-section>
  `,
})
export default class Home {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

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

  protected readonly placeholders = Array.from({ length: 30 }, (_, index) => index);
  /** The three ways onto the board (Nuxters' "How to become a Nuxter"). */
  protected readonly becomeWays = [
    { title: 'Merge a pull request', action: 'Read the guide', description: 'Fix a bug, ship a feature or improve the docs in any Angular repository.', icon: 'octGitMerge', color: 'text-[#8250DF] dark:text-[#A371F7]', url: 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md' },
    { title: 'Open a helpful issue', action: 'See the issues', description: 'An issue that gets completed, or collects 3+ reactions or 5+ comments.', icon: 'octIssueOpened', color: 'text-[#1A7F37] dark:text-[#3FB950]', url: 'https://github.com/angular/angular/issues' },
    { title: 'Write a helpful comment', action: 'Review a pull request', description: 'Answer a question or review a PR: a comment with 3+ reactions counts.', icon: 'remixChatHeartLine', color: 'text-[#0969DA] dark:text-[#58A6FF]', url: 'https://github.com/angular/angular/pulls' },
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
      const title = shared ? `Top Angularians ${periodPhrase(shared.period)}` : 'Angularians';
      const description = shared
        ? `${plural(shared.total, 'person', 'people')} contributed to Angular ${periodPhrase(shared.period)}: ${plural(shared.landedPullRequests, 'merged pull request', 'merged pull requests')}, ${plural(shared.issues, 'issue', 'issues')} and ${plural(shared.comments + shared.reviewComments, 'comment', 'comments')}.`
        : SITE_DESCRIPTION;
      this.title.setTitle(title);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
      // The site's card, or the card of the shared period; the canonical URL has no `?period=`.
      const query = shared ? `?period=${shared.period}` : '';
      this.meta.updateTag({ property: 'og:url', content: `${SITE_URL}/${query}` });
      this.meta.updateTag({ property: 'og:image', content: `${SITE_URL}/og.png${query}` });
      this.meta.updateTag({ property: 'og:image:width', content: '2400' });
      this.meta.updateTag({ property: 'og:image:height', content: '1260' });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
      this.meta.updateTag({ name: 'twitter:image', content: `${SITE_URL}/og.png${query}` });
      setCanonical(this.document, '/');
    });
  }

  /** Same page, no new history entry, scroll position kept. The default period leaves the URL clean. */
  protected setPeriod(period: Period): void {
    void this.router.navigate([], { queryParams: { period: period === DEFAULT_PERIOD ? null : period }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected worldDescription(countries: number): string {
    return ` from ${formatNumber(countries)} countries ${periodPhrase(this.period())}. Pick a country to see its best ranked contributors.`;
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
