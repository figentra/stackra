/**
 * Stackra file contract:
 * Purpose: `MarkGradient`, the soft vertical light of a bar, column or step: its lit top fading to its own colour,
 *          for a `<defs>` the mark's `fill="url(#id)"` points at.
 * Boundary: an SVG `linearGradient` in presentation attributes (no style attribute); no shadow or glow.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0320 (the glass material); STA-1371.
 */
import type { ReactElement } from "react";

import { topLitOf } from "#react/chart/top-lit-of.function";

/** A mark's top-lit fill. */
export function MarkGradient({ id, color }: { id: string; color: string }): ReactElement {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={topLitOf(color)} />
      <stop offset="100%" stopColor={color} />
    </linearGradient>
  );
}
