/**
 * Stackra file contract:
 * Purpose: the native `CloseButton` on HeroUI Native's CloseButton (tertiary, small, icon-only, 12 pt hit slop),
 *          named by the required `label`, which HeroUI Native leaves unset.
 * Boundary: no styling of its own; the overlay that owns it decides what closing does.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (HeroUI Native on native).
 */
import {
  CloseButton as HeroCloseButton,
  type CloseButtonProps as HeroCloseButtonProps,
} from "heroui-native";

import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
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
export function CloseButton({ label, icon, isDisabled, onPress, ...rest }: CloseButtonProps) {
  return (
    <HeroCloseButton
      {...rest}
      {...omitUndefined({ isDisabled, onPress })}
      accessibilityLabel={label}
    >
      {icon === undefined ? undefined : <SlotIcon icon={icon} />}
    </HeroCloseButton>
  );
}
