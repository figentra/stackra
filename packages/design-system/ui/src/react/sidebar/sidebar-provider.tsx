/**
 * Stackra file contract:
 * Purpose: the web `SidebarProvider`: owns one sidebar's state and lays out the row it sits in, so a
 *          `Sidebar.Trigger` in the page header, `useSidebar` in the app's own nodes and the Sidebar itself all share it.
 *          Below `collapseBelow` (`md` by default) the Sidebar inside becomes a drawer the trigger opens.
 * Boundary: a flex row and a context; the state lives in `useSidebarState`. A Sidebar drawn without a provider makes
 *           its own state and stays in the page at every width unless it is given `collapseBelow`.
 * Runtime: browser
 * Governing contract: ADR 0305; ADR 0302 (decision 3); owner request 2026-10-29 (STA-1371, robust sidebar).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { SidebarContext } from "#react/sidebar/sidebar-context";
import type { SidebarProviderProps } from "#react/sidebar/sidebar-provider.props";
import { useSidebarState } from "#react/sidebar/use-sidebar-state";

/** Shares one sidebar's state with everything inside it. */
export function SidebarProvider({
  variant,
  collapsible,
  isCollapsed,
  defaultCollapsed,
  onCollapsedChange,
  isMobileOpen,
  defaultMobileOpen,
  onMobileOpenChange,
  collapseBelow = "md",
  keyboardShortcut,
  isExpandOnHover,
  isResizable,
  width,
  defaultWidth,
  minWidth,
  maxWidth,
  onWidthChange,
  storageKey,
  children,
  className,
  ...rest
}: SidebarProviderProps): ReactElement {
  const state = useSidebarState(
    {
      variant,
      collapsible,
      isCollapsed,
      defaultCollapsed,
      onCollapsedChange,
      isMobileOpen,
      defaultMobileOpen,
      onMobileOpenChange,
      collapseBelow,
      keyboardShortcut,
      isExpandOnHover,
      isResizable,
      width,
      defaultWidth,
      minWidth,
      maxWidth,
      onWidthChange,
      storageKey,
    },
    true,
  );
  return (
    <SidebarContext value={state}>
      <div
        {...rest}
        data-slot="sidebar-wrapper"
        data-variant={state.variant}
        className={cn(
          "flex h-full min-h-0 w-full",
          // The floating and inset looks draw a card on the page background.
          state.variant === "sidebar" ? "" : "bg-background",
          className,
        )}
      >
        {children}
      </div>
    </SidebarContext>
  );
}
