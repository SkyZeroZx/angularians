import { Directive } from "@angular/core";
import { BrnComboboxContent } from "@spartan-ng/brain/combobox";
import { classes } from "@spartan-ng/helm/utils";

@Directive({
  selector: "[hlmComboboxContent]",
  hostDirectives: [BrnComboboxContent],
  host: { "data-slot": "combobox-content" },
})
export class HlmComboboxContent {
  constructor() {
    classes(
      () =>
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ring-foreground/10 group/combobox flex max-h-80 w-(--brn-combobox-width) flex-col overflow-hidden rounded-md shadow-md ring-1 duration-100",
    );
  }
}
