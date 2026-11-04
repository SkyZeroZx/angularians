// Ported from nuxt.com `app/components/nuxters/NuxtersScoreBreakdown.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs):
// the (i) button by a score, and the breakdown in a modal.
import { Component, input } from '@angular/core'
import type { ScoredStats } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideInfo } from '@ng-icons/lucide'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { formatNumber } from '../leaderboard/format'
import { ScoreBreakdown } from './score-breakdown'

@Component({
  selector: 'app-score-dialog',
  imports: [HlmButton, HlmDialogImports, NgIcon, ScoreBreakdown],
  providers: [provideIcons({ lucideInfo })],
  host: { class: 'inline-flex' },
  template: `
    <hlm-dialog>
      <button hlmDialogTrigger hlmBtn variant="ghost" size="icon-xs" type="button" aria-label="Show score breakdown" class="text-muted-foreground">
        <ng-icon name="lucideInfo" aria-hidden="true" />
      </button>
      <hlm-dialog-content *hlmDialogPortal class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>How is the score calculated?</h2>
          <p hlmDialogDescription>Each contribution type has a weight. Merged PRs weigh the most.</p>
        </hlm-dialog-header>
        <div class="my-2 flex flex-col items-center gap-1 rounded-md bg-muted/60 py-4">
          <span class="text-4xl font-bold tabular-nums">{{ number(stats().score) }}</span>
          <span class="text-sm text-muted-foreground">total points {{ phrase() }}</span>
        </div>
        <app-score-breakdown [stats]="stats()" />
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class ScoreDialog {
  readonly stats = input.required<ScoredStats & { score: number }>()
  /** "of all time", "in 2025". */
  readonly phrase = input('of all time')
  protected readonly number = formatNumber
}
