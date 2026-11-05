// Ported from nuxt.com `app/components/nuxters/NuxtersMeCard.vue` and `NuxtersMeCardSkeleton.vue`
// (MIT, Copyright (c) 2022-2023 NuxtLabs). No Discord: the actions are the share buttons.
import { Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixChatHeartLine, remixInformationLine, remixMedalLine } from '@ng-icons/remixicon'
import { vikingHead } from '../layout/viking-icons'
import { octGitMerge, octIssueOpened } from '@ng-icons/octicons'
import { simpleGithub } from '@ng-icons/simple-icons'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmSkeleton } from '@spartan-ng/helm/skeleton'
import { HlmTooltip } from '@spartan-ng/helm/tooltip'
import { AuthService } from '../auth/auth.service'
import { AngularLogo } from '../layout/angular-logo'
import { LogoMark } from '../layout/logo-mark'
import { ScoreDialog } from '../profile/score-dialog'
import { JoinLinks } from './join-links'
import { Share } from '../profile/share'
import { avatarUrl, formatNumber, formatPoints } from './format'

const CARD = 'flex w-full flex-col rounded-xl bg-muted/40 p-6 ring-1 ring-border sm:p-8'
/**
 * The signed-in card's size, from the width of its container (it wraps below 520px), for it and for its skeleton:
 * the hero does not move when the stats arrive. Needs an `@container` parent. Signed out, the card is only as tall
 * as its content: most visitors are, and a visitor signed in last time gets the skeleton at this size instead.
 */
const SIGNED_IN = 'min-h-[25rem] @min-[400px]:min-h-[23rem] @min-[520px]:min-h-[22rem]'
/** Signed out: as tall as the hero's text on wide screens, so the card does not look lost beside it. */
const SIGNED_OUT = 'max-sm:p-4 sm:min-h-64 lg:min-h-80'

/** The signed-in Angularian, or a sign-in. */
@Component({
  selector: 'app-me-card',
  imports: [AngularLogo, HlmButton, HlmSkeleton, HlmTooltip, JoinLinks, LogoMark, NgIcon, RouterLink, ScoreDialog, Share],
  providers: [provideIcons({ vikingHead, remixMedalLine, octIssueOpened, octGitMerge, remixInformationLine, remixChatHeartLine, simpleGithub })],
  host: { class: 'block w-full' },
  template: `
    @if (state() === null && auth.wasSignedIn()) {
      <!-- The session loads in the browser: the skeleton, at the signed-in card's height -->
      <div [class]="card + ' ' + signedIn" aria-hidden="true">
        <div class="flex flex-col gap-6">
          <div class="flex items-center gap-4">
            <div hlmSkeleton class="size-18 shrink-0 rounded-full"></div>
            <div class="flex flex-1 flex-col gap-2">
              <div hlmSkeleton class="h-5 w-40"></div>
              <div hlmSkeleton class="h-7 w-32"></div>
              <div hlmSkeleton class="h-4 w-36"></div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            @for (row of [1, 2, 3]; track row) { <div hlmSkeleton class="h-28 rounded-lg"></div> }
          </div>
          <div class="flex gap-2 border-t border-border pt-4">
            <div hlmSkeleton class="h-8 w-44"></div>
            <div hlmSkeleton class="h-8 w-36"></div>
          </div>
        </div>
      </div>
    } @else if (me(); as me) {
      <section [class]="card + ' ' + signedIn" aria-label="Your Angularian profile">
        <div class="flex flex-col gap-6">
          <div class="flex items-center gap-4">
            @if (me.angularian; as person) {
              <a [routerLink]="['/', person.username]" [attr.aria-label]="'Profile of ' + person.username" class="shrink-0 rounded-full transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                <img [src]="avatar(me.githubId)" alt="" width="72" height="72" class="size-18 rounded-full bg-muted ring-1 ring-border" />
              </a>
            } @else {
              <img [src]="avatar(me.githubId)" [alt]="me.login" width="72" height="72" class="size-18 shrink-0 rounded-full bg-muted ring-1 ring-border" />
            }
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                @if (me.angularian; as person) {
                  <a [routerLink]="['/', person.username]" class="min-w-0 truncate rounded-sm text-lg font-semibold transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">{{ me.login }}</a>
                } @else {
                  <p class="min-w-0 truncate text-lg font-semibold">{{ me.login }}</p>
                }
                @for (badge of me.badges; track badge) {
                  @if (badge === 'Angular team') {
                    <!-- As on the profile: the Angular logo of the press kit, only for members of the Angular team -->
                    <span class="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#dc087d]/10 px-2 text-sm font-medium ring-1 ring-[#dc087d]/40">
                      <app-angular-logo class="size-5" />{{ badge }}
                    </span>
                  } @else if (badge === 'Angularian') {
                    <!-- Our own badge: the mark, and the word in the brand font -->
                    <span class="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary/10 px-2 text-base font-medium text-primary">
                      <app-logo-mark class="size-5" /><span class="brand leading-none">{{ badge }}</span>
                    </span>
                  } @else {
                    <span class="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary/10 px-2 text-sm font-medium text-primary">
                      <ng-icon name="remixMedalLine" aria-hidden="true" />{{ badge }}
                    </span>
                  }
                }
              </div>
              @if (me.angularian; as person) {
                <p class="mt-1 flex flex-wrap items-center gap-x-2">
                  <span class="brand text-3xl leading-none text-primary">#{{ number(person.rank) }}</span>
                  <span class="text-muted-foreground tabular-nums">{{ points(person.score) }}</span>
                  <app-score-dialog [stats]="person" />
                </p>
                @if (lastYear(); as year) {
                  <p class="text-sm text-muted-foreground"><span class="brand text-base leading-none">#{{ number(year.rank) }}</span> in the last 12 months</p>
                }
                @if (contributorSince(); as since) {
                  <p class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><app-angular-logo class="size-4" /><span><span class="font-medium text-foreground">Angular contributor</span> since {{ since }}</span></p>
                }
              } @else {
                <p class="text-muted-foreground">No contributions on record yet.</p>
              }
            </div>
          </div>

          <ul class="grid grid-cols-3 gap-2">
            @for (item of unlocks(); track item.label) {
              <li class="flex flex-col gap-1.5 rounded-lg bg-background/60 p-3 ring-1 ring-border">
                <!-- GitHub's colours; grey until there is one -->
                <ng-icon [name]="item.icon" size="1.25rem" [class]="'shrink-0 ' + (item.value > 0 ? item.color : 'text-muted-foreground/60')" aria-hidden="true" />
                <span class="text-2xl font-semibold tabular-nums">{{ number(item.value) }}</span>
                <span class="flex items-center gap-1 text-xs text-muted-foreground">
                  {{ item.value === 1 ? item.one : item.label }}
                  @if (item.hint) {
                    <button type="button" class="grid shrink-0 place-items-center rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" [hlmTooltip]="item.hint" [attr.aria-label]="item.hint"><ng-icon name="remixInformationLine" aria-hidden="true" /></button>
                  }
                </span>
              </li>
            }
          </ul>

          @if (!me.badges.length) {
            <p class="text-sm text-muted-foreground">One merged PR, helpful issue or helpful comment unlocks the <span class="brand text-primary">Angularian</span> badge.</p>
          }

          @if (!me.angularian) {
            <div class="flex flex-col gap-3 border-t border-border pt-4">
              <p class="font-medium">Become an <span class="brand text-primary">Angularian</span></p>
              <p class="text-sm text-muted-foreground">These make your first PR easier. Hope to see you in <span class="brand text-primary whitespace-nowrap">ng-halla</span>.</p>
              <app-join-links />
            </div>
          }

          <!-- Sharing is the all-time profile: the card does not follow the leaderboard period. -->
          @if (me.angularian; as person) {
            <div class="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <a hlmBtn variant="outline" class="border-primary/40! bg-primary/15! text-primary! hover:bg-primary/25!" [routerLink]="['/', person.username]"><ng-icon name="vikingHead" size="1.5rem" aria-hidden="true" /> My profile</a>
              @if (me.badges.length) {
                <app-share [username]="person.username" [periods]="periods()" [country]="person.country" />
              }
            </div>
          }
        </div>
      </section>
    } @else {
      <!-- Signed out, or not known yet (and not signed in last time): the sign-in, at once -->
      <section [class]="card + ' ' + signedOut" aria-labelledby="me-card-title">
        <div class="my-auto flex items-center justify-between gap-3 sm:flex-col sm:justify-center sm:gap-4 sm:text-center">
          <ng-icon name="simpleGithub" size="2rem" class="max-sm:hidden" aria-hidden="true" />
          <p id="me-card-title" class="font-medium sm:text-lg">Discover your contributions</p>
          <p class="-mt-2 max-w-sm text-muted-foreground max-sm:hidden">
            @if (state()?.enabled !== false) {
              Sign in with GitHub to see your score, share your <span class="brand text-primary">Angularian</span> profile and unlock your badges.
            } @else {
              Sign-in with GitHub is coming soon: your score, your <span class="brand text-primary">Angularian</span> profile to share, and your badges.
            }
          </p>
          @if (state()?.enabled !== false) {
            <a hlmBtn class="bg-foreground text-background hover:bg-foreground/90" [href]="loginUrl">
              <ng-icon name="simpleGithub" aria-hidden="true" /> <span class="max-sm:sr-only">Sign in with GitHub</span><span class="sm:hidden" aria-hidden="true">Sign in</span>
            </a>
          }
        </div>
      </section>
    }
  `,
})
export class MeCard {
  protected readonly auth = inject(AuthService)
  protected readonly card = CARD
  protected readonly signedIn = SIGNED_IN
  protected readonly signedOut = SIGNED_OUT
  protected readonly state = this.auth.state
  protected readonly me = computed(() => this.state()?.user ?? null)
  protected readonly loginUrl = this.auth.loginUrl('/')
  protected readonly contributorSince = computed(() => {
    const first = this.me()?.angularian?.firstContributionAt
    return first ? new Date(first).getUTCFullYear() : null
  })
  protected readonly lastYear = computed(() => this.me()?.angularian?.periods.find(row => row.period === '12m') ?? null)
  protected readonly periods = computed(() => this.me()?.angularian?.periods.map(row => row.period) ?? [])
  protected readonly unlocks = computed(() => {
    const person = this.me()?.angularian
    return [
      { label: 'Merged PRs', one: 'Merged PR', value: person?.pullRequests.all ?? 0, hint: null, icon: 'octGitMerge', color: 'text-[#8250DF] dark:text-[#A371F7]' },
      { label: 'Helpful issues', one: 'Helpful issue', value: person?.helpfulIssues ?? 0, hint: 'Completed, or 3+ reactions, or 5+ comments', icon: 'octIssueOpened', color: 'text-[#1A7F37] dark:text-[#3FB950]' },
      { label: 'Helpful comments', one: 'Helpful comment', value: person?.helpfulComments ?? 0, hint: '3+ reactions', icon: 'remixChatHeartLine', color: 'text-[#0969DA] dark:text-[#58A6FF]' },
    ]
  })

  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 64)
  protected readonly number = formatNumber
  protected readonly points = formatPoints
}
