// Ported from nuxt.com `app/pages/nuxters/[username].vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
// Without the Nuxt-only parts: modules, blog posts, hackathons, the share card and the signed-in owner view.
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { injectServerFn, type RouteMeta } from '@analogjs/router';
import { injectResponse } from '@analogjs/router/tokens';
import { countryName, DEFAULT_PERIOD, isPeriod, periodPhrase, type ContributorProfile, type Period } from '@angularians/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft, lucideArrowUpRight, lucideAward, lucideCalendar, lucideCircleDot, lucideFileCode, lucideGithub, lucideGitPullRequest, lucideGlobe,
  lucideLink, lucideMapPin, lucideMessageCircle, lucideSmilePlus,
} from '@ng-icons/lucide';
import { injectParams } from 'ngxtension/inject-params';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { getContributor } from '../data/contributors.server';
import { Container } from '../layout/container';
import { avatarUrl, formatNumber, formatPoints, plural, profileQuery } from '../leaderboard/format';
import { PeriodTabs } from '../leaderboard/period-tabs';
import { ScoreBreakdown } from '../profile/score-breakdown';

export const routeMeta = {
  title: 'Contributor · Angularians',
} satisfies RouteMeta;

const SINCE = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const REPO = 'angular/angular';

@Component({
  selector: 'app-profile',
  imports: [Container, HlmButton, HlmSkeleton, HlmTooltip, NgIcon, NgTemplateOutlet, PeriodTabs, RouterLink, ScoreBreakdown],
  providers: [provideIcons({
    lucideArrowLeft, lucideArrowUpRight, lucideAward, lucideCalendar, lucideCircleDot, lucideFileCode, lucideGithub, lucideGitPullRequest, lucideGlobe,
    lucideLink, lucideMapPin, lucideMessageCircle, lucideSmilePlus,
  })],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
                <span><strong class="font-semibold">{{ number(current().score) }}</strong> pts</span>
              </p>
              <p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                @if (person.country) {
                  <!-- nofollow: crawlers would render every country × period. -->
                  <a routerLink="/" [queryParams]="countryQuery(person.country)" fragment="leaderboard" rel="nofollow" class="inline-flex items-center gap-1.5 hover:text-foreground">
                    <ng-icon name="lucideMapPin" aria-hidden="true" />{{ country(person.country) }}
                  </a>
                }
                @if (since(); as date) {
                  <span class="inline-flex items-center gap-1.5"><ng-icon name="lucideCalendar" aria-hidden="true" />Contributing since {{ date }}</span>
                }
                @if (best(); as year) {
                  <a [routerLink]="[]" [queryParams]="{ period: year.period }" replaceUrl class="inline-flex items-center gap-1.5 tabular-nums hover:text-foreground">
                    <ng-icon name="lucideAward" aria-hidden="true" />Best year {{ year.period }}, #{{ number(year.rank) }} with {{ number(year.score) }} pts
                  </a>
                }
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-6 lg:col-span-3">
            <div class="flex lg:justify-end">
              <app-period-tabs [period]="period()" [periods]="available()" [ranks]="ranks()" label="Profile period" (periodChange)="setPeriod($event)" />
            </div>

            <ul class="grid grid-cols-2 gap-4" [attr.aria-label]="'Contributions ' + phrase(period())">
              @for (stat of stats(); track stat.key) {
                <li [class.col-span-2]="stat.key === 'pullRequests'">
                  @if (stat.url) {
                    <a
                      [href]="stat.url"
                      target="_blank"
                      rel="noopener"
                      [attr.aria-label]="stat.label"
                      [class]="'group relative block h-full rounded-xl p-5 ring-1 transition ' + stat.tint"
                    >
                      <ng-icon name="lucideArrowUpRight" class="absolute top-4 right-4 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
                      <ng-container [ngTemplateOutlet]="statBody" [ngTemplateOutletContext]="{ $implicit: stat }" />
                    </a>
                  } @else {
                    <div [class]="'h-full rounded-xl p-5 ring-1 ' + stat.tint">
                      <ng-container [ngTemplateOutlet]="statBody" [ngTemplateOutletContext]="{ $implicit: stat }" />
                    </div>
                  }
                </li>
              }
            </ul>
            <ng-template #statBody let-stat>
              <ng-icon [name]="stat.icon" [class]="stat.text" size="20" aria-hidden="true" />
              <p class="mt-2 text-3xl font-semibold tabular-nums">{{ number(stat.value) }}</p>
              <p [class]="stat.text">{{ stat.name }}</p>
              <p class="mt-1 text-sm text-muted-foreground tabular-nums">{{ stat.detail }}</p>
            </ng-template>

            <section class="rounded-xl border p-6" aria-labelledby="score-title">
              <div class="mb-5 flex items-baseline justify-between gap-4">
                <h2 id="score-title" class="font-semibold">How the {{ number(current().score) }} points add up</h2>
                <a routerLink="/" fragment="how-it-works" class="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Scoring</a>
              </div>
              <app-score-breakdown [stats]="current()" />
            </section>
          </div>
        </div>
      </app-container>

      @if (years().length > 1) {
        <app-container class="pb-16">
          <section aria-labelledby="years-title">
            <h2 id="years-title" class="mb-4 text-2xl font-semibold tracking-tight">Year by year</h2>
            <div class="overflow-x-auto rounded-xl border">
              <table class="w-full text-sm tabular-nums">
                <thead class="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th scope="col" class="px-4 py-2 font-medium">Year</th>
                    <th scope="col" class="px-4 py-2 text-right font-medium">Rank</th>
                    <th scope="col" class="px-4 py-2 text-right font-medium">Landed PRs</th>
                    <th scope="col" class="px-4 py-2 text-right font-medium">Issues</th>
                    <th scope="col" class="px-4 py-2 text-right font-medium">Comments</th>
                    <th scope="col" class="px-4 py-2 text-right font-medium">Points</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  @for (row of years(); track row.period) {
                    <tr [class.bg-primary/5]="row.period === period()">
                      <th scope="row" class="px-4 py-2 text-left font-medium">
                        <a [routerLink]="[]" [queryParams]="{ period: row.period }" replaceUrl class="underline-offset-4 hover:underline">{{ row.period }}</a>
                      </th>
                      <td class="px-4 py-2 text-right">#{{ number(row.rank) }}</td>
                      <td class="px-4 py-2 text-right">{{ number(row.pullRequests.all) }}</td>
                      <td class="px-4 py-2 text-right">{{ number(row.issues) }}</td>
                      <td class="px-4 py-2 text-right">{{ number(row.comments + row.reviewComments) }}</td>
                      <td class="px-4 py-2 text-right">{{ number(row.score) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        </app-container>
      }
    } @else if (profile.isLoading()) {
      <app-container class="py-14" aria-busy="true">
        <div class="flex items-center gap-4">
          <div hlmSkeleton class="size-20 rounded-xl"></div>
          <div class="flex-1 space-y-2"><div hlmSkeleton class="h-8 w-56"></div><div hlmSkeleton class="h-5 w-32"></div></div>
        </div>
      </app-container>
    } @else {
      <app-container class="py-14">
        <h1 class="text-3xl font-bold tracking-tight">No contributions from {{ username() }}</h1>
        <p class="mt-2 max-w-xl text-muted-foreground">
          {{ profile.error() ? 'The profile could not be loaded. Try again in a moment.' : 'Nobody with this GitHub username has a landed pull request, an issue or a comment in angular/angular yet, or the data has not caught up: it updates every night.' }}
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

  protected readonly username = injectParams(params => String(params['username'] ?? ''));
  private readonly requested = injectQueryParams(params => (isPeriod(params['period']) ? (params['period'] as Period) : null));
  /** Every period is in the profile: switching period needs no request. */
  protected readonly profile = injectServerFn(getContributor, () => ({ username: this.username() }));

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
    const search = (q: string, type: 'pullrequests' | 'issues') => `https://github.com/search?${new URLSearchParams({ q: `repo:${REPO} ${q}`, type })}`;
    return [
      {
        key: 'pullRequests', icon: 'lucideGitPullRequest', value: prs.all, name: prs.all === 1 ? 'Landed pull request' : 'Landed pull requests',
        detail: `${formatNumber(prs.feat)} feat · ${formatNumber(prs.fix)} fix · ${formatNumber(prs.docs)} docs · ${formatNumber(prs.chore)} chore`,
        // GitHub shows most landed PRs as closed (PR Close): this lists all of them, landed or not.
        url: this.githubSearch(person), label: `${this.githubLabel(person)}`,
        tint: 'bg-primary/5 ring-primary/40 hover:bg-primary/10 hover:ring-primary', text: 'text-primary',
      },
      {
        key: 'issues', icon: 'lucideCircleDot', value: n.issues, name: n.issues === 1 ? 'Issue' : 'Issues', detail: `${formatNumber(n.helpfulIssues)} helpful`,
        url: search(`is:issue author:${person.username}`, 'issues'), label: `${plural(n.issues, 'issue', 'issues')} ${periodPhrase(this.period())}. Opens ${person.username}'s issues on GitHub`,
        tint: 'bg-sky-500/5 ring-sky-500/30 hover:bg-sky-500/10 hover:ring-sky-500', text: 'text-sky-700 dark:text-sky-400',
      },
      {
        key: 'comments', icon: 'lucideMessageCircle', value: n.comments, name: n.comments === 1 ? 'Comment' : 'Comments', detail: `${formatNumber(n.helpfulComments)} helpful`,
        url: search(`commenter:${person.username}`, 'issues'), label: `${plural(n.comments, 'comment', 'comments')} ${periodPhrase(this.period())}. Opens the issues and pull requests ${person.username} commented on, on GitHub`,
        tint: 'bg-violet-500/5 ring-violet-500/30 hover:bg-violet-500/10 hover:ring-violet-500', text: 'text-violet-700 dark:text-violet-400',
      },
      {
        key: 'reviewComments', icon: 'lucideFileCode', value: n.reviewComments, name: n.reviewComments === 1 ? 'Review comment' : 'Review comments', detail: 'on the code of pull requests',
        url: search(`is:pr reviewed-by:${person.username}`, 'pullrequests'), label: `${plural(n.reviewComments, 'review comment', 'review comments')} ${periodPhrase(this.period())}. Opens the pull requests ${person.username} reviewed, on GitHub`,
        tint: 'bg-emerald-500/5 ring-emerald-500/30 hover:bg-emerald-500/10 hover:ring-emerald-500', text: 'text-emerald-700 dark:text-emerald-400',
      },
      {
        key: 'reactions', icon: 'lucideSmilePlus', value: n.reactions, name: n.reactions === 1 ? 'Reaction' : 'Reactions', detail: 'received',
        url: null, label: '',
        tint: 'bg-amber-500/5 ring-amber-500/30', text: 'text-amber-700 dark:text-amber-400',
      },
    ];
  });
  /** The contributor's rank in each period they contributed in, for the period tabs. */
  protected readonly ranks = computed(() => Object.fromEntries((this.profile.value()?.periods ?? []).map(row => [row.period, row.rank])));
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
      { url: `https://github.com/${person.username}`, label: `github.com/${person.username}`, icon: 'lucideGithub', rel: 'me noopener' },
      ...(person.website ? [{ url: person.website, label: 'Website', icon: 'lucideGlobe', rel }] : []),
      ...person.socialAccounts.map(account => ({ url: account.url, label: account.displayName, icon: 'lucideLink', rel })),
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
  protected readonly countryQuery = (code: string) => ({ ...profileQuery(this.period()), country: code });

  constructor() {
    effect(() => {
      const person = this.profile.value();
      if (person === null && this.response) this.response.statusCode = 404;
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
    return `https://github.com/${REPO}/pulls?${new URLSearchParams({ q: `is:pr author:${person.username}` })}`;
  }

  protected githubLabel(person: ContributorProfile): string {
    const count = this.current().pullRequests.all;
    return `${plural(count, 'landed pull request', 'landed pull requests')} ${periodPhrase(this.period())}. Opens ${person.username}'s pull requests on GitHub`;
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
    const description = `${person.username} landed ${plural(current.pullRequests.all, 'pull request', 'pull requests')}, opened ${plural(current.issues, 'issue', 'issues')} and wrote ${plural(current.comments + current.reviewComments, 'comment', 'comments')} in angular/angular ${periodPhrase(this.period())}: #${formatNumber(current.rank)} with ${formatPoints(current.score)}.`;
    this.title.setTitle(`${title} · Angularians`);
    this.meta.removeTag('name="robots"');
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: avatarUrl(person.githubId, 200) });
    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `/${person.username}`);
  }
}
