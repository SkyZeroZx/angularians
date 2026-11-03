// Ported from nuxt.com `app/components/nuxters/NuxtersScoreBreakdown.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
// Inline instead of a modal; landed PRs only, no core bonus.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { scoreBreakdown, type PullRequestCounts } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideBookOpen, lucideBrushCleaning, lucideRocket, lucideWrench } from '@ng-icons/lucide'
import { HlmProgressImports } from '@spartan-ng/helm/progress'
import { formatNumber, formatPoints } from '../leaderboard/format'

const ICONS: Record<string, string> = { 'rocket': 'lucideRocket', 'wrench': 'lucideWrench', 'book-open': 'lucideBookOpen', 'brush-cleaning': 'lucideBrushCleaning' }

/** One row per PR type: count × points = total, with a bar on one scale so the rows compare. */
@Component({
  selector: 'app-score-breakdown',
  imports: [HlmProgressImports, NgIcon],
  providers: [provideIcons({ lucideBookOpen, lucideBrushCleaning, lucideRocket, lucideWrench })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="flex flex-col gap-4">
      @for (row of rows(); track row.type) {
        <li class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2 text-sm">
            <span class="flex items-center gap-2">
              <ng-icon [name]="icon(row.icon)" class="text-muted-foreground" aria-hidden="true" />
              {{ row.label }}
            </span>
            <span class="text-muted-foreground tabular-nums">
              {{ number(row.amount) }} × {{ row.points }} = <span class="font-medium text-foreground">{{ number(row.total) }}</span>
            </span>
          </div>
          <hlm-progress [value]="row.total" [max]="max()" class="h-1.5" [attr.aria-label]="row.label + ': ' + points(row.total)">
            <hlm-progress-indicator />
          </hlm-progress>
        </li>
      }
    </ul>
  `,
})
export class ScoreBreakdown {
  readonly pullRequests = input.required<PullRequestCounts>()

  protected readonly rows = computed(() => scoreBreakdown(this.pullRequests()))
  protected readonly max = computed(() => Math.max(1, ...this.rows().map(row => row.total)))
  protected readonly icon = (name: string) => ICONS[name] ?? 'lucideRocket'
  protected readonly number = formatNumber
  protected readonly points = formatPoints
}
