import type { Contributor, Period, ProfileRecord } from '@angularians/shared'

/** What `scripts/bundle-data.ts` writes to `bundle.generated.json`: the validated `data/` files, in one module. */
export interface DataBundle {
  meta: { collectedAt: string | null, partial: boolean, repos: string[] } | null
  /** Ranked contributors of each period that has a file. */
  periods: Record<Period, Contributor[]>
  profiles: ProfileRecord[]
}
