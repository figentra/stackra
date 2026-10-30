/**
 * Stackra file contract:
 * Purpose: `PieFigure`, the web pie on Recharts that `PieChart` and `DonutChart` share: one slice per row clockwise
 *          from the top, in its series' theme colour, with the tooltip, legend and data table; a donut adds a hole
 *          with the total and `centerLabel` in it.
 * Boundary: no style of its own; a pie is never mirrored. Recharts animates only without `prefers-reduced-motion`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 *          Portions ported from shadcn/ui (https://github.com/shadcn-ui/ui, apps/v4/registry/new-york-v4/charts at\n *          96da9cc7f1aa10580a3741664e2a77c721206c00), MIT License, Copyright (c) 2023 shadcn. See THIRD_PARTY_NOTICES.md.
 */
import type { ReactElement } from "react";
import { Label, Pie, PieChart as RechartsPieChart, Tooltip } from "recharts";

import { chartTableOf } from "#core/functions/chart-table-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { centreLabel } from "#react/chart/centre-label";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { ChartFrame } from "#react/chart/chart-frame";
import type { PieFigureProps } from "#react/chart/pie-figure.props";
import { sliceRowsOf } from "#react/chart/slice-rows-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";

/** A pie or donut. */
export function PieFigure(props: PieFigureProps): ReactElement {
  const { data, series, label, nameKey, valueKey, valueFormat, height = 240, isDonut } = props;
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
  const total = data.reduce(
    (sum, row) => sum + (typeof row[valueKey] === "number" ? row[valueKey] : 0),
    0,
  );
  return (
    <ChartFrame
      label={label}
      table={table}
      legend={(props.showLegend ?? false) ? series : []}
      palette={props.palette}
      className={props.className}
    >
      <RechartsPieChart responsive style={{ width: "100%", height }} role="img" aria-label={label}>
        {props.showTooltip === false ? null : (
          <Tooltip content={<ChartTooltip formatValue={value} />} />
        )}
        <Pie
          data={sliceRowsOf(data, series, nameKey, props.palette)}
          dataKey={valueKey}
          nameKey="name"
          startAngle={90}
          endAngle={-270}
          innerRadius={isDonut ? "54%" : 0}
          outerRadius="90%"
          stroke={CHART_PAINT.surface}
          strokeWidth={2}
        >
          {isDonut && props.centerLabel ? (
            <Label content={centreLabel(value(total), props.centerLabel)} />
          ) : null}
        </Pie>
      </RechartsPieChart>
    </ChartFrame>
  );
}
