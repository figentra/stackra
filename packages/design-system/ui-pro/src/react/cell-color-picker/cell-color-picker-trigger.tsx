/**
 * Stackra file contract:
 * Purpose: `CellColorPicker.Trigger` on HeroUI Pro's trigger: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; the button props are HeroUI Pro's (a React Aria button), passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import { CellColorPicker as HeroCellColorPicker } from "@heroui-pro/react/cell-color-picker";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { CellColorPickerTriggerProps } from "#react/cell-color-picker/cell-color-picker-trigger.props";

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
