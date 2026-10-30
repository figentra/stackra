/**
 * Stackra file contract:
 * Purpose: `DisclosureContractProps`, the props every runtime's `Disclosure` takes: one section whose title shows and
 *          hides its content ("Advanced options", "Order details"). A group of them is an `Accordion`.
 * Boundary: types only; whether it is open is the caller's state or the component's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); WAI-ARIA 1.2 disclosure pattern; STA-1371 (wave C).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `Disclosure`. */
export interface DisclosureContractProps {
  /** The title that opens and closes the section; it names the button. */
  readonly title: ReactNode;
  /** What shows while the section is open. */
  readonly children?: ReactNode;
  /** True while open, for a controlled section; pair it with `onExpandedChange`. */
  readonly isExpanded?: boolean | undefined;
  /** True to start open, for an uncontrolled section. */
  readonly defaultExpanded?: boolean | undefined;
  /** Called with the new state each time the section opens or closes. */
  readonly onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  /** True to show the title but refuse opening or closing. */
  readonly isDisabled?: boolean | undefined;
}
