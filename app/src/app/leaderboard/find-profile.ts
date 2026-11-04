// The card beside the hero, after nuxt.com/nuxters' "Discover your contributions": sign in with GitHub, or any username.
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import type { ContributorSummary } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideArrowRight, lucideGithub, lucideLogOut } from '@ng-icons/lucide'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmCardImports } from '@spartan-ng/helm/card'
import { HlmInput } from '@spartan-ng/helm/input'
import { AuthService } from '../auth/auth.service'
import { avatarUrl, formatNumber, formatPoints } from './format'

/** GitHub's rule: letters, digits and single hyphens between them, 39 characters at most. */
const GITHUB_LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

/** Signed in: your rank and your profile. Otherwise: sign in with GitHub, or open anyone's profile by username. */
@Component({
  selector: 'app-find-profile',
  imports: [HlmButton, HlmCardImports, HlmInput, NgIcon, RouterLink],
  providers: [provideIcons({ lucideArrowRight, lucideGithub, lucideLogOut })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard class="bg-card/60 items-center gap-0 px-6 py-10 text-center backdrop-blur-sm sm:px-10" aria-labelledby="find-profile-title">
      @if (user(); as me) {
        <!-- In a div: an img first in a card is styled as its cover picture. -->
        <div><img [src]="avatar(me.githubId, 64)" alt="" width="64" height="64" class="size-16 rounded-full bg-muted object-cover ring-4 ring-card" /></div>
        <h2 id="find-profile-title" class="mt-5 text-lg font-medium">Welcome, {{ me.login }}</h2>
        <p class="mt-2 max-w-sm text-pretty text-muted-foreground">
          @if (me.rank) {
            You are <strong class="font-semibold text-foreground">#{{ number(me.rank) }}</strong> of all time, with {{ points(me.score ?? 0) }}.
          } @else {
            No contribution on the board yet: one merged pull request, issue or comment puts you on it, the next night.
          }
        </p>
        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <a hlmBtn [routerLink]="['/', me.login]">See your profile <ng-icon name="lucideArrowRight" aria-hidden="true" /></a>
          <form method="post" action="/api/auth/logout">
            <button hlmBtn variant="outline" type="submit"><ng-icon name="lucideLogOut" aria-hidden="true" /> Sign out</button>
          </form>
        </div>
      } @else {
        @if (top().length) {
          <div class="flex -space-x-3" aria-hidden="true">
            @for (person of top(); track person.githubId) {
              <img [src]="avatar(person.githubId, 48)" alt="" width="48" height="48" class="size-12 shrink-0 rounded-full bg-muted object-cover ring-4 ring-card" loading="lazy" />
            }
          </div>
        } @else {
          <ng-icon name="lucideGithub" size="2rem" aria-hidden="true" />
        }
        <h2 id="find-profile-title" class="mt-5 text-lg font-medium">Discover your contributions</h2>
        <p class="mt-2 max-w-sm text-pretty text-muted-foreground">
          {{ signIn() ? 'Sign in with GitHub to see your score, your rank in every year and your badges.' : 'Your score, your rank in every year and your badges, from your GitHub username.' }}
          @if (total()) { One of {{ number(total()) }} Angularians. }
        </p>
        @if (signIn()) {
          <a hlmBtn class="mt-6" [href]="loginUrl"><ng-icon name="lucideGithub" aria-hidden="true" /> Sign in with GitHub</a>
          <p class="mt-6 text-sm text-muted-foreground">or look anyone up</p>
        }
        <form class="flex w-full max-w-sm gap-2" [class.mt-6]="!signIn()" [class.mt-2]="signIn()" (submit)="open($event)">
          <label for="find-profile-username" class="sr-only">GitHub username</label>
          <input hlmInput id="find-profile-username" class="flex-1" [placeholder]="signIn() ? 'A GitHub username' : 'Your GitHub username'" autocomplete="off" autocapitalize="off" spellcheck="false"
            [value]="username()" (input)="edit($event)" [attr.aria-invalid]="invalid() || null" aria-describedby="find-profile-hint" />
          <button hlmBtn [variant]="signIn() ? 'outline' : 'default'" type="submit" aria-label="Open the profile">
            <ng-icon name="lucideArrowRight" aria-hidden="true" />
          </button>
        </form>
        <p id="find-profile-hint" class="mt-2 min-h-5 text-sm" [class.text-destructive]="invalid()" aria-live="polite">
          {{ invalid() ? 'That is not a GitHub username.' : '' }}
        </p>
      }
    </section>
  `,
})
export class FindProfile {
  /** The first contributors of the board, shown as a row of avatars. */
  readonly top = input<readonly ContributorSummary[]>([])
  /** Everyone on the board. */
  readonly total = input(0)

  private readonly router = inject(Router)
  private readonly auth = inject(AuthService)
  protected readonly user = computed(() => this.auth.state()?.user ?? null)
  /** Only once the site says sign-in is set up: no button that leads to an error. */
  protected readonly signIn = computed(() => this.auth.state()?.enabled === true)
  protected readonly loginUrl = this.auth.loginUrl('/')
  protected readonly username = signal('')
  protected readonly invalid = signal(false)
  protected readonly avatar = avatarUrl
  protected readonly number = formatNumber
  protected readonly points = formatPoints

  protected edit(event: Event): void {
    this.username.set((event.target as HTMLInputElement).value)
    this.invalid.set(false)
  }

  protected open(event: Event): void {
    event.preventDefault()
    // A pasted profile link works too: github.com/name or @name.
    const login = this.username().trim().replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '').replace(/\/.*$/, '')
    if (!GITHUB_LOGIN.test(login)) {
      this.invalid.set(true)
      return
    }
    void this.router.navigate(['/', login])
  }
}
