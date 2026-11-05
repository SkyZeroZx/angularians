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

/** The fallback for browsers without srcset: the cells are drawn at 124px at most. */
const AVATAR_SIZE = 56
/** Gold, silver and bronze for the top three of a period. */
export const PODIUM: Record<number, { icon: string, ring: string, badge: string, text: string } | undefined> = {
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
  templateUrl: './leaderboard-grid.html',
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
  /** Both belong to one board: a failure or a request of the last one must not show on the next. */
  protected readonly loading = linkedSignal({ source: () => this.page(), computation: () => false })
  protected readonly failed = linkedSignal({ source: () => this.page(), computation: () => false })
  protected readonly items = computed(() => [...this.page().items, ...this.more()])
  protected readonly query = computed(() => profileQuery(this.page().period, this.page().country))
  protected readonly listLabel = computed(() => `Contributors, ranked: ${formatNumber(this.items().length)} of ${formatNumber(this.page().total)} shown`)
  protected readonly AVATAR_SIZE = AVATAR_SIZE
  protected readonly avatar = (item: ContributorSummary) => avatarUrl(item.githubId, AVATAR_SIZE)
  protected readonly avatars = (item: ContributorSummary) => avatarSrcset(item.githubId)
  protected readonly listAvatar = (item: ContributorSummary) => avatarUrl(item.githubId, 40)
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
      if (first === this.page()) this.loading.set(false)
    }
  }
}
