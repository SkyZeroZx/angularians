import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGithub } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { Container } from './container';
import { LogoMark } from './logo-mark';
import { ThemeToggle } from './theme-toggle';

@Component({
  selector: 'app-site-header',
  imports: [Container, HlmButton, LogoMark, NgIcon, RouterLink, ThemeToggle],
  providers: [provideIcons({ lucideGithub })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sticky top-0 z-40 block border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60' },
  template: `
    <app-container class="flex h-16 items-center gap-4">
      <a routerLink="/" class="flex items-center gap-2 font-semibold tracking-tight">
        <app-logo-mark class="size-6" />
        <span>Angularians</span>
      </a>
      <nav class="ml-auto flex items-center gap-1" aria-label="Site">
        <a hlmBtn variant="ghost" size="icon" href="https://github.com/angular/angular" target="_blank" rel="noopener" aria-label="angular/angular on GitHub" title="angular/angular on GitHub">
          <ng-icon name="lucideGithub" aria-hidden="true" />
        </a>
        <app-theme-toggle />
      </nav>
    </app-container>
  `,
})
export class SiteHeader {}
