/**
 * Stackra file contract:
 * Purpose: the web `RadarChart` compound on HeroUI Pro's RadarChart (a recharts chart in a themed container): the root maps
 *          `label` to `aria-label`; every other prop passes through. The parts are HeroUI Pro's own: AngleAxis, Grid, Radar, RadiusAxis, Tooltip, TooltipContent.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. It draws with `recharts`, an
 *          optional peer. The compound exposes the documented parts: HeroUI Pro's `RadarChart.Root` is left out. Imports the
 *          `radar-chart` subpath, the only way to reach it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import {
  RadarChart as HeroRadarChart,
  type RadarChartRootProps as HeroRadarChartRootProps,
} from "@heroui-pro/react/radar-chart";

import type { RadarChartContractProps } from "#contracts/types/radar-chart-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the web RadarChart: the shared contract plus HeroUI Pro's own container props, passed through unchanged. The
 * accessible name is `label`, so `aria-label` is left out of the type.
 */
export type RadarChartProps = RadarChartContractProps &
  Omit<HeroRadarChartRootProps, keyof RadarChartContractProps | "aria-label">;

/** The root: HeroUI Pro's, with `label` as the `aria-label`. */
function RadarChartRoot({ label, ...rest }: RadarChartProps) {
  return <HeroRadarChart.Root {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface RadarChartParts {
  /** The axis around the circle. */
  readonly AngleAxis: typeof HeroRadarChart.AngleAxis;
  /** The background grid lines. */
  readonly Grid: typeof HeroRadarChart.Grid;
  /** The radar series of one data key. */
  readonly Radar: typeof HeroRadarChart.Radar;
  /** The axis from the centre outwards. */
  readonly RadiusAxis: typeof HeroRadarChart.RadiusAxis;
  /** The recharts tooltip, shown while a point is pressed or hovered. */
  readonly Tooltip: typeof HeroRadarChart.Tooltip;
  /** HeroUI Pro's tooltip body, for the `content` of the tooltip. */
  readonly TooltipContent: typeof HeroRadarChart.TooltipContent;
}

/** A radar chart: put AngleAxis, Grid, Radar, RadiusAxis, Tooltip, TooltipContent inside it. Name it for screen readers with `label`. */
export const RadarChart: typeof RadarChartRoot & RadarChartParts = Object.assign(RadarChartRoot, {
  AngleAxis: HeroRadarChart.AngleAxis,
  Grid: HeroRadarChart.Grid,
  Radar: HeroRadarChart.Radar,
  RadiusAxis: HeroRadarChart.RadiusAxis,
  Tooltip: HeroRadarChart.Tooltip,
  TooltipContent: HeroRadarChart.TooltipContent,
});
