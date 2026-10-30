/**
 * Stackra file contract:
 * Purpose: `topLitOf`, the colour of a mark's lit top: `color` with a little white mixed in, scaled by the theme's
 *          material highlight, so the top light vanishes in a flat brand.
 * Boundary: pure; a CSS colour for a gradient stop or an inline gradient.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0320 (the glass material); STA-1371.
 */
import { MARK_PAINT } from "#react/chart/mark-paint.constant";

/** `color` lit from the top. */
export function topLitOf(color: string): string {
  return `color-mix(in oklab, ${color}, white calc(${MARK_PAINT.lift} * ${MARK_PAINT.topWhite}%))`;
}
