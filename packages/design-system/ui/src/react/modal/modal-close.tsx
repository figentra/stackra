/**
 * Stackra file contract:
 * Purpose: the web `Modal.Close`: HeroUI's modal close trigger, a close button in React Aria's `close` slot, so a
 *          press closes the dialog and the button sits in its corner; named by the required `label` instead of
 *          HeroUI's English default.
 * Boundary: reached as `Modal.Close`; the barrel exports only its props type. It is the same contract as
 *           `CloseButton`, so an icon of its own and the disabled state work the same.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.5.8 and 4.1.2.
 */
import {
  Modal as HeroModal,
  type ModalCloseTriggerProps as HeroModalCloseProps,
} from "@heroui/react";
import type { ReactElement } from "react";

import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/**
 * Props of the web Modal.Close: the close-button contract plus HeroUI v3's own close-trigger props, passed through.
 * HeroUI's `aria-label` is the contract's `label`, and its children are the contract's `icon`.
 */
export type ModalCloseProps = CloseButtonContractProps &
  Omit<HeroModalCloseProps, keyof CloseButtonContractProps | "children" | "aria-label">;

/** The button in the modal's corner that closes it. Without an `icon` it draws HeroUI's close mark. */
export function ModalClose({
  label,
  icon,
  isDisabled,
  onPress,
  ...rest
}: ModalCloseProps): ReactElement {
  return (
    <HeroModal.CloseTrigger
      {...rest}
      {...omitUndefined({ isDisabled, onPress })}
      aria-label={label}
    >
      {icon === undefined ? undefined : <SlotIcon icon={icon} />}
    </HeroModal.CloseTrigger>
  );
}
