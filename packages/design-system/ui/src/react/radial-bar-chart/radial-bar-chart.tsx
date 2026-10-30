/**
 * Stackra file contract:
 * Purpose: the web `RadialBarChart` on Recharts: one ring per row, filled clockwise from the top to its value out of
 *          `maxValue` over a track, in its series' theme colour, with the tooltip, the data table and an optional
 *          total in the middle.
 * Boundary: no style of its own; rings are never mirrored. Recharts animates only without `prefers-reduced-motion`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 *          Portions ported from shadcn/ui (https://github.com/shadcn-ui/ui, apps/v4/registry/new-york-v4/charts at\n *          96da9cc7f1aa10580a3741664e2a77c721206c00), MIT License, Copyright (c) 2023 shadcn. See THIRD_PARTY_NOTICES.md.
 */
import type { ReactElement } from "react";
import {
  Label,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart as RechartsRadialBarChart,
  Tooltip,
} from "recharts";

import { chartTableOf } from "#core/functions/chart-table-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { centreLabel } from "#react/chart/centre-label";
import { ChartFrame } from "#react/chart/chart-frame";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { sliceRowsOf } from "#react/chart/slice-rows-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";
import type { RadialBarChartProps } from "#react/radial-bar-chart/radial-bar-chart.props";

/** Rings filled to their values. */
export function RadialBarChart(props: RadialBarChartProps): ReactElement {
  const { data, series, label, nameKey, valueKey, valueFormat, height = 240 } = props;
  const { locale, words } = useChartLocale();
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const table = chartTableOf({
    data,
    series,
    categoryKey: nameKey,
    valueKey,
    locale,
    valueFormat,
    words,
  });
  const values = data.map((row) => (typeof row[valueKey] === "number" ? row[valueKey] : 0));
  const total = values.reduce((sum, figure) => sum + figure, 0);
  const max = props.maxValue ?? Math.max(1, ...values);
  return (
    <ChartFrame
      label={label}
      table={table}
      legend={(props.showLegend ?? false) ? series : []}
      palette={props.palette}
      className={props.className}
    >
      <RechartsRadialBarChart
        data={sliceRowsOf(data, series, nameKey, props.palette)}
        responsive
        style={{ width: "100%", height }}
        startAngle={90}
        endAngle={-270}
        innerRadius={props.centerLabel ? "55%" : "30%"}
        outerRadius="95%"
        {...(data.length > 1 ? {} : { barSize: 14 })}
        role="img"
        aria-label={label}
      >
        <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />
        {props.showTooltip === false ? null : (
          <Tooltip cursor={false} content={<ChartTooltip nameKey="name" formatValue={value} />} />
        )}
        <RadialBar dataKey={valueKey} background={CHART_PAINT.track} cornerRadius={10} />
        {props.centerLabel ? (
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label content={centreLabel(value(total), props.centerLabel)} />
          </PolarRadiusAxis>
        ) : null}
      </RechartsRadialBarChart>
    </ChartFrame>
  );
}
