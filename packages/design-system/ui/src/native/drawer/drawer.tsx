/**
 * Stackra file contract:
 * Purpose: the native `Drawer`, the adapted form of the web one: a phone has no side panel for a task, so the drawer
 *          is HeroUI Native's BottomSheet (a `@gorhom/bottom-sheet` panel with a drag handle) drawn from the bottom
 *          edge, with the contract's names: `isDefaultOpen` is `defaultOpen`, and the overlay's `isCloseOnPress` and
 *          the sheet's `enablePanDownToClose` are both `isDismissable`. Every other HeroUI Native sheet-content prop
 *          (`snapPoints`, `index`, `detached` and so on) passes through.
 * Boundary: built on HeroUI Native's free BottomSheet only. `placement` narrows to `bottom`: it is accepted so one
 *           call site serves web and native, and read for nothing else. HeroUI Native's sheet has no Escape key and
 *           does not handle the Android back button, so `isKeyboardDismissDisabled` is unread here and the app
 *           handles back itself. Header, Body and Footer are the adapted forms shared with `Modal`; Title and Close
 *           are HeroUI Native's, with the contract's props. The portal asks iOS VoiceOver to stay inside the sheet
 *           (`unstable_accessibilityContainerViewIsModal`, which HeroUI Native marks unstable). Needs the app's
 *           `HeroUINativeProvider`, GestureHandlerRootView and the `@gorhom/bottom-sheet` peer.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI Native
 *          on native); owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import { BottomSheet } from "heroui-native";
import type { ReactElement } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { DrawerClose } from "#native/drawer/drawer-close";
import { DrawerTitle } from "#native/drawer/drawer-title";
import { ModalBody } from "#native/modal/modal-body";
import { ModalFooter } from "#native/modal/modal-footer";
import { ModalHeader } from "#native/modal/modal-header";
import type { DrawerProps } from "#native/drawer/drawer.props";

/** The drawer root: HeroUI Native's bottom-sheet parts in one, holding the caller's parts. */
function DrawerRoot({
  children,
  trigger,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable = true,
  isKeyboardDismissDisabled: _isKeyboardDismissDisabled,
  placement: _placement,
  label,
  ...rest
}: DrawerProps): ReactElement {
  // Owner decision 2026-10-24: every native sheet is HeroUI Native's inset style, detached and clear of the home bar.
  const insets = useSafeAreaInsets();
  return (
    <BottomSheet
      {...omitUndefined({ isOpen, onOpenChange })}
      {...(defaultOpen === undefined ? {} : { isDefaultOpen: defaultOpen })}
    >
      {trigger ? <BottomSheet.Trigger asChild>{trigger}</BottomSheet.Trigger> : null}
      <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
        <BottomSheet.Overlay isCloseOnPress={isDismissable} />
        <BottomSheet.Content
          detached
          bottomInset={insets.bottom + 12}
          className="mx-4"
          backgroundClassName="rounded-4xl"
          {...rest}
          enablePanDownToClose={isDismissable}
          {...(label ? { accessibilityLabel: label } : {})}
        >
          {children}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

/** The parts of the compound. */
interface DrawerParts {
  /** The header: a column for the title. */
  readonly Header: typeof ModalHeader;
  /** The title, a heading-role text. */
  readonly Title: typeof DrawerTitle;
  /** The body: a column for the content. */
  readonly Body: typeof ModalBody;
  /** The footer: a row for actions. */
  readonly Footer: typeof ModalFooter;
  /** The button that closes the drawer, named by its required `label`. */
  readonly Close: typeof DrawerClose;
}

/**
 * A drawer: on native, a bottom sheet over a backdrop that blocks the screen until it closes. Open it from a
 * `trigger`, or drive it with `isOpen` and `onOpenChange`; fill it with `Drawer.Header`, `Drawer.Title`,
 * `Drawer.Body`, `Drawer.Footer` and `Drawer.Close`.
 */
export const Drawer: typeof DrawerRoot & DrawerParts = Object.assign(DrawerRoot, {
  Header: ModalHeader,
  Title: DrawerTitle,
  Body: ModalBody,
  Footer: ModalFooter,
  Close: DrawerClose,
});
