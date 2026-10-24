/**
 * Stackra file contract:
 * Purpose: the native `Drawer.Close`: HeroUI Native's bottom-sheet close button, which closes the sheet before it
 *          calls the caller's `onPress`; named by the required `label`, which HeroUI Native leaves unset.
 * Boundary: reached as `Drawer.Close`; the barrel exports only its props type. It is the same contract as
 *           `CloseButton`, so an icon of its own and the disabled state work the same. It must sit inside the drawer.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.5.8 and 4.1.2.
 */
import { BottomSheet, type BottomSheetCloseProps as HeroSheetCloseProps } from "heroui-native";
import type { ReactElement } from "react";

import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SlotIcon } from "#native/slot-icon/slot-icon";

/**
 * Props of the native Drawer.Close: the close-button contract plus HeroUI Native's own close props, passed through.
 * HeroUI's accessibility name is the contract's `label`, and its children are the contract's `icon`.
 */
export type DrawerCloseProps = CloseButtonContractProps &
  DistributiveOmit<
    HeroSheetCloseProps,
    keyof CloseButtonContractProps | "children" | "accessibilityLabel" | "aria-label"
  >;

/** The button that closes the drawer. Without an `icon` it draws HeroUI Native's close mark. */
export function DrawerClose({
  label,
  icon,
  isDisabled,
  onPress,
  ...rest
}: DrawerCloseProps): ReactElement {
  return (
    <BottomSheet.Close
      {...rest}
      {...omitUndefined({ isDisabled, onPress })}
      accessibilityLabel={label}
    >
      {icon === undefined ? undefined : <SlotIcon icon={icon} />}
    </BottomSheet.Close>
  );
}
