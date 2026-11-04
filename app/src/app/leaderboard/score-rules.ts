import { Component } from '@angular/core'
import { ACTIVITY_POINTS, PULL_REQUEST_POINTS } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideBookOpen, lucideBrushCleaning, lucideRocket, lucideTrophy, lucideWrench } from '@ng-icons/lucide'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'

/** The hero's "How the score works": every rule, in a dialog (Nuxters keeps the page itself for people). */
@Component({
  selector: 'app-score-rules',
  imports: [HlmButton, HlmDialogImports, NgIcon],
  providers: [provideIcons({ lucideBookOpen, lucideBrushCleaning, lucideRocket, lucideTrophy, lucideWrench })],
  host: { class: 'contents' },
  template: `
    <hlm-dialog>
      <button hlmDialogTrigger hlmBtn type="button"><ng-icon name="lucideTrophy" aria-hidden="true" /> How the score works</button>
      <hlm-dialog-content *hlmDialogPortal class="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>How the score works</h2>
          <p hlmDialogDescription>
            Every contribution to angular/angular, angular/components, angular/angular-cli and angular/dev-infra counts, for its author,
            on the day it was made.
          </p>
        </hlm-dialog-header>

        <!-- Grouped: the dialog spaces each of its children apart -->
        <section>
        <h3 class="text-sm font-semibold">Merged pull requests, by type</h3>
        <p class="mt-1 text-sm text-muted-foreground">From the title (feat, fix, docs…): the convention the repositories already enforce.</p>
        <ul class="mt-3 grid gap-2 sm:grid-cols-2">
          @for (type of types; track type.title) {
            <li class="flex items-start gap-3 rounded-lg bg-muted/40 p-3 ring-1 ring-border">
              <ng-icon [name]="type.icon" class="mt-0.5 shrink-0 text-primary" size="18" aria-hidden="true" />
              <div class="min-w-0 flex-1">
                <p class="font-medium">{{ type.title }}</p>
                <p class="text-sm text-muted-foreground">{{ type.description }}</p>
              </div>
              <p class="font-semibold whitespace-nowrap tabular-nums">{{ type.points }} pts</p>
            </li>
          }
        </ul>
        </section>

        <section>
        <h3 class="text-sm font-semibold">Everything else counts too</h3>
        <div class="mt-3 overflow-x-auto rounded-lg ring-1 ring-border">
          <table class="w-full text-sm">
            <tbody class="divide-y divide-border">
              @for (rule of rules; track rule.what) {
                <tr>
                  <th scope="row" class="px-3 py-2 text-left font-medium">{{ rule.what }}</th>
                  <td class="px-3 py-2 text-muted-foreground">{{ rule.when }}</td>
                  <td class="px-3 py-2 text-right font-semibold whitespace-nowrap tabular-nums">{{ rule.points }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        </section>

        <p class="text-sm text-muted-foreground">
          Most PRs from 2017 to 2025 show as closed on GitHub, not merged: Angular's merge tooling pushes the commits itself and adds
          <code class="rounded bg-muted px-1 py-0.5 text-xs">PR Close #N</code> to them. Those count as merged too. Bots are left out.
          The weights are the ones of Nuxters, plus review comments.
        </p>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class ScoreRules {
  protected readonly types = [
    { title: 'Features', description: 'feat and perf: new APIs, capabilities and speed.', icon: 'lucideRocket', points: PULL_REQUEST_POINTS.feat },
    { title: 'Fixes', description: 'fix: bugs found and fixed.', icon: 'lucideWrench', points: PULL_REQUEST_POINTS.fix },
    { title: 'Docs', description: 'docs: guides, API docs and examples.', icon: 'lucideBookOpen', points: PULL_REQUEST_POINTS.docs },
    { title: 'Chores', description: 'refactor, test, build, ci, release and reverts.', icon: 'lucideBrushCleaning', points: PULL_REQUEST_POINTS.chore },
  ]
  protected readonly rules = [
    { what: 'Issue', when: 'every issue opened', points: `${ACTIVITY_POINTS.issues} pt` },
    { what: 'Helpful issue', when: 'on top: closed as completed, or 3+ reactions, or 5+ comments', points: `+${ACTIVITY_POINTS.helpfulIssues} pts` },
    { what: 'Review comment', when: 'every comment on the code of a pull request', points: `${ACTIVITY_POINTS.reviewComments} pt` },
    { what: 'Comment', when: 'every comment on an issue or a pull request', points: `${ACTIVITY_POINTS.comments} pt` },
    { what: 'Helpful comment', when: 'on top: 3+ reactions', points: `+${ACTIVITY_POINTS.helpfulComments} pts` },
    { what: 'Reaction', when: 'received on your issues, pull requests and comments', points: `${ACTIVITY_POINTS.reactions} pt` },
  ]
}
