import { Directive } from "@angular/core";
import { BrnComboboxEmpty } from "@spartan-ng/brain/combobox";
import { classes } from "@spartan-ng/helm/utils";

@Directive({
  selector: "[hlmComboboxEmpty]",
  hostDirectives: [BrnComboboxEmpty],
  host: { "data-slot": "combobox-empty" },
})
export class HlmComboboxEmpty {
  constructor() {
    classes(() => "text-muted-foreground hidden py-2 text-center text-sm group-data-empty/combobox:block");
  }
}
