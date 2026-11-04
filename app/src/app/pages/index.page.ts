// Ported from nuxt.com `app/pages/nuxters/index.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, effect, inject, linkedSignal, untracked } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { injectServerFn, type RouteMeta } from '@analogjs/router';
import { ACTIVITY_POINTS, countryCode, countryName, DEFAULT_PERIOD, isPeriod, periodPhrase, PULL_REQUEST_POINTS, type Period } from '@angularians/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBookOpen, lucideBrushCleaning, lucideCalendar, lucideCircleDot, lucideGitPullRequest, lucideMessageCircle, lucideMessageCircleHeart, lucideRocket, lucideUsers, lucideWrench } from '@ng-icons/lucide';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { getContributorsMap, getLeaderboard } from '../data/contributors.server';
import { PageGrid } from '../layout/page-grid';
import { LogoMark } from '../layout/logo-mark';
import { PageHero } from '../layout/page-hero';
import { PageSection } from '../layout/page-section';
import { ContributorSearch } from '../leaderboard/contributor-search';
import { CountrySelect } from '../leaderboard/country-select';
import { FindProfile } from '../leaderboard/find-profile';
import { formatDate, formatNumber, plural } from '../leaderboard/format';
import { LeaderboardGrid } from '../leaderboard/leaderboard-grid';
import { PeriodTabs } from '../leaderboard/period-tabs';
import { World } from '../world/world';

const SITE_DESCRIPTION = 'Everyone who has contributed to Angular since 2014, ranked: merged pull requests, issues, comments and code reviews in angular/angular, Components, the CLI and dev-infra.';

export const routeMeta = {
  title: 'Angularians',
  meta: [{ name: 'description', content: SITE_DESCRIPTION }],
} satisfies RouteMeta;

@Component({
  selector: 'app-home',
  imports: [
    ContributorSearch, CountrySelect, FindProfile, HlmBadge, HlmButton, HlmCardImports, HlmSkeleton, LeaderboardGrid, LogoMark, NgIcon,
    PageGrid, PageHero, PageSection, PeriodTabs, World,
  ],
  providers: [provideIcons({ lucideBookOpen, lucideBrushCleaning, lucideCalendar, lucideCircleDot, lucideGitPullRequest, lucideMessageCircle, lucideMessageCircleHeart, lucideRocket, lucideUsers, lucideWrench })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero [description]="description">
      <span heroHeadline hlmBadge variant="secondary" class="mb-4">Updated every day</span>
      <span heroTitle class="group inline-flex flex-wrap items-center gap-x-4"><app-logo-mark class="size-[1.1em] shrink-0" animated /><span>Meet the <span class="text-brand-from">Angularians</span></span></span>
      <ng-container heroActions>
        <a hlmBtn href="#how-it-works">How the score works</a>
        <a hlmBtn variant="outline" href="https://github.com/angular/angular/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">How to contribute</a>
      </ng-container>
      <app-find-profile heroAside [top]="board()?.items?.slice(0, 5) ?? []" [total]="board()?.total ?? 0" />
    </app-page-hero>

    <app-page-section sectionId="leaderboard" [flush]="true">
      <h2 class="sr-only">Leaderboard</h2>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <app-period-tabs [period]="period()" [periods]="board()?.periods ?? []" (periodChange)="setPeriod($event)" />
        <div class="flex flex-col gap-3 sm:flex-row">
          <app-country-select [countries]="map.value()?.countries ?? []" [value]="country()" (valueChange)="setCountry($event)" />
          <app-contributor-search [period]="period()" />
        </div>
      </div>

      @if (board(); as page) {
        <ul class="mt-4 mb-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground" [attr.aria-label]="'Contributions ' + phrase(page.period)">
          <li class="flex items-center gap-1.5"><ng-icon name="lucideUsers" aria-hidden="true" /><span><strong class="font-semibold text-foreground tabular-nums">{{ number(page.total) }}</strong> {{ page.total === 1 ? 'contributor' : 'contributors' }}{{ page.country ? ' from ' + countryLabel(page.country) : '' }}</span></li>
          <li class="flex items-center gap-1.5"><ng-icon name="lucideGitPullRequest" aria-hidden="true" /><span><strong class="font-semibold text-foreground tabular-nums">{{ number(page.landedPullRequests) }}</strong> merged {{ page.landedPullRequests === 1 ? 'PR' : 'PRs' }}</span></li>
          <li class="flex items-center gap-1.5"><ng-icon name="lucideCircleDot" aria-hidden="true" /><span><strong class="font-semibold text-foreground tabular-nums">{{ number(page.issues) }}</strong> {{ page.issues === 1 ? 'issue' : 'issues' }}</span></li>
          <li class="flex items-center gap-1.5"><ng-icon name="lucideMessageCircle" aria-hidden="true" /><span><strong class="font-semibold text-foreground tabular-nums">{{ number(page.comments + page.reviewComments) }}</strong> {{ page.comments + page.reviewComments === 1 ? 'comment' : 'comments' }}</span></li>
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
        <app-page-section sectionId="world" title="Angularians around the world" [description]="worldDescription(world.countries.length)">
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

    <app-page-section sectionId="how-it-works" title="How the score works" description="Every contribution to angular/angular, angular/components, angular/angular-cli and angular/dev-infra counts, for its author, on the day it was made. Pull requests count once they are merged, by type, from the title (feat, fix, docs…): the convention the repositories already enforce.">
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
      <h3 class="mt-10 mb-4 font-semibold">Everything else counts too</h3>
      <div class="overflow-x-auto rounded-xl border">
        <table class="w-full text-sm">
          <tbody class="divide-y">
            @for (rule of rules; track rule.what) {
              <tr>
                <th scope="row" class="px-4 py-2.5 text-left font-medium">{{ rule.what }}</th>
                <td class="px-4 py-2.5 text-muted-foreground">{{ rule.when }}</td>
                <td class="px-4 py-2.5 text-right font-semibold whitespace-nowrap tabular-nums">{{ rule.points }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="mt-6 max-w-3xl text-sm text-muted-foreground">
        Most PRs from 2017 to 2025 show as closed on GitHub, not merged: Angular's merge tooling pushes the commits itself and adds
        <code class="rounded bg-muted px-1 py-0.5 text-xs">PR Close #N</code> to them. Those count as merged too. Reactions count on the day of the
        issue or comment they are on. Bots are left out. The weights are the ones of Nuxters, plus review comments.
      </p>
    </app-page-section>

    <app-page-section>
      <header class="mx-auto mb-10 max-w-3xl text-center">
        <h2 class="text-3xl font-medium tracking-tight sm:text-4xl">How to become an Angularian</h2>
        <p class="mt-4 text-lg text-pretty text-muted-foreground">One of these contributions to Angular puts you on the board, the next night.</p>
      </header>
      <app-page-grid>
        @for (way of becomeWays; track way.title) {
          <a [href]="way.url" target="_blank" rel="noopener" hlmCard class="transition hover:bg-muted/40">
            <div hlmCardHeader>
              <ng-icon [name]="way.icon" class="text-primary" size="22" aria-hidden="true" />
              <h3 hlmCardTitle class="mt-2">{{ way.title }}</h3>
              <p hlmCardDescription>{{ way.description }}</p>
            </div>
          </a>
        }
      </app-page-grid>
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

  protected readonly description = 'The people behind Angular, its CLI and its components, ranked by their contributions since 2014: merged pull requests, issues, comments and code reviews. Thanks to every one of them.';
  protected readonly placeholders = Array.from({ length: 30 }, (_, index) => index);
  protected readonly ways = [
    { title: 'Features', description: 'feat and perf PRs: new APIs, capabilities and speed.', icon: 'lucideRocket', points: PULL_REQUEST_POINTS.feat },
    { title: 'Fixes', description: 'fix PRs: bugs found and fixed.', icon: 'lucideWrench', points: PULL_REQUEST_POINTS.fix },
    { title: 'Docs', description: 'docs PRs: guides, API docs and examples on angular.dev.', icon: 'lucideBookOpen', points: PULL_REQUEST_POINTS.docs },
    { title: 'Chores', description: 'refactor, test, build, ci, release and reverts.', icon: 'lucideBrushCleaning', points: PULL_REQUEST_POINTS.chore },
  ];
  /** The three ways onto the board (Nuxters' "How to become a Nuxter"). */
  protected readonly becomeWays = [
    { title: 'Merge a pull request', description: 'Fix a bug, ship a feature or improve the docs of Angular, its CLI or its components.', icon: 'lucideGitPullRequest', url: 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md' },
    { title: 'Open a helpful issue', description: 'An issue that gets completed, or collects 3+ reactions or 5+ comments.', icon: 'lucideCircleDot', url: 'https://github.com/angular/angular/issues' },
    { title: 'Write a helpful comment', description: 'Answer a question or review a PR: a comment with 3+ reactions counts, every review comment too.', icon: 'lucideMessageCircleHeart', url: 'https://github.com/angular/angular/pulls' },
  ];
  /** Everything besides merged PRs, as `ACTIVITY_POINTS` weighs it. */
  protected readonly rules = [
    { what: 'Issue', when: 'every issue opened', points: `${ACTIVITY_POINTS.issues} pt` },
    { what: 'Helpful issue', when: 'on top: closed as completed, or 3+ reactions, or 5+ comments', points: `+${ACTIVITY_POINTS.helpfulIssues} pts` },
    { what: 'Review comment', when: 'every comment on the code of a pull request', points: `${ACTIVITY_POINTS.reviewComments} pt` },
    { what: 'Comment', when: 'every comment on an issue or a pull request', points: `${ACTIVITY_POINTS.comments} pt` },
    { what: 'Helpful comment', when: 'on top: 3+ reactions', points: `+${ACTIVITY_POINTS.helpfulComments} pts` },
    { what: 'Reaction', when: 'received on your issues, pull requests and comments', points: `${ACTIVITY_POINTS.reactions} pt` },
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
    });
  }

  /** Same page, no new history entry, scroll position kept. The default period leaves the URL clean. */
  protected setPeriod(period: Period): void {
    void this.router.navigate([], { queryParams: { period: period === DEFAULT_PERIOD ? null : period }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected worldDescription(countries: number): string {
    return `Angularians from ${formatNumber(countries)} countries ${periodPhrase(this.period())}. Pick a country to see its best ranked contributors.`;
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
