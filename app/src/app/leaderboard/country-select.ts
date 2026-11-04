// Ported from nuxt.com `app/components/nuxters/NuxtersCountrySelect.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { Component, computed, input, output } from '@angular/core'
import { countryName, type CountryStats } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideCheck, lucideChevronDown, lucideEarth, lucideSearch } from '@ng-icons/lucide'
import {
  BrnCombobox,
  BrnComboboxAnchor,
  BrnComboboxContent,
  BrnComboboxEmpty,
  BrnComboboxInput,
  BrnComboboxItem,
  BrnComboboxList,
  BrnComboboxPopoverTrigger,
} from '@spartan-ng/brain/combobox'
import { BrnPopover, BrnPopoverContent, provideBrnPopoverConfig } from '@spartan-ng/brain/popover'
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group'
import { flagUrl, formatNumber, matchesName } from './format'

const ALL = 'all'
const TRIGGER = 'border-input dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full items-center justify-between gap-1.5 rounded-md border bg-transparent py-2 ps-2.5 pe-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 sm:w-52 [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0'
const CONTENT = 'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ring-foreground/10 group/country flex max-h-80 w-(--brn-combobox-width) min-w-52 flex-col overflow-hidden rounded-md shadow-md ring-1 duration-100'
const ITEM = 'data-highlighted:bg-accent data-highlighted:text-accent-foreground data-highlighted:**:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none data-hidden:hidden [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0'

/** Everyone, or one country, searchable by name. Countries come from the GitHub profiles; hidden until there are some. */
@Component({
  selector: 'app-country-select',
  imports: [
    BrnCombobox,
    BrnComboboxAnchor,
    BrnComboboxContent,
    BrnComboboxEmpty,
    BrnComboboxInput,
    BrnComboboxItem,
    BrnComboboxList,
    BrnComboboxPopoverTrigger,
    BrnPopover,
    BrnPopoverContent,
    HlmInputGroupImports,
    NgIcon,
  ],
  providers: [
    provideIcons({ lucideCheck, lucideChevronDown, lucideEarth, lucideSearch }),
    provideBrnPopoverConfig({ align: 'start', sideOffset: 6 }),
  ],
  template: `
    @if (items().length) {
      <div brnCombobox brnPopover #combobox="brnCombobox" class="block w-full sm:w-52" [value]="value() ?? ALL" (valueChange)="pick($event)" [itemToString]="label" [filter]="matches" autoHighlight>
        <button
          type="button"
          brnComboboxAnchor
          brnComboboxPopoverTrigger
          role="combobox"
          aria-label="Filter by country"
          aria-haspopup="dialog"
          [attr.aria-expanded]="combobox.isExpanded()"
          (keydown.arrowdown)="$event.preventDefault(); combobox.open()"
          (keydown.arrowup)="$event.preventDefault(); combobox.open()"
          [class]="trigger"
        >
          @if (value(); as code) {
            <img [src]="flag(code)" alt="" width="20" height="20" class="size-5 shrink-0" />
          } @else {
            <ng-icon name="lucideEarth" class="shrink-0 text-muted-foreground" aria-hidden="true" />
          }
          <span class="flex-1 truncate text-start">{{ label(value()) }}</span>
          <ng-icon name="lucideChevronDown" class="text-muted-foreground text-[length:--spacing(4)]" aria-hidden="true" />
        </button>
        <div *brnPopoverContent brnComboboxContent [class]="content">
          <div hlmInputGroup class="m-1 w-auto shrink-0">
            <input brnComboboxInput hlmInputGroupInput aria-label="Search a country" placeholder="Search a country" />
            <hlm-input-group-addon><ng-icon name="lucideSearch" aria-hidden="true" /></hlm-input-group-addon>
          </div>
          <p brnComboboxEmpty class="hidden py-2 text-center text-sm text-muted-foreground group-data-empty/country:block">No country found</p>
          <div brnComboboxList aria-label="Countries" class="no-scrollbar min-h-0 flex-1 scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:hidden">
            <div brnComboboxItem [value]="ALL" [class]="item">
              <ng-icon name="lucideEarth" class="text-muted-foreground" aria-hidden="true" />
              <span class="flex-1">All countries</span>
              @if (!value()) { <ng-icon name="lucideCheck" class="absolute end-2 text-[length:--spacing(4)]" aria-hidden="true" /> }
            </div>
            @for (entry of items(); track entry.code) {
              <div brnComboboxItem [value]="entry.code" [class]="item">
                <img [src]="flag(entry.code)" alt="" width="20" height="20" loading="lazy" class="size-5 shrink-0" />
                <span class="flex-1 truncate">{{ entry.name }}</span>
                <span class="text-xs text-muted-foreground tabular-nums">{{ entry.count }}</span>
                @if (value() === entry.code) { <ng-icon name="lucideCheck" class="absolute end-2 text-[length:--spacing(4)]" aria-hidden="true" /> }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class CountrySelect {
  readonly countries = input.required<CountryStats[]>()
  readonly value = input<string | null>(null)
  readonly valueChange = output<string | null>()

  protected readonly ALL = ALL
  protected readonly trigger = TRIGGER
  protected readonly content = CONTENT
  protected readonly item = ITEM
  protected readonly flag = flagUrl
  protected readonly items = computed(() => {
    // A country picked in another period keeps showing, with nobody in this one.
    const value = this.value()
    const countries = value && !this.countries().some(item => item.code === value)
      ? [{ code: value, count: 0, top: [] }, ...this.countries()]
      : this.countries()
    return countries.map(item => ({ code: item.code, name: countryName(item.code), count: formatNumber(item.count) }))
  })
  protected readonly label = (code: string | null) => (code && code !== ALL ? countryName(code) : 'All countries')

  protected readonly matches = (code: string, search: string) => matchesName(this.label(code), search)

  protected pick(value: unknown): void {
    const code = typeof value === 'string' && value !== ALL ? value : null
    if (code !== this.value()) this.valueChange.emit(code)
  }
}
