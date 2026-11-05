// Ported from nuxt.com `app/components/nuxters/NuxtersCountrySelect.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { Component, computed, effect, ElementRef, input, output, untracked, viewChild, viewChildren } from '@angular/core'
import { countryName, type CountryStats } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixArrowDownSLine, remixCheckLine, remixCloseLine, remixEarthLine, remixSearchLine } from '@ng-icons/remixicon'
import { BrnCombobox, BrnComboboxItem } from '@spartan-ng/brain/combobox'
import { provideBrnPopoverConfig } from '@spartan-ng/brain/popover'
import { HlmComboboxImports } from '@spartan-ng/helm/combobox'
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group'
import { flagUrl, formatNumber, matchesCountry, matchesName } from './format'

const ALL = 'all'

/** Everyone, or one country, searchable by name. Countries come from the GitHub profiles; hidden until there are some. */
@Component({
  selector: 'app-country-select',
  imports: [HlmComboboxImports, HlmInputGroupImports, NgIcon],
  providers: [
    provideIcons({ remixCheckLine, remixCloseLine, remixArrowDownSLine, remixEarthLine, remixSearchLine }),
    provideBrnPopoverConfig({ align: 'start', sideOffset: 6 }),
  ],
  template: `
    @if (items().length) {
      <div brnCombobox brnPopover #combobox="brnCombobox" class="relative block w-full sm:w-52" [value]="value() ?? ALL" (valueChange)="pick($event)" [itemToString]="label" [filter]="matches" autoHighlight>
        <button
          #trigger
          type="button"
          hlmComboboxTrigger
          role="combobox"
          [attr.aria-label]="ariaLabel()"
          aria-haspopup="dialog"
          [attr.aria-expanded]="combobox.isExpanded()"
          (keydown.arrowdown)="$event.preventDefault(); combobox.open()"
          (keydown.arrowup)="$event.preventDefault(); combobox.open()"
          class="w-full sm:w-52"
        >
          @if (value(); as code) {
            <img [src]="flag(code)" alt="" width="20" height="20" class="size-5 shrink-0" />
          } @else {
            <ng-icon name="remixEarthLine" class="shrink-0 text-muted-foreground" aria-hidden="true" />
          }
          <span class="flex-1 truncate text-start" [class.pe-6]="value()">{{ label(value()) }}</span>
          <ng-icon name="remixArrowDownSLine" class="text-muted-foreground text-[length:--spacing(4)]" aria-hidden="true" />
        </button>
        @if (value()) {
          <button type="button" aria-label="Clear country" class="absolute end-8 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" (click)="clear()">
            <ng-icon name="remixCloseLine" aria-hidden="true" />
          </button>
        }
        <div *brnPopoverContent hlmComboboxContent class="min-w-52">
          <div hlmInputGroup class="m-1 w-auto shrink-0">
            <input brnComboboxInput hlmInputGroupInput aria-label="Search a country" placeholder="Search a country" />
            <hlm-input-group-addon><ng-icon name="remixSearchLine" aria-hidden="true" /></hlm-input-group-addon>
          </div>
          <p hlmComboboxEmpty>No country found</p>
          <div hlmComboboxList aria-label="Countries">
            <div hlmComboboxItem [value]="ALL">
              <ng-icon name="remixEarthLine" class="text-muted-foreground" aria-hidden="true" />
              <span class="flex-1">{{ allLabel() }}</span>
              @if (!value()) { <ng-icon name="remixCheckLine" class="absolute end-2 text-[length:--spacing(4)]" aria-hidden="true" /> }
            </div>
            @for (entry of items(); track entry.code) {
              <div hlmComboboxItem [value]="entry.code">
                <img [src]="flag(entry.code)" alt="" width="20" height="20" loading="lazy" class="size-5 shrink-0" />
                <span class="flex-1 truncate">{{ entry.name }}</span>
                @if (showCounts()) { <span class="text-xs text-muted-foreground tabular-nums">{{ entry.count }}</span> }
                @if (value() === entry.code) { <ng-icon name="remixCheckLine" class="absolute end-2 text-[length:--spacing(4)]" aria-hidden="true" /> }
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
  readonly allLabel = input('All countries')
  readonly ariaLabel = input('Filter by country')
  readonly showCounts = input(true)

  protected readonly ALL = ALL
  protected readonly flag = flagUrl
  protected readonly items = computed(() => {
    // A country picked in another period keeps showing, with nobody in this one.
    const value = this.value()
    const countries = value && !this.countries().some(item => item.code === value)
      ? [{ code: value, count: 0, top: [] }, ...this.countries()]
      : this.countries()
    return countries.map(item => ({ code: item.code, name: countryName(item.code), count: formatNumber(item.count) }))
  })
  protected readonly label = (code: string | null) => (code && code !== ALL ? countryName(code) : this.allLabel())

  protected readonly matches = (code: string, search: string) =>
    code === ALL ? matchesName(this.label(code), search) : matchesCountry(code, search)

  private readonly combobox = viewChild(BrnCombobox)
  private readonly options = viewChildren(BrnComboboxItem)
  private readonly trigger = viewChild('trigger', { read: ElementRef })

  constructor() {
    effect(() => {
      const combobox = this.combobox()
      if (!combobox?.isExpanded() || combobox.search()) return
      const selected = this.value() ?? ALL
      const option = this.options().find(item => item.value() === selected)
      if (option) untracked(() => combobox.keyManager.setActiveItem(option))
    })
  }

  protected clear(): void {
    this.valueChange.emit(null)
    this.trigger()?.nativeElement.focus()
  }

  protected pick(value: unknown): void {
    const code = typeof value === 'string' && value !== ALL ? value : null
    if (code !== this.value()) this.valueChange.emit(code)
  }
}
