/**
 * Stackra file contract:
 * Purpose: the web `Modal` on HeroUI v3's Modal: one root that draws HeroUI's root, backdrop, container and dialog
 *          around the caller's parts, so an app writes `Modal` and its `Header`, `Title`, `Body`, `Footer` and `Close`
 *          and nothing else. It maps the shared contract onto HeroUI (`size`, `position` to HeroUI's `placement`,
 *          `isDismissable` and `isKeyboardDismissDisabled` to the backdrop, `label` to `aria-label`) and passes every
 *          other HeroUI dialog prop through unchanged.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. React Aria traps focus in the
 *           dialog, hides the page behind it from assistive technology and returns focus to the element that opened
 *           it. A footer button with `slot="close"` closes the modal without any state. A route-bound modal and the
 *           stack of overlays are `@stackra/navigation`'s.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI v3 on web); owner
 *          decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import { Modal as HeroModal } from "@heroui/react";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { ModalClose } from "#react/modal/modal-close";
import { ModalTitle } from "#react/modal/modal-title";
import type { ModalProps } from "#react/modal/modal.props";

/** The modal root: HeroUI's root, backdrop, container and dialog in one, holding the caller's parts. */
function ModalRoot({
  children,
  trigger,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable,
  isKeyboardDismissDisabled,
  size,
  position,
  label,
  ...rest
}: ModalProps): ReactElement {
  return (
    <HeroModal.Root {...omitUndefined({ isOpen, defaultOpen, onOpenChange })}>
      {trigger}
      <HeroModal.Backdrop {...omitUndefined({ isDismissable, isKeyboardDismissDisabled })}>
        <HeroModal.Container {...omitUndefined({ size, placement: position })}>
          <HeroModal.Dialog {...rest} {...(label ? { "aria-label": label } : {})}>
            {children}
          </HeroModal.Dialog>
        </HeroModal.Container>
      </HeroModal.Backdrop>
    </HeroModal.Root>
  );
}

/** The parts of the compound, typed from HeroUI's own so the declaration output can name them. */
interface ModalParts {
  /** The header: a column for the title. */
  readonly Header: typeof HeroModal.Header;
  /** The title, a heading placed in the outline by its `level`, which also names the dialog. */
  readonly Title: typeof ModalTitle;
  /** The body, which scrolls inside the dialog when the content is long. */
  readonly Body: typeof HeroModal.Body;
  /** The footer: a row for actions. */
  readonly Footer: typeof HeroModal.Footer;
  /** The close button in the corner, named by its required `label`. */
  readonly Close: typeof ModalClose;
}

/**
 * A modal dialog: a centred panel over a backdrop that blocks the page until it closes. Open it from a `trigger`, or
 * drive it with `isOpen` and `onOpenChange`; fill it with `Modal.Header`, `Modal.Title`, `Modal.Body`, `Modal.Footer`
 * and `Modal.Close`.
 */
export const Modal: typeof ModalRoot & ModalParts = Object.assign(ModalRoot, {
  Header: HeroModal.Header,
  Title: ModalTitle,
  Body: HeroModal.Body,
  Footer: HeroModal.Footer,
  Close: ModalClose,
});
