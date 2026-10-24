/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Modal` root takes: a centred dialog that blocks the page behind it. It is the
 *          overlay props (open state and dismissal) plus the parts inside it, an optional trigger, a width, a
 *          vertical position and an accessible name for a modal with no title. Each runtime's `ModalProps` is this
 *          plus its dialog element's own props, which pass through unchanged.
 * Boundary: types only. The parts are `Modal.Header`, `Modal.Title`, `Modal.Body`, `Modal.Footer` and `Modal.Close`;
 *           the backdrop, the container and the dialog are the root's own and are not parts.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 and 2); WCAG 2.2 SC 2.1.2,
 *          2.4.3 and 4.1.2.
 */
import type { ReactElement, ReactNode } from "react";

import type { Size } from "#contracts/enums/size.enum";
import type { OverlayContractProps } from "#contracts/types/overlay-contract-props.type";

/** Props shared by the web and native `Modal`. */
export interface ModalContractProps extends OverlayContractProps {
  /** The modal's parts, usually a header, a body and a footer; any element is allowed. */
  readonly children: ReactNode;
  /**
   * The element that opens the modal when pressed: a Button, or any pressable element. Leave it out for a modal the
   * app opens through `isOpen`. Focus returns to the element that opened the modal when it closes.
   */
  readonly trigger?: ReactElement | undefined;
  /**
   * The dialog's width: `sm`, `md` or `lg` cap it, and `full` fills the screen for a full-screen presentation.
   * Defaults to `md`.
   */
  readonly size?: Size | "full" | undefined;
  /**
   * The dialog's vertical place on the screen. `auto`, the default, is the runtime's choice (centred, or at the bottom
   * on a narrow web screen). It is `position` and not `placement`, which ADR 0312 keeps for `Placement`.
   */
  readonly position?: "auto" | "top" | "center" | "bottom" | undefined;
  /** The accessible name for a modal that has no `Modal.Title`; with a title, the title names it. */
  readonly label?: string | undefined;
}
