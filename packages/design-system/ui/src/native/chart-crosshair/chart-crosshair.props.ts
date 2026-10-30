/**
 * Stackra file contract:
 * Purpose: `ChartCrosshairProps`, the props of the native `ChartCrosshair`: Victory's press state, the plot bounds,
 *          and what to draw at the scrubbed category (a soft column band, a dashed guide, ringed dots on lines).
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); chart style spec (2026-10-28) sections 3 and 6;
 *          STA-1371.
 */
import type { ChartBounds, ChartPressState } from "victory-native";

/** Props of the native ChartCrosshair, drawn inside a Victory chart's canvas. */
export interface ChartCrosshairProps {
  /** The chart's press state (`useChartPressState`). */
  readonly state: ChartPressState<{ x: string | number; y: Record<string, number> }>;
  /** The plot area Victory hands its children. */
  readonly bounds: ChartBounds;
  /** Series that get a ringed dot at the scrubbed point, with their colours. */
  readonly dots?: readonly { readonly key: string; readonly color: string }[] | undefined;
  /** The width of the soft band behind the category; 0 draws only the dashed guide. */
  readonly bandWidth?: number | undefined;
  /** The guide's colour (the muted text colour). */
  readonly guideColor: string;
  /** The band's colour (the foreground, drawn at 5%). */
  readonly bandColor: string;
  /** The ring around each dot (the surface colour). */
  readonly ringColor: string;
}
