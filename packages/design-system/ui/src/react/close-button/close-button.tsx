/**
 * Stackra file contract:
 * Purpose: the web `CloseButton` on HeroUI v3's CloseButton: the dismiss control, named by the required `label`
 *          instead of HeroUI's English default.
 * Boundary: no styling of its own; the overlay that owns it decides what closing does.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract).
 */
import type { ReactElement } from "react";
import { CloseButton as HeroCloseButton } from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import type { CloseButtonProps } from "#react/close-button/close-button.props";

/** The dismiss button. Without an `icon` it draws HeroUI's close mark. */
export function CloseButton({
  label,
  icon,
  isDisabled,
  onPress,
  ...rest
}: CloseButtonProps): ReactElement {
  return (
    <HeroCloseButton {...rest} {...omitUndefined({ isDisabled, onPress })} aria-label={label}>
      {icon === undefined ? undefined : <SlotIcon icon={icon} />}
    </HeroCloseButton>
  );
}
