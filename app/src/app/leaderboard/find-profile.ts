// The card beside the hero, after nuxt.com/nuxters' "Discover your contributions": no sign-in here, a username is enough.
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core'
import { Router } from '@angular/router'
import type { ContributorSummary } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideArrowRight, lucideGithub } from '@ng-icons/lucide'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmCardImports } from '@spartan-ng/helm/card'
import { HlmInput } from '@spartan-ng/helm/input'
import { avatarUrl, formatNumber } from './format'

/** GitHub's rule: letters, digits and single hyphens between them, 39 characters at most. */
const GITHUB_LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

/** A GitHub username → its profile, with the top of the board above it. */
@Component({
  selector: 'app-find-profile',
  imports: [HlmButton, HlmCardImports, HlmInput, NgIcon],
  providers: [provideIcons({ lucideArrowRight, lucideGithub })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard class="bg-card/60 items-center gap-0 px-6 py-10 text-center backdrop-blur-sm sm:px-10" aria-labelledby="find-profile-title">
      @if (top().length) {
        <div class="flex -space-x-3" aria-hidden="true">
          @for (person of top(); track person.githubId) {
            <img [src]="avatar(person)" alt="" width="48" height="48" class="size-12 rounded-full bg-muted ring-4 ring-card" loading="lazy" />
          }
        </div>
      } @else {
        <ng-icon name="lucideGithub" size="2rem" aria-hidden="true" />
      }
      <h2 id="find-profile-title" class="mt-5 text-lg font-medium">Discover your contributions</h2>
      <p class="mt-2 max-w-sm text-pretty text-muted-foreground">
        Your score, your rank in every year and your badges, from your GitHub username.
        @if (total()) { One of {{ number(total()) }} Angularians. }
      </p>
      <form class="mt-6 flex w-full max-w-sm gap-2" (submit)="open($event)">
        <label for="find-profile-username" class="sr-only">GitHub username</label>
        <input hlmInput id="find-profile-username" class="flex-1" placeholder="Your GitHub username" autocomplete="off" autocapitalize="off" spellcheck="false"
          [value]="username()" (input)="edit($event)" [attr.aria-invalid]="invalid() || null" aria-describedby="find-profile-hint" />
        <button hlmBtn type="submit" aria-label="Open the profile">
          <ng-icon name="lucideArrowRight" aria-hidden="true" />
        </button>
      </form>
      <p id="find-profile-hint" class="mt-2 min-h-5 text-sm" [class.text-destructive]="invalid()" aria-live="polite">
        {{ invalid() ? 'That is not a GitHub username.' : '' }}
      </p>
    </section>
  `,
})
export class FindProfile {
  /** The first contributors of the board, shown as a row of avatars. */
  readonly top = input<readonly ContributorSummary[]>([])
  /** Everyone on the board. */
  readonly total = input(0)

  private readonly router = inject(Router)
  protected readonly username = signal('')
  protected readonly invalid = signal(false)
  protected readonly avatar = (person: ContributorSummary) => avatarUrl(person.githubId, 48)
  protected readonly number = formatNumber

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
