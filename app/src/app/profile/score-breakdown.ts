// Ported from nuxt.com `app/components/nuxters/NuxtersScoreBreakdown.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
// Inline instead of a modal, and no core bonus.
import { Component, computed, input } from '@angular/core'
import { scoreBreakdown, type ScoredStats } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import {
  lucideBookOpen, lucideBrushCleaning, lucideCircleDot, lucideFileCode, lucideLightbulb, lucideMessageCircle, lucideMessageCircleHeart,
  lucideRocket, lucideSmilePlus, lucideWrench,
} from '@ng-icons/lucide'
import { HlmProgressImports } from '@spartan-ng/helm/progress'
import { formatNumber, formatPoints } from '../leaderboard/format'

/** `scoreBreakdown` names Lucide icons in kebab case: their `@ng-icons/lucide` names. */
const ICONS: Record<string, string> = {
  'rocket': 'lucideRocket',
  'wrench': 'lucideWrench',
  'book-open': 'lucideBookOpen',
  'brush-cleaning': 'lucideBrushCleaning',
  'lightbulb': 'lucideLightbulb',
  'message-circle-heart': 'lucideMessageCircleHeart',
  'circle-dot': 'lucideCircleDot',
  'file-code': 'lucideFileCode',
  'message-circle': 'lucideMessageCircle',
  'smile-plus': 'lucideSmilePlus',
}

/** One row per contribution type: count × points = total, with a bar on one scale so the rows compare. */
@Component({
  selector: 'app-score-breakdown',
  imports: [HlmProgressImports, NgIcon],
  providers: [provideIcons({
    lucideBookOpen, lucideBrushCleaning, lucideCircleDot, lucideFileCode, lucideLightbulb, lucideMessageCircle, lucideMessageCircleHeart,
    lucideRocket, lucideSmilePlus, lucideWrench,
  })],
  template: `
    <ul class="flex flex-col gap-4">
      @for (row of rows(); track row.key) {
        <li class="flex flex-col gap-1.5" [class.opacity-50]="!row.amount">
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
  readonly stats = input.required<ScoredStats>()

  protected readonly rows = computed(() => scoreBreakdown(this.stats()))
  protected readonly max = computed(() => Math.max(1, ...this.rows().map(row => row.total)))
  protected readonly icon = (name: string) => ICONS[name] ?? 'lucideRocket'
  protected readonly number = formatNumber
  protected readonly points = formatPoints
}
