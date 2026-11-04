// Ported from nuxt.com `app/components/nuxters/NuxtersMeCard.vue` and `NuxtersMeCardSkeleton.vue`
// (MIT, Copyright (c) 2022-2023 NuxtLabs). No Discord: the actions are the share buttons.
import { Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixArrowRightLine, remixChatHeartLine, remixInformationLine, remixMedalLine, remixSparklingLine } from '@ng-icons/remixicon'
import { octGitMerge, octIssueOpened } from '@ng-icons/octicons'
import { simpleGithub } from '@ng-icons/simple-icons'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmSkeleton } from '@spartan-ng/helm/skeleton'
import { HlmTooltip } from '@spartan-ng/helm/tooltip'
import { AuthService } from '../auth/auth.service'
import { AngularLogo } from '../layout/angular-logo'
import { LogoMark } from '../layout/logo-mark'
import { ScoreDialog } from '../profile/score-dialog'
import { Share } from '../profile/share'
import { avatarUrl, formatNumber, formatPoints } from './format'

const CARD = 'flex w-full flex-col rounded-xl bg-muted/40 p-6 ring-1 ring-border sm:p-8'
/**
 * The signed-in card's size, from the width of its container (it wraps below 520px), for it and for its skeleton:
 * the hero does not move when the stats arrive. Needs an `@container` parent. Signed out, the card is only as tall
 * as its content: most visitors are, and a visitor signed in last time gets the skeleton at this size instead.
 */
const SIGNED_IN = 'min-h-[29rem] @min-[400px]:min-h-[25.75rem] @min-[460px]:min-h-[24.25rem] @min-[520px]:min-h-[22rem]'
/** Signed out: as tall as the hero's text on wide screens, so the card does not look lost beside it. */
const SIGNED_OUT = 'min-h-64 lg:min-h-80'
const GUIDE = 'flex items-center gap-3 rounded-lg bg-background p-3 shadow-xs ring-1 transition hover:shadow-sm dark:bg-background/60 dark:shadow-none dark:hover:bg-muted dark:hover:shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
const AUTHOR_ID = 88717125

/** The signed-in Angularian, or a sign-in. */
@Component({
  selector: 'app-me-card',
  imports: [AngularLogo, HlmButton, HlmSkeleton, HlmTooltip, LogoMark, NgIcon, RouterLink, ScoreDialog, Share],
  providers: [provideIcons({ remixArrowRightLine, remixMedalLine, octIssueOpened, octGitMerge, remixInformationLine, remixChatHeartLine, remixSparklingLine, simpleGithub })],
  host: { class: 'block w-full' },
  template: `
    @if (state() === null && auth.wasSignedIn()) {
      <!-- The session loads in the browser: the skeleton, at the signed-in card's height -->
      <div [class]="card + ' ' + signedIn" aria-hidden="true">
        <div class="flex flex-col gap-6">
          <div class="flex items-center gap-4">
            <div hlmSkeleton class="size-16 shrink-0 rounded-full"></div>
            <div class="flex flex-1 flex-col gap-2">
              <div hlmSkeleton class="h-5 w-40"></div>
              <div hlmSkeleton class="h-4 w-28"></div>
              <div hlmSkeleton class="h-4 w-36"></div>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            @for (row of [1, 2, 3]; track row) { <div hlmSkeleton class="h-6 w-56"></div> }
          </div>
          <div hlmSkeleton class="h-6 w-32"></div>
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
            <img [src]="avatar(me.githubId)" [alt]="me.login" width="64" height="64" class="size-16 shrink-0 rounded-full bg-muted" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-lg font-semibold">{{ me.login }}</p>
              @if (me.angularian; as person) {
                <p class="flex items-center gap-1 text-muted-foreground">
                  <span class="tabular-nums">#{{ number(person.rank) }}</span>
                  <span aria-hidden="true">·</span>
                  <span class="tabular-nums">{{ points(person.score) }}</span>
                  <app-score-dialog [stats]="person" />
                </p>
              } @else {
                <p class="text-muted-foreground">No contributions on record yet.</p>
              }
              @if (lastYear(); as year) {
                <p class="text-sm text-muted-foreground">Last 12 months: <span class="tabular-nums">#{{ number(year.rank) }}</span></p>
              }
            </div>
            @if (me.angularian; as person) {
              <a hlmBtn variant="outline" [routerLink]="['/', person.username]">My profile <ng-icon name="remixArrowRightLine" aria-hidden="true" /></a>
            }
          </div>

          <ul class="flex flex-col gap-2">
            @for (item of unlocks(); track item.label) {
              <li class="flex items-center gap-2">
                <!-- The profile's stat colours: pink PRs, sky issues, violet comments; grey until there is one -->
                <ng-icon [name]="item.icon" size="1.25rem" [class]="'shrink-0 ' + (item.value > 0 ? item.color : 'text-muted-foreground/60')" aria-hidden="true" />
                <span><span class="font-medium tabular-nums">{{ number(item.value) }}</span> {{ item.value === 1 ? item.one : item.label }}</span>
                @if (item.hint) {
                  <ng-icon name="remixInformationLine" class="text-muted-foreground" [hlmTooltip]="item.hint" [attr.aria-label]="item.hint" tabindex="0" />
                }
              </li>
            }
          </ul>

          <div class="flex flex-wrap items-center gap-2">
            @for (badge of me.badges; track badge) {
              @if (badge === 'Angular team') {
                <!-- As on the profile: the Angular logo of the press kit, only for members of the Angular team -->
                <span class="inline-flex items-center gap-1.5 rounded-md bg-[#dc087d]/10 px-2 py-0.5 text-sm font-medium ring-1 ring-[#dc087d]/40">
                  <app-angular-logo class="size-4" />{{ badge }}
                </span>
              } @else if (badge === 'Angularian') {
                <!-- Our own badge: the mark, and the word in the brand font -->
                <span class="inline-flex h-7 items-center gap-1 rounded-md bg-primary/10 px-2 text-sm font-medium text-primary">
                  <app-logo-mark class="size-4" /><span class="brand leading-none">{{ badge }}</span>
                </span>
              } @else {
                <span class="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                  <ng-icon name="remixMedalLine" aria-hidden="true" />{{ badge }}
                </span>
              }
            } @empty {
              <p class="text-sm text-muted-foreground">One merged PR, helpful issue or helpful comment unlocks the <span class="brand text-primary">Angularian</span> badge.</p>
            }
          </div>

          @if (!me.angularian) {
            <div class="flex flex-col gap-3 border-t border-border pt-4">
              <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p class="font-medium">Become an <span class="brand text-primary">Angularian</span></p>
                <a href="https://github.com/erkamyaman" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  <img [src]="authorAvatar" alt="" width="20" height="20" class="size-5 rounded-full bg-muted" /> by erkamyaman
                </a>
              </div>
              <p class="text-sm text-muted-foreground">I made these to make your first PR easier. Hope to see you in <span class="brand text-primary whitespace-nowrap">ng-halla</span>.</p>
              <div class="grid gap-2 @min-[460px]:grid-cols-2">
                <a [class]="guide + ' ring-[#9A6700]/60 hover:ring-[#9A6700] dark:ring-[#D29922]/60 dark:hover:ring-[#D29922]'" href="https://github.com/erkamyaman/angular-contribution-skill" target="_blank" rel="noopener">
                  <span class="grid size-10 shrink-0 place-items-center rounded-md bg-[#9A6700]/10 text-[#9A6700] dark:bg-muted dark:text-[#D29922]"><ng-icon name="remixSparklingLine" size="1.25rem" aria-hidden="true" /></span>
                  <span class="min-w-0">
                    <span class="block font-medium">Agent skill</span>
                    <span class="block text-sm text-muted-foreground">Contribute by Angular's rules</span>
                  </span>
                </a>
                <a [class]="guide + ' ring-[#FF0000]/60 hover:ring-[#FF0000]'" href="https://www.youtube.com/watch?v=_KfE1fnZphc" target="_blank" rel="noopener">
                  <span class="grid size-10 shrink-0 place-items-center rounded-md bg-[#FF0000]/10 dark:bg-muted">
                    <svg viewBox="0 0 24 24" class="size-6" aria-hidden="true">
                      <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                      <path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12z" />
                    </svg>
                  </span>
                  <span class="min-w-0">
                    <span class="block font-medium">Open Source 101</span>
                    <span class="block text-sm text-muted-foreground">The talk, at Ng Asia</span>
                  </span>
                </a>
              </div>
            </div>
          }

          <!-- Sharing is the all-time profile: the card does not follow the leaderboard period. -->
          @if (me.angularian && me.badges.length) {
            <div class="border-t border-border pt-4">
              <app-share [username]="me.angularian.username" [periods]="periods()" />
            </div>
          }
        </div>
      </section>
    } @else {
      <!-- Signed out, or not known yet (and not signed in last time): the sign-in, at once -->
      <section [class]="card + ' ' + signedOut" aria-labelledby="me-card-title">
        <div class="my-auto flex flex-col items-center gap-4 text-center">
          <ng-icon name="simpleGithub" size="2rem" aria-hidden="true" />
          <p id="me-card-title" class="text-lg font-medium">Discover your contributions</p>
          <p class="-mt-2 max-w-sm text-muted-foreground">
            @if (state()?.enabled !== false) {
              Sign in with GitHub to see your score, share your <span class="brand text-primary">Angularian</span> profile and unlock your badges.
            } @else {
              Sign-in with GitHub is coming soon: your score, your <span class="brand text-primary">Angularian</span> profile to share, and your badges.
            }
          </p>
          @if (state()?.enabled !== false) {
            <a hlmBtn class="bg-foreground text-background hover:bg-foreground/90" [href]="loginUrl">
              <ng-icon name="simpleGithub" aria-hidden="true" /> Sign in with GitHub
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
  protected readonly guide = GUIDE
  protected readonly authorAvatar = avatarUrl(AUTHOR_ID, 20)
  protected readonly state = this.auth.state
  protected readonly me = computed(() => this.state()?.user ?? null)
  protected readonly loginUrl = this.auth.loginUrl('/')
  protected readonly lastYear = computed(() => this.me()?.angularian?.periods.find(row => row.period === '12m') ?? null)
  protected readonly periods = computed(() => this.me()?.angularian?.periods.map(row => row.period) ?? [])
  protected readonly unlocks = computed(() => {
    const person = this.me()?.angularian
    return [
      { label: 'merged pull requests', one: 'merged pull request', value: person?.pullRequests.all ?? 0, hint: null, icon: 'octGitMerge', color: 'text-[#8250DF] dark:text-[#A371F7]' },
      { label: 'helpful issues', one: 'helpful issue', value: person?.helpfulIssues ?? 0, hint: 'Completed, or 3+ reactions, or 5+ comments', icon: 'octIssueOpened', color: 'text-[#1A7F37] dark:text-[#3FB950]' },
      { label: 'helpful comments', one: 'helpful comment', value: person?.helpfulComments ?? 0, hint: '3+ reactions', icon: 'remixChatHeartLine', color: 'text-[#0969DA] dark:text-[#58A6FF]' },
    ]
  })

  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 64)
  protected readonly number = formatNumber
  protected readonly points = formatPoints
}
