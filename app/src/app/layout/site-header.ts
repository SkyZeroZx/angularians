import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeart } from '@ng-icons/lucide';
import { simpleGithub } from '@ng-icons/simple-icons';
import { HlmButton } from '@spartan-ng/helm/button';
import { Container } from './container';
import { BrandPicker } from './brand-picker';
import { LogoMark } from './logo-mark';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-site-header',
  imports: [BrandPicker, Container, HlmButton, LogoMark, NgIcon, RouterLink, ThemeToggle, UserMenu],
  providers: [provideIcons({ lucideHeart, simpleGithub })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'banner', class: 'sticky top-0 z-40 block border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60' },
  template: `
    <app-container class="flex h-16 items-center gap-4">
      <a routerLink="/" class="flex items-center gap-1 font-semibold tracking-tight">
        <app-logo-mark class="size-8" />
        <span class="brand text-[1.55em] text-brand-from">Angularians</span>
      </a>
      <nav class="ml-auto flex items-center gap-1" aria-label="Site">
        <!-- As on ngprimitives.com: sponsor first, a divider, then the icons. On phones the heart alone. -->
        <a class="mr-1 inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          href="https://github.com/sponsors/erkamyaman" target="_blank" rel="noopener" aria-label="Sponsor Angularians" title="Sponsor Angularians">
          <ng-icon name="lucideHeart" aria-hidden="true" /><span class="max-sm:hidden">Sponsor</span>
        </a>
        <span class="mr-1 h-5 w-px bg-border" aria-hidden="true"></span>
        <!-- GitHub and the theme always; then, signed in, the avatar and its menu -->
        @if (signedIn()) {
          <!-- Signed in: try a brand colour, in this browser only -->
          <app-brand-picker />
        }
        <a hlmBtn variant="ghost" size="icon" href="https://github.com/erkamyaman/angularians" target="_blank" rel="noopener" aria-label="Angularians on GitHub" title="Angularians on GitHub">
          <ng-icon name="simpleGithub" aria-hidden="true" />
        </a>
        <app-theme-toggle />
        @if (signedIn()) {
          <app-user-menu />
        } @else if (auth.wasSignedIn() && auth.state() === null) {
          <!-- Signed in last time, the session still loading: the avatar's place -->
          <span class="grid size-9 place-items-center" aria-hidden="true"><span class="size-7 animate-pulse rounded-full bg-muted"></span></span>
        }
      </nav>
    </app-container>
  `,
})
export class SiteHeader {
  protected readonly auth = inject(AuthService);
  protected readonly signedIn = computed(() => !!this.auth.state()?.user);
}
