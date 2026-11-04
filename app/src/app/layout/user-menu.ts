// After nuxt.com's `HeaderUserMenu.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs): signed in, the header's GitHub link and
// theme button make way for the avatar, and its menu has the profile, the theme and signing out.
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideAward, lucideCheck, lucideLogOut, lucideMoon, lucideSun } from '@ng-icons/lucide'
import { HlmPopoverImports } from '@spartan-ng/helm/popover'
import { AuthService } from '../auth/auth.service'
import { avatarUrl } from '../leaderboard/format'
import { ThemeService } from '../theme.service'

const ITEM = 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted'

@Component({
  selector: 'app-user-menu',
  imports: [HlmPopoverImports, NgIcon, RouterLink],
  providers: [provideIcons({ lucideAward, lucideCheck, lucideLogOut, lucideMoon, lucideSun })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex' },
  template: `
    @if (user(); as me) {
      <hlm-popover align="end" sideOffset="8">
        <button hlmPopoverTrigger type="button" class="grid size-9 place-items-center rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          [attr.aria-label]="'Account menu of ' + me.login">
          <img [src]="avatar(me.githubId)" alt="" width="28" height="28" class="size-7 rounded-full bg-muted" />
        </button>
        <div hlmPopoverContent *hlmPopoverPortal="let ctx" class="w-60 gap-0 p-1">
          <div class="flex items-center gap-2 px-2 py-2">
            <img [src]="avatar(me.githubId)" alt="" width="24" height="24" class="size-6 rounded-full bg-muted" />
            <span class="truncate text-sm font-medium">{{ me.angularian?.username ?? me.login }}</span>
          </div>
          <div class="my-1 h-px bg-border" role="separator"></div>
          @if (me.angularian; as person) {
            <a [class]="item" [routerLink]="['/', person.username]" (click)="ctx.close()">
              <ng-icon name="lucideAward" aria-hidden="true" /> My Angularian profile
            </a>
          } @else {
            <p class="px-2 py-1.5 text-sm text-muted-foreground">No contributions on record yet.</p>
          }
          <div class="my-1 h-px bg-border" role="separator"></div>
          <p class="px-2 pt-1 pb-0.5 text-xs text-muted-foreground">Appearance</p>
          <button type="button" [class]="item" [attr.aria-pressed]="!theme.dark()" (click)="setTheme('light')">
            <ng-icon name="lucideSun" aria-hidden="true" /> Light
            @if (!theme.dark()) { <ng-icon name="lucideCheck" class="ml-auto" aria-hidden="true" /> }
          </button>
          <button type="button" [class]="item" [attr.aria-pressed]="theme.dark()" (click)="setTheme('dark')">
            <ng-icon name="lucideMoon" aria-hidden="true" /> Dark
            @if (theme.dark()) { <ng-icon name="lucideCheck" class="ml-auto" aria-hidden="true" /> }
          </button>
          <div class="my-1 h-px bg-border" role="separator"></div>
          <form method="post" action="/api/auth/logout">
            <button type="submit" [class]="item"><ng-icon name="lucideLogOut" aria-hidden="true" /> Sign out</button>
          </form>
        </div>
      </hlm-popover>
    }
  `,
})
export class UserMenu {
  private readonly auth = inject(AuthService)
  protected readonly theme = inject(ThemeService)
  protected readonly user = computed(() => this.auth.state()?.user ?? null)
  protected readonly item = ITEM
  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 28)

  protected setTheme(theme: 'light' | 'dark'): void {
    if ((theme === 'dark') !== this.theme.dark()) this.theme.toggle()
  }
}
