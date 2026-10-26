/**
 * Stackra file contract:
 * Purpose: the web `AreaChart` compound on HeroUI Pro's AreaChart (a recharts chart in a themed container): the root maps
 *          `label` to `aria-label`; every other prop passes through. The parts are HeroUI Pro's own: Area, Grid, Tooltip, TooltipContent, XAxis, YAxis.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. It draws with `recharts`, an
 *          optional peer. The compound exposes the documented parts: HeroUI Pro's `AreaChart.Root` is left out. Imports the
 *          `area-chart` subpath, the only way to reach it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import { AreaChart as HeroAreaChart } from "@heroui-pro/react/area-chart";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { AreaChartProps } from "#react/area-chart/area-chart.props";

/** The root: HeroUI Pro's, with `label` as the `aria-label`. */
function AreaChartRoot({ label, ...rest }: AreaChartProps) {
  return <HeroAreaChart.Root {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface AreaChartParts {
  /** The filled area series of one data key. */
  readonly Area: typeof HeroAreaChart.Area;
  /** The background grid lines. */
  readonly Grid: typeof HeroAreaChart.Grid;
  /** The recharts tooltip, shown while a point is pressed or hovered. */
  readonly Tooltip: typeof HeroAreaChart.Tooltip;
  /** HeroUI Pro's tooltip body, for the `content` of the tooltip. */
  readonly TooltipContent: typeof HeroAreaChart.TooltipContent;
  /** The horizontal axis. */
  readonly XAxis: typeof HeroAreaChart.XAxis;
  /** The vertical axis. */
  readonly YAxis: typeof HeroAreaChart.YAxis;
}

/** A area chart: put Area, Grid, Tooltip, TooltipContent, XAxis, YAxis inside it. Name it for screen readers with `label`. */
export const AreaChart: typeof AreaChartRoot & AreaChartParts = Object.assign(AreaChartRoot, {
  Area: HeroAreaChart.Area,
  Grid: HeroAreaChart.Grid,
  Tooltip: HeroAreaChart.Tooltip,
  TooltipContent: HeroAreaChart.TooltipContent,
  XAxis: HeroAreaChart.XAxis,
  YAxis: HeroAreaChart.YAxis,
});
