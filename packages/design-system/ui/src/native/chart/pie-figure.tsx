/**
 * Stackra file contract:
 * Purpose: `PieFigure`, the native pie on Victory Native that PieChart and DonutChart share: one slice per row
 *          clockwise from the top in its series' colour (the accent ramp by default), each slice parted from the next
 *          by a 2px gap of the surface; a donut (inner radius 60%) adds a hole with the total and `centerLabel`.
 * Boundary: a pie is never mirrored. Victory Native's polar chart has no press state, so the slices carry no readout:
 *           the legend (`showLegend`) names them and the chart's spoken value reads every share.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";
import { Pie, PolarChart } from "victory-native";

import { chartTableOf } from "#core/functions/chart-table-of.function";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { ChartFrame } from "#native/chart/chart-frame";
import type { PieFigureProps } from "#native/chart/pie-figure.props";
import { RingCentre } from "#native/chart/ring-centre";
import { sliceColorsOf } from "#native/chart/slice-colors-of.function";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";

/** A pie or donut. */
export function PieFigure(props: PieFigureProps): ReactElement {
  const { data, series, label, nameKey, valueKey, valueFormat, height = 240, isDonut } = props;
  const { locale, words } = useChartLocale();
  const paint = useChartPaint(sliceColorsOf(data, series, nameKey, props.palette));
  const table = chartTableOf({ data, series, categoryKey: nameKey, valueKey, locale, valueFormat, words });
  const total = data.reduce((sum, row) => sum + (typeof row[valueKey] === "number" ? row[valueKey] : 0), 0);
  const rows = data.map((row, index) => ({
    name: String(row[nameKey] ?? ""),
    value: typeof row[valueKey] === "number" ? row[valueKey] : 0,
    color: paint.series[index] ?? "",
  }));
  return (
    <ChartFrame
      label={label}
      spoken={chartTextOf(table, locale)}
      legend={(props.showLegend ?? false) ? series : []}
      palette={props.palette}
      className={props.className}
    >
      <View style={{ height }}>
        <PolarChart data={rows} labelKey="name" valueKey="value" colorKey="color">
          <Pie.Chart innerRadius={isDonut ? "60%" : 0} startAngle={-90}>
            {() => (
              <>
                <Pie.Slice />
                <Pie.SliceAngularInset
                  angularInset={{ angularStrokeWidth: 2, angularStrokeColor: paint.surface }}
                />
              </>
            )}
          </Pie.Chart>
        </PolarChart>
        {isDonut && props.centerLabel ? (
          <RingCentre value={formatChartNumber(total, locale, valueFormat)} word={props.centerLabel} />
        ) : null}
      </View>
    </ChartFrame>
  );
}
