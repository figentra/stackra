/**
 * Stackra file contract:
 * Purpose: the web `SidePanel.Panel`: the panel column at the end edge of the row, a `complementary` landmark named by
 *          the SidePanel's `label`. Closed it takes no width and is inert; open it is `width` pixels wide; expanded it
 *          takes the whole row. Its content keeps the open width while it closes, so nothing reflows on the way out.
 *          Escape inside it closes it. Below the drawer breakpoint the same parts are drawn in the house Drawer on the
 *          end edge (full width while expanded).
 * Boundary: the width eases (the theme's `slow` step on the `enter` curve) at the `full` motion level, so the page beside it visibly
 *           shrinks and grows; at `reduced` the content fades instead and at `none` it snaps. Never during a drag
 *           (`data-resizing`), where the width follows the pointer. With the `split` look the panel is its own rounded
 *           card, its gap from the page inside the column so a closed panel leaves none. The end edge is logical, so
 *           right-to-left puts it on the left.
 * Runtime: browser
 * Governing contract: ADR 0305; ADR 0060 (right-to-left); WAI-ARIA complementary landmark; WCAG 2.2 SC 1.3.1, 2.1.1
 *          and 2.3.3; owner request 2026-10-29 (STA-1371, side panel).
 */
import { cn } from "@heroui/react";
import type { CSSProperties, ReactElement } from "react";

import { useMotion } from "#react/design-system-provider/use-motion";
import { Drawer } from "#react/drawer/drawer";
import type { SidePanelPanelProps } from "#react/side-panel/side-panel-panel.props";
import { useSidePanel } from "#react/side-panel/use-side-panel";

/** The width's easing at the full motion level: a gliding ease-out, off during a drag and under reduced motion. */
const MOVE =
  "transition-[width] duration-(--duration-slow) ease-(--ease-enter) motion-reduce:transition-none data-[resizing]:transition-none";

/** The panel column. */
export function SidePanelPanel({
  children,
  className,
  style,
  onKeyDown,
  ...rest
}: SidePanelPanelProps): ReactElement {
  const { panelId, label, state, setState, width, isDrawer, isInitial, variant } = useSidePanel();
  const motion = useMotion();

  if (isDrawer)
    return (
      <Drawer
        isOpen={state !== "closed" && !isInitial}
        onOpenChange={(isOpen) => setState(isOpen ? "open" : "closed")}
        placement="end"
        size={state === "expanded" ? "full" : "sm"}
        label={label}
      >
        <div
          id={panelId}
          data-slot="side-panel"
          data-state={state}
          className={cn("flex min-h-0 flex-1 flex-col", className)}
        >
          {children}
        </div>
      </Drawer>
    );

  const isClosed = state === "closed";
  const isSplit = variant === "split";
  // The split look's gap sits inside the column, so a closed panel leaves no gap behind.
  const openWidth = isSplit ? `calc(${width}px + 0.5rem)` : width;
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- reason: the panel takes Escape bubbling from the controls inside it, to close; it is not a control
    <aside
      {...rest}
      id={panelId}
      aria-label={label}
      tabIndex={-1}
      inert={isClosed}
      data-slot="side-panel"
      data-state={state}
      data-variant={variant}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key !== "Escape" || event.defaultPrevented || isClosed) return;
        event.preventDefault();
        setState("closed");
      }}
      style={
        {
          ...style,
          width: isClosed ? 0 : state === "expanded" ? "100%" : openWidth,
          "--side-panel-width": `${width}px`,
        } as CSSProperties
      }
      className={cn(
        "relative h-full max-w-full shrink-0 overflow-hidden outline-none",
        isSplit || isClosed ? "" : "border-s border-separator bg-surface",
        // Full motion eases the width, so the page visibly shrinks and grows; reduced fades the content instead.
        motion === "full" ? MOVE : "",
        className,
      )}
    >
      <div
        data-slot="side-panel-card"
        className={cn(
          "absolute inset-y-0 end-0 flex flex-col",
          state === "expanded" ? "w-full" : "w-[var(--side-panel-width)] max-w-full",
          isSplit
            ? "overflow-hidden rounded-[var(--radius-container)] border border-separator bg-surface shadow-surface"
            : "",
          motion === "reduced" ? "transition-opacity duration-(--duration-fast)" : "",
          isClosed && motion === "reduced" ? "opacity-0" : "",
        )}
      >
        {children}
      </div>
    </aside>
  );
}
