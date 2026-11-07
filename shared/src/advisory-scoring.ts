import type { AdvisoryRole, AdvisoryRoleCounts } from './types.ts'

export const ADVISORY_ROLE_POINTS: Readonly<Record<AdvisoryRole, number>> = {
  finder: 20, reporter: 20, analyst: 20, coordinator: 1, remediation_developer: 30,
  remediation_reviewer: 10, remediation_verifier: 1, tool: 1, sponsor: 1, other: 1,
}
const ROLE_LABELS: Readonly<Record<AdvisoryRole, string>> = {
  finder: 'Finder', reporter: 'Reporter', analyst: 'Analyst', coordinator: 'Coordinator',
  remediation_developer: 'Remediation developer', remediation_reviewer: 'Remediation reviewer',
  remediation_verifier: 'Remediation verifier', tool: 'Tool', sponsor: 'Sponsor', other: 'Other',
}
const ROLES = Object.keys(ADVISORY_ROLE_POINTS) as AdvisoryRole[]

interface AdvisoryStats {
  advisories: number
  advisoryRoles?: AdvisoryRoleCounts
}
export interface AdvisoryRoleBreakdown {
  role: AdvisoryRole
  label: string
  points: number
  amount: number
  total: number
}

/** Earlier snapshots count only finder/reporter credits, at 20 points each. */
function rolesOf(stats: AdvisoryStats): AdvisoryRoleCounts {
  return stats.advisoryRoles ?? (stats.advisories ? { reporter: stats.advisories } : {})
}

export function advisoryBreakdown(stats: AdvisoryStats): AdvisoryRoleBreakdown[] {
  const counts = rolesOf(stats)
  return ROLES.flatMap((role) => {
    const amount = counts[role] ?? 0
    const points = ADVISORY_ROLE_POINTS[role]
    return amount ? [{ role, label: ROLE_LABELS[role], points, amount, total: amount * points }] : []
  })
}

export function advisoryPoints(stats: AdvisoryStats): number {
  if (!stats.advisoryRoles) return stats.advisories * 20
  return advisoryBreakdown(stats).reduce((total, role) => total + role.total, 0)
}

/** Older aggregate credits can merge with role counts without losing points. */
export function addAdvisoryCounts(target: AdvisoryStats, source: AdvisoryStats): void {
  if (!target.advisoryRoles && !source.advisoryRoles) {
    target.advisories += source.advisories
    return
  }
  const combined = { ...rolesOf(target) }
  const incoming = rolesOf(source)
  for (const role of ROLES) {
    const amount = incoming[role] ?? 0
    if (amount) combined[role] = (combined[role] ?? 0) + amount
  }
  target.advisoryRoles = combined
  target.advisories = Object.values(combined).reduce((sum, amount) => sum + amount, 0)
}
