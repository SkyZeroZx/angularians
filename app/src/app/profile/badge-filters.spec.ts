import { indexBadges } from './badge-filters'
import type { EarnedBadge } from './earned-badges'

const badge = (label: string, tone: EarnedBadge['tone'], officialLabel?: string): EarnedBadge => ({ label, tone, officialLabel, title: '', icon: 'logo' })

describe('indexBadges', () => {
  const { filters, holders } = indexBadges([
    { githubId: 1, badges: [badge('Reviewer', 'purple'), badge('Türkçe translator', 'lang-tr'), badge('#1 in 2019', 'gold')] },
    { githubId: 2, badges: [badge('Analog alchemist', 'analog', 'AnalogJS creator'), badge('NG Baguette organizer', 'ng-baguette'), badge('#1 in 2020 and 2021', 'gold')] },
  ])
  const group = (label: string) => filters.find(filter => filter.label === label)?.group

  it('sorts each badge under its heading', () => {
    expect(group('Reviewer')).toBe('Recognitions')
    expect(group('Türkçe translator')).toBe('Translations')
    expect(group('Analog alchemist')).toBe('Projects')
    expect(group('NG Baguette organizer')).toBe('Community')
  })

  it('makes one entry of every year someone was first', () => {
    expect(group('#1 of a year')).toBe('Recognitions')
    expect(filters.filter(filter => filter.key === 'number-one')).toHaveLength(1)
    expect([...holders.get('number-one')!]).toEqual([1, 2])
  })

  it('keeps the real name for the search', () => {
    expect(filters.find(filter => filter.label === 'Analog alchemist')?.official).toBe('AnalogJS creator')
  })
})
