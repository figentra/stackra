/**
 * Stackra file contract:
 * Purpose: the web `SidePanel.Footer`: the panel's bottom row, for a composer or actions; it stays put while the body
 *          scrolls.
 * Boundary: a `div`, ruled off from the body.
 * Runtime: browser
 * Governing contract: ADR 0305; owner request 2026-10-29 (STA-1371, side panel).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { SidePanelFooterProps } from "#react/side-panel/side-panel-footer.props";

/** The panel's bottom row. */
export function SidePanelFooter({ className, ...rest }: SidePanelFooterProps): ReactElement {
  return (
    <div
      {...rest}
      data-slot="side-panel-footer"
      className={cn("shrink-0 border-t border-separator p-3", className)}
    />
  );
}
