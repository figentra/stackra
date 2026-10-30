/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.Rail`: a thin strip on the sidebar's inner edge. A click collapses or expands the sidebar;
 *          on a resizable sidebar a drag sets the width (a drag towards the edge past half the narrowest width
 *          collapses it), and the strip is a focusable window splitter: Left and Right change the width by 16 px (in
 *          the reading direction), Home and End jump to the narrowest and widest, Enter collapses.
 * Boundary: the pointer convenience; `Sidebar.Trigger` is the keyboard path to collapse, so a rail that cannot resize is
 *           out of the tab order. The strip sits on the logical end edge, so it follows the sidebar in right-to-left.
 *           While dragging the sidebar's width transition is off, so the edge follows the pointer. The drag and keys
 *           are `useResizeHandle`'s, shared with `SidePanel.Handle`.
 * Runtime: browser
 * Governing contract: ADR 0305; WAI-ARIA window splitter pattern; WCAG 2.2 SC 2.1.1 and 2.5.7; owner request
 *          2026-10-29 (STA-1371).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { RESIZE_SLOP } from "#core/constants/resize-slop.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useResizeHandle } from "#react/hooks/use-resize-handle";
import { useUiText } from "#react/hooks/use-ui-text";
import type { SidebarRailProps } from "#react/sidebar/sidebar-rail.props";
import { useSidebar } from "#react/sidebar/use-sidebar";

/** The sidebar's resize and toggle strip. */
export function SidebarRail({ className, ...rest }: SidebarRailProps): ReactElement | null {
  const t = useUiText();
  const sidebar = useSidebar();
  const { isCollapsed, setCollapsed, collapsible, isResizable, isMobile, width, setWidth } =
    sidebar;
  const { onKeyDown, ...pointer } = useResizeHandle({
    width,
    minWidth: sidebar.minWidth,
    maxWidth: sidebar.maxWidth,
    edge: "end",
    resizing: "[data-slot=sidebar]",
    onResize: setWidth,
    onDrag: (next, delta) => {
      if (isCollapsed) {
        if (delta > RESIZE_SLOP * 4) setCollapsed(false);
        return;
      }
      if (!isResizable) return;
      if (next < sidebar.minWidth / 2) setCollapsed(true);
      else setWidth(next);
    },
    onPress: () => setCollapsed(!isCollapsed),
    keys: { Enter: () => setCollapsed(true) },
  });
  if (isMobile || collapsible === "none") return null;
  const canResize = isResizable && !isCollapsed;

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- a window splitter when resizable; otherwise a pointer-only strip, with Sidebar.Trigger as the keyboard path
    <div
      {...rest}
      data-slot="sidebar-rail"
      {...(canResize
        ? {
            role: "separator",
            tabIndex: 0,
            "aria-orientation": "vertical" as const,
            "aria-label": t(UI_KEYS.ui.sidebar.resize),
            "aria-controls": sidebar.panelId,
            "aria-valuenow": width,
            "aria-valuemin": sidebar.minWidth,
            "aria-valuemax": sidebar.maxWidth,
            onKeyDown,
          }
        : { "aria-hidden": true })}
      {...pointer}
      className={cn(
        "group/rail absolute inset-y-0 -end-2 z-20 w-4 touch-none outline-none",
        canResize
          ? "cursor-col-resize"
          : isCollapsed
            ? "cursor-e-resize rtl:cursor-w-resize"
            : "cursor-w-resize rtl:cursor-e-resize",
        // The visible edge: a hairline that thickens on hover, drag and keyboard focus.
        "after:absolute after:inset-y-0 after:start-1/2 after:w-px after:bg-transparent after:transition-colors",
        "hover:after:w-0.5 hover:after:bg-accent focus-visible:after:w-0.5 focus-visible:after:bg-focus",
        className,
      )}
    />
  );
}
