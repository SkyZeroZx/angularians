import { Component } from '@angular/core'
import { ACTIVITY_POINTS, PULL_REQUEST_POINTS, REPOS } from '@angularians/shared'
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
  templateUrl: './score-rules.html',
})
export class ScoreRules {
  protected readonly repos = REPOS
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
