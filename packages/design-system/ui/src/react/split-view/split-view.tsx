/**
 * Stackra file contract:
 * Purpose: the web `SplitView`: from the tablet size class a grid of the list pane (`primaryWidth` wide, a border at
 *          its inline end) and the detail pane, each a named region; below it one pane at a time, `isSecondaryShown`
 *          choosing which. With `isResizable` a window splitter on the border resizes the list pane by pointer and
 *          keyboard, on the same pane engine as `Sidebar` and `SidePanel` (`usePaneWidth`, `useResizeHandle`).
 * Boundary: the size class comes from `#react/use-breakpoint/use-breakpoint`; the grid follows the reading direction,
 *           so the list sits on the right in Arabic, and so do the strip and its arrows. Navigation between the panes
 *           on a phone is the app's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28); WAI-ARIA window
 *          splitter pattern; WCAG 2.2 SC 1.3.1 (named regions), 2.1.1 and 2.5.7; STA-1371 (shared pane engine).
 */
import { cn } from "@heroui/react";
import { useId, type ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { usePaneWidth } from "#react/hooks/use-pane-width";
import { useResizeHandle } from "#react/hooks/use-resize-handle";
import { useUiText } from "#react/hooks/use-ui-text";
import type { SplitViewProps } from "#react/split-view/split-view.props";
import { useBreakpoint } from "#react/use-breakpoint/use-breakpoint";

/** A list and its detail, side by side when they fit and one at a time on a phone. */
export function SplitView({
  primary,
  secondary,
  isSecondaryShown = false,
  primaryLabel,
  secondaryLabel,
  primaryWidth = 320,
  isResizable = false,
  minPrimaryWidth = 240,
  maxPrimaryWidth = 560,
  onPrimaryWidthChange,
  storageKey,
  className,
  style,
  ...rest
}: SplitViewProps): ReactElement {
  const t = useUiText();
  const primaryId = `split-view-${useId().replaceAll(/[^a-zA-Z0-9]/gu, "")}`;
  const isSplit = useBreakpoint().sizeClass !== "phone";
  // A fixed pane follows `primaryWidth`; a resizable one starts there and then owns its width.
  const pane = usePaneWidth({
    width: isResizable ? undefined : primaryWidth,
    defaultWidth: primaryWidth,
    minWidth: isResizable ? minPrimaryWidth : primaryWidth,
    maxWidth: isResizable ? maxPrimaryWidth : primaryWidth,
    onWidthChange: onPrimaryWidthChange,
    storageKey,
  });
  const handlers = useResizeHandle({
    width: pane.width,
    minWidth: minPrimaryWidth,
    maxWidth: maxPrimaryWidth,
    edge: "end",
    resizing: "[data-slot=split-view]",
    onResize: pane.setWidth,
  });
  return (
    <div
      {...rest}
      data-slot="split-view"
      className={cn("relative grid min-h-0", className)}
      style={{
        gridTemplateColumns: isSplit ? `${pane.width}px minmax(0, 1fr)` : "minmax(0, 1fr)",
        ...style,
      }}
    >
      {isSplit || !isSecondaryShown ? (
        <section
          id={primaryId}
          aria-label={primaryLabel}
          className={cn("min-h-0 overflow-auto", isSplit && "border-e border-separator")}
        >
          {primary}
        </section>
      ) : null}
      {isSplit || isSecondaryShown ? (
        <section aria-label={secondaryLabel} className="min-h-0 overflow-auto">
          {secondary}
        </section>
      ) : null}
      {isSplit && isResizable ? (
        <div
          {...handlers}
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={t(UI_KEYS.ui.split_view.resize)}
          aria-controls={primaryId}
          aria-valuenow={pane.width}
          aria-valuemin={minPrimaryWidth}
          aria-valuemax={maxPrimaryWidth}
          data-slot="split-view-handle"
          // Centred on the list pane's end border; `inset-inline-start` follows the reading direction.
          style={{ insetInlineStart: pane.width - 4 }}
          className={cn(
            "absolute inset-y-0 z-(--z-raised) w-2 cursor-col-resize touch-none outline-none",
            "after:absolute after:inset-y-0 after:start-1 after:w-px after:bg-transparent after:transition-colors",
            "motion-reduce:after:transition-none hover:after:w-0.5 hover:after:bg-accent",
            "focus-visible:after:w-0.5 focus-visible:after:bg-focus",
          )}
        />
      ) : null}
    </div>
  );
}
