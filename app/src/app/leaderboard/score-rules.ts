import { Component } from '@angular/core'
import { ACTIVITY_POINTS, PULL_REQUEST_POINTS } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { octComment, octIssueOpened, octSmiley } from '@ng-icons/octicons'
import { remixChatHeartLine, remixFileCodeLine, remixLightbulbLine } from '@ng-icons/remixicon'
import { vikingAnvil, vikingBroom, vikingHammer, vikingScroll, vikingSword } from '../layout/viking-icons'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'

/** GitHub's colours, one for each kind of contribution. */
const PURPLE = 'text-[#8250DF] dark:text-[#A371F7]'
const RED = 'text-[#CF222E] dark:text-[#F85149]'
const BLUE = 'text-[#0969DA] dark:text-[#58A6FF]'
const GOLD = 'text-[#9A6700] dark:text-[#D29922]'
const GREEN = 'text-[#1A7F37] dark:text-[#3FB950]'
const PINK = 'text-[#BF3989] dark:text-[#DB61A2]'
const ORANGE = 'text-[#BC4C00] dark:text-[#F0883E]'

/** The hero's "How the score works": every rule, in a dialog (Nuxters keeps the page itself for people). */
@Component({
  selector: 'app-score-rules',
  imports: [HlmButton, HlmDialogImports, NgIcon],
  providers: [provideIcons({ octComment, octIssueOpened, octSmiley, remixChatHeartLine, remixFileCodeLine, remixLightbulbLine, vikingAnvil, vikingBroom, vikingHammer, vikingScroll, vikingSword })],
  host: { class: 'contents' },
  template: `
    <hlm-dialog>
      <button hlmDialogTrigger hlmBtn type="button"><ng-icon name="vikingHammer" size="1.5rem" aria-hidden="true" /> How the score works</button>
      <hlm-dialog-content *hlmDialogPortal class="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <hlm-dialog-header>
          <h2 hlmDialogTitle class="text-xl">How the score works</h2>
          <p hlmDialogDescription>Every contribution counts for its author, on the day it was made, in these repositories:</p>
          <ul class="flex flex-wrap gap-1.5" aria-label="Repositories">
            @for (repo of repos; track repo) {
              <li><a [href]="'https://github.com/' + repo" target="_blank" rel="noopener" class="block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">{{ repo }}</a></li>
            }
          </ul>
        </hlm-dialog-header>

        <!-- Grouped: the dialog spaces each of its children apart -->
        <section>
          <h3 class="font-semibold">Merged pull requests</h3>
          <p class="text-sm text-muted-foreground">The type comes from the title: feat, fix, docs and so on.</p>
          <ul class="mt-3 grid grid-cols-2 gap-2">
            @for (type of types; track type.title) {
              <li class="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 ring-1 ring-border">
                <div class="flex items-center justify-between gap-2">
                  <ng-icon [name]="type.icon" [class]="'shrink-0 ' + type.color" size="28" aria-hidden="true" />
                  <p class="flex items-baseline gap-1 tabular-nums"><span class="text-2xl font-semibold">{{ type.points }}</span><span class="text-xs text-muted-foreground">pts</span></p>
                </div>
                <div>
                  <p class="font-medium">{{ type.title }}</p>
                  <p class="text-sm text-muted-foreground">{{ type.description }}</p>
                </div>
              </li>
            }
          </ul>
        </section>

        <section>
          <h3 class="font-semibold">Everything else counts too</h3>
          <ul class="mt-3 grid grid-cols-2 gap-2">
            @for (rule of rules; track rule.what) {
              <li class="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 ring-1 ring-border">
                <div class="flex items-center justify-between gap-2">
                  <ng-icon [name]="rule.icon" [class]="'shrink-0 ' + rule.color" size="24" aria-hidden="true" />
                  <p class="flex items-baseline gap-1 tabular-nums"><span class="text-2xl font-semibold">{{ rule.value }}</span><span class="text-xs text-muted-foreground">{{ rule.unit }}</span></p>
                </div>
                <div>
                  <p class="font-medium">{{ rule.what }}</p>
                  <p class="text-sm text-muted-foreground">{{ rule.when }}</p>
                </div>
              </li>
            }
          </ul>
        </section>

        <details class="group rounded-lg bg-muted/40 p-3 text-sm ring-1 ring-border">
          <summary class="cursor-pointer font-medium">Why do some merged PRs show as closed on GitHub?</summary>
          <p class="mt-2 text-muted-foreground">
            Most PRs from 2017 to 2025 show as closed, not merged: Angular's merge tooling pushes the commits itself and adds
            <code class="rounded bg-muted px-1 py-0.5 text-xs">PR Close #N</code> to them. Those count as merged too. Bots are left out.
            The weights are the ones of Nuxters, plus review comments.
          </p>
        </details>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class ScoreRules {
  protected readonly repos = ['angular/angular', 'angular/components', 'angular/angular-cli', 'angular/dev-infra']
  protected readonly types = [
    { title: 'Features', description: 'New APIs, capabilities and speed.', icon: 'vikingSword', color: PURPLE, points: PULL_REQUEST_POINTS.feat },
    { title: 'Fixes', description: 'Bugs found and fixed.', icon: 'vikingAnvil', color: RED, points: PULL_REQUEST_POINTS.fix },
    { title: 'Docs', description: 'Guides, API docs and examples.', icon: 'vikingScroll', color: BLUE, points: PULL_REQUEST_POINTS.docs },
    { title: 'Chores', description: 'Refactors, tests, builds, CI and releases.', icon: 'vikingBroom', color: GOLD, points: PULL_REQUEST_POINTS.chore },
  ]
  protected readonly rules = [
    { what: 'Issue', when: 'Every issue you open.', value: `${ACTIVITY_POINTS.issues}`, unit: 'pt', icon: 'octIssueOpened', color: GREEN },
    { what: 'Helpful issue', when: 'On top, when completed or with 3+ reactions or 5+ comments.', value: `+${ACTIVITY_POINTS.helpfulIssues}`, unit: 'pts', icon: 'remixLightbulbLine', color: GOLD },
    { what: 'Comment', when: 'Every comment on an issue or a pull request.', value: `${ACTIVITY_POINTS.comments}`, unit: 'pt', icon: 'octComment', color: BLUE },
    { what: 'Helpful comment', when: 'On top, with 3+ reactions.', value: `+${ACTIVITY_POINTS.helpfulComments}`, unit: 'pts', icon: 'remixChatHeartLine', color: PINK },
    { what: 'Review comment', when: 'Every comment on the code of a pull request.', value: `${ACTIVITY_POINTS.reviewComments}`, unit: 'pt', icon: 'remixFileCodeLine', color: PURPLE },
    { what: 'Reaction', when: 'Received on your issues, pull requests and comments.', value: `${ACTIVITY_POINTS.reactions}`, unit: 'pt', icon: 'octSmiley', color: ORANGE },
  ]
}
