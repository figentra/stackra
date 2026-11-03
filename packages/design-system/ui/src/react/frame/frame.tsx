/**
 * Stackra file contract:
 * Purpose: the web `Frame`: the chrome around a screenshot or a live widget on a marketing page: a `window` with a
 *          quiet title bar, a `phone`, or a `plain` border, on the frame radius, the kit's `lg` plus 4 px (10 px,
 *          owner Q2); or a `schematic` window, a part of a blueprint machine: a 30 px title bar with two hairline
 *          stripes either side of its mono title, on the blueprint frame radius. It can run past its parent's bottom
 *          or end edge, and docks a pill switcher on its bottom edge.
 * Boundary: chrome only; the content is the caller's. The three title-bar dots and the stripes are neutral decoration
 *           hidden from assistive tech. The bleed is a negative logical margin, so it mirrors in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); ADR 0501 (section 9, the blueprint roles);
 *          STA-2041 (owner Q2).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { FrameProps } from "#react/frame/frame.props";

/** The frame radius: the kit's `lg` plus 4 px; a schematic window takes the blueprint's. */
const RADIUS = "rounded-[calc(var(--radius-lg)+4px)]";
const SCHEMATIC_RADIUS = "rounded-[var(--blueprint-frame-radius)]";

/** One hairline stripe pair of a schematic title bar: a top and a bottom rule in the blueprint's rule colour. */
const STRIPE =
  "h-1 min-w-4 flex-1 [border-block:var(--blueprint-rule-width)_solid_var(--blueprint-rule)]";

/** The bleed: a negative logical margin, and no border or rounding on the edge that runs out. */
const BLEED = {
  none: "",
  bottom: "-mb-12 rounded-b-none border-b-0",
  end: "-me-12 rounded-e-none border-e-0",
  "bottom-end": "-mb-12 -me-12 rounded-b-none rounded-e-none border-b-0 border-e-0",
} as const;

/** A window, phone or plain frame around a screenshot or a live widget. */
export function Frame({
  variant = "window",
  title,
  children,
  bleed = "none",
  tabs,
  className,
}: FrameProps): ReactElement {
  return (
    <div
      data-slot="frame"
      data-variant={variant}
      className={cn(
        "relative overflow-hidden border border-border bg-surface",
        variant === "schematic" ? SCHEMATIC_RADIUS : RADIUS,
        variant === "phone" && "mx-auto aspect-[9/19.5] w-full max-w-72 p-2",
        BLEED[bleed],
        className,
      )}
    >
      {variant === "window" ? (
        <div
          data-slot="frame-bar"
          className="flex h-9 items-center gap-3 border-b border-border bg-surface-secondary px-3"
        >
          <span aria-hidden="true" className="flex gap-1.5">
            {[0, 1, 2].map((dot) => (
              <span key={dot} className="size-2.5 rounded-[var(--radius-pill)] bg-default" />
            ))}
          </span>
          {title ? (
            <span className="min-w-0 flex-1 truncate text-center font-mono text-xs text-muted">
              {title}
            </span>
          ) : null}
        </div>
      ) : null}
      {variant === "schematic" ? (
        <div
          data-slot="frame-bar"
          className="flex h-7.5 items-center gap-3 border-b border-border bg-surface-secondary px-3"
        >
          <span aria-hidden="true" className={STRIPE} />
          {title ? (
            <>
              <span className="min-w-0 max-w-[70%] shrink truncate font-mono text-xs text-muted">
                {title}
              </span>
              <span aria-hidden="true" className={STRIPE} />
            </>
          ) : null}
        </div>
      ) : null}
      <div
        data-slot="frame-content"
        className={cn(
          "relative",
          variant === "phone" && "size-full overflow-hidden rounded-[var(--radius-lg)]",
        )}
      >
        {children}
      </div>
      {tabs ? (
        <div data-slot="frame-tabs" className="absolute inset-x-0 bottom-3 flex justify-center">
          {tabs}
        </div>
      ) : null}
    </div>
  );
}
