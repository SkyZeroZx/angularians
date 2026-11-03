// Ported from nuxt.com `app/components/nuxters/NuxtersCountrySelect.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import { countryName, type CountryStats } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideEarth } from '@ng-icons/lucide'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { flagUrl, formatNumber } from './format'

const ALL = ''

/** Everyone, or one country. Countries come from the GitHub profiles; hidden until there are some. */
@Component({
  selector: 'app-country-select',
  imports: [HlmSelectImports, NgIcon],
  providers: [provideIcons({ lucideEarth })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length) {
      <hlm-select [value]="value() ?? ALL" (valueChange)="pick($event)" [itemToString]="label">
        <hlm-select-trigger class="w-full sm:w-52" buttonAriaLabel="Filter by country">
          @if (value(); as code) {
            <img [src]="flag(code)" alt="" width="20" height="20" class="size-5 shrink-0" />
          } @else {
            <ng-icon name="lucideEarth" class="shrink-0 text-muted-foreground" aria-hidden="true" />
          }
          <hlm-select-value placeholder="All countries" />
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal class="max-h-80">
          <hlm-select-item [value]="ALL">
            <ng-icon name="lucideEarth" class="text-muted-foreground" aria-hidden="true" />
            <span class="flex-1">All countries</span>
          </hlm-select-item>
          @for (item of items(); track item.code) {
            <hlm-select-item [value]="item.code">
              <img [src]="flag(item.code)" alt="" width="20" height="20" loading="lazy" class="size-5 shrink-0" />
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
  protected readonly flag = flagUrl
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
