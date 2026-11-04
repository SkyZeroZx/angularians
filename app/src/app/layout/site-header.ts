import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { simpleGithub } from '@ng-icons/simple-icons';
import { HlmButton } from '@spartan-ng/helm/button';
import { Container } from './container';
import { LogoMark } from './logo-mark';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-site-header',
  imports: [Container, HlmButton, LogoMark, NgIcon, RouterLink, ThemeToggle, UserMenu],
  providers: [provideIcons({ simpleGithub })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'banner', class: 'sticky top-0 z-40 block border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60' },
  template: `
    <app-container class="flex h-16 items-center gap-4">
      <a routerLink="/" class="flex items-center gap-2 font-semibold tracking-tight">
        <app-logo-mark class="size-6" animated />
        <span>Angularians</span>
      </a>
      <nav class="ml-auto flex items-center gap-1" aria-label="Site">
        <!-- As on nuxt.com: signed in, the avatar and its menu (the theme is in it); signed out, GitHub and the theme -->
        @if (signedIn()) {
          <app-user-menu />
        } @else if (auth.wasSignedIn() && auth.state() === null) {
          <!-- Signed in last time, the session still loading: the avatar's place, not the signed-out links -->
          <span class="grid size-9 place-items-center" aria-hidden="true"><span class="size-7 animate-pulse rounded-full bg-muted"></span></span>
        } @else {
          <a hlmBtn variant="ghost" size="icon" href="https://github.com/erkamyaman/angularians" target="_blank" rel="noopener" aria-label="Angularians on GitHub" title="Angularians on GitHub">
            <ng-icon name="simpleGithub" aria-hidden="true" />
          </a>
          <app-theme-toggle />
        }
      </nav>
    </app-container>
  `,
})
export class SiteHeader {
  protected readonly auth = inject(AuthService);
  protected readonly signedIn = computed(() => !!this.auth.state()?.user);
}
