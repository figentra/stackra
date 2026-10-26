/**
 * Stackra file contract:
 * Purpose: the native `Modal` on HeroUI Native's Dialog: one root that draws the dialog's root, trigger, portal,
 *          overlay and content around the caller's parts, with the contract's names: `isDefaultOpen` is `defaultOpen`,
 *          the overlay's `isCloseOnPress` and the content's `isSwipeable` are both `isDismissable`, and `size` and
 *          `position` become classes on the content and the portal. Every other HeroUI Native content prop passes
 *          through.
 * Boundary: no styling beyond those classes; the look is HeroUI Native's. Header, Body and Footer are the adapted
 *           forms in `modal-section`; Title and Close are HeroUI Native's, with the contract's props. A string child
 *           of those sections is wrapped in `Text`. The Android back button is the phone's Escape key: with
 *           `isKeyboardDismissDisabled` it is swallowed (see `back-button-block`); iOS has none. The portal asks iOS
 *           VoiceOver to stay inside the dialog (`unstable_accessibilityContainerViewIsModal`, which HeroUI Native
 *           marks unstable). The classes are literal strings so the app's Tailwind scan finds them; the app's CSS
 *           must include this package as a source. Needs the app's `HeroUINativeProvider` (the portal host).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI Native on native);
 *          owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import { Dialog } from "heroui-native";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { BackButtonBlock } from "#native/modal/back-button-block";
import { ModalClose } from "#native/modal/modal-close";
import { ModalBody } from "#native/modal/modal-body";
import { ModalFooter } from "#native/modal/modal-footer";
import { ModalHeader } from "#native/modal/modal-header";
import { ModalTitle } from "#native/modal/modal-title";
import type { ModalProps } from "#native/modal/modal.props";

/** The dialog's width by `size`: a cap and centring, or the whole screen. */
const SIZE_CLASS_NAME = {
  sm: "w-full max-w-[320px] self-center",
  md: "w-full max-w-[448px] self-center",
  lg: "w-full max-w-[576px] self-center",
  full: "flex-1 self-stretch rounded-none",
} as const;

/** The portal's vertical alignment by `position`; the portal centres its content unless told otherwise. */
const POSITION_CLASS_NAME = {
  auto: "",
  center: "",
  top: "justify-start",
  bottom: "justify-end",
} as const;

/** The modal root: HeroUI Native's dialog parts in one, holding the caller's parts. */
function ModalRoot({
  children,
  trigger,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  size = "md",
  position = "auto",
  label,
  className,
  ...rest
}: ModalProps): ReactElement {
  // A full-screen dialog drops the portal's padding along with its radius.
  const portalClassName = [POSITION_CLASS_NAME[position], size === "full" ? "p-0" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <Dialog
      {...omitUndefined({ isOpen, onOpenChange })}
      {...(defaultOpen === undefined ? {} : { isDefaultOpen: defaultOpen })}
    >
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal className={portalClassName} unstable_accessibilityContainerViewIsModal>
        <Dialog.Overlay isCloseOnPress={isDismissable} />
        <Dialog.Content
          {...rest}
          className={[SIZE_CLASS_NAME[size], className].filter(Boolean).join(" ")}
          isSwipeable={isDismissable}
          {...(label ? { accessibilityLabel: label } : {})}
        >
          {children}
        </Dialog.Content>
        <BackButtonBlock isBlocked={isKeyboardDismissDisabled} />
      </Dialog.Portal>
    </Dialog>
  );
}

/** The parts of the compound. */
interface ModalParts {
  /** The header: a column for the title. */
  readonly Header: typeof ModalHeader;
  /** The title, a heading-role text that also names the dialog. */
  readonly Title: typeof ModalTitle;
  /** The body: a column for the content. */
  readonly Body: typeof ModalBody;
  /** The footer: a row for actions. */
  readonly Footer: typeof ModalFooter;
  /** The button that closes the modal, named by its required `label`. */
  readonly Close: typeof ModalClose;
}

/**
 * A modal dialog: a centred panel over a backdrop that blocks the screen until it closes. Open it from a `trigger`,
 * or drive it with `isOpen` and `onOpenChange`; fill it with `Modal.Header`, `Modal.Title`, `Modal.Body`,
 * `Modal.Footer` and `Modal.Close`.
 */
export const Modal: typeof ModalRoot & ModalParts = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Title: ModalTitle,
  Body: ModalBody,
  Footer: ModalFooter,
  Close: ModalClose,
});
