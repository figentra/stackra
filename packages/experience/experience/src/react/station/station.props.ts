/**
 * Stackra file contract:
 * Purpose: `StationProps`, what a page hands the Station: the station's anchor, its title and line, the
 *          schematic window it shows and the dock's status line for it.
 * Boundary: an interface in its own file beside the component (ADR 0305). Every word is page content; the window is
 *           the station's children, the document node's own children.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041 (the landing).
 */
import type { ReactNode } from "react";

/**
 * One station on the landing's pipe.
 *
 * @example
 * <Station id="expose" title="Expose" body="Gen writes the route." status="gen: 1 endpoint">
 *   <StepSwitcher … />
 * </Station>
 */
export interface StationProps {
  /** The section's id: the dock's link target (`#expose`). */
  readonly id: string;
  /** The station's heading, and the section's spoken name. */
  readonly title: string;
  /** The line under the title. */
  readonly body: string;
  /** What comes out at this station, a schematic window; in a document, the node's children. */
  readonly children?: ReactNode;
  /** The dock's status line while this station is current; kept on the station as `data-status`. */
  readonly status?: string | undefined;
  /** Styles the section. */
  readonly className?: string | undefined;
}
