// Ported from nuxt.com `app/components/nuxters/NuxtersSearch.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { DOCUMENT } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core'
import { Router } from '@angular/router'
import { injectServerFnMutation } from '@analogjs/router'
import type { ContributorSummary, Period } from '@angular-contributors/shared'
import { HlmAutocompleteImports } from '@spartan-ng/helm/autocomplete'
import { HlmKbd } from '@spartan-ng/helm/kbd'
import { searchContributors } from '../data/contributors.server'
import { avatarUrl, formatNumber, formatPoints, profileQuery } from './format'

const DEBOUNCE_MS = 200

/** Search everyone, all time. Nothing loads until you type; `/` focuses it. */
@Component({
  selector: 'app-contributor-search',
  imports: [HlmAutocompleteImports, HlmKbd],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-autocomplete [search]="term()" (searchChange)="term.set($event ?? '')" (valueChange)="open($event)" [itemToString]="username" class="w-full sm:w-64">
      <label [for]="inputId" class="sr-only">Search a contributor</label>
      <hlm-autocomplete-input #input [inputId]="inputId" placeholder="Search a contributor">
        @if (!term()) {
          <kbd hlmKbd class="me-2 hidden sm:inline-flex" aria-hidden="true">/</kbd>
        }
      </hlm-autocomplete-input>
      <hlm-autocomplete-content *hlmAutocompletePortal>
        <hlm-autocomplete-empty>{{ term().trim() && !loading() ? 'Nobody found' : 'Type a GitHub username' }}</hlm-autocomplete-empty>
        <div hlmAutocompleteList aria-label="Contributors">
          @for (item of results(); track item.githubId) {
            <hlm-autocomplete-item [value]="item">
              <img [src]="avatar(item)" alt="" width="24" height="24" class="size-6 rounded-md bg-muted" loading="lazy" />
              <span class="flex-1 truncate">{{ item.username }}</span>
              <span class="text-xs text-muted-foreground tabular-nums">#{{ rank(item) }} · {{ points(item) }}</span>
            </hlm-autocomplete-item>
          }
        </div>
      </hlm-autocomplete-content>
    </hlm-autocomplete>
  `,
})
export class ContributorSearch {
  /** The profile opens on this period. */
  readonly period = input.required<Period>()

  private readonly router = inject(Router)
  private readonly document = inject(DOCUMENT)
  private readonly search = injectServerFnMutation(searchContributors)
  private readonly input = viewChild('input', { read: ElementRef })

  protected readonly inputId = 'contributor-search'
  protected readonly term = signal('')
  protected readonly results = signal<ContributorSummary[]>([])
  protected readonly loading = signal(false)
  protected readonly username = (item: ContributorSummary | null) => item?.username ?? ''
  protected readonly avatar = (item: ContributorSummary) => avatarUrl(item.githubId, 24)
  protected readonly rank = (item: ContributorSummary) => formatNumber(item.rank)
  protected readonly points = (item: ContributorSummary) => formatPoints(item.score)

  private request = 0

  constructor() {
    // One request per pause in typing; a slower, older answer never replaces a newer one.
    effect((onCleanup) => {
      const query = this.term().trim()
      const current = ++this.request
      if (!query) {
        this.results.set([])
        this.loading.set(false)
        return
      }
      this.loading.set(true)
      const timer = setTimeout(async () => {
        // On an error, no results rather than stale ones.
        const items = await this.search({ q: query }).catch(() => [])
        if (current !== this.request) return
        this.results.set(items)
        this.loading.set(false)
      }, DEBOUNCE_MS)
      onCleanup(() => clearTimeout(timer))
    })

    const onKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]')
      if (event.key !== '/' || typing || event.metaKey || event.ctrlKey || event.altKey) return
      event.preventDefault()
      this.input()?.nativeElement.querySelector('input')?.focus()
    }
    this.document.addEventListener('keydown', onKeydown)
    inject(DestroyRef).onDestroy(() => this.document.removeEventListener('keydown', onKeydown))
  }

  protected open(item: unknown): void {
    if (!item || typeof item !== 'object' || !('username' in item)) return
    const { username } = item as ContributorSummary
    this.term.set('')
    this.results.set([])
    void this.router.navigate(['/', username], { queryParams: profileQuery(this.period()) })
  }
}
