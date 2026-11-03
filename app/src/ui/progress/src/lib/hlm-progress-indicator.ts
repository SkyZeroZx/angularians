import { Directionality } from "@angular/cdk/bidi";
import { Directive, computed, inject } from "@angular/core";
import {
  BrnProgressIndicator,
  injectBrnProgress,
} from "@spartan-ng/brain/progress";
import { classes } from "@spartan-ng/helm/utils";

@Directive({
  selector: "[hlmProgressIndicator],hlm-progress-indicator",
  exportAs: "hlmProgressIndicator",
  hostDirectives: [BrnProgressIndicator],
  host: {
    "data-slot": "progress-indicator",
    "[class.animate-indeterminate]": "_indeterminate()",
    "[style.transform]": "_transform()",
  },
})
export class HlmProgressIndicator {
  private readonly _progress = injectBrnProgress();
  private readonly _dir = inject(Directionality);
  // Offset the indicator by the unfilled remainder. In RTL the bar fills from the inline-start
  // (visually the right), so translate the opposite way to keep the fill on the correct side.
  protected readonly _transform = computed(() => {
    // Local fix: the shipped helm used `value` as a percentage and ignored `max`, so any max other
    // than 100 drew a wrong bar (e.g. 99 of 536 drawn full). Fill by value / max instead.
    const value = this._progress.value();
    const max = this._progress.max() || 100;
    const offset = value === null || value === undefined ? 0 : 100 - Math.min(100, Math.max(0, (value / max) * 100));
    return `translateX(${this._dir.valueSignal() === "rtl" ? "" : "-"}${offset}%)`;
  });
  protected readonly _indeterminate = computed(
    () =>
      this._progress.value() === null || this._progress.value() === undefined,
  );

  constructor() {
    classes(() => "bg-primary h-full w-full flex-1 transition-all");
  }
}
