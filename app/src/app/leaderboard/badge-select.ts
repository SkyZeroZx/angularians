import { Component, computed, ElementRef, input, output, viewChild } from '@angular/core'
import type { BadgeFilter, BadgeMatch } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixArrowDownSLine, remixAwardLine, remixCheckLine, remixCloseLine, remixSearchLine } from '@ng-icons/remixicon'
import { BrnComboboxGroup, BrnComboboxInput, BrnComboboxLabel, BrnComboboxMultiple } from '@spartan-ng/brain/combobox'
import { BrnPopover, BrnPopoverContent, provideBrnPopoverConfig } from '@spartan-ng/brain/popover'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmComboboxContent, HlmComboboxEmpty, HlmComboboxItem, HlmComboboxList, HlmComboboxTrigger } from '@spartan-ng/helm/combobox'
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group'
import { matchesName } from '../contributors/country-match'
import { AngularLogo } from '../layout/angular-logo'
import { BrandText } from '../layout/brand-text'
import { BADGE_FILTER_GROUPS } from '../profile/badge-filters'
import { BADGE_ICONS } from '../profile/earned-badges'
import { formatNumber } from '../text/number-format'

const MATCH_CHOICES: ReadonlyArray<{ value: BadgeMatch, label: string, name: string }> = [{ value: 'any', label: '||', name: 'Has any of these badges' }, { value: 'all', label: '&&', name: 'Has all of these badges' }]

@Component({
  selector: 'app-badge-select',
  imports: [AngularLogo, BrandText, BrnComboboxGroup, BrnComboboxInput, BrnComboboxLabel, BrnComboboxMultiple, BrnPopover, BrnPopoverContent, HlmButton, HlmComboboxContent, HlmComboboxEmpty, HlmComboboxItem, HlmComboboxList, HlmComboboxTrigger, HlmInputGroupImports, NgIcon],
  providers: [
    provideIcons({ ...BADGE_ICONS, remixArrowDownSLine, remixAwardLine, remixCheckLine, remixCloseLine, remixSearchLine }),
    provideBrnPopoverConfig({ align: 'start', sideOffset: 6 }),
  ],
  templateUrl: './badge-select.html',
})
export class BadgeSelect {
  readonly filters = input.required<readonly BadgeFilter[]>()
  readonly value = input<string[]>([])
  readonly valueChange = output<string[]>()
  readonly match = input<BadgeMatch>('any')
  readonly matchChange = output<BadgeMatch>()

  private readonly combobox = viewChild(BrnComboboxMultiple)
  private readonly trigger = viewChild('trigger', { read: ElementRef })

  protected readonly groups = computed(() => BADGE_FILTER_GROUPS
    .map(name => ({ name, filters: this.filters().filter(filter => filter.group === name && (filter.count || this.value().includes(filter.key))) }))
    .filter(group => group.filters.length))
  protected readonly label = (key: string) => this.filter(key)?.label ?? key
  protected readonly matches = (key: string, search: string) => {
    const filter = this.filter(key)
    return !!filter && (matchesName(filter.label, search) || (!!filter.official && matchesName(filter.official, search)))
  }
  protected readonly summary = computed(() => {
    const picked = this.value()
    if (!picked.length) return 'All badges'
    return picked.length === 1 ? this.label(picked[0]!) : `${picked.length} badges`
  })
  protected readonly number = formatNumber
  /** Any or all only means something with two badges or more. */
  protected readonly canMatch = computed(() => this.value().length > 1)
  protected readonly matchChoices = computed(() => MATCH_CHOICES.map(choice => ({ ...choice, active: choice.value === this.match() })))

  protected pickBadges(keys: readonly string[] | null | undefined): void {
    const picked = [...(keys ?? [])].sort()
    if (picked.join() !== [...this.value()].sort().join()) this.valueChange.emit(picked)
  }

  protected groupMatches(filters: readonly BadgeFilter[], search: string): boolean {
    return filters.some(filter => this.matches(filter.key, search))
  }

  protected pickMatch(match: BadgeMatch): void {
    if (match !== this.match()) this.matchChange.emit(match)
  }

  protected clear(): void {
    this.valueChange.emit([])
    this.trigger()?.nativeElement.focus()
  }

  protected openList(event: Event): void {
    event.preventDefault()
    this.combobox()?.open()
  }

  private filter(key: string): BadgeFilter | undefined {
    return this.filters().find(filter => filter.key === key)
  }
}
