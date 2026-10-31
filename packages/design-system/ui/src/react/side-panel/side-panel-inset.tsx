/**
 * Stackra file contract:
 * Purpose: the web `SidePanel.Inset`: the page beside the panel. It fills what the panel leaves, so opening the panel
 *          pushes it over (with the `split` look it is a rounded card); while the panel is expanded it shrinks to nothing and is inert.
 * Boundary: a frame and an inner `div` that takes the caller's props (so its padding goes when the frame shrinks); it
 *           draws no landmark of its own, so the page inside keeps its own `main` or regions.
 * Runtime: browser
 * Governing contract: ADR 0305; owner request 2026-10-29 (STA-1371, side panel).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { SidePanelInsetProps } from "#react/side-panel/side-panel-inset.props";
import { useSidePanel } from "#react/side-panel/use-side-panel";

/** The page beside the panel. */
export function SidePanelInset({ className, ...rest }: SidePanelInsetProps): ReactElement {
  const { state, isDrawer, variant } = useSidePanel();
  const isCovered = state === "expanded" && !isDrawer;
  // The frame shrinks to nothing while the panel is expanded; the caller's padding sits on the inner box, so it never
  // holds a sliver of the page open.
  return (
    <div
      data-slot="side-panel-inset"
      inert={isCovered}
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 overflow-hidden",
        variant === "split" && !isDrawer && !isCovered
          ? "rounded-[var(--radius-container)] border border-separator bg-surface shadow-surface"
          : "",
      )}
    >
      <div {...rest} className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)} />
    </div>
  );
}
