/**
 * Stackra file contract:
 * Purpose: `CellColorPicker.Trigger` on HeroUI Pro's trigger: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; the button props are HeroUI Pro's (a React Aria button), passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  CellColorPicker as HeroCellColorPicker,
  type CellColorPickerTriggerProps as HeroCellColorPickerTriggerProps,
} from "@heroui-pro/react/cell-color-picker";

import type { CellColorPickerTriggerContractProps } from "#contracts/types/cell-color-picker-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the colour picker trigger: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type CellColorPickerTriggerProps = CellColorPickerTriggerContractProps &
  Omit<HeroCellColorPickerTriggerProps, keyof CellColorPickerTriggerContractProps | "aria-label">;

/** The trigger button: holds the label, the value text and the swatch, and opens the popover. */
export function CellColorPickerTrigger({
  label,
  isDisabled,
  ...rest
}: CellColorPickerTriggerProps) {
  return (
    <HeroCellColorPicker.Trigger
      {...rest}
      {...omitUndefined({ isDisabled, "aria-label": label })}
    />
  );
}
