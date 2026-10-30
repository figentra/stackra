/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.Header`: the top block of a sidebar, for the brand or a workspace switcher, and in a sidebar
 *          drawn from `items` the collapse toggle. In the rail its content is centred.
 * Boundary: a `div`; the app's nodes read `useSidebar().isRail` to draw a mark instead of a name.
 * Runtime: browser
 * Governing contract: ADR 0305; owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import { cn } from "@heroui/react";
import { use, type ReactElement } from "react";

import { SidebarContext } from "#react/sidebar/sidebar-context";
import type { SidebarHeaderProps } from "#react/sidebar/sidebar-header.props";

/** The sidebar's top block. */
export function SidebarHeader({ className, ...rest }: SidebarHeaderProps): ReactElement {
  const isRail = use(SidebarContext)?.isRail ?? false;
  return (
    <div
      {...rest}
      data-slot="sidebar-header"
      className={cn("flex shrink-0 flex-col gap-2 p-2", isRail ? "items-center" : "", className)}
    />
  );
}
