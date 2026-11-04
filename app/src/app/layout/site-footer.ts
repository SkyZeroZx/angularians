import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFileText, lucideGlobe } from '@ng-icons/lucide';
import { simpleGithub, simpleNuxt } from '@ng-icons/simple-icons';
import { Container } from './container';
import { LogoMark } from './logo-mark';

const REPO = 'https://github.com/erkamyaman/angularians';

/** `icon`: an ng-icons name; `logo`: a project's own logo in public/credits (theirs, to credit them). */
interface FooterLink { label: string; href: string; route?: boolean; icon?: string; logo?: string; color?: string }

/** The footer: the brand and its pitch, three short columns of links, then the small print. */
@Component({
  selector: 'app-site-footer',
  imports: [Container, LogoMark, NgIcon, RouterLink],
  providers: [provideIcons({ lucideFileText, lucideGlobe, simpleGithub, simpleNuxt })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'contentinfo', class: 'block border-t' },
  template: `
    <app-container class="block py-12 text-sm">
      <div class="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div class="col-span-2 flex max-w-xs flex-col gap-4 md:col-span-1">
          <a routerLink="/" class="flex w-fit items-center gap-1">
            <app-logo-mark class="size-8" />
            <span class="brand text-[1.55em] text-brand-from">Angularians</span>
          </a>
          <p class="text-pretty text-muted-foreground">Everyone who has contributed to Angular, ranked. Updated every night.</p>
          <a class="flex w-fit items-center gap-2 text-muted-foreground hover:text-foreground" [href]="repo" target="_blank" rel="noopener">
            <ng-icon name="simpleGithub" aria-hidden="true" /> Source on GitHub
          </a>
        </div>

        @for (column of columns; track column.title) {
          <nav [attr.aria-label]="column.title">
            <h2 class="mb-3 font-medium text-foreground">{{ column.title }}</h2>
            <ul class="flex flex-col gap-2">
              @for (link of column.links; track link.label) {
                <li>
                  <a class="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground" [href]="link.href"
                    [attr.target]="link.route ? null : '_blank'" [attr.rel]="link.route ? null : 'noopener'">
                    @if (link.logo) {
                      <img [src]="link.logo" alt="" width="16" height="16" class="size-4 shrink-0 object-contain" />
                    } @else if (link.icon) {
                      <ng-icon [name]="link.icon" class="shrink-0" [style.color]="link.color ?? null" aria-hidden="true" />
                    }
                    <span>{{ link.label }}</span>
                  </a>
                </li>
              }
            </ul>
          </nav>
        }
      </div>

      <div class="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          © 2026 <a class="font-medium text-foreground hover:underline underline-offset-4" href="https://erkamyaman.dev" target="_blank" rel="noopener">Erkam Yaman</a> ·
          <a class="hover:text-foreground" [href]="repo + '/blob/main/LICENSE'" target="_blank" rel="noopener">MIT licence</a>
        </p>
        <p>Community project, not affiliated with Google or the Angular team. Angular is a trademark of Google LLC.</p>
      </div>
    </app-container>
  `,
})
export class SiteFooter {
  protected readonly repo = REPO;
  protected readonly columns: Array<{ title: string, links: FooterLink[] }> = [
    {
      title: 'Project',
      links: [
        { label: 'The leaderboard', href: '/#leaderboard', route: true },
        { label: 'Around the world', href: '/#world', route: true },
        { label: 'How the score works', href: `${REPO}/blob/main/docs/SCORING.md` },
        { label: 'Report an issue', href: `${REPO}/issues/new/choose` },
      ],
    },
    {
      title: 'Data',
      links: [
        { label: 'angular/angular', href: 'https://github.com/angular/angular' },
        { label: 'angular/components', href: 'https://github.com/angular/components' },
        { label: 'angular/angular-cli', href: 'https://github.com/angular/angular-cli' },
        { label: 'angular/dev-infra', href: 'https://github.com/angular/dev-infra' },
      ],
    },
    {
      title: 'Credits',
      links: [
        { label: 'Inspired by Nuxters', href: 'https://nuxt.com/nuxters', icon: 'simpleNuxt', color: '#00DC82' },
        { label: 'Built with AnalogJS', href: 'https://analogjs.org', logo: '/credits/analogjs.svg' },
        { label: 'UI by spartan/ui', href: 'https://spartan.ng', logo: '/credits/spartan.svg' },
        { label: 'Icons by ng-icons', href: 'https://ng-icons.github.io/ng-icons', logo: '/credits/ng-icons.svg' },
        { label: 'Countries by GeoNames', href: 'https://www.geonames.org', icon: 'lucideGlobe' },
        { label: 'All notices', href: `${REPO}/blob/main/THIRD_PARTY_NOTICES.md`, icon: 'lucideFileText' },
      ],
    },
  ];
}
