// Ported from nuxt.com `app/components/nuxters/NuxtersMeCard.vue` and `NuxtersMeCardSkeleton.vue`
// (MIT, Copyright (c) 2022-2023 NuxtLabs). No Discord: the actions are the share buttons.
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideArrowRight, lucideAward, lucideCircle, lucideCircleCheck, lucideGithub, lucideInfo } from '@ng-icons/lucide'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmSkeleton } from '@spartan-ng/helm/skeleton'
import { HlmTooltip } from '@spartan-ng/helm/tooltip'
import { AuthService } from '../auth/auth.service'
import { AngularLogo } from '../layout/angular-logo'
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

/** The signed-in Angularian, or a sign-in. */
@Component({
  selector: 'app-me-card',
  imports: [AngularLogo, HlmButton, HlmSkeleton, HlmTooltip, NgIcon, RouterLink, ScoreDialog, Share],
  providers: [provideIcons({ lucideArrowRight, lucideAward, lucideCircle, lucideCircleCheck, lucideGithub, lucideInfo })],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
              <a hlmBtn variant="outline" [routerLink]="['/', person.username]">My profile <ng-icon name="lucideArrowRight" aria-hidden="true" /></a>
            }
          </div>

          <ul class="flex flex-col gap-2">
            @for (item of unlocks(); track item.label) {
              <li class="flex items-center gap-2">
                <ng-icon [name]="item.value > 0 ? 'lucideCircleCheck' : 'lucideCircle'" size="1.25rem" class="shrink-0"
                  [class.text-primary]="item.value > 0" [class.text-muted-foreground]="!item.value" aria-hidden="true" />
                <span><span class="font-medium tabular-nums">{{ number(item.value) }}</span> {{ item.label }}</span>
                @if (item.hint) {
                  <ng-icon name="lucideInfo" class="text-muted-foreground" [hlmTooltip]="item.hint" [attr.aria-label]="item.hint" tabindex="0" />
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
              } @else {
                <span class="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                  <ng-icon name="lucideAward" aria-hidden="true" />{{ badge }}
                </span>
              }
            } @empty {
              <p class="text-sm text-muted-foreground">One merged PR, helpful issue or helpful comment unlocks the Angularian badge.</p>
            }
          </div>

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
          <ng-icon name="lucideGithub" size="2rem" aria-hidden="true" />
          <p id="me-card-title" class="text-lg font-medium">Discover your contributions</p>
          <p class="-mt-2 max-w-sm text-muted-foreground">
            @if (state()?.enabled !== false) {
              Sign in with GitHub to see your score, share your Angularian profile and unlock your badges.
            } @else {
              Sign-in with GitHub is coming soon: your score, your Angularian profile to share, and your badges.
            }
          </p>
          @if (state()?.enabled !== false) {
            <a hlmBtn class="bg-foreground text-background hover:bg-foreground/90" [href]="loginUrl">
              <ng-icon name="lucideGithub" aria-hidden="true" /> Sign in with GitHub
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
  protected readonly lastYear = computed(() => this.me()?.angularian?.periods.find(row => row.period === '12m') ?? null)
  protected readonly periods = computed(() => this.me()?.angularian?.periods.map(row => row.period) ?? [])
  protected readonly unlocks = computed(() => {
    const person = this.me()?.angularian
    return [
      { label: 'merged pull requests', value: person?.pullRequests.all ?? 0, hint: null },
      { label: 'helpful issues', value: person?.helpfulIssues ?? 0, hint: 'Completed, or 3+ reactions, or 5+ comments' },
      { label: 'helpful comments', value: person?.helpfulComments ?? 0, hint: '3+ reactions' },
    ]
  })

  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 64)
  protected readonly number = formatNumber
  protected readonly points = formatPoints
}
