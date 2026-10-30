/**
 * Stackra file contract:
 * Purpose: the web `VisuallyHidden` on React Aria's: content a screen reader reads and the screen does not show, such
 *          as a table's caption, the full date behind "3 days ago", or a skip link that appears on focus
 *          (`isFocusable`).
 * Boundary: a thin wrapper; the clipping is React Aria's, so it never collapses a focus ring or a live region.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 19 (owner choice "P1 + P2 core", 2026-10-28); ADR 0165 (React
 *          Aria on web); owner decision 6 of STA-350 (thin wrappers).
 */
import type { ReactElement } from "react";
import { VisuallyHidden as AriaVisuallyHidden } from "react-aria-components";

import type { VisuallyHiddenProps } from "#react/visually-hidden/visually-hidden.props";

/** Content for screen readers only. */
export function VisuallyHidden({
  children,
  elementType = "span",
  ...rest
}: VisuallyHiddenProps): ReactElement {
  // A span by default: the hidden words usually sit inside a sentence, and a div inside a <p> is invalid HTML.
  return (
    <AriaVisuallyHidden {...rest} elementType={elementType} data-slot="visually-hidden">
      {children}
    </AriaVisuallyHidden>
  );
}
