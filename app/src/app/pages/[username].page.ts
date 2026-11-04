// Ported from nuxt.com `app/pages/nuxters/[username].vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
// Without the Nuxt-only parts: modules, blog posts, hackathons, the share card and the signed-in owner view.
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { injectServerFn, type RouteMeta } from '@analogjs/router';
import { injectResponse } from '@analogjs/router/tokens';
import { countryName, DEFAULT_PERIOD, GITHUB_USERNAME_RE, isPeriod, periodPhrase, reposQuery, type ContributorProfile, type Period } from '@angularians/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft, lucideArrowUpRight, lucideAward, lucideCircleDot, lucideGitPullRequest, lucideInfo,
  lucideBadgeCheck, lucideChevronDown, lucideChevronUp, lucideCrown, lucideFileCode, lucideLink, lucideLinkedin, lucideMessageCircle,
  lucideSmilePlus, lucideTrophy,
} from '@ng-icons/lucide';
import {
  simpleBluesky, simpleFacebook, simpleGithub, simpleInstagram, simpleMastodon, simpleNpm, simpleReddit, simpleThreads, simpleTwitch, simpleX,
  simpleYoutube,
} from '@ng-icons/simple-icons';
import { injectParams } from 'ngxtension/inject-params';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { getContributor } from '../data/contributors.server';
import { AngularLogo } from '../layout/angular-logo';
import { Container } from '../layout/container';
import { avatarUrl, flagUrl, formatNumber, formatPoints, plural, profileQuery } from '../leaderboard/format';
import { PeriodTabs } from '../leaderboard/period-tabs';
import { foldPackages, PACKAGE_ICONS, packageIcon, packageLabel } from '../profile/packages';
import { ScoreDialog } from '../profile/score-dialog';
import { Share } from '../profile/share';
import { AuthService } from '../auth/auth.service';
import { setCanonical, SITE_URL } from '../site';

export const routeMeta = {
  title: 'Contributor · Angularians',
} satisfies RouteMeta;

/** Links set on a GitHub profile, by provider (`generic` and unknown ones: a link icon). */
const SOCIAL_ICONS: Record<string, string> = {
  twitter: 'simpleX',
  bluesky: 'simpleBluesky',
  linkedin: 'lucideLinkedin',
  mastodon: 'simpleMastodon',
  youtube: 'simpleYoutube',
  twitch: 'simpleTwitch',
  instagram: 'simpleInstagram',
  facebook: 'simpleFacebook',
  threads: 'simpleThreads',
  reddit: 'simpleReddit',
  npm: 'simpleNpm',
};
const SINCE = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Years as ranges: [2019, 2024, 2025, 2026] → "2019, 2024–2026". */
export function yearRanges(years: readonly number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < years.length; i++) {
    let j = i;
    while (j + 1 < years.length && years[j + 1] === years[j]! + 1) j++;
    parts.push(j > i ? `${years[i]}–${years[j]}` : `${years[i]}`);
    i = j;
  }
  return parts.join(', ');
}

@Component({
  selector: 'app-profile',
  imports: [AngularLogo, Container, HlmButton, HlmSkeleton, HlmTooltip, NgIcon, NgTemplateOutlet, PeriodTabs, RouterLink, ScoreDialog, Share],
  providers: [provideIcons({
    lucideArrowLeft, lucideArrowUpRight, lucideAward, lucideCircleDot, lucideGitPullRequest, lucideInfo,
    lucideBadgeCheck, lucideChevronDown, lucideChevronUp, lucideCrown, lucideFileCode, lucideLink, lucideLinkedin, lucideMessageCircle,
    lucideSmilePlus, lucideTrophy,
    simpleBluesky, simpleFacebook, simpleGithub, simpleInstagram, simpleMastodon, simpleNpm, simpleReddit, simpleThreads, simpleTwitch, simpleX,
    simpleYoutube, ...PACKAGE_ICONS,
  })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block isolate' },
  template: `
    <app-container class="pt-8">
      <a hlmBtn variant="link" class="px-0" routerLink="/" [queryParams]="backQuery()">
        <ng-icon name="lucideArrowLeft" aria-hidden="true" />All contributors
      </a>
    </app-container>

    @if (profile.value(); as person) {
      <app-container class="py-8 lg:py-14">
        <div class="grid items-start gap-8 lg:grid-cols-5 lg:gap-12">
          <div class="flex min-w-0 flex-col items-start gap-5 lg:col-span-2">
            <!-- w-full: a long name truncates instead of widening the page on phones -->
            <div class="flex w-full min-w-0 items-center gap-4 lg:flex-col lg:items-start lg:gap-6">
              <img [src]="avatar(person)" [alt]="person.username" width="112" height="112" class="size-20 shrink-0 rounded-xl bg-muted ring-1 ring-border lg:size-28" />
              <div class="flex min-w-0 flex-1 flex-col gap-1 lg:w-full">
                <h1 class="truncate text-3xl font-bold tracking-tight sm:text-4xl" [title]="displayName()">{{ displayName() }}</h1>
                @if (person.name) {
                  <p class="truncate text-lg text-muted-foreground">{{ person.username }}</p>
                }
                <ul class="-ml-2 flex flex-wrap items-center gap-0.5" aria-label="Links">
                  @for (link of links(); track link.url) {
                    <li>
                      <a hlmBtn variant="ghost" size="icon-sm" [href]="link.url" target="_blank" [attr.rel]="link.rel" [attr.aria-label]="link.label" [hlmTooltip]="link.label" class="text-muted-foreground hover:text-foreground">
                        <ng-icon [name]="link.icon" aria-hidden="true" />
                      </a>
                    </li>
                  }
                </ul>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-lg tabular-nums">
                <span>#{{ number(current().rank) }} {{ phrase(period()) }}</span>
                <span class="text-muted-foreground" aria-hidden="true">·</span>
                <span class="inline-flex items-center gap-1">
                  <strong class="font-semibold">{{ number(current().score) }}</strong> pts
                  <app-score-dialog [stats]="current()" [phrase]="phrase(period())" />
                </span>
              </p>
              <p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                @if (person.country) {
                  <!-- nofollow: crawlers would render every country × period. -->
                  <a routerLink="/" [queryParams]="countryQuery(person.country)" fragment="leaderboard" rel="nofollow" class="inline-flex items-center gap-1.5 hover:text-foreground">
                    <img [src]="flag(person.country)" alt="" width="16" height="16" class="size-4 shrink-0 rounded-full" />{{ country(person.country) }}
                  </a>
                }
                @if (since(); as date) {
                  <span class="inline-flex items-center gap-1.5"><ng-icon name="lucideCalendar" aria-hidden="true" />Contributing since {{ date }}</span>
                }
                @if (best(); as year) {
                  <a [routerLink]="[]" [queryParams]="{ period: year.period }" replaceUrl class="inline-flex items-center gap-1.5 tabular-nums hover:text-foreground">
                    <ng-icon name="lucideAward" aria-hidden="true" />Best year {{ year.period }}, #{{ number(year.rank) }} with {{ points(year.score) }}
                  </a>
                }
              </p>
              @if (badges().length) {
                <ul class="flex flex-wrap gap-2" aria-label="Badges">
                  @for (badge of badges(); track badge.label) {
                    <li [class]="'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm ring-1 ' + badge.style" [hlmTooltip]="badge.title">
                      @if (badge.icon === 'angular') {
                        <app-angular-logo class="size-4" />
                      } @else {
                        <ng-icon [name]="badge.icon" aria-hidden="true" />
                      }
                      {{ badge.label }}
                    </li>
                  }
                </ul>
              }
              <!-- Your own profile: share it (the period on screen). In the browser only: the page is cached for everyone. -->
              @if (isOwner()) {
                <app-share class="hidden lg:flex" [username]="person.username" [period]="period()" [periods]="available()" />
              }
            </div>
          </div>

          <div class="flex flex-col gap-6 lg:col-span-3">
            <div class="flex lg:justify-end">
              <app-period-tabs [period]="period()" [periods]="available()" [ranks]="ranks()" label="Profile period" (periodChange)="setPeriod($event)" />
            </div>

            <ul class="grid grid-cols-2 gap-4" [attr.aria-label]="'Contributions ' + phrase(period())">
              @for (stat of stats(); track stat.key) {
                <li>
                  @if (stat.url) {
                    <a
                      [href]="stat.url"
                      target="_blank"
                      rel="noopener"
                      [attr.aria-label]="stat.label"
                      [class]="'group relative block h-full min-h-44 rounded-xl p-6 ring-1 transition ' + stat.tint"
                    >
                      <ng-icon name="lucideArrowUpRight" size="20" class="absolute top-6 right-6 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
                      <ng-container [ngTemplateOutlet]="statBody" [ngTemplateOutletContext]="{ $implicit: stat }" />
                    </a>
                  } @else {
                    <div [class]="'h-full min-h-44 rounded-xl p-6 ring-1 ' + stat.tint">
                      <ng-container [ngTemplateOutlet]="statBody" [ngTemplateOutletContext]="{ $implicit: stat }" />
                    </div>
                  }
                </li>
              }
            </ul>
            <ng-template #statBody let-stat>
              <ng-icon [name]="stat.icon" [class]="stat.text" size="22" aria-hidden="true" />
              <p class="mt-6 text-4xl font-semibold tabular-nums">{{ number(stat.value) }}</p>
              <p [class]="'mt-1 ' + stat.text">{{ stat.name }}</p>
              <p class="mt-1 text-sm text-muted-foreground tabular-nums">{{ stat.detail }}</p>
            </ng-template>

          </div>
        </div>
      </app-container>

      @if (packages().length) {
        <app-container class="pb-12">
          <section aria-labelledby="packages-title">
            <h2 id="packages-title" class="mb-1 text-2xl font-medium tracking-tight">Contributed to</h2>
            <p class="mb-6 text-muted-foreground">Merged PRs in {{ plural(packages().length, 'package', 'packages') }} of Angular, by PRs.</p>
            <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              @for (item of shownPackages(); track item.name) {
                <li class="flex items-center gap-3 rounded-lg px-3 py-2 ring-1 ring-border">
                  <span class="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <ng-icon [name]="icon(item.name)" aria-hidden="true" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium">{{ item.name }}</span>
                    <span class="block truncate text-xs text-muted-foreground">{{ packageLabel(item.name) }}</span>
                  </span>
                  <span class="text-sm tabular-nums text-muted-foreground">{{ plural(item.pullRequests, 'PR', 'PRs') }}</span>
                </li>
              }
            </ul>
            @if (packages().length > PACKAGES_SHOWN) {
              <button hlmBtn variant="ghost" type="button" class="mt-4" (click)="allPackages.set(!allPackages())">
                {{ allPackages() ? 'Show less' : 'Show all ' + packages().length }}
                <ng-icon [name]="allPackages() ? 'lucideChevronUp' : 'lucideChevronDown'" aria-hidden="true" />
              </button>
            }
          </section>
        </app-container>
      }

      @if (years().length > 1) {
        <app-container class="pb-16">
          <section aria-labelledby="years-title">
            <h2 id="years-title" class="mb-1 text-2xl font-medium tracking-tight">Year by year</h2>
            <p class="mb-6 text-muted-foreground">Rank and points in every year {{ displayName() }} contributed.</p>
            <ol class="max-w-3xl" aria-labelledby="years-title">
              @for (row of years(); track row.period) {
                <li>
                  <a
                    [routerLink]="[]"
                    [queryParams]="{ period: row.period }"
                    replaceUrl
                    class="-mx-2 flex items-center gap-4 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/60"
                    [class.bg-muted]="row.period === period()"
                    [attr.aria-current]="row.period === period() ? 'true' : null"
                  >
                    <span class="w-12 font-medium tabular-nums">{{ row.period }}</span>
                    <span class="w-14 text-muted-foreground tabular-nums">#{{ number(row.rank) }}</span>
                    <span class="min-w-0 flex-1">
                      <span class="block h-1.5 rounded-full bg-primary/70" [style.width.%]="yearBar(row.score)"></span>
                    </span>
                    <span class="w-20 text-right tabular-nums"><strong class="font-semibold">{{ number(row.score) }}</strong>&nbsp;<span class="text-muted-foreground">pts</span></span>
                  </a>
                </li>
              }
            </ol>
          </section>
        </app-container>
      }
    } @else if (profile.isLoading() && validUsername()) {
      <!-- The shape of the profile below, so nothing jumps when it arrives. -->
      <app-container class="py-8 lg:py-14" aria-busy="true">
        <span class="sr-only">Loading the profile of {{ username() }}</span>
        <div class="grid items-start gap-8 lg:grid-cols-5 lg:gap-12" aria-hidden="true">
          <div class="flex flex-col items-start gap-5 lg:col-span-2">
            <div class="flex w-full items-center gap-4 lg:flex-col lg:items-start lg:gap-6">
              <div hlmSkeleton class="size-20 shrink-0 rounded-xl lg:size-28"></div>
              <div class="flex flex-1 flex-col gap-2 lg:w-full">
                <div hlmSkeleton class="h-9 w-3/4 max-w-72"></div>
                <div hlmSkeleton class="h-5 w-32"></div>
                <div class="flex gap-2 pt-1">
                  @for (i of [1, 2, 3, 4]; track i) { <div hlmSkeleton class="size-7 rounded-md"></div> }
                </div>
              </div>
            </div>
            <div class="flex w-full flex-col gap-2">
              <div hlmSkeleton class="h-7 w-56"></div>
              <div hlmSkeleton class="h-4 w-72 max-w-full"></div>
              <div hlmSkeleton class="h-4 w-64 max-w-full"></div>
            </div>
            <div class="flex flex-wrap gap-2">
              @for (w of ['w-32', 'w-28', 'w-24']; track w) { <div hlmSkeleton [class]="'h-8 rounded-md ' + w"></div> }
            </div>
          </div>
          <div class="flex flex-col gap-4 lg:col-span-3">
            <div hlmSkeleton class="h-10 w-full max-w-md self-end rounded-lg"></div>
            <div class="grid gap-4 sm:grid-cols-2">
              @for (i of [1, 2, 3, 4]; track i) { <div hlmSkeleton class="min-h-44 rounded-xl"></div> }
            </div>
          </div>
        </div>
        <div class="mt-14 flex flex-col gap-3" aria-hidden="true">
          <div hlmSkeleton class="h-7 w-48"></div>
          <div hlmSkeleton class="h-5 w-80 max-w-full"></div>
          <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) { <div hlmSkeleton class="h-16 rounded-lg"></div> }
          </div>
        </div>
      </app-container>
    } @else {
      <app-container class="py-14">
        <h1 class="text-3xl font-bold tracking-tight">No contributions from {{ username() }}</h1>
        <p class="mt-2 max-w-xl text-muted-foreground">
          {{ notFoundText() }}
        </p>
        <a hlmBtn class="mt-6" href="https://github.com/angular/angular/contribute" target="_blank" rel="noopener">Find a first issue</a>
      </app-container>
    }
  `,
})
export default class Profile {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly response = injectResponse();
  private readonly auth = inject(AuthService);

  protected readonly username = injectParams(params => String(params['username'] ?? ''));
  private readonly requested = injectQueryParams(params => (isPeriod(params['period']) ? (params['period'] as Period) : null));
  /** Every period is in the profile: switching period needs no request. */
  protected readonly profile = injectServerFn(getContributor, () => ({ username: this.username() }));
  /** Signed in as this contributor (by GitHub id). */
  /** In the class, not the template: an apostrophe in a template string ends it. */
  /** GitHub's rule for a username; anything else is not found, not a failed load. */
  protected readonly validUsername = computed(() => GITHUB_USERNAME_RE.test(this.username()));
  protected readonly notFoundText = computed(() => this.profile.error() && this.validUsername()
    ? 'The profile could not be loaded. Try again in a moment.'
    : "Nobody with this GitHub username has a merged pull request, an issue or a comment in Angular's repositories yet, or the data has not caught up: it updates every night.");
  protected readonly isOwner = computed(() => {
    const me = this.auth.state()?.user;
    return !!me && me.githubId === this.profile.value()?.githubId;
  });

  protected readonly available = computed(() => this.profile.value()?.periods.map(row => row.period) ?? ['all']);
  /** `?period=` when the contributor contributed in it, all time otherwise. */
  protected readonly period = computed<Period>(() => {
    const requested = this.requested();
    return requested && this.available().includes(requested) ? requested : 'all';
  });
  protected readonly current = computed(() => {
    const person = this.profile.value()!;
    return person.periods.find(row => row.period === this.period()) ?? { ...person, period: 'all' };
  });
  /** One card per kind of contribution; the ones GitHub can search link to that search. */
  protected readonly stats = computed(() => {
    const person = this.profile.value()!;
    const n = this.current();
    const prs = n.pullRequests;
    const search = (q: string, type: 'pullrequests' | 'issues') => `https://github.com/search?${new URLSearchParams({ q: `${reposQuery()} ${q}`, type })}`;
    return [
      {
        key: 'pullRequests', icon: 'lucideGitPullRequest', value: prs.all, name: prs.all === 1 ? 'Merged PR' : 'Merged PRs',
        detail: `${formatNumber(prs.feat)} feat · ${formatNumber(prs.fix)} fix · ${formatNumber(prs.docs)} docs · ${formatNumber(prs.chore)} chore`,
        // GitHub shows most landed PRs as closed (PR Close): this lists all of them, landed or not.
        url: this.githubSearch(person), label: `${this.githubLabel(person)}`,
        tint: 'bg-primary/5 ring-primary hover:bg-primary/10', text: 'text-primary',
      },
      {
        key: 'issues', icon: 'lucideCircleDot', value: n.issues, name: n.issues === 1 ? 'Issue' : 'Issues', detail: `${formatNumber(n.helpfulIssues)} helpful`,
        url: search(`is:issue author:${person.username}`, 'issues'), label: `${plural(n.issues, 'issue', 'issues')} ${periodPhrase(this.period())}. Opens ${person.username}'s issues on GitHub`,
        tint: 'bg-sky-500/5 ring-sky-500 hover:bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400',
      },
      {
        key: 'comments', icon: 'lucideMessageCircle', value: n.comments, name: n.comments === 1 ? 'Comment' : 'Comments',
        // Inline review comments score on their own (1 pt each): their count goes with the comments.
        detail: `${formatNumber(n.helpfulComments)} helpful · ${plural(n.reviewComments, 'review comment', 'review comments')} on code`,
        url: search(`commenter:${person.username}`, 'issues'), label: `${plural(n.comments, 'comment', 'comments')} ${periodPhrase(this.period())}. Opens the issues and pull requests ${person.username} commented on, on GitHub`,
        tint: 'bg-violet-500/5 ring-violet-500 hover:bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400',
      },
      {
        key: 'reactions', icon: 'lucideSmilePlus', value: n.reactions, name: n.reactions === 1 ? 'Reaction' : 'Reactions', detail: 'received',
        url: null, label: '',
        tint: 'bg-amber-500/5 ring-amber-500', text: 'text-amber-700 dark:text-amber-400',
      },
    ];
  });
  protected readonly PACKAGES_SHOWN = 12;
  protected readonly allPackages = signal(false);
  /** Misspelled scopes (`platform-brower`) folded into the package they mean. */
  protected readonly packages = computed(() => foldPackages(this.profile.value()?.packages ?? []));
  protected readonly shownPackages = computed(() => {
    const packages = this.packages();
    return this.allPackages() ? packages : packages.slice(0, this.PACKAGES_SHOWN);
  });
  protected readonly packageLabel = packageLabel;
  protected readonly icon = packageIcon;
  protected readonly plural = plural;
  protected readonly points = formatPoints;
  /** Earned from the data: the Angular team, the all-time top 10, #1 of a year, 100+ review comments. */
  protected readonly badges = computed(() => {
    const person = this.profile.value();
    if (!person) return [];
    // One colour per kind, the profile's stat colours: gold for a #1, sky for the all-time top 10, violet (comments)
    // for reviews. As soft tints, readable in both themes.
    const gold = 'bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-400';
    const sky = 'bg-sky-500/10 text-sky-700 ring-sky-500/30 dark:text-sky-400';
    const violet = 'bg-violet-500/10 text-violet-700 ring-violet-500/30 dark:text-violet-400';
    const badges: Array<{ label: string, title: string, icon: string, style: string }> = [];
    // The gradient Angular logo of the press kit, only to say "member of the Angular team" (the site's mark stays the A).
    if (person.team) badges.push({ label: 'Angular team', title: 'A public member of the angular organization on GitHub', icon: 'angular', style: 'bg-[#dc087d]/10 text-foreground ring-[#dc087d]/40' });
    // Every year at #1 in one badge: "#1 in 2024–2026", "#1 in 2019, 2024".
    const firsts = this.years().filter(row => row.rank === 1).map(row => Number(row.period)).sort((x, y) => x - y);
    if (firsts.length) {
      badges.push({ label: `#1 in ${yearRanges(firsts)}`, title: `The top Angularian of ${plural(firsts.length, 'year', 'years')}`, icon: 'lucideCrown', style: gold });
    }
    if (person.rank <= 10) badges.push({ label: 'Top 10 all time', title: `#${formatNumber(person.rank)} of all time`, icon: 'lucideTrophy', style: sky });
    if (person.reviewComments >= 100) badges.push({ label: 'Reviewer', title: `${formatNumber(person.reviewComments)} review comments on code`, icon: 'lucideFileCode', style: violet });
    return badges;
  });
  /** The contributor's rank in each period they contributed in, for the period tabs. */
  protected readonly ranks = computed(() => Object.fromEntries((this.profile.value()?.periods ?? []).map(row => [row.period, row.rank])));
  /** The bar of a year: its points against the best year's. */
  protected readonly yearBar = (score: number) => Math.max(2, score / Math.max(1, ...this.years().map(row => row.score)) * 100);
  protected readonly years = computed(() => (this.profile.value()?.periods ?? []).filter(row => /^\d{4}$/.test(row.period)));
  /** Best rank; on a tie (#1 several years), the year with the most points. */
  protected readonly best = computed(() => this.years().reduce<ReturnType<typeof this.years>[number] | undefined>(
    (top, row) => (!top || row.rank < top.rank || (row.rank === top.rank && row.score > top.score) ? row : top), undefined));
  protected readonly displayName = computed(() => this.profile.value()?.name || this.profile.value()?.username || this.username());
  protected readonly since = computed(() => {
    const date = this.profile.value()?.firstContributionAt;
    return date ? SINCE.format(new Date(date)) : null;
  });
  protected readonly links = computed(() => {
    const person = this.profile.value();
    if (!person) return [];
    // Links set on GitHub are user input: never followed by crawlers. `me` for Mastodon verification.
    const rel = 'me nofollow noopener noreferrer';
    const all = [
      { url: `https://github.com/${person.username}`, label: `github.com/${person.username}`, icon: 'simpleGithub', rel: 'me noopener' },
      ...(person.website ? [{ url: person.website, label: 'Website', icon: 'lucideGlobe', rel }] : []),
      ...person.socialAccounts.map(account => ({ url: account.url, label: account.displayName, icon: SOCIAL_ICONS[account.provider] ?? 'lucideLink', rel })),
    ];
    // A website can also be a social account: one icon per URL, the first wins.
    return all.filter((link, index) => all.findIndex(other => other.url === link.url) === index);
  });
  /** Back to the board of the period on screen; the board's default period keeps its URL clean. */
  protected readonly backQuery = computed(() => (this.period() === DEFAULT_PERIOD ? {} : { period: this.period() }));

  protected readonly avatar = (person: ContributorProfile) => avatarUrl(person.githubId, 112);
  protected readonly number = formatNumber;
  protected readonly phrase = periodPhrase;
  protected readonly country = countryName;
  protected readonly flag = flagUrl;
  protected readonly countryQuery = (code: string) => ({ ...profileQuery(this.period()), country: code });

  constructor() {
    effect(() => {
      const person = this.profile.value();
      // Nobody with this username, or a path that cannot be one (`/-x-`): not found.
      if ((person === null || !this.validUsername()) && this.response) this.response.statusCode = 404;
      // One URL per profile: /CrisBeto → /crisbeto, keeping the period.
      if (person && person.username !== this.username()) {
        void this.router.navigate(['/', person.username], { queryParamsHandling: 'preserve', replaceUrl: true });
      }
      this.updateHead(person ?? null);
    });
  }

  protected setPeriod(period: Period): void {
    void this.router.navigate([], { queryParams: { period: period === 'all' ? null : period }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected githubSearch(person: ContributorProfile): string {
    return `https://github.com/search?${new URLSearchParams({ q: `${reposQuery()} is:pr author:${person.username}`, type: 'pullrequests' })}`;
  }

  protected githubLabel(person: ContributorProfile): string {
    const count = this.current().pullRequests.all;
    return `${plural(count, 'merged pull request', 'merged pull requests')} ${periodPhrase(this.period())}. Opens ${person.username}'s pull requests on GitHub`;
  }

  /** Shared links show the period on screen; the canonical URL has none, so search engines see one page per profile. */
  private updateHead(person: ContributorProfile | null): void {
    if (!person) {
      this.title.setTitle(`${this.username()} · Angularians`);
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
      return;
    }
    const current = this.current();
    const title = this.period() === 'all'
      ? `${person.username}, Angularian #${formatNumber(current.rank)}`
      : `${person.username}: #${formatNumber(current.rank)} ${periodPhrase(this.period())}`;
    const description = `${person.username} merged ${plural(current.pullRequests.all, 'pull request', 'pull requests')}, opened ${plural(current.issues, 'issue', 'issues')} and wrote ${plural(current.comments + current.reviewComments, 'comment', 'comments')} in Angular ${periodPhrase(this.period())}: #${formatNumber(current.rank)} with ${formatPoints(current.score)}.`;
    this.title.setTitle(`${title} · Angularians`);
    this.meta.removeTag('name="robots"');
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    // The Angularian card of the period on screen: 1200×630, a large preview on X, LinkedIn, Slack…
    const card = `${SITE_URL}/${person.username}/card.png${this.period() === 'all' ? '' : `?period=${this.period()}`}`;
    this.meta.updateTag({ property: 'og:image', content: card });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:image', content: card });
    this.meta.updateTag({ property: 'og:url', content: `${SITE_URL}/${person.username}${this.period() === 'all' ? '' : `?period=${this.period()}`}` });
    setCanonical(this.document, `/${person.username}`);
  }
}
