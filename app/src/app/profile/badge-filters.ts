import type { BadgeFilter } from '@angularians/shared'
import { badgeKey, NUMBER_ONE_KEY } from './card-badges'
import type { EarnedBadge } from './earned-badges'
import { PROJECT_BADGES } from './project-badges'

export const BADGE_FILTER_GROUPS = ['Recognitions', 'Translations', 'Projects', 'Community'] as const
export type BadgeFilterGroup = (typeof BADGE_FILTER_GROUPS)[number]

export interface BadgeIndex {
  holders: Map<string, Set<number>>
  filters: Array<Omit<BadgeFilter, 'count'>>
}

const COMMUNITY_ROLE = /founder|organizer/

function filterGroup(badge: EarnedBadge): BadgeFilterGroup {
  if (badge.tone.startsWith('lang-')) return 'Translations'
  const project = PROJECT_BADGES.find(candidate => candidate.badge === badge.label)
  if (!project) return 'Recognitions'
  return project.people.some(person => COMMUNITY_ROLE.test(person.role)) ? 'Community' : 'Projects'
}

/** Who holds each badge, and the filters to offer: every badge someone holds, by label. */
export function indexBadges(people: Iterable<{ githubId: number, badges: readonly EarnedBadge[] }>): BadgeIndex {
  const holders = new Map<string, Set<number>>()
  const found = new Map<string, Omit<BadgeFilter, 'count'>>()
  for (const { githubId, badges } of people) {
    for (const badge of badges) {
      const key = badgeKey(badge.label)
      if (!found.has(key)) found.set(key, { key, label: key === NUMBER_ONE_KEY ? '#1 of a year' : badge.label, ...(badge.officialLabel ? { official: badge.officialLabel } : {}), group: filterGroup(badge), icon: badge.icon, tone: badge.tone, ...(badge.logo ? { logo: badge.logo } : {}) })
      holders.set(key, (holders.get(key) ?? new Set()).add(githubId))
    }
  }
  return { holders, filters: [...found.values()].sort((a, b) => a.label.localeCompare(b.label)) }
}
