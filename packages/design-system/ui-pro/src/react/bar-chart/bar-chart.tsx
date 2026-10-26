/**
 * Stackra file contract:
 * Purpose: the web `BarChart` compound on HeroUI Pro's BarChart (a recharts chart in a themed container): the root maps
 *          `label` to `aria-label`; every other prop passes through. The parts are HeroUI Pro's own: Bar, Grid, Tooltip, TooltipContent, XAxis, YAxis.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. It draws with `recharts`, an
 *          optional peer. The compound exposes the documented parts: HeroUI Pro's `BarChart.Root` is left out. Imports the
 *          `bar-chart` subpath, the only way to reach it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import { BarChart as HeroBarChart } from "@heroui-pro/react/bar-chart";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { BarChartProps } from "#react/bar-chart/bar-chart.props";

/** The root: HeroUI Pro's, with `label` as the `aria-label`. */
function BarChartRoot({ label, ...rest }: BarChartProps) {
  return <HeroBarChart.Root {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface BarChartParts {
  /** The bar series of one data key. */
  readonly Bar: typeof HeroBarChart.Bar;
  /** The background grid lines. */
  readonly Grid: typeof HeroBarChart.Grid;
  /** The recharts tooltip, shown while a point is pressed or hovered. */
  readonly Tooltip: typeof HeroBarChart.Tooltip;
  /** HeroUI Pro's tooltip body, for the `content` of the tooltip. */
  readonly TooltipContent: typeof HeroBarChart.TooltipContent;
  /** The horizontal axis. */
  readonly XAxis: typeof HeroBarChart.XAxis;
  /** The vertical axis. */
  readonly YAxis: typeof HeroBarChart.YAxis;
}

/** A bar chart: put Bar, Grid, Tooltip, TooltipContent, XAxis, YAxis inside it. Name it for screen readers with `label`. */
export const BarChart: typeof BarChartRoot & BarChartParts = Object.assign(BarChartRoot, {
  Bar: HeroBarChart.Bar,
  Grid: HeroBarChart.Grid,
  Tooltip: HeroBarChart.Tooltip,
  TooltipContent: HeroBarChart.TooltipContent,
  XAxis: HeroBarChart.XAxis,
  YAxis: HeroBarChart.YAxis,
});
