/**
 * Stackra file contract:
 * Purpose: `DemoChartTooltipProps`: props of `DemoChartTooltip`; recharts passes them to a tooltip's `content`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { DemoChartTooltipEntry } from "./demo-chart-tooltip-entry.type";

/** Props of {@link DemoChartTooltip}; recharts passes them to a tooltip's `content`. */
export interface DemoChartTooltipProps {
  /** Whether a point is hovered or focused. */
  readonly active?: boolean | undefined;
  /** The label of the point, the header. */
  readonly label?: string | number | undefined;
  /** One entry per series at the point. */
  readonly payload?: readonly DemoChartTooltipEntry[] | undefined;
  /** How a value reads; locale numbers when left out. */
  readonly format?: ((value: number) => string) | undefined;
}
