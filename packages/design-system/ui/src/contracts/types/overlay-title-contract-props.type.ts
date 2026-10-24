/**
 * Stackra file contract:
 * Purpose: the props of the title part of a dialog-like overlay (`Modal.Title`, `Drawer.Title`): its text and where
 *          it sits in the page outline. The title names the overlay for assistive technology, so the overlay is read
 *          out by it when it opens.
 * Boundary: types only; each runtime's title props are this plus its own heading element's props.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 1.3.1 and 4.1.2.
 */
import type { ReactNode } from "react";

import type { HeadingLevel } from "#contracts/enums/heading-level.enum";

/** Props shared by the web and native title of a modal or a drawer. */
export interface OverlayTitleContractProps {
  /** The title's text; it is also the overlay's accessible name. */
  readonly children?: ReactNode;
  /**
   * The title's level in the outline, 1 to 6. Defaults to 2: the page keeps its own `h1`, and the overlay's title is a
   * section of it. React Native has no heading level, so native accepts and ignores it.
   */
  readonly level?: HeadingLevel | undefined;
}
