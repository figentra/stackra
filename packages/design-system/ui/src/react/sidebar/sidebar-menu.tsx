/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.Menu`: a list of `Sidebar.MenuItem`s.
 * Boundary: a `ul`, so assistive technology counts the places.
 * Runtime: browser
 * Governing contract: ADR 0305; WCAG 2.2 SC 1.3.1; owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { SidebarMenuProps } from "#react/sidebar/sidebar-menu.props";

/** A list of places. */
export function SidebarMenu({ className, ...rest }: SidebarMenuProps): ReactElement {
  return (
    <ul {...rest} data-slot="sidebar-menu" className={cn("flex flex-col gap-0.5", className)} />
  );
}
