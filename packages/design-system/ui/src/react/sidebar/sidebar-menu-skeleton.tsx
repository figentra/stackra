/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.MenuSkeleton`: a placeholder row the height of an entry, while the menu loads. In the rail
 *          it is the icon alone.
 * Boundary: hidden from assistive technology; the sidebar announces the loading once (see `Sidebar`'s `isLoading`).
 * Runtime: browser
 * Governing contract: ADR 0305; owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import { cn } from "@heroui/react";
import { use, type ReactElement } from "react";

import { SidebarContext } from "#react/sidebar/sidebar-context";
import type { SidebarMenuSkeletonProps } from "#react/sidebar/sidebar-menu-skeleton.props";
import { Skeleton } from "#react/skeleton/skeleton";

/** A loading row. */
export function SidebarMenuSkeleton({
  hasIcon = true,
  className,
  ...rest
}: SidebarMenuSkeletonProps): ReactElement {
  const isRail = use(SidebarContext)?.isRail ?? false;
  return (
    <li
      {...rest}
      aria-hidden="true"
      data-slot="sidebar-menu-skeleton"
      className={cn(
        "flex h-9 items-center gap-3 px-3",
        isRail ? "justify-center px-0" : "",
        className,
      )}
    >
      {hasIcon || isRail ? (
        <Skeleton className="size-5 shrink-0 rounded-[var(--radius-control)]" />
      ) : null}
      {isRail ? null : <Skeleton className="h-3 w-3/4 rounded-[var(--radius-pill)]" />}
    </li>
  );
}
