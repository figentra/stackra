/**
 * Stackra file contract:
 * Purpose: the web `ComposedChart` compound on HeroUI Pro's ComposedChart (a recharts chart in a themed container): the root maps
 *          `label` to `aria-label`; every other prop passes through. The parts are HeroUI Pro's own: Area, Bar, Grid, Line, Tooltip, TooltipContent, XAxis, YAxis.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. It draws with `recharts`, an
 *          optional peer. The compound exposes the documented parts: HeroUI Pro's `ComposedChart.Root` is left out. Imports the
 *          `composed-chart` subpath, the only way to reach it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import { ComposedChart as HeroComposedChart } from "@heroui-pro/react/composed-chart";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { ComposedChartProps } from "#react/composed-chart/composed-chart.props";

/** The root: HeroUI Pro's, with `label` as the `aria-label`. */
function ComposedChartRoot({ label, ...rest }: ComposedChartProps) {
  return <HeroComposedChart.Root {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ComposedChartParts {
  /** The filled area series of one data key. */
  readonly Area: typeof HeroComposedChart.Area;
  /** The bar series of one data key. */
  readonly Bar: typeof HeroComposedChart.Bar;
  /** The background grid lines. */
  readonly Grid: typeof HeroComposedChart.Grid;
  /** The line series of one data key. */
  readonly Line: typeof HeroComposedChart.Line;
  /** The recharts tooltip, shown while a point is pressed or hovered. */
  readonly Tooltip: typeof HeroComposedChart.Tooltip;
  /** HeroUI Pro's tooltip body, for the `content` of the tooltip. */
  readonly TooltipContent: typeof HeroComposedChart.TooltipContent;
  /** The horizontal axis. */
  readonly XAxis: typeof HeroComposedChart.XAxis;
  /** The vertical axis. */
  readonly YAxis: typeof HeroComposedChart.YAxis;
}

/** A composed chart: put Area, Bar, Grid, Line, Tooltip, TooltipContent, XAxis, YAxis inside it. Name it for screen readers with `label`. */
export const ComposedChart: typeof ComposedChartRoot & ComposedChartParts = Object.assign(
  ComposedChartRoot,
  {
    Area: HeroComposedChart.Area,
    Bar: HeroComposedChart.Bar,
    Grid: HeroComposedChart.Grid,
    Line: HeroComposedChart.Line,
    Tooltip: HeroComposedChart.Tooltip,
    TooltipContent: HeroComposedChart.TooltipContent,
    XAxis: HeroComposedChart.XAxis,
    YAxis: HeroComposedChart.YAxis,
  },
);
