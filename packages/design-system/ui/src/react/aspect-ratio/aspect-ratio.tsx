/**
 * Stackra file contract:
 * Purpose: the web `AspectRatio`: a full-width box held at a width to height ratio (CSS `aspect-ratio`), whose child
 *          fills it, so images and videos keep their shape and the page does not jump while they load.
 * Boundary: layout only; no role. The child is stretched to the box; an image or video covers it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.4.10; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { AspectRatioProps } from "#react/aspect-ratio/aspect-ratio.props";

/** A box that keeps its shape. */
export function AspectRatio({ children, ratio = 1, className }: AspectRatioProps): ReactElement {
  return (
    <div
      data-slot="aspect-ratio"
      style={{ aspectRatio: ratio }}
      className={cn(
        "relative w-full overflow-hidden rounded-[var(--radius-container)] *:absolute *:inset-0 *:size-full *:object-cover",
        className,
      )}
    >
      {children}
    </div>
  );
}
