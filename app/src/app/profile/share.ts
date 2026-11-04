// Ported from nuxt.com `app/components/nuxters/NuxtersShare.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core'
import { periodLabel, periodPhrase, sortPeriods, type Period } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideCheck, lucideCopy, lucideIdCard, lucideImageOff, lucideLink } from '@ng-icons/lucide'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { HlmSkeleton } from '@spartan-ng/helm/skeleton'
import { SITE_URL } from '../site'

/** The skeleton shows at least this long, so a fast card does not flicker it. */
const MIN_LOADING_MS = 500

const query = (period?: Period) => (!period || period === 'all' ? '' : `?period=${period}`)

/** Copy the profile link, or the Markdown of the Angularian card for a GitHub profile README. */
@Component({
  selector: 'app-share',
  imports: [HlmButton, HlmDialogImports, HlmSelectImports, HlmSkeleton, NgIcon],
  providers: [provideIcons({ lucideCheck, lucideCopy, lucideIdCard, lucideImageOff, lucideLink })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap items-center gap-2' },
  template: `
    <button hlmBtn variant="secondary" size="sm" type="button" (click)="copyLink()">
      <ng-icon [name]="copied() === 'link' ? 'lucideCheck' : 'lucideLink'" aria-hidden="true" />
      {{ copied() === 'link' ? 'Profile link copied' : 'Copy profile link' }}
    </button>

    <hlm-dialog (stateChanged)="opened($event)">
      <button hlmDialogTrigger hlmBtn variant="secondary" size="sm" type="button">
        <ng-icon name="lucideIdCard" aria-hidden="true" /> Add to README
      </button>
      <hlm-dialog-content *hlmDialogPortal class="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>Add your <span class="brand">Angularian</span> card to GitHub</h2>
          <p hlmDialogDescription>Paste this Markdown in your GitHub profile README. The card updates every day.</p>
        </hlm-dialog-header>
        <div class="flex flex-col gap-4">
          @if (periodItems().length > 1) {
            <div class="flex items-center justify-between gap-4">
              <span id="share-period-label" class="text-sm font-medium">Period</span>
              <!-- The site's select (as the board's Year), not the browser's -->
              <hlm-select [value]="cardPeriod()" (valueChange)="pick($event)" [itemToString]="periodName">
                <hlm-select-trigger class="w-44" size="sm" buttonAriaLabel="Period of the card">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  @for (item of periodItems(); track item.value) {
                    <hlm-select-item [value]="item.value">{{ item.label }}</hlm-select-item>
                  }
                </hlm-select-content>
              </hlm-select>
            </div>
          }
          <!-- The card's own background while it loads. Changing the period keeps the card on screen (the avatar and the
               name do not change) and only the parts that do (the rank, the points, the four stats) shimmer until the
               new one fades in over it. -->
          <div class="relative aspect-[1200/630] w-full overflow-hidden rounded-md bg-neutral-950 ring-1 ring-border">
            @if (shownUrl(); as shown) {
              <img [src]="shown" alt="" aria-hidden="true" width="1200" height="630" class="absolute inset-0 size-full" />
            }
            @for (url of [previewUrl()]; track url) {
              <img [src]="url" [alt]="username() + '’s Angularian card'" width="1200" height="630"
                class="relative size-full transition-opacity duration-300" [class.opacity-0]="cardState() !== 'loaded'"
                (load)="loaded(url)" (error)="cardState.set('error')" />
            }
            @if (cardState() === 'loading') {
              <div class="absolute inset-0 flex gap-[5.3%] p-[5.3%]" role="status">
                <span class="sr-only">Loading the card</span>
                @if (shownUrl()) {
                  <!-- A card is shown: only the rank and the points change on the left (measured on the 1200 × 630 card) -->
                  <div hlmSkeleton class="absolute top-[54%] left-[9%] h-[15%] w-[24%] rounded-md bg-neutral-950/80" aria-hidden="true"></div>
                  <div class="w-[31.7%]" aria-hidden="true"></div>
                } @else {
                  <div class="flex w-[31.7%] flex-col items-center gap-[6%]" aria-hidden="true">
                    <div hlmSkeleton class="aspect-square w-[46%] rounded-full bg-white/10"></div>
                    <div hlmSkeleton class="h-[7%] w-[70%] bg-white/10"></div>
                    <div hlmSkeleton class="h-[5%] w-[55%] bg-white/10"></div>
                    <div hlmSkeleton class="h-[6%] w-[40%] bg-white/10"></div>
                  </div>
                }
                <div class="grid flex-1 grid-cols-2 content-center gap-[5%]" aria-hidden="true">
                  @for (box of [1, 2, 3, 4]; track box) {
                    <div hlmSkeleton class="aspect-[1.35] rounded-xl" [class]="shownUrl() ? 'bg-neutral-950/70' : 'bg-white/10'"></div>
                  }
                </div>
              </div>
            } @else if (cardState() === 'error') {
              <div class="absolute inset-0 flex items-center justify-center gap-2 bg-neutral-950 text-sm text-neutral-400" role="status">
                <ng-icon name="lucideImageOff" aria-hidden="true" /> The card could not be loaded
              </div>
            }
          </div>
          <textarea readonly rows="3" class="w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Markdown of the card" (focus)="select($event)">{{ markdown() }}</textarea>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <a class="text-sm text-primary underline-offset-4 hover:underline" target="_blank" rel="noopener"
              href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme">How to set up a profile README</a>
            <button hlmBtn type="button" (click)="copyMarkdown()">
              <ng-icon [name]="copied() === 'markdown' ? 'lucideCheck' : 'lucideCopy'" aria-hidden="true" />
              {{ copied() === 'markdown' ? 'Markdown copied' : 'Copy Markdown' }}
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

  protected readonly copied = signal<'link' | 'markdown' | null>(null)
  /** The card renders on demand: its background and a loader meanwhile. */
  protected readonly cardState = signal<'loading' | 'loaded' | 'error'>('loading')
  /** The last card that loaded: it stays under the next one while that renders. */
  protected readonly shownUrl = signal<string | null>(null)
  protected readonly cardPeriod = linkedSignal(() => this.period())
  protected readonly periodItems = computed(() => sortPeriods(['all', ...this.periods()]).map(value => ({ value, label: periodLabel(value) })))

  private readonly profileUrl = computed(() => `${SITE_URL}/${this.username()}${query(this.period())}`)
  protected readonly cardUrl = computed(() => `${SITE_URL}/${this.username()}/card.png${query(this.cardPeriod())}`)
  /** The same card from this site: right on a preview deploy or locally too. The Markdown keeps the public address. */
  protected readonly previewUrl = computed(() => `/${this.username()}/card.png${query(this.cardPeriod())}`)
  protected readonly markdown = computed(() => {
    const alt = `${this.username()}'s Angularian profile${this.cardPeriod() === 'all' ? '' : ` ${periodPhrase(this.cardPeriod())}`}`
    return `[![${alt}](${this.cardUrl()})](${SITE_URL}/${this.username()}${query(this.cardPeriod())})`
  })

  private timer: ReturnType<typeof setTimeout> | undefined

  protected opened(state: string): void {
    if (state !== 'open') return
    this.cardPeriod.set(this.period())
    this.shownUrl.set(null)
    this.startLoading()
  }

  protected pick(value: Period | null | undefined): void {
    if (!value || value === this.cardPeriod()) return
    this.cardPeriod.set(value)
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

  protected readonly periodName = (value: Period | null) => (value ? periodLabel(value) : '')

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
