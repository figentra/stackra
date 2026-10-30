/**
 * Stackra file contract:
 * Purpose: the web `SplitView`: from the tablet size class a grid of the list pane (`primaryWidth` wide, a border at
 *          its inline end) and the detail pane, each a named region; below it one pane at a time, `isSecondaryShown`
 *          choosing which.
 * Boundary: the size class comes from `#react/use-breakpoint/use-breakpoint`; the grid follows the reading direction,
 *           so the list sits on the right in Arabic. Navigation between the panes on a phone is the app's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28); WCAG 2.2
 *          SC 1.3.1 (named regions).
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";

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
  className,
  style,
  ...rest
}: SplitViewProps): ReactElement {
  const isSplit = useBreakpoint().sizeClass !== "phone";
  return (
    <div
      {...rest}
      data-slot="split-view"
      className={cn("grid min-h-0", className)}
      style={{
        gridTemplateColumns: isSplit ? `${primaryWidth}px minmax(0, 1fr)` : "minmax(0, 1fr)",
        ...style,
      }}
    >
      {isSplit || !isSecondaryShown ? (
        <section
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
    </div>
  );
}
