import { BrnCombobox, BrnComboboxInput } from "@spartan-ng/brain/combobox";
import { BrnPopover, BrnPopoverContent } from "@spartan-ng/brain/popover";
import { HlmComboboxContent } from "./lib/hlm-combobox-content";
import { HlmComboboxEmpty } from "./lib/hlm-combobox-empty";
import { HlmComboboxItem } from "./lib/hlm-combobox-item";
import { HlmComboboxList } from "./lib/hlm-combobox-list";
import { HlmComboboxTrigger } from "./lib/hlm-combobox-trigger";

export * from "./lib/hlm-combobox-content";
export * from "./lib/hlm-combobox-empty";
export * from "./lib/hlm-combobox-item";
export * from "./lib/hlm-combobox-list";
export * from "./lib/hlm-combobox-trigger";

export const HlmComboboxImports = [
  BrnCombobox,
  BrnComboboxInput,
  BrnPopover,
  BrnPopoverContent,
  HlmComboboxContent,
  HlmComboboxEmpty,
  HlmComboboxItem,
  HlmComboboxList,
  HlmComboboxTrigger,
] as const;
