import { Directive } from "@angular/core";
import { BrnComboboxAnchor, BrnComboboxPopoverTrigger } from "@spartan-ng/brain/combobox";
import { classes } from "@spartan-ng/helm/utils";

@Directive({
  selector: "button[hlmComboboxTrigger]",
  hostDirectives: [BrnComboboxAnchor, BrnComboboxPopoverTrigger],
  host: { "data-slot": "combobox-trigger" },
})
export class HlmComboboxTrigger {
  constructor() {
    classes(
      () =>
        "border-input dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 items-center justify-between gap-1.5 rounded-md border bg-transparent py-2 ps-2.5 pe-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
    );
  }
}
