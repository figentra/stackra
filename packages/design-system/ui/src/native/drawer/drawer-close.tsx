/**
 * Stackra file contract:
 * Purpose: the native `Drawer.Close`: HeroUI Native's bottom-sheet close button, which closes the sheet before it
 *          calls the caller's `onPress`; named by the required `label`, which HeroUI Native leaves unset.
 * Boundary: reached as `Drawer.Close`; the barrel exports only its props type. It is the same contract as
 *           `CloseButton`, so an icon of its own and the disabled state work the same. It must sit inside the drawer.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.5.8 and 4.1.2.
 */
import { BottomSheet, Dialog } from "heroui-native";
import { use, type ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import type { DrawerCloseProps } from "#native/drawer/drawer-close.props";
import { DrawerLayerContext } from "#native/drawer/drawer-layer-context";

/** The button that closes the drawer. Without an `icon` it draws HeroUI Native's close mark. */
export function DrawerClose({
  label,
  icon,
  isDisabled,
  onPress,
  closeButton,
  ...rest
}: DrawerCloseProps): ReactElement | null {
  // A tablet's side panel is HeroUI Native's Dialog, whose close reads the dialog's state, not the sheet's.
  const Close = use(DrawerLayerContext)?.isPanel ? Dialog.Close : BottomSheet.Close;
  if (closeButton === "none") return null;
  return (
    <Close {...rest} {...omitUndefined({ isDisabled, onPress })} accessibilityLabel={label}>
      {icon === undefined ? undefined : <SlotIcon icon={icon} />}
    </Close>
  );
}
