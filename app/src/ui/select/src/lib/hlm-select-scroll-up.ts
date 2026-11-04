import { Component } from "@angular/core";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { remixArrowUpSLine } from "@ng-icons/remixicon";
import { BrnSelectScrollUp } from "@spartan-ng/brain/select";
import { classes } from "@spartan-ng/helm/utils";

@Component({
  selector: "hlm-select-scroll-up",
  exportAs: "hlmSelectScrollUp",
  imports: [NgIcon],
  providers: [provideIcons({ remixArrowUpSLine })],
  hostDirectives: [BrnSelectScrollUp],
  template: ` <ng-icon name="remixArrowUpSLine" /> `,
})
export class HlmSelectScrollUp {
  constructor() {
    classes(
      () =>
        "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] sticky top-0 w-full data-hidden:hidden",
    );
  }
}
