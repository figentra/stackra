/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.Inset`: the page beside a sidebar inside a `SidebarProvider`. It takes the rest of the row;
 *          with the `inset` look it is a rounded card on the page background.
 * Boundary: a `div`, not a `main`: the app's page puts its own `main` inside, so a page holds one.
 * Runtime: browser
 * Governing contract: ADR 0305; owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import { cn } from "@heroui/react";
import { use, type ReactElement } from "react";

import { SidebarContext } from "#react/sidebar/sidebar-context";
import type { SidebarInsetProps } from "#react/sidebar/sidebar-inset.props";

/** The page beside the sidebar. */
export function SidebarInset({ className, ...rest }: SidebarInsetProps): ReactElement {
  const isInset = use(SidebarContext)?.variant === "inset";
  return (
    <div
      {...rest}
      data-slot="sidebar-inset"
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 flex-col bg-background",
        isInset
          ? "m-2 overflow-hidden rounded-[var(--radius-container)] border border-separator bg-surface shadow-sm"
          : "",
        className,
      )}
    />
  );
}
