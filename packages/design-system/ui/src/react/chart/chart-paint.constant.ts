/**
 * Stackra file contract:
 * Purpose: `CHART_PAINT`, the theme colours the web charts paint their furniture in (ticks, grid, cursor, track,
 *          centre text) as `var(--<role>)` SVG presentation attributes.
 * Boundary: values only. Attributes, not a style tag or style attribute: they repaint with the theme, brand and
 *           scheme and need no `style-src` allowance (ADR 0302 decision 3).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0291 (ported code); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { paintOf } from "#react/chart/paint-of.function";

/** The furniture's paints and the tick text size. */
export const CHART_PAINT = {
  tick: { fill: paintOf("muted"), fontSize: 10 },
  grid: { stroke: paintOf("muted"), strokeOpacity: 0.15 },
  /** Line and area charts: a 1px muted dashed line through the pointed row. */
  cursorLine: { stroke: paintOf("muted"), strokeWidth: 1, strokeDasharray: "4 4" },
  /** Bar charts: a soft block of the text colour behind the pointed category. */
  cursorBand: { fill: "currentColor", fillOpacity: 0.05 },
  /** A radial ring's track. */
  track: { fill: paintOf("muted"), fillOpacity: 0.15 },
  /** The gap between pie slices and the ring round an active dot: the card's own surface. */
  surface: paintOf("surface"),
  centreValue: paintOf("foreground"),
  centreLabel: paintOf("muted"),
} as const;
