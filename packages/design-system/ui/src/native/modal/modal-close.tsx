/**
 * Stackra file contract:
 * Purpose: the native `Modal.Close`: HeroUI Native's dialog close button, which closes the dialog before it calls the
 *          caller's `onPress`; named by the required `label`, which HeroUI Native leaves unset.
 * Boundary: reached as `Modal.Close`; the barrel exports only its props type. It is the same contract as `CloseButton`,
 *           so an icon of its own and the disabled state work the same. It must sit inside the modal.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.5.8 and 4.1.2.
 */
import { Dialog, type DialogCloseProps as HeroDialogCloseProps } from "heroui-native";
import type { ReactElement } from "react";

import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SlotIcon } from "#native/slot-icon/slot-icon";

/**
 * Props of the native Modal.Close: the close-button contract plus HeroUI Native's own close props, passed through.
 * HeroUI's accessibility name is the contract's `label`, and its children are the contract's `icon`.
 */
export type ModalCloseProps = CloseButtonContractProps &
  DistributiveOmit<
    HeroDialogCloseProps,
    keyof CloseButtonContractProps | "children" | "accessibilityLabel" | "aria-label"
  >;

/** The button that closes the modal. Without an `icon` it draws HeroUI Native's close mark. */
export function ModalClose({
  label,
  icon,
  isDisabled,
  onPress,
  ...rest
}: ModalCloseProps): ReactElement {
  return (
    <Dialog.Close {...rest} {...omitUndefined({ isDisabled, onPress })} accessibilityLabel={label}>
      {icon === undefined ? undefined : <SlotIcon icon={icon} />}
    </Dialog.Close>
  );
}
