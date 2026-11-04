// Ported from nuxt.com `app/components/nuxters/NuxtersScoreBreakdown.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
// Inline instead of a modal, and no core bonus.
import { Component, computed, input } from '@angular/core'
import { scoreBreakdown, type ScoredStats } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixBookOpenLine, remixBrushLine, remixChatHeartLine, remixFileCodeLine, remixLightbulbLine, remixRocketLine, remixToolsLine } from '@ng-icons/remixicon'
import { octComment, octIssueOpened, octSmiley } from '@ng-icons/octicons'
import { HlmProgressImports } from '@spartan-ng/helm/progress'
import { formatNumber, formatPoints } from '../leaderboard/format'

/** `scoreBreakdown`'s icon keys, and the icons they show. */
const ICONS: Record<string, string> = {
  'rocket': 'remixRocketLine',
  'wrench': 'remixToolsLine',
  'book-open': 'remixBookOpenLine',
  'brush-cleaning': 'remixBrushLine',
  'lightbulb': 'remixLightbulbLine',
  'message-circle-heart': 'remixChatHeartLine',
  'circle-dot': 'octIssueOpened',
  'file-code': 'remixFileCodeLine',
  'message-circle': 'octComment',
  'smile-plus': 'octSmiley',
}

/** One row per contribution type: count × points = total, with a bar on one scale so the rows compare. */
@Component({
  selector: 'app-score-breakdown',
  imports: [HlmProgressImports, NgIcon],
  providers: [provideIcons({
    remixBookOpenLine, remixBrushLine, octIssueOpened, remixFileCodeLine, remixLightbulbLine, octComment, remixChatHeartLine,
    remixRocketLine, octSmiley, remixToolsLine,
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
  protected readonly icon = (name: string) => ICONS[name] ?? 'remixRocketLine'
  protected readonly number = formatNumber
  protected readonly points = formatPoints
}
