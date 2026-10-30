/**
 * Stackra file contract:
 * Purpose: `ChartTooltipProps`, the props of the web `ChartTooltip`: what Recharts hands a tooltip's `content`, plus
 *          how the title and the values are written and the indicator's shape.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0291 (ported code); WCAG 2.2 SC 1.4.11; STA-1371.
 */
import type { ChartTooltipItem } from "#react/chart-tooltip/chart-tooltip-item.type";

/** Props of the web ChartTooltip. */
export interface ChartTooltipProps {
  /** Whether a row is pointed at (Recharts). */
  readonly active?: boolean | undefined;
  /** The pointed row's values (Recharts). */
  readonly payload?: readonly ChartTooltipItem[] | undefined;
  /** The pointed row's category (Recharts). */
  readonly label?: unknown;
  /** Writes a value; the locale's number format by default. */
  readonly formatValue?: ((value: number) => string) | undefined;
  /** Writes the title from the category; no title without it. */
  readonly formatLabel?: ((label: unknown) => string) | undefined;
  /** Names each line from this key of its row instead of its series (one ring or slice per row). */
  readonly nameKey?: string | undefined;
  /** A square `dot` (the default) or a `line` beside each value. */
  readonly indicator?: "dot" | "line" | undefined;
}
