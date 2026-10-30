/**
 * Stackra file contract:
 * Purpose: the web `ScrollArea` on HeroUI v3's ScrollShadow: a bounded region that scrolls, its edges fading while
 *          there is more to see in that direction.
 * Boundary: a named, focusable region (`tabIndex=0`) so keyboard users can scroll it with the arrow keys; the fades are
 *           a mask, so they follow any background. Horizontal fades follow the reading direction.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.1.1 and 2.4.7; STA-1371.
 */
import { ScrollShadow, cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { ScrollAreaProps } from "#react/scroll-area/scroll-area.props";

/** A region that scrolls with faded edges. */
export function ScrollArea({
  children,
  label,
  orientation = "vertical",
  maxSize,
  fadeSize = 40,
  className,
}: ScrollAreaProps): ReactElement {
  const isVertical = orientation === "vertical";
  return (
    <ScrollShadow
      role="region"
      aria-label={label}
      tabIndex={0}
      orientation={orientation}
      size={fadeSize}
      data-slot="scroll-area"
      style={
        maxSize === undefined
          ? undefined
          : isVertical
            ? { maxHeight: maxSize }
            : { maxWidth: maxSize }
      }
      className={cn(
        "rounded-[var(--radius-container)] outline-none focus-visible:outline-2 focus-visible:outline-focus",
        className,
      )}
    >
      {children}
    </ScrollShadow>
  );
}
