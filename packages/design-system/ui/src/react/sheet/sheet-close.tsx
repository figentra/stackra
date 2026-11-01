/**
 * Stackra file contract:
 * Purpose: the web `Sheet.Close`: HeroUI's sheet close button, named by the required `label`, in the sheet's top
 *          reading-end corner (HeroUI pins it to the physical right; it moves to the left in right-to-left).
 * Boundary: it closes the sheet even when `isDismissable` is false; a footer button closes it with `slot="close"`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.1.1, 2.5.8 and 4.1.2; STA-1371.
 */
import { Sheet as HeroSheet } from "@heroui/react";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { SheetCloseProps } from "#react/sheet/sheet-close.props";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** The button that closes the sheet, named by its required `label`. */
export function SheetClose({
  label,
  icon,
  isDisabled,
  onPress,
  className,
  ...rest
}: SheetCloseProps): ReactElement {
  return (
    <HeroSheet.CloseTrigger
      {...rest}
      {...omitUndefined({ isDisabled, onPress })}
      className={`rtl:right-auto rtl:left-3 ${className ?? ""}`}
      aria-label={label}
    >
      {icon === undefined ? undefined : <SlotIcon icon={icon} />}
    </HeroSheet.CloseTrigger>
  );
}
