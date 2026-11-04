// Ported from nuxt.com `app/components/nuxters/NuxtersPeriodTabs.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core'
import type { Period } from '@angularians/shared'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { HlmTabsImports } from '@spartan-ng/helm/tabs'

const TAB_LABELS: Record<string, string> = { '30d': '30 days', '12m': '12 months', 'all': 'All time' }
const YEAR = 'year'
const RANK = new Intl.NumberFormat('en-US')

/** 30 days, 12 months and all time as tabs; the years in a picker next to them. */
@Component({
  selector: 'app-period-tabs',
  imports: [HlmSelectImports, HlmTabsImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // One pill: the tabs, then the year picker inside it (Nuxters).
  host: { class: 'inline-flex max-w-full items-center rounded-lg bg-muted p-[3px]' },
  template: `
    @if (tabs().length) {
      <hlm-tabs [tab]="activeTab()" (tabActivated)="pickTab($event)">
        <hlm-tabs-list [attr.aria-label]="label()" class="bg-transparent p-0">
          @for (tab of tabs(); track tab.value) {
            <button [hlmTabsTrigger]="tab.value" type="button">
              {{ tab.label }}
              <!-- No room on small screens: pages show the rank of the period on screen elsewhere -->
              @if (rankOf(tab.value); as rank) {
                <span class="hidden text-muted-foreground tabular-nums sm:inline">{{ rank }}</span>
              }
            </button>
          }
        </hlm-tabs-list>
      </hlm-tabs>
    }
    @if (years().length) {
      <hlm-select [value]="year()" (valueChange)="pickYear($event)" [itemToString]="yearLabel">
        <hlm-select-trigger
          [class]="'h-[calc(100%-1px)] border-transparent bg-transparent shadow-none hover:text-foreground dark:bg-transparent '
            + (year() ? 'bg-background text-foreground shadow-sm dark:bg-input/30' : 'text-foreground/60 dark:text-muted-foreground')"
          size="sm"
          buttonAriaLabel="Year"
        >
          <hlm-select-value placeholder="Year" />
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal>
          @for (value of years(); track value) {
            <hlm-select-item [value]="value">
              <span class="flex-1">{{ value }}</span>
              @if (rankOf(value); as rank) {
                <span class="text-xs text-muted-foreground tabular-nums">{{ rank }}</span>
              }
            </hlm-select-item>
          }
        </hlm-select-content>
      </hlm-select>
    }
  `,
})
export class PeriodTabs {
  /** The period on screen. */
  readonly period = input.required<Period>()
  /** The periods with data, in display order. */
  readonly periods = input.required<Period[]>()
  /** The contributor's rank in each period, shown next to it (a profile). `null`: no ranks (the leaderboard). */
  readonly ranks = input<Partial<Record<Period, number>> | null>(null)
  /** The accessible name of the tab list. */
  readonly label = input('Leaderboard period')
  readonly periodChange = output<Period>()

  /** Follows a click right away: `period` only changes once the new board has loaded. */
  protected readonly selected = linkedSignal(() => this.period())
  protected readonly tabs = computed(() => ['30d', '12m', 'all']
    .filter(value => this.periods().includes(value))
    .map(value => ({ value, label: TAB_LABELS[value]! })))
  protected readonly years = computed(() => this.periods().filter(value => /^\d{4}$/.test(value)))
  protected readonly year = computed(() => (this.years().includes(this.selected()) ? this.selected() : null))
  /** A year matches no tab: none is active. */
  protected readonly activeTab = computed(() => (this.year() ? YEAR : this.selected()))
  /** `#12`, or `null` without a rank for that period. */
  protected readonly rankOf = (period: Period): string | null => {
    const rank = this.ranks()?.[period]
    return rank ? `#${RANK.format(rank)}` : null
  }
  /** The year on the closed picker, with its rank when there is one: "2019 #2". */
  protected readonly yearLabel = (value: string | null) => (value ? [value, this.rankOf(value)].filter(Boolean).join(' ') : '')

  protected pickTab(value: string): void {
    if (value === YEAR || value === this.selected()) return
    this.select(value)
  }

  protected pickYear(value: unknown): void {
    if (typeof value === 'string' && value !== this.selected()) this.select(value)
  }

  private select(value: Period): void {
    this.selected.set(value)
    this.periodChange.emit(value)
  }
}
