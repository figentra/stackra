/**
 * Stackra file contract:
 * Purpose: the web `RadialChart` compound on HeroUI Pro's RadialChart (a recharts chart in a themed container): the root maps
 *          `label` to `aria-label`; every other prop passes through. The parts are HeroUI Pro's own: AngleAxis, Bar, Cell, Tooltip, TooltipContent.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. It draws with `recharts`, an
 *          optional peer. The compound exposes the documented parts: HeroUI Pro's `RadialChart.Root` is left out. Imports the
 *          `radial-chart` subpath, the only way to reach it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import { RadialChart as HeroRadialChart } from "@heroui-pro/react/radial-chart";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { RadialChartProps } from "#react/radial-chart/radial-chart.props";

/** The root: HeroUI Pro's, with `label` as the `aria-label`. */
function RadialChartRoot({ label, ...rest }: RadialChartProps) {
  return <HeroRadialChart.Root {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface RadialChartParts {
  /** The axis around the circle. */
  readonly AngleAxis: typeof HeroRadialChart.AngleAxis;
  /** The bar series of one data key. */
  readonly Bar: typeof HeroRadialChart.Bar;
  /** The styling of one slice or bar. */
  readonly Cell: typeof HeroRadialChart.Cell;
  /** The recharts tooltip, shown while a point is pressed or hovered. */
  readonly Tooltip: typeof HeroRadialChart.Tooltip;
  /** HeroUI Pro's tooltip body, for the `content` of the tooltip. */
  readonly TooltipContent: typeof HeroRadialChart.TooltipContent;
}

/** A radial chart: put AngleAxis, Bar, Cell, Tooltip, TooltipContent inside it. Name it for screen readers with `label`. */
export const RadialChart: typeof RadialChartRoot & RadialChartParts = Object.assign(
  RadialChartRoot,
  {
    AngleAxis: HeroRadialChart.AngleAxis,
    Bar: HeroRadialChart.Bar,
    Cell: HeroRadialChart.Cell,
    Tooltip: HeroRadialChart.Tooltip,
    TooltipContent: HeroRadialChart.TooltipContent,
  },
);
