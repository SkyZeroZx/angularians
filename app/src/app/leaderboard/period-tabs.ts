// Ported from nuxt.com `app/components/nuxters/NuxtersPeriodTabs.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core'
import type { Period } from '@angularians/shared'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { HlmTabsImports } from '@spartan-ng/helm/tabs'

const TAB_LABELS: Record<string, string> = { '30d': '30 days', '12m': '12 months', 'all': 'All time' }
const YEAR = 'year'

/** 30 days, 12 months and all time as tabs; the years in a picker next to them. */
@Component({
  selector: 'app-period-tabs',
  imports: [HlmSelectImports, HlmTabsImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap items-center gap-2' },
  template: `
    @if (tabs().length) {
      <hlm-tabs [tab]="activeTab()" (tabActivated)="pickTab($event)">
        <hlm-tabs-list aria-label="Leaderboard period">
          @for (tab of tabs(); track tab.value) {
            <button [hlmTabsTrigger]="tab.value" type="button">{{ tab.label }}</button>
          }
        </hlm-tabs-list>
      </hlm-tabs>
    }
    @if (years().length) {
      <hlm-select [value]="year()" (valueChange)="pickYear($event)" [itemToString]="yearLabel">
        <hlm-select-trigger [class]="year() ? 'w-28 border-primary text-foreground' : 'w-28'" buttonAriaLabel="Year">
          <hlm-select-value placeholder="Year" />
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal>
          @for (value of years(); track value) {
            <hlm-select-item [value]="value">{{ value }}</hlm-select-item>
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
  protected readonly yearLabel = (value: string | null) => value ?? ''

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
