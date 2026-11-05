// After nuxt.com's `HeaderUserMenu.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs): signed in, the avatar joins the header's GitHub
// link and theme button, and its menu has the profile and signing out.
import { Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixLogoutBoxRLine } from '@ng-icons/remixicon'
import { HlmPopoverImports } from '@spartan-ng/helm/popover'
import { AuthService } from '../auth/auth.service'
import { LogoMark } from './logo-mark'
import { avatarUrl } from '../leaderboard/format'

const ITEM = 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted'

@Component({
  selector: 'app-user-menu',
  imports: [HlmPopoverImports, LogoMark, NgIcon, RouterLink],
  providers: [provideIcons({ remixLogoutBoxRLine })],
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
              <app-logo-mark class="size-4 shrink-0" />
              <!-- One text run, so the word sits on the line with the rest, not centred as a separate box -->
              <span>My <span class="brand text-primary">Angularian</span> profile</span>
            </a>
          } @else {
            <p class="px-2 py-1.5 text-sm text-muted-foreground">No contributions on record yet.</p>
          }
          <div class="my-1 h-px bg-border" role="separator"></div>
          <form method="post" action="/api/auth/logout">
            <button type="submit" [class]="item"><ng-icon name="remixLogoutBoxRLine" aria-hidden="true" /> Sign out</button>
          </form>
        </div>
      </hlm-popover>
    }
  `,
})
export class UserMenu {
  private readonly auth = inject(AuthService)
  protected readonly user = computed(() => this.auth.state()?.user ?? null)
  protected readonly item = ITEM
  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 28)
}
