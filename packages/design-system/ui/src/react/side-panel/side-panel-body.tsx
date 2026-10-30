/**
 * Stackra file contract:
 * Purpose: the web `SidePanel.Body`: the panel's content, the only part that scrolls.
 * Boundary: a `div`; its scroll is contained so reaching its end does not scroll the page behind.
 * Runtime: browser
 * Governing contract: ADR 0305; owner request 2026-10-29 (STA-1371, side panel).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { SidePanelBodyProps } from "#react/side-panel/side-panel-body.props";

/** The panel's scrolling content. */
export function SidePanelBody({ className, ...rest }: SidePanelBodyProps): ReactElement {
  return (
    <div
      {...rest}
      data-slot="side-panel-body"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-4", className)}
    />
  );
}
