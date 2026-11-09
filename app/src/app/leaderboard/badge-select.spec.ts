import { TestBed } from '@angular/core/testing'
import type { BadgeFilter } from '@angularians/shared'
import { BadgeSelect } from './badge-select'

const filter = (key: string, count: number): BadgeFilter => ({ key, label: key, group: 'Recognitions', icon: 'logo', tone: 'team', count })

describe('BadgeSelect', () => {
  const groups = (value: string[]) => {
    const fixture = TestBed.createComponent(BadgeSelect)
    fixture.componentRef.setInput('filters', [filter('held', 2), filter('empty', 0), filter('picked', 0)])
    fixture.componentRef.setInput('value', value)
    return (fixture.componentInstance as unknown as { groups(): Array<{ filters: BadgeFilter[] }> }).groups()
  }

  it('leaves out a badge nobody in the period holds', () => {
    expect(groups([])[0]!.filters.map(item => item.key)).toEqual(['held'])
  })

  it('finds a badge by its name or the project behind it, ignoring case and accents', () => {
    const fixture = TestBed.createComponent(BadgeSelect)
    fixture.componentRef.setInput('filters', [{ ...filter('analog', 1), label: 'Analog alchemist', official: 'AnalogJS creator' }, { ...filter('tr', 1), label: 'Türkçe translator' }])
    const matches = (fixture.componentInstance as unknown as { matches(key: string, search: string): boolean }).matches
    expect(matches('analog', 'ALCHEM')).toBe(true)
    expect(matches('analog', 'analogjs')).toBe(true)
    expect(matches('tr', 'turkce')).toBe(true)
    expect(matches('analog', 'spartan')).toBe(false)
  })

  it('knows when a search leaves a group empty', () => {
    const fixture = TestBed.createComponent(BadgeSelect)
    const items = [filter('held', 2)]
    fixture.componentRef.setInput('filters', items)
    const select = fixture.componentInstance as unknown as { groupMatches(filters: BadgeFilter[], search: string): boolean }
    expect(select.groupMatches(items, '')).toBe(true)
    expect(select.groupMatches(items, 'he')).toBe(true)
    expect(select.groupMatches(items, 'zzz')).toBe(false)
  })

  describe('picking', () => {
    const select = (value: string[]) => {
      const fixture = TestBed.createComponent(BadgeSelect)
      fixture.componentRef.setInput('filters', [{ ...filter('gde', 2), label: 'Angular GDE' }, filter('star', 1)])
      fixture.componentRef.setInput('value', value)
      const emitted: string[][] = []
      const matched: string[] = []
      fixture.componentInstance.valueChange.subscribe(keys => emitted.push(keys))
      fixture.componentInstance.matchChange.subscribe(match => matched.push(match))
      return { emitted, matched, parts: fixture.componentInstance as unknown as { summary(): string, canMatch(): boolean, pickBadges(keys: string[]): void, pickMatch(match: 'any' | 'all'): void, clear(): void } }
    }

    it('sums up what is picked', () => {
      expect(select([]).parts.summary()).toBe('All badges')
      expect(select(['gde']).parts.summary()).toBe('Angular GDE')
      expect(select(['gde', 'star']).parts.summary()).toBe('2 badges')
    })

    it('offers any or all only with two badges or more', () => {
      expect(select(['gde']).parts.canMatch()).toBe(false)
      expect(select(['gde', 'star']).parts.canMatch()).toBe(true)
    })

    it('tells only of real changes, sorted', () => {
      const { emitted, parts } = select(['gde'])
      parts.pickBadges(['gde'])
      expect(emitted).toEqual([])
      parts.pickBadges(['star', 'gde'])
      expect(emitted).toEqual([['gde', 'star']])
      parts.clear()
      expect(emitted[1]).toEqual([])
    })

    it('tells of a new match only', () => {
      const { matched, parts } = select(['gde', 'star'])
      parts.pickMatch('any')
      expect(matched).toEqual([])
      parts.pickMatch('all')
      expect(matched).toEqual(['all'])
    })
  })

  it('keeps a picked badge so it can be unticked', () => {
    expect(groups(['picked'])[0]!.filters.map(item => item.key)).toEqual(['held', 'picked'])
  })
})
