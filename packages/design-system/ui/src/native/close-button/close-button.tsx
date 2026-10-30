/**
 * Stackra file contract:
 * Purpose: the native `CloseButton` on HeroUI Native's CloseButton (tertiary, small, icon-only, 12 pt hit slop),
 *          named by the required `label`, which HeroUI Native leaves unset. Its default (tertiary) look is glass,
 *          through the Button's `useGlassButton`, so the two agree.
 * Boundary: no styling of its own beyond the glass; the overlay that owns it decides what closing does.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (HeroUI Native on native); ADR 0319
 *          (the glass close button).
 */
import type { ReactElement } from "react";
import { CloseButton as HeroCloseButton, cn } from "heroui-native";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useGlassButton } from "#native/glass/use-glass-button";
import { withHaptic } from "#native/haptics/with-haptic.function";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import type { CloseButtonProps } from "#native/close-button/close-button.props";

/** The dismiss button. Without an `icon` it draws HeroUI Native's close mark. */
export function CloseButton({
  label,
  icon,
  isDisabled,
  onPress,
  className,
  ...rest
}: CloseButtonProps): ReactElement {
  // HeroUI Native's CloseButton is a tertiary Button unless the caller picks another variant.
  const glass = useGlassButton(rest.variant ?? "tertiary", isDisabled);
  return (
    <HeroCloseButton
      // Before the rest, so a caller's own `background` (or `null`) wins.
      {...(glass ? { background: glass.background } : {})}
      {...rest}
      {...omitUndefined({
        isDisabled,
        onPress: withHaptic("impact", onPress),
        className: cn(glass?.className, className) || undefined,
      })}
      accessibilityLabel={label}
    >
      {icon === undefined ? undefined : <SlotIcon icon={icon} />}
    </HeroCloseButton>
  );
}
