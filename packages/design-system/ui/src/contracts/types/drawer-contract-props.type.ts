/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Drawer` root takes: an edge panel for a detail or an edit that blocks the page
 *          behind it. It is the overlay props (open state and dismissal) plus the edge it opens on, the parts inside
 *          it, an optional trigger and an accessible name for a drawer with no title. Each runtime's `DrawerProps` is
 *          this plus its dialog element's own props, which pass through unchanged.
 * Boundary: types only. The parts are `Drawer.Header`, `Drawer.Title`, `Drawer.Body`, `Drawer.Footer` and
 *           `Drawer.Close`. Native has no side panels (the catalogue's adapted form is a bottom sheet), so its
 *           `placement` narrows to `bottom`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 and 2); ADR 0060
 *          (right-to-left); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import type { ReactElement, ReactNode } from "react";

import type { OverlayContractProps } from "#contracts/types/overlay-contract-props.type";
import type { PlacementContractProps } from "#contracts/types/placement-contract-props.type";

/** Props shared by the web and native `Drawer`. */
export interface DrawerContractProps
  extends OverlayContractProps, Pick<PlacementContractProps, "placement"> {
  /** The drawer's parts, usually a header, a body and a footer; any element is allowed. */
  readonly children: ReactNode;
  /**
   * The element that opens the drawer when pressed: a Button, or any pressable element. Leave it out for a drawer the
   * app opens through `isOpen`. Focus returns to the element that opened the drawer when it closes.
   */
  readonly trigger?: ReactElement | undefined;
  /** The accessible name for a drawer that has no `Drawer.Title`; with a title, the title names it. */
  readonly label?: string | undefined;
}
