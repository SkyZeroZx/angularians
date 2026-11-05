// Ported from nuxt.com `app/components/nuxters/NuxtersLeaderboard.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { Component, computed, inject, input, linkedSignal, signal, Service } from '@angular/core'
import { RouterLink } from '@angular/router'
import { injectServerFnMutation } from '@analogjs/router'
import type { ContributorSummary, LeaderboardPage } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixAddLine, remixLayoutGridLine, remixListUnordered } from '@ng-icons/remixicon'
import { HlmButton } from '@spartan-ng/helm/button'
import { vikingAxes, vikingHelmet, vikingShield } from '../layout/viking-icons'
import { HlmTooltip } from '@spartan-ng/helm/tooltip'
import { getLeaderboard } from '../data/contributors.server'
import { RankShield } from './rank-shield'
import { avatarSrcset, avatarUrl, formatNumber, formatPoints, profileQuery } from './format'

/** Avatar cells are 112px at most (10 columns of the container). */
const AVATAR_SIZE = 112
/** Gold, silver and bronze for the top three of a period. */
export const PODIUM: Record<number, { icon: string, ring: string, badge: string, text: string }> = {
  1: { icon: 'vikingHelmet', ring: 'ring-2 ring-[#D29922]', badge: 'ring-[#D29922] text-[#9A6700] dark:text-[#D29922]', text: 'text-[#9A6700] dark:text-[#D29922]' },
  2: { icon: 'vikingShield', ring: 'ring-2 ring-[#A8B3BD]', badge: 'ring-[#A8B3BD] text-[#59636E] dark:text-[#A8B3BD]', text: 'text-[#59636E] dark:text-[#A8B3BD]' },
  3: { icon: 'vikingAxes', ring: 'ring-2 ring-[#B5561C]', badge: 'ring-[#B5561C] text-[#9A4510] dark:text-[#D2691E]', text: 'text-[#9A4510] dark:text-[#D2691E]' },
}

/** The first page comes server-rendered; "Show more" loads the next ones. */
/** The extra pages of each board, for as long as the tab is open: a board is its period, country and data night. */
@Service()
export class LeaderboardMemory {
  private readonly pages = new Map<string, ContributorSummary[]>()
  readonly view = signal<'grid' | 'list'>('grid')
  private key(page: LeaderboardPage): string {
    return `${page.period}|${page.country ?? ''}|${page.collectedAt ?? ''}`
  }
  get(page: LeaderboardPage): ContributorSummary[] {
    return this.pages.get(this.key(page)) ?? []
  }
  set(page: LeaderboardPage, items: ContributorSummary[]): void {
    this.pages.set(this.key(page), items)
  }
}

@Component({
  selector: 'app-leaderboard-grid',
  imports: [HlmButton, HlmTooltip, NgIcon, RankShield, RouterLink],
  providers: [provideIcons({ remixAddLine, remixLayoutGridLine, remixListUnordered, vikingAxes, vikingHelmet, vikingShield })],
  template: `
    <div class="mb-3 flex justify-end sm:hidden" role="group" aria-label="Leaderboard view">
      <div class="inline-flex gap-1 rounded-lg bg-muted p-1">
        <button type="button" aria-label="Show as a grid" [attr.aria-pressed]="view() === 'grid'" [class]="viewButton(view() === 'grid')" (click)="memory.view.set('grid')"><ng-icon name="remixLayoutGridLine" aria-hidden="true" /></button>
        <button type="button" aria-label="Show as a list" [attr.aria-pressed]="view() === 'list'" [class]="viewButton(view() === 'list')" (click)="memory.view.set('list')"><ng-icon name="remixListUnordered" aria-hidden="true" /></button>
      </div>
    </div>

    @if (view() === 'list') {
      <ol class="flex flex-col gap-2 sm:hidden" [attr.aria-label]="listLabel()">
        @for (item of items(); track item.githubId) {
          <li>
            <a [routerLink]="['/', item.username]" [queryParams]="query()" class="flex items-center gap-3 rounded-lg bg-muted/40 p-2 ring-1 ring-border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" [attr.aria-label]="label(item)">
              @if (podium(item); as medal) {
                <app-rank-shield [rank]="place(item)" metal="" [podium]="true" [class]="'h-8 w-7 shrink-0 text-sm ' + medal.text" />
              } @else {
                <app-rank-shield [rank]="place(item)" class="h-8 w-7 shrink-0 text-sm text-foreground" />
              }
              <img [src]="avatar(item)" alt="" width="40" height="40" loading="lazy" decoding="async" class="size-10 shrink-0 rounded-md bg-muted object-cover" />
              <span class="min-w-0 flex-1">
                <span class="block font-medium wrap-anywhere">{{ item.name || item.username }}</span>
                @if (item.name) { <span class="block text-xs wrap-anywhere text-muted-foreground">{{ item.username }}</span> }
              </span>
              <span class="shrink-0 text-sm font-semibold tabular-nums">{{ points(item) }}</span>
            </a>
          </li>
        }
      </ol>
    }

    <ol [class]="'grid-cols-5 gap-3 sm:grid sm:grid-cols-8 sm:gap-4 md:grid-cols-10 ' + (view() === 'list' ? 'hidden' : 'grid')" [attr.aria-label]="listLabel()">
      @for (item of items(); track item.githubId) {
        <li class="relative">
          <ng-template #tip><span class="brand mr-1.5 text-sm leading-none">#{{ rank(item) }}</span>{{ who(item) }} · {{ points(item) }}@if (item.countryRank) { · #{{ overall(item) }} overall }</ng-template>
          <a
            [routerLink]="['/', item.username]"
            [queryParams]="query()"
            [hlmTooltip]="tip"
            [attr.aria-label]="label(item)"
            [class]="'relative block aspect-square overflow-hidden rounded-xl bg-muted transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ' + podiumRing(item)"
          >
            <img [src]="avatar(item)" [srcset]="avatars(item)" alt="" [width]="AVATAR_SIZE" [height]="AVATAR_SIZE" loading="lazy" decoding="async" class="size-full object-cover" />
            @if (podium(item)) {
              <span class="absolute inset-x-0 bottom-0 hidden bg-black/75 px-1.5 py-1 text-center text-[0.6875rem] leading-tight font-medium wrap-anywhere text-white xl:block">{{ item.name || item.username }}</span>
            }
          </a>
          @if (podium(item); as medal) {
            <span [class]="'pointer-events-none absolute -top-2 -left-1 grid size-7 place-items-center rounded-md bg-background ring-1 ' + medal.badge" aria-hidden="true">
              <ng-icon [name]="medal.icon" size="1.25rem" />
            </span>
            <app-rank-shield [rank]="place(item)" metal="" [podium]="true" [class]="'pointer-events-none absolute! -top-2 -right-1 h-8 w-7 text-sm ' + medal.text" />
          } @else {
            <app-rank-shield [rank]="place(item)" class="pointer-events-none absolute! -right-1 -bottom-1 h-5 w-4.5 text-[0.625rem] text-foreground sm:h-6 sm:w-5.5 sm:text-xs" />
          }
        </li>
      }
    </ol>

    @if (items().length < page().total) {
      <div class="mt-10 flex justify-center">
        <button hlmBtn variant="outline" type="button" [disabled]="loading()" (click)="showMore()">
          <ng-icon name="remixAddLine" aria-hidden="true" />
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
  protected readonly memory = inject(LeaderboardMemory)
  protected readonly view = this.memory.view
  protected readonly viewButton = (active: boolean) =>
    `grid size-8 place-items-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${active ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`
  /**
   * The pages after the first, as "Show more" loaded them: remembered per board, so coming back from a profile shows
   * the same list (and the browser's scroll position lands where it was). Another period or country: its own.
   */
  private readonly more = linkedSignal<LeaderboardPage, ContributorSummary[]>({ source: () => this.page(), computation: page => this.memory.get(page) })
  protected readonly loading = signal(false)
  protected readonly failed = signal(false)
  protected readonly items = computed(() => [...this.page().items, ...this.more()])
  protected readonly query = computed(() => profileQuery(this.page().period, this.page().country))
  protected readonly listLabel = computed(() => `Contributors, ranked: ${formatNumber(this.items().length)} of ${formatNumber(this.page().total)} shown`)
  protected readonly AVATAR_SIZE = AVATAR_SIZE
  protected readonly avatar = (item: ContributorSummary) => avatarUrl(item.githubId, AVATAR_SIZE)
  protected readonly avatars = (item: ContributorSummary) => avatarSrcset(item.githubId, AVATAR_SIZE)
  protected readonly podiumRing = (item: ContributorSummary) => PODIUM[this.place(item)]?.ring ?? 'ring-1 ring-border hover:ring-2 hover:ring-primary'
  protected readonly podium = (item: ContributorSummary) => PODIUM[this.place(item)] ?? null
  protected readonly who = (item: ContributorSummary) =>
    item.name && item.name.toLowerCase() !== item.username.toLowerCase() ? `${item.name} (${item.username})` : item.username
  protected readonly overall = (item: ContributorSummary) => formatNumber(item.rank)
  protected readonly place = (item: ContributorSummary) => item.countryRank ?? item.rank
  protected readonly rank = (item: ContributorSummary) => formatNumber(this.place(item))
  protected readonly label = (item: ContributorSummary) =>
    `${this.who(item)}, #${this.rank(item)}${item.countryRank ? ` in the country, #${formatNumber(item.rank)} overall` : ''}, ${this.points(item)}`
  protected readonly points = (item: ContributorSummary) => formatPoints(item.score)

  protected async showMore(): Promise<void> {
    // The period or the country can change while this loads: its items must not join the new board.
    const first = this.page()
    const next = Math.floor(this.items().length / first.items.length) + 1
    this.loading.set(true)
    this.failed.set(false)
    try {
      const page = await this.fetchPage({ period: first.period, country: first.country, page: next })
      if (first === this.page()) {
        this.more.update(items => [...items, ...page.items])
        this.memory.set(first, this.more())
      }
    }
    catch {
      if (first === this.page()) this.failed.set(true)
    }
    finally {
      this.loading.set(false)
    }
  }
}
