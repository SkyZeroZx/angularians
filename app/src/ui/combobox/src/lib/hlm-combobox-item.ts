import { Directive } from "@angular/core";
import { BrnComboboxItem } from "@spartan-ng/brain/combobox";
import { classes } from "@spartan-ng/helm/utils";

@Directive({
  selector: "[hlmComboboxItem]",
  hostDirectives: [{ directive: BrnComboboxItem, inputs: ["id", "disabled", "value"] }],
  host: { "data-slot": "combobox-item" },
})
export class HlmComboboxItem {
  constructor() {
    classes(
      () =>
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground data-highlighted:**:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none data-hidden:hidden [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
    );
  }
}
