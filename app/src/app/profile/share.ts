// Ported from nuxt.com `app/components/nuxters/NuxtersShare.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { NgTemplateOutlet } from '@angular/common'
import { Component, computed, input, linkedSignal, signal } from '@angular/core'
import { periodPhrase, sortPeriods, type Period, COUNTRIES, countryName } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixCheckLine, remixDownloadLine, remixFileCopyLine, remixImageLine, remixLinkedinBoxFill, remixLinkM, remixMarkdownLine, remixShareLine } from '@ng-icons/remixicon'
import { simpleBluesky, simpleX } from '@ng-icons/simple-icons'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { CountrySelect } from '../leaderboard/country-select'
import { PeriodTabs } from '../leaderboard/period-tabs'
import { HlmSkeleton } from '@spartan-ng/helm/skeleton'
import { SITE_URL } from '../site'

/** The skeleton shows at least this long, so a fast card does not flicker it. */
const MIN_LOADING_MS = 500
/** A box of the 1200 × 630 card, in percent of it: the skeleton is measured on the card (`server/card/card.ts`). */
const box = (x: number, y: number, width: number, height: number, round = false) => ({ left: x / 12, top: y / 6.3, width: width / 12, height: height / 6.3, round })
const TILES = [[508, 56], [834, 56], [508, 276], [834, 276]] as const
const TILE_BOXES = TILES.map(([x, y]) => box(x, y, 302, 196))
/** The first load, before there is a card to show: changing the period keeps the card and dims it instead. */
const SKELETON_BOXES = [
  box(64, 56, 124, 124, true),
  box(64, 196, 270, 46),
  box(64, 258, 180, 76),
  box(64, 348, 200, 34),
  box(64, 520, 320, 66),
  box(884, 520, 252, 66),
  ...TILES.flatMap(([x, y]) => [box(x + 26, y + 26, 40, 40, true), box(x + 26, y + 78, 150, 52), box(x + 26, y + 138, 150, 28)]),
]

/** Raise it when the card's design changes, so the preview does not show a copy the browser kept. */
export const CARD_DESIGN = 12

const query = (period?: Period, flag?: string | null) => {
  const params = new URLSearchParams({ ...(period && period !== 'all' ? { period } : {}), ...(flag ? { flag } : {}) }).toString()
  return params ? `?${params}` : ''
}

/** Copy the profile link, or the Markdown of the Angularian card for a GitHub profile README. */
@Component({
  selector: 'app-share',
  imports: [CountrySelect, HlmButton, HlmDialogImports, HlmSkeleton, NgIcon, NgTemplateOutlet, PeriodTabs],
  providers: [provideIcons({ remixCheckLine, remixDownloadLine, remixFileCopyLine, remixImageLine, remixLinkedinBoxFill, remixShareLine, simpleBluesky, simpleX, remixLinkM, remixMarkdownLine })],
  host: { class: 'flex flex-wrap items-center gap-2' },
  template: `
    <button hlmBtn variant="secondary" type="button" (click)="copyLink()">
      <ng-icon [name]="copied() === 'link' ? 'remixCheckLine' : 'remixLinkM'" size="1.25rem" aria-hidden="true" />
      <!-- Both labels share one cell, so the button keeps its width when the label changes -->
      <span class="grid">
        <span class="invisible col-start-1 row-start-1" aria-hidden="true">Copy profile link</span>
        <span class="col-start-1 row-start-1 text-center">{{ copied() === 'link' ? 'Link copied' : 'Copy profile link' }}</span>
      </span>
    </button>

    <ng-template #preview>
          @if (cardPeriods().length > 1) {
            <app-period-tabs class="self-start" [period]="cardPeriod()" [periods]="cardPeriods()" label="Period of the card" (periodChange)="pick($event)" />
          }
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <app-country-select class="shrink-0" [countries]="allCountries" [value]="flag()" [allLabel]="flagLabel()" ariaLabel="Country on the card" [showCounts]="false" (valueChange)="pickFlag($event)" />
            <p class="text-xs text-pretty text-muted-foreground">
              Your <a href="https://github.com/settings/profile" target="_blank" rel="noopener" class="font-medium text-foreground">GitHub location</a>
              @if (country(); as code) { says {{ name(code) }}. From elsewhere? Pick yours. } @else { is empty. Pick a country for a flag. }
            </p>
          </div>
          <!-- The card's own background while it loads. Changing the period keeps the card on screen (the avatar and the
               name do not change) and only the parts that do (the rank, the points, the four stats) shimmer until the
               new one fades in over it. -->
          <div class="relative aspect-[1200/630] w-full overflow-hidden rounded-md bg-neutral-950 ring-1 ring-border">
            @if (shownUrl(); as shown) {
              <img [src]="shown" alt="" aria-hidden="true" width="1200" height="630" class="absolute inset-0 size-full transition-opacity duration-200" [class.animate-pulse]="cardState() === 'loading'" [class.opacity-50]="cardState() === 'loading'" />
            }
            @for (url of [previewUrl()]; track url) {
              <img [src]="url" [alt]="username() + '’s Angularian card'" width="1200" height="630"
                class="relative size-full transition-opacity duration-300" [class.opacity-0]="cardState() !== 'loaded'"
                (load)="loaded(url)" (error)="cardState.set('error')" />
            }
            @if (cardState() === 'loading') {
              <div class="absolute inset-0" role="status">
                <span class="sr-only">Loading the card</span>
                @if (!shownUrl()) {
                  @for (tile of tileBoxes; track $index) {
                    <div class="absolute rounded-[4%/8%] ring-1 ring-white/10" [style.left.%]="tile.left" [style.top.%]="tile.top" [style.width.%]="tile.width" [style.height.%]="tile.height" aria-hidden="true"></div>
                  }
                  @for (shape of skeletonBoxes; track $index) {
                    <div hlmSkeleton class="absolute bg-white/10" [class.rounded-full]="shape.round" [style.left.%]="shape.left" [style.top.%]="shape.top" [style.width.%]="shape.width" [style.height.%]="shape.height" aria-hidden="true"></div>
                  }
                }
              </div>
            } @else if (cardState() === 'error') {
              <div class="absolute inset-0 flex items-center justify-center gap-2 bg-neutral-950 text-sm text-neutral-400" role="status">
                <ng-icon name="remixImageLine" aria-hidden="true" /> The card could not be loaded
              </div>
            }
          </div>
    </ng-template>

    <hlm-dialog (stateChanged)="opened($event)">
      <button hlmDialogTrigger hlmBtn variant="secondary" type="button">
        <ng-icon name="remixShareLine" size="1.25rem" aria-hidden="true" /> Share card
      </button>
      <hlm-dialog-content *hlmDialogPortal class="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>Share your <span class="brand text-primary">Angularian</span> card</h2>
          <p hlmDialogDescription>Download it or post it. The link shows the card as its preview.</p>
        </hlm-dialog-header>
        <div class="flex flex-col gap-4">
          <ng-container [ngTemplateOutlet]="preview" />
          <div class="flex flex-wrap gap-2">
            <a hlmBtn variant="secondary" [href]="previewUrl()" [attr.download]="fileName()"><ng-icon name="remixDownloadLine" aria-hidden="true" /> Download</a>
            <a hlmBtn variant="secondary" [href]="shareLinks().x" target="_blank" rel="noopener"><ng-icon name="simpleX" aria-hidden="true" /> Post on X</a>
            <a hlmBtn variant="secondary" [href]="shareLinks().linkedin" target="_blank" rel="noopener"><ng-icon name="remixLinkedinBoxFill" aria-hidden="true" /> LinkedIn</a>
            <a hlmBtn variant="secondary" [href]="shareLinks().bluesky" target="_blank" rel="noopener"><ng-icon name="simpleBluesky" aria-hidden="true" /> Bluesky</a>
          </div>
        </div>
      </hlm-dialog-content>
    </hlm-dialog>

    <hlm-dialog (stateChanged)="opened($event)">
      <button hlmDialogTrigger hlmBtn variant="secondary" type="button">
        <ng-icon name="remixMarkdownLine" size="1.25rem" aria-hidden="true" /> Add to README
      </button>
      <hlm-dialog-content *hlmDialogPortal class="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>Add your <span class="brand text-primary">Angularian</span> card to GitHub</h2>
          <p hlmDialogDescription>Paste this Markdown in your GitHub profile README. The card updates every day.</p>
        </hlm-dialog-header>
        <div class="flex flex-col gap-4">
          <ng-container [ngTemplateOutlet]="preview" />
          <textarea readonly rows="3" class="w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Markdown of the card" (focus)="select($event)">{{ markdown() }}</textarea>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <a class="text-sm text-primary transition-opacity hover:opacity-80" target="_blank" rel="noopener"
              href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme">How to set up a profile README</a>
            <button hlmBtn type="button" (click)="copyMarkdown()">
              <ng-icon [name]="copied() === 'markdown' ? 'remixCheckLine' : 'remixFileCopyLine'" aria-hidden="true" />
              <span class="grid">
                <span class="invisible col-start-1 row-start-1" aria-hidden="true">Markdown copied</span>
                <span class="col-start-1 row-start-1 text-center">{{ copied() === 'markdown' ? 'Markdown copied' : 'Copy Markdown' }}</span>
              </span>
            </button>
          </div>
        </div>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class Share {
  readonly username = input.required<string>()
  /** The link and the card share the period on screen (all time by default). */
  readonly period = input<Period>('all')
  /** The periods the contributor is in: the README card can show any of them. */
  readonly periods = input<readonly Period[]>([])
  /** The country of the GitHub location, when it has one. */
  readonly country = input<string | null | undefined>(null)

  protected readonly copied = signal<'link' | 'markdown' | null>(null)
  /** The card renders on demand: its background and a loader meanwhile. */
  protected readonly tileBoxes = TILE_BOXES
  protected readonly skeletonBoxes = SKELETON_BOXES
  protected readonly cardState = signal<'loading' | 'loaded' | 'error'>('loading')
  /** The last card that loaded: it stays under the next one while that renders. */
  protected readonly shownUrl = signal<string | null>(null)
  protected readonly cardPeriod = linkedSignal(() => this.period())
  /** A country picked for this card only. `null`: the GitHub location. */
  protected readonly flag = signal<string | null>(null)
  protected readonly allCountries = Object.keys(COUNTRIES).map(code => ({ code, count: 0, top: [] }))
  protected readonly name = countryName
  protected readonly flagLabel = computed(() => {
    const country = this.country()
    return country ? `GitHub: ${countryName(country)}` : 'No flag'
  })
  protected readonly cardPeriods = computed(() => sortPeriods(['all', ...this.periods()]))

  private readonly profileUrl = computed(() => `${SITE_URL}/${this.username()}${query(this.period())}`)
  protected readonly cardUrl = computed(() => `${SITE_URL}/${this.username()}/card.png${query(this.cardPeriod(), this.flag())}`)
  /** The same card from this site: right on a preview deploy or locally too. The Markdown keeps the public address. */
  protected readonly previewUrl = computed(() => {
    const period = this.cardPeriod()
    const flag = this.flag()
    return `/${this.username()}/card.png?v=${CARD_DESIGN}${period === 'all' ? '' : `&period=${period}`}${flag ? `&flag=${flag}` : ''}`
  })
  protected readonly fileName = computed(() => `${this.username()}-angularian${this.cardPeriod() === 'all' ? '' : `-${this.cardPeriod()}`}.png`)
  /** The profile's link preview is this card, so a post only needs the link. */
  protected readonly shareLinks = computed(() => {
    const period = this.cardPeriod()
    const url = `${SITE_URL}/${this.username()}${query(period, this.flag())}`
    const text = `My contributions to Angular${period === 'all' ? '' : ` ${periodPhrase(period)}`} on Angularians`
    return {
      x: `https://x.com/intent/post?${new URLSearchParams({ text, url })}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url })}`,
      bluesky: `https://bsky.app/intent/compose?${new URLSearchParams({ text: `${text} ${url}` })}`,
    }
  })
  protected readonly markdown = computed(() => {
    const alt = `${this.username()}'s Angularian profile${this.cardPeriod() === 'all' ? '' : ` ${periodPhrase(this.cardPeriod())}`}`
    return `[![${alt}](${this.cardUrl()})](${SITE_URL}/${this.username()}${query(this.cardPeriod(), this.flag())})`
  })

  private timer: ReturnType<typeof setTimeout> | undefined

  protected opened(state: string): void {
    if (state !== 'open') return
    this.cardPeriod.set(this.period())
    this.flag.set(null)
    this.shownUrl.set(null)
    this.startLoading()
  }

  protected pick(value: Period | null | undefined): void {
    if (!value || value === this.cardPeriod()) return
    this.cardPeriod.set(value)
    this.startLoading()
  }

  protected pickFlag(code: string | null): void {
    if (code === this.flag()) return
    this.flag.set(code)
    this.startLoading()
  }

  private loadingSince = 0
  private loadedTimer: ReturnType<typeof setTimeout> | undefined

  private startLoading(): void {
    clearTimeout(this.loadedTimer)
    this.loadingSince = Date.now()
    this.cardState.set('loading')
  }

  protected loaded(url: string): void {
    clearTimeout(this.loadedTimer)
    this.loadedTimer = setTimeout(() => {
      // A later pick may have started another card meanwhile: only the one on screen counts.
      if (url !== this.previewUrl()) return
      this.cardState.set('loaded')
      this.shownUrl.set(url)
    }, Math.max(0, MIN_LOADING_MS - (Date.now() - this.loadingSince)))
  }


  protected select(event: Event): void {
    (event.target as HTMLTextAreaElement).select()
  }

  protected copyLink(): void {
    void this.copy(this.profileUrl(), 'link')
  }

  protected copyMarkdown(): void {
    void this.copy(this.markdown(), 'markdown')
  }

  private async copy(text: string, what: 'link' | 'markdown'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
    }
    catch {
      return
    }
    this.copied.set(what)
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.copied.set(null), 2000)
  }
}
