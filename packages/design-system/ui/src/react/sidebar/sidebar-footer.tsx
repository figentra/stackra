/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.Footer`: the bottom block of a sidebar, usually the user menu. In the rail its content is
 *          centred.
 * Boundary: a `div`; the app's nodes read `useSidebar().isRail` to draw an avatar alone instead of a name.
 * Runtime: browser
 * Governing contract: ADR 0305; owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import { cn } from "@heroui/react";
import { use, type ReactElement } from "react";

import { SidebarContext } from "#react/sidebar/sidebar-context";
import type { SidebarFooterProps } from "#react/sidebar/sidebar-footer.props";

/** The sidebar's bottom block. */
export function SidebarFooter({ className, ...rest }: SidebarFooterProps): ReactElement {
  const isRail = use(SidebarContext)?.isRail ?? false;
  return (
    <div
      {...rest}
      data-slot="sidebar-footer"
      className={cn(
        "flex shrink-0 flex-col gap-2 border-t border-separator p-2",
        isRail ? "items-center" : "",
        className,
      )}
    />
  );
}
