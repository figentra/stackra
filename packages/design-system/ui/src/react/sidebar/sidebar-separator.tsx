/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.Separator`: a thin rule between blocks of a sidebar, inset from both sides.
 * Boundary: an `hr`, so it is a separator to assistive technology too.
 * Runtime: browser
 * Governing contract: ADR 0305; owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { SidebarSeparatorProps } from "#react/sidebar/sidebar-separator.props";

/** A rule between blocks. */
export function SidebarSeparator({ className, ...rest }: SidebarSeparatorProps): ReactElement {
  return (
    <hr
      {...rest}
      data-slot="sidebar-separator"
      className={cn("mx-2 my-1 shrink-0 border-0 border-t border-separator", className)}
    />
  );
}
