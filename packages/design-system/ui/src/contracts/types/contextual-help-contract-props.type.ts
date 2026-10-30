/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ContextualHelp` takes: a small "?" or "i" button, named by `label`, that opens a
 *          popover of help beside a field or a heading, with the popover's title, content, placement and open state.
 * Boundary: types only; the popover's own props (dismissal, the arrow) pass through each runtime's props.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0312; design-system
 *          gap inventory row 36 (2026-10-28).
 */
import type { ReactNode } from "react";

import type { Size } from "#contracts/enums/size.enum";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { PlacementContractProps } from "#contracts/types/placement-contract-props.type";

/** Props shared by the web and native `ContextualHelp`. */
export interface ContextualHelpContractProps
  extends OpenStateContractProps, PlacementContractProps {
  /** The accessible name of the button, which says what the help is about, for example "About tax-inclusive prices". */
  readonly label: string;
  /** The help: text, or text with a link. Plain text is wrapped for the runtime. */
  readonly children: ReactNode;
  /** The popover's heading; without it the popover is named by `label`. */
  readonly title?: string | undefined;
  /** `help` draws a question mark for how-to help, `info` an "i" for background facts. Defaults to `help`. */
  readonly variant?: "help" | "info" | undefined;
  /** The size of the button. Defaults to `sm`, so it sits beside a label. */
  readonly size?: Size | undefined;
}
