// Ported from nuxt.com `app/components/nuxters/NuxtersShare.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core'
import { periodLabel, periodPhrase, sortPeriods, type Period } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideCheck, lucideCopy, lucideIdCard, lucideImageOff, lucideLink, lucideLoaderCircle } from '@ng-icons/lucide'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { SITE_URL } from '../site'

const query = (period?: Period) => (!period || period === 'all' ? '' : `?period=${period}`)

/** Copy the profile link, or the Markdown of the Angularian card for a GitHub profile README. */
@Component({
  selector: 'app-share',
  imports: [HlmButton, HlmDialogImports, NgIcon],
  providers: [provideIcons({ lucideCheck, lucideCopy, lucideIdCard, lucideImageOff, lucideLink, lucideLoaderCircle })],
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
          <h2 hlmDialogTitle>Add your Angularian card to GitHub</h2>
          <p hlmDialogDescription>Paste this Markdown in your GitHub profile README. The card updates every day.</p>
        </hlm-dialog-header>
        <div class="flex flex-col gap-4">
          @if (periodItems().length > 1) {
            <label class="flex items-center justify-between gap-4 text-sm font-medium">
              Period
              <select class="h-9 w-44 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                [value]="cardPeriod()" (change)="pick($event)">
                @for (item of periodItems(); track item.value) {
                  <option [value]="item.value" [selected]="item.value === cardPeriod()">{{ item.label }}</option>
                }
              </select>
            </label>
          }
          <!-- The card's own background while it loads -->
          <div class="relative aspect-[1200/630] w-full overflow-hidden rounded-md bg-neutral-950 ring-1 ring-border">
            @for (url of [previewUrl()]; track url) {
              <img [src]="url" [alt]="username() + '’s Angularian card'" width="1200" height="630"
                class="size-full transition-opacity duration-300" [class.opacity-0]="cardState() !== 'loaded'"
                (load)="cardState.set('loaded')" (error)="cardState.set('error')" />
            }
            @if (cardState() !== 'loaded') {
              <div class="absolute inset-0 flex items-center justify-center gap-2 text-sm text-neutral-400" role="status">
                @if (cardState() === 'loading') {
                  <ng-icon name="lucideLoaderCircle" size="1.5rem" class="animate-spin" aria-hidden="true" /><span class="sr-only">Loading the card</span>
                } @else {
                  <ng-icon name="lucideImageOff" aria-hidden="true" /> The card could not be loaded
                }
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
    this.cardState.set('loading')
  }

  protected pick(event: Event): void {
    this.cardPeriod.set((event.target as HTMLSelectElement).value as Period)
    this.cardState.set('loading')
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
