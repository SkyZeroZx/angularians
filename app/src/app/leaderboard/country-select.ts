// Ported from nuxt.com `app/components/nuxters/NuxtersCountrySelect.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import { countryName, type CountryStats } from '@angular-contributors/shared'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { formatNumber } from './format'

const ALL = ''

/** Everyone, or one country. Countries come from the GitHub profiles; hidden until there are some. */
@Component({
  selector: 'app-country-select',
  imports: [HlmSelectImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length) {
      <hlm-select [value]="value() ?? ALL" (valueChange)="pick($event)" [itemToString]="label">
        <hlm-select-trigger class="w-full sm:w-52" buttonAriaLabel="Filter by country">
          <hlm-select-value placeholder="All countries" />
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal class="max-h-80">
          <hlm-select-item [value]="ALL">All countries</hlm-select-item>
          @for (item of items(); track item.code) {
            <hlm-select-item [value]="item.code">
              <span class="flex-1 truncate">{{ item.name }}</span>
              <span class="text-xs text-muted-foreground tabular-nums">{{ item.count }}</span>
            </hlm-select-item>
          }
        </hlm-select-content>
      </hlm-select>
    }
  `,
})
export class CountrySelect {
  readonly countries = input.required<CountryStats[]>()
  readonly value = input<string | null>(null)
  readonly valueChange = output<string | null>()

  protected readonly ALL = ALL
  protected readonly items = computed(() => {
    // A country picked in another period keeps showing, with nobody in this one.
    const value = this.value()
    const countries = value && !this.countries().some(item => item.code === value)
      ? [{ code: value, count: 0, top: [] }, ...this.countries()]
      : this.countries()
    return countries.map(item => ({ code: item.code, name: countryName(item.code), count: formatNumber(item.count) }))
  })
  protected readonly label = (code: string | null) => (code ? countryName(code) : 'All countries')

  protected pick(value: unknown): void {
    const code = typeof value === 'string' && value !== ALL ? value : null
    if (code !== this.value()) this.valueChange.emit(code)
  }
}
