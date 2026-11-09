import { Component, computed, input } from '@angular/core'
import { brandParts } from './brand-parts'

/** Text with the word "Angularian(s)" in the brand font. */
@Component({
  selector: 'app-brand-text',
  templateUrl: './brand-text.html',
})
export class BrandText {
  readonly text = input.required<string>()

  protected readonly parts = computed(() => brandParts(this.text()))
}
