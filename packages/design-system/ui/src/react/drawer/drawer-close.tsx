/**
 * Stackra file contract:
 * Purpose: the web `Drawer.Close`: HeroUI's drawer close trigger, a close button in React Aria's `close` slot, so a
 *          press closes the dialog; named by the required `label` instead of HeroUI's English default.
 * Boundary: reached as `Drawer.Close`; the barrel exports only its props type. It is the same contract as
 *           `CloseButton`, so an icon of its own and the disabled state work the same.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.5.8 and 4.1.2.
 */
import {
  Drawer as HeroDrawer,
  type DrawerCloseTriggerProps as HeroDrawerCloseProps,
} from "@heroui/react";
import type { ReactElement } from "react";

import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/**
 * Props of the web Drawer.Close: the close-button contract plus HeroUI v3's own close-trigger props, passed through.
 * HeroUI's `aria-label` is the contract's `label`, and its children are the contract's `icon`.
 */
export type DrawerCloseProps = CloseButtonContractProps &
  Omit<HeroDrawerCloseProps, keyof CloseButtonContractProps | "children" | "aria-label">;

/** The button that closes the drawer. Without an `icon` it draws HeroUI's close mark. */
export function DrawerClose({
  label,
  icon,
  isDisabled,
  onPress,
  ...rest
}: DrawerCloseProps): ReactElement {
  return (
    <HeroDrawer.CloseTrigger
      {...rest}
      {...omitUndefined({ isDisabled, onPress })}
      aria-label={label}
    >
      {icon === undefined ? undefined : <SlotIcon icon={icon} />}
    </HeroDrawer.CloseTrigger>
  );
}
