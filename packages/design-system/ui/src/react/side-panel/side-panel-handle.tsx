/**
 * Stackra file contract:
 * Purpose: the web `SidePanel.Handle`: the resize strip on the panel's start border, a focusable window splitter. A drag
 *          sets the open width live (the page reflows beside it); Left and Right move the border 16 px that way, Home
 *          and End jump to the narrowest and widest.
 * Boundary: the drag and keys are `useResizeHandle`'s, shared with `Sidebar.Rail`. Drawn only while the panel is open in
 *           the page (not closed, expanded or a drawer). The border is logical, so it follows the panel in
 *           right-to-left, and so do the arrows.
 * Runtime: browser
 * Governing contract: ADR 0305; WAI-ARIA window splitter pattern; WCAG 2.2 SC 2.1.1 and 2.5.7; owner request 2026-10-29
 *          (STA-1371, side panel).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useResizeHandle } from "#react/hooks/use-resize-handle";
import { useUiText } from "#react/hooks/use-ui-text";
import type { SidePanelHandleProps } from "#react/side-panel/side-panel-handle.props";
import { useSidePanel } from "#react/side-panel/use-side-panel";

/** The panel's resize strip. */
export function SidePanelHandle({ className, ...rest }: SidePanelHandleProps): ReactElement | null {
  const t = useUiText();
  const panel = useSidePanel();
  const handlers = useResizeHandle({
    width: panel.width,
    minWidth: panel.minWidth,
    maxWidth: panel.maxWidth,
    edge: "start",
    resizing: "[data-slot=side-panel]",
    onResize: panel.setWidth,
  });
  if (panel.state !== "open" || panel.isDrawer) return null;
  return (
    <div
      {...rest}
      {...handlers}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={t(UI_KEYS.ui.side_panel.resize)}
      aria-controls={panel.panelId}
      aria-valuenow={panel.width}
      aria-valuemin={panel.minWidth}
      aria-valuemax={panel.maxWidth}
      data-slot="side-panel-handle"
      className={cn(
        "absolute inset-y-0 start-0 z-(--z-sticky) w-2 cursor-col-resize touch-none outline-none",
        // The visible border: a hairline that thickens on hover, drag and keyboard focus.
        "after:absolute after:inset-y-0 after:start-0 after:w-px after:bg-transparent after:transition-colors",
        "hover:after:w-0.5 hover:after:bg-accent focus-visible:after:w-0.5 focus-visible:after:bg-focus",
        className,
      )}
    />
  );
}
