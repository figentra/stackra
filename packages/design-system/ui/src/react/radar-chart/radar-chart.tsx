/**
 * Stackra file contract:
 * Purpose: the web `RadarChart` on Recharts: one spoke per row clockwise from the top, one filled shape per series in
 *          its theme colour, over a polygon grid, with the tooltip, legend and data table.
 * Boundary: no style of its own; a radar is never mirrored. Recharts animates only without `prefers-reduced-motion`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 *          Portions ported from shadcn/ui (https://github.com/shadcn-ui/ui, apps/v4/registry/new-york-v4/charts at\n *          96da9cc7f1aa10580a3741664e2a77c721206c00), MIT License, Copyright (c) 2023 shadcn. See THIRD_PARTY_NOTICES.md.
 */
import type { ReactElement } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  Tooltip,
} from "recharts";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chartTableOf } from "#core/functions/chart-table-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { activeDotOf } from "#react/chart/active-dot-of.function";
import { ChartFrame } from "#react/chart/chart-frame";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";
import type { RadarChartProps } from "#react/radar-chart/radar-chart.props";

/** Series as shapes over spokes. */
export function RadarChart(props: RadarChartProps): ReactElement {
  const { data, series, label, xKey, xFormat, valueFormat, height = 260 } = props;
  const { locale, words } = useChartLocale();
  const category = (value: unknown) => formatChartCategory(value, locale, xFormat);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const table = chartTableOf({
    data,
    series,
    categoryKey: xKey,
    locale,
    valueFormat,
    categoryFormat: xFormat,
    words,
  });
  return (
    <ChartFrame
      label={label}
      table={table}
      legend={(props.showLegend ?? series.length > 1) ? series : []}
      palette={props.palette}
      className={props.className}
    >
      <RechartsRadarChart
        data={[...data]}
        responsive
        style={{ width: "100%", height }}
        outerRadius="75%"
        role="img"
        aria-label={label}
      >
        {props.showTooltip === false ? null : (
          <Tooltip
            cursor={false}
            content={<ChartTooltip formatLabel={category} formatValue={value} />}
          />
        )}
        <PolarGrid {...CHART_PAINT.grid} />
        <PolarAngleAxis dataKey={xKey} tick={CHART_PAINT.tick} tickFormatter={category} />
        {series.map((item, index) => {
          const color = paintOf(chartColorOf(item, index, props.palette));
          return (
            <Radar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              stroke={color}
              strokeWidth={2}
              fill={color}
              fillOpacity={series.length > 1 ? 0.25 : 0.5}
              dot={{ r: 3, fillOpacity: 1, fill: color }}
              activeDot={activeDotOf(color)}
            />
          );
        })}
      </RechartsRadarChart>
    </ChartFrame>
  );
}
