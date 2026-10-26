/**
 * Stackra file contract:
 * Purpose: the web `LineChart` compound on HeroUI Pro's LineChart (a recharts chart in a themed container): the root maps
 *          `label` to `aria-label`; every other prop passes through. The parts are HeroUI Pro's own: Grid, Line, Tooltip, TooltipContent, XAxis, YAxis.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. It draws with `recharts`, an
 *          optional peer. The compound exposes the documented parts: HeroUI Pro's `LineChart.Root` is left out. Imports the
 *          `line-chart` subpath, the only way to reach it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import { LineChart as HeroLineChart } from "@heroui-pro/react/line-chart";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { LineChartProps } from "#react/line-chart/line-chart.props";

/** The root: HeroUI Pro's, with `label` as the `aria-label`. */
function LineChartRoot({ label, ...rest }: LineChartProps) {
  return <HeroLineChart.Root {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface LineChartParts {
  /** The background grid lines. */
  readonly Grid: typeof HeroLineChart.Grid;
  /** The line series of one data key. */
  readonly Line: typeof HeroLineChart.Line;
  /** The recharts tooltip, shown while a point is pressed or hovered. */
  readonly Tooltip: typeof HeroLineChart.Tooltip;
  /** HeroUI Pro's tooltip body, for the `content` of the tooltip. */
  readonly TooltipContent: typeof HeroLineChart.TooltipContent;
  /** The horizontal axis. */
  readonly XAxis: typeof HeroLineChart.XAxis;
  /** The vertical axis. */
  readonly YAxis: typeof HeroLineChart.YAxis;
}

/** A line chart: put Grid, Line, Tooltip, TooltipContent, XAxis, YAxis inside it. Name it for screen readers with `label`. */
export const LineChart: typeof LineChartRoot & LineChartParts = Object.assign(LineChartRoot, {
  Grid: HeroLineChart.Grid,
  Line: HeroLineChart.Line,
  Tooltip: HeroLineChart.Tooltip,
  TooltipContent: HeroLineChart.TooltipContent,
  XAxis: HeroLineChart.XAxis,
  YAxis: HeroLineChart.YAxis,
});
