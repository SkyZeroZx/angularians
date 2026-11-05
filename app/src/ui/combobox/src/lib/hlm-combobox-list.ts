import { Directive } from "@angular/core";
import { BrnComboboxList } from "@spartan-ng/brain/combobox";
import { classes } from "@spartan-ng/helm/utils";

@Directive({
  selector: "[hlmComboboxList]",
  hostDirectives: [BrnComboboxList],
  host: { "data-slot": "combobox-list" },
})
export class HlmComboboxList {
  constructor() {
    classes(() => "no-scrollbar min-h-0 flex-1 scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:hidden");
  }
}
