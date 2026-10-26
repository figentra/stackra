/**
 * Stackra file contract:
 * Purpose: the web `PieChart` compound on HeroUI Pro's PieChart (a recharts chart in a themed container): the root maps
 *          `label` to `aria-label`; every other prop passes through. The parts are HeroUI Pro's own: Cell, Label, Pie, Tooltip, TooltipContent.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. It draws with `recharts`, an
 *          optional peer. The compound exposes the documented parts: HeroUI Pro's `PieChart.Root` is left out. Imports the
 *          `pie-chart` subpath, the only way to reach it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import { PieChart as HeroPieChart } from "@heroui-pro/react/pie-chart";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { PieChartProps } from "#react/pie-chart/pie-chart.props";

/** The root: HeroUI Pro's, with `label` as the `aria-label`. */
function PieChartRoot({ label, ...rest }: PieChartProps) {
  return <HeroPieChart.Root {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface PieChartParts {
  /** The styling of one slice or bar. */
  readonly Cell: typeof HeroPieChart.Cell;
  /** The label drawn inside the chart. */
  readonly Label: typeof HeroPieChart.Label;
  /** The pie series that draws the slices. */
  readonly Pie: typeof HeroPieChart.Pie;
  /** The recharts tooltip, shown while a point is pressed or hovered. */
  readonly Tooltip: typeof HeroPieChart.Tooltip;
  /** HeroUI Pro's tooltip body, for the `content` of the tooltip. */
  readonly TooltipContent: typeof HeroPieChart.TooltipContent;
}

/** A pie chart: put Cell, Label, Pie, Tooltip, TooltipContent inside it. Name it for screen readers with `label`. */
export const PieChart: typeof PieChartRoot & PieChartParts = Object.assign(PieChartRoot, {
  Cell: HeroPieChart.Cell,
  Label: HeroPieChart.Label,
  Pie: HeroPieChart.Pie,
  Tooltip: HeroPieChart.Tooltip,
  TooltipContent: HeroPieChart.TooltipContent,
});
