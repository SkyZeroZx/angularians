// Ported from nuxt.com `app/components/nuxters/NuxtersLeaderboard.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { injectServerFnMutation } from '@analogjs/router'
import type { ContributorSummary, LeaderboardPage } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucidePlus } from '@ng-icons/lucide'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmTooltip } from '@spartan-ng/helm/tooltip'
import { getLeaderboard } from '../data/contributors.server'
import { avatarUrl, formatNumber, formatPoints, profileQuery } from './format'

/** Avatar cells are 112px at most (10 columns of the container). */
const AVATAR_SIZE = 112

/** The first page comes server-rendered; "Show more" loads the next ones. */
@Component({
  selector: 'app-leaderboard-grid',
  imports: [HlmButton, HlmTooltip, NgIcon, RouterLink],
  providers: [provideIcons({ lucidePlus })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="grid grid-cols-5 gap-3 sm:grid-cols-8 sm:gap-4 md:grid-cols-10" [attr.aria-label]="label()">
      @for (item of items(); track item.githubId) {
        <li class="relative">
          <a
            [routerLink]="['/', item.username]"
            [queryParams]="query()"
            [hlmTooltip]="item.username + ' · ' + points(item)"
            [attr.aria-label]="item.username + ', #' + rank(item) + ', ' + points(item)"
            class="block aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-border transition hover:ring-2 hover:ring-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <img [src]="avatar(item)" alt="" [width]="AVATAR_SIZE" [height]="AVATAR_SIZE" loading="lazy" decoding="async" class="size-full object-cover" />
          </a>
          <span class="pointer-events-none absolute right-1 -bottom-1.5 rounded bg-background px-1 text-xs font-medium tabular-nums ring-1 ring-border" aria-hidden="true">{{ item.rank }}</span>
        </li>
      }
    </ol>

    @if (items().length < page().total) {
      <div class="mt-10 flex justify-center">
        <button hlmBtn variant="outline" type="button" [disabled]="loading()" (click)="showMore()">
          <ng-icon name="lucidePlus" aria-hidden="true" />
          {{ loading() ? 'Loading…' : 'Show more' }}
        </button>
      </div>
    }
    @if (failed()) {
      <p role="alert" class="mt-4 text-center text-sm text-destructive">The next page could not be loaded. Try again.</p>
    }
  `,
})
export class LeaderboardGrid {
  /** The first page of a period and country. */
  readonly page = input.required<LeaderboardPage>()

  private readonly fetchPage = injectServerFnMutation(getLeaderboard)
  /** Another period or country: start again from its first page. */
  private readonly more = linkedSignal<LeaderboardPage, ContributorSummary[]>({ source: () => this.page(), computation: () => [] })
  protected readonly loading = signal(false)
  protected readonly failed = signal(false)
  protected readonly items = computed(() => [...this.page().items, ...this.more()])
  protected readonly query = computed(() => profileQuery(this.page().period))
  protected readonly label = computed(() => `Contributors, ranked: ${formatNumber(this.items().length)} of ${formatNumber(this.page().total)} shown`)
  protected readonly AVATAR_SIZE = AVATAR_SIZE
  protected readonly avatar = (item: ContributorSummary) => avatarUrl(item.githubId, AVATAR_SIZE)
  protected readonly rank = (item: ContributorSummary) => formatNumber(item.rank)
  protected readonly points = (item: ContributorSummary) => formatPoints(item.score)

  protected async showMore(): Promise<void> {
    // The period or the country can change while this loads: its items must not join the new board.
    const first = this.page()
    const next = Math.floor(this.items().length / first.items.length) + 1
    this.loading.set(true)
    this.failed.set(false)
    try {
      const page = await this.fetchPage({ period: first.period, country: first.country, page: next })
      if (first === this.page()) this.more.update(items => [...items, ...page.items])
    }
    catch {
      if (first === this.page()) this.failed.set(true)
    }
    finally {
      this.loading.set(false)
    }
  }
}
