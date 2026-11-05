import { Component } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { simpleDiscord } from '@ng-icons/simple-icons'
import { AngularLogo } from '../layout/angular-logo'
import { FirstPrGuides, GUIDE } from './first-pr-guides'
import { avatarUrl } from './format'

const AUTHOR_ID = 88717125

@Component({
  selector: 'app-join-links',
  imports: [AngularLogo, FirstPrGuides, NgIcon],
  providers: [provideIcons({ simpleDiscord })],
  host: { class: 'mx-auto grid w-full max-w-4xl gap-6 text-left @min-[640px]:grid-cols-2' },
  template: `
    <section class="@container" aria-labelledby="join-angular">
      <h3 id="join-angular" class="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <app-angular-logo class="size-5" /> From the Angular team
      </h3>
      <div class="grid gap-2 @min-[460px]:grid-cols-2">
        <a [class]="guide + ' ring-[#9717E7]/60 hover:ring-[#9717E7]'" href="https://github.com/angular/angular/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">
          <span class="grid size-10 shrink-0 place-items-center rounded-md bg-[#9717E7]/10 dark:bg-muted"><app-angular-logo class="size-6" /></span>
          <span class="min-w-0">
            <span class="block font-medium">Contribution guide</span>
            <span class="block text-sm text-muted-foreground">How to send your first PR</span>
          </span>
        </a>
        <a [class]="guide + ' ring-[#5865F2]/60 hover:ring-[#5865F2]'" href="https://discord.gg/angular" target="_blank" rel="noopener">
          <span class="grid size-10 shrink-0 place-items-center rounded-md bg-[#5865F2]/10 text-[#5865F2] dark:bg-muted"><ng-icon name="simpleDiscord" size="1.5rem" aria-hidden="true" /></span>
          <span class="min-w-0">
            <span class="block font-medium">Angular Discord</span>
            <span class="block text-sm text-muted-foreground">Ask the community for help</span>
          </span>
        </a>
      </div>
    </section>
    <section class="@container" aria-labelledby="join-author">
      <h3 id="join-author" class="mb-3 text-sm font-medium text-muted-foreground">
        <a href="https://github.com/erkamyaman" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <img [src]="authorAvatar" alt="" width="20" height="20" class="size-5 rounded-full bg-muted" /> By erkamyaman
        </a>
      </h3>
      <app-first-pr-guides />
    </section>
  `,
})
export class JoinLinks {
  protected readonly guide = GUIDE
  protected readonly authorAvatar = avatarUrl(AUTHOR_ID, 20)
}
