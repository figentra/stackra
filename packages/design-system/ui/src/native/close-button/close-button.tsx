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
import {
  CloseButton as HeroCloseButton,
  cn,
  type CloseButtonProps as HeroCloseButtonProps,
} from "heroui-native";

import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useGlassButton } from "#native/glass/use-glass-button";
import { SlotIcon } from "#native/slot-icon/slot-icon";

/**
 * Props of the native CloseButton: the shared contract plus HeroUI Native's own close-button props, passed through
 * (`iconProps`, `size`, `variant`, `hitSlop`, `feedbackVariant` and `animation` among them). HeroUI's accessibility
 * name is the contract's `label`, and its children are the contract's `icon`.
 */
export type CloseButtonProps = CloseButtonContractProps &
  DistributiveOmit<
    HeroCloseButtonProps,
    keyof CloseButtonContractProps | "children" | "accessibilityLabel" | "aria-label"
  >;

/** The dismiss button. Without an `icon` it draws HeroUI Native's close mark. */
export function CloseButton({
  label,
  icon,
  isDisabled,
  onPress,
  className,
  ...rest
}: CloseButtonProps) {
  // HeroUI Native's CloseButton is a tertiary Button unless the caller picks another variant.
  const glass = useGlassButton(rest.variant ?? "tertiary", isDisabled);
  return (
    <HeroCloseButton
      // Before the rest, so a caller's own `background` (or `null`) wins.
      {...(glass ? { background: glass.background } : {})}
      {...rest}
      {...omitUndefined({
        isDisabled,
        onPress,
        className: cn(glass?.className, className) || undefined,
      })}
      accessibilityLabel={label}
    >
      {icon === undefined ? undefined : <SlotIcon icon={icon} />}
    </HeroCloseButton>
  );
}
