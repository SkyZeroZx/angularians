import { Component, computed, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixEyeLine } from '@ng-icons/remixicon'
import { simpleGithub } from '@ng-icons/simple-icons'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { CARD_DESIGN } from './share'

/** The real card of a profile, for someone signed out: signing in is what unlocks sharing it. */
@Component({
  selector: 'app-card-preview',
  imports: [HlmButton, HlmDialogImports, NgIcon],
  providers: [provideIcons({ remixEyeLine, simpleGithub })],
  host: { class: 'contents' },
  template: `
    <hlm-dialog>
      <button hlmDialogTrigger hlmBtn variant="outline" type="button"><ng-icon name="remixEyeLine" aria-hidden="true" /> See the card</button>
      <hlm-dialog-content *hlmDialogPortal class="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>The <span class="brand text-primary">Angularian</span> card</h2>
          <p hlmDialogDescription>Sign in with GitHub as {{ username() }} to download it or share it.</p>
        </hlm-dialog-header>
        <img [src]="image()" [alt]="username() + '’s Angularian card'" width="1200" height="630" class="block h-auto w-full rounded-lg bg-muted ring-1 ring-border" />
        <div class="flex justify-end">
          <a hlmBtn class="bg-foreground text-background hover:bg-foreground/90" [href]="signInUrl()"><ng-icon name="simpleGithub" aria-hidden="true" /> Sign in to share</a>
        </div>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class CardPreview {
  readonly username = input.required<string>()
  readonly signInUrl = input.required<string>()
  protected readonly image = computed(() => `/${encodeURIComponent(this.username())}/card.png?v=${CARD_DESIGN}`)
}
