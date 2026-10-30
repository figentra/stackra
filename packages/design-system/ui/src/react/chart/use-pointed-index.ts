/**
 * Stackra file contract:
 * Purpose: `usePointedIndex`, the row a Recharts chart's pointer is over (null when none), with the chart's mouse
 *          handlers that track it, so a chart can lift the pointed mark and dim the rest.
 * Boundary: state only; the colour change is instant, so reduced motion has nothing to stop.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3; STA-1371.
 */
import { useState } from "react";

/** The pointed row and the handlers to spread on the chart. */
export function usePointedIndex(): {
  readonly pointed: number | null;
  readonly handlers: {
    readonly onMouseMove: (state: { activeTooltipIndex?: unknown }) => void;
    readonly onMouseLeave: () => void;
  };
} {
  const [pointed, setPointed] = useState<number | null>(null);
  return {
    pointed,
    handlers: {
      onMouseMove: (state) => {
        const index = Number(state.activeTooltipIndex ?? Number.NaN);
        setPointed(Number.isInteger(index) ? index : null);
      },
      onMouseLeave: () => setPointed(null),
    },
  };
}
