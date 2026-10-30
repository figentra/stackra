/**
 * Stackra file contract:
 * Purpose: the native `ScatterChart` on Victory Native and Skia: points placed by two numbers, one colour per series
 *          (group), sized by a third number for a bubble chart, with toggles in the legend, reference lines and one
 *          image whose value reads every point.
 * Boundary: axis labels through the Paragraph API. The horizontal axis runs right to left in Arabic: the numbers are
 *           handed over negated and written back positive, since Victory's numeric axis has no reverse.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1; STA-1371.
 */
import { DashPathEffect, Group, Line, Rect, vec } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { View } from "react-native";
import { Scatter } from "victory-native";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chartReferenceTextOf } from "#core/functions/chart-reference-text-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { useSeriesToggle } from "#react/chart/use-series-toggle";
import { alphaOf } from "#native/chart/alpha-of.function";
import { ChartFrame } from "#native/chart/chart-frame";
import { LooseCartesianChart } from "#native/chart/loose-cartesian-chart";
import { useAxisLabels } from "#native/chart/use-axis-labels";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { ScatterChartProps } from "#native/scatter-chart/scatter-chart.props";

/** The smallest and largest bubble radii, in points. */
const RADIUS = [3, 14] as const;

/** Points by two numbers, sized by a third when given. */
export function ScatterChart(props: ScatterChartProps): ReactElement {
  const {
    data,
    series,
    label,
    xKey,
    yKey,
    sizeKey,
    groupKey,
    xLabel,
    yLabel,
    height = 280,
  } = props;
  const { locale, isRtl } = useChartLocale();
  const paint = useChartPaint(
    series.map((item, index) => chartColorOf(item, index, props.palette)),
  );
  const labels = useAxisLabels(paint.muted);
  const { hidden, toggle } = useSeriesToggle();
  const sign = isRtl ? -1 : 1;
  const x = (figure: number) => formatChartNumber(figure, locale, props.xFormat);
  const y = (figure: number) => formatChartNumber(figure, locale, props.valueFormat);
  const groupOf = (row: (typeof data)[number]) =>
    groupKey === undefined ? series[0]?.key : String(row[groupKey] ?? "");
  const shown = series
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !hidden.includes(item.key));
  const points = data.filter(
    (row) => typeof row[xKey] === "number" && typeof row[yKey] === "number",
  );
  // One row per point, its y under its group's key only, so each group is its own Victory series.
  const rows = points.map((row) => ({
    x: sign * (row[xKey] as number),
    ...Object.fromEntries(
      shown.map(({ item }) => [item.key, groupOf(row) === item.key ? (row[yKey] as number) : null]),
    ),
  }));
  const sizes = sizeKey ? points.map((row) => Number(row[sizeKey]) || 0) : [];
  const [least = 0, most = 0] = [Math.min(...sizes), Math.max(...sizes)];
  const radiusOf = (row: (typeof points)[number]) =>
    !sizeKey || most === least
      ? 5
      : RADIUS[0] +
        Math.sqrt(((Number(row[sizeKey]) || 0) - least) / (most - least)) * (RADIUS[1] - RADIUS[0]);
  const spoken = [
    ...points.map(
      (row) =>
        `${series.find((item) => item.key === groupOf(row))?.label ?? ""}: ${xLabel} ${x(row[xKey] as number)}, ${yLabel} ${y(
          row[yKey] as number,
        )}${sizeKey && typeof row[sizeKey] === "number" ? `, ${props.sizeLabel ?? ""} ${y(row[sizeKey])}` : ""}`,
    ),
    ...(props.references ?? []).map((item) =>
      chartReferenceTextOf(item, locale, props.valueFormat),
    ),
  ].join("; ");
  return (
    <ChartFrame
      label={label}
      spoken={spoken}
      legend={(props.showLegend ?? series.length > 1) ? series : []}
      palette={props.palette}
      onToggle={toggle}
      hiddenKeys={hidden}
      className={props.className}
    >
      <View style={{ height }}>
        <LooseCartesianChart
          data={rows}
          xKey="x"
          yKeys={shown.map(({ item }) => item.key)}
          padding={{ top: 8, bottom: 4 }}
          domainPadding={{ left: 16, right: 16, top: 16, bottom: 8 }}
          frame={{ lineWidth: 0 }}
          xAxis={{
            labelRenderer: labels,
            formatXLabel: (figure: unknown) =>
              typeof figure === "number"
                ? formatChartNumber(sign * figure, locale, {
                    notation: "compact",
                    ...props.xFormat,
                  })
                : "",
            lineWidth: 0,
            labelColor: paint.muted,
            tickCount: 5,
          }}
          yAxis={[
            {
              axisSide: isRtl ? "right" : "left",
              labelRenderer: labels,
              formatYLabel: (figure: unknown) =>
                typeof figure === "number"
                  ? formatChartNumber(figure, locale, { notation: "compact", ...props.valueFormat })
                  : "",
              labelColor: paint.muted,
              lineColor: paint.grid,
              lineWidth: 1,
              tickCount: 4,
            },
          ]}
        >
          {({ points: drawn, chartBounds, yScale }) => (
            <>
              {(props.references ?? []).map((reference, index) =>
                reference.value === undefined ? (
                  <Rect
                    // oxlint-disable-next-line react/no-array-index-key -- reference lines carry no id and may share a value; the list is fixed per render
                    key={index}
                    x={chartBounds.left}
                    y={yScale(reference.to ?? 0)}
                    width={chartBounds.right - chartBounds.left}
                    height={yScale(reference.from ?? 0) - yScale(reference.to ?? 0)}
                    color={alphaOf(paint.muted, 0.08)}
                  />
                ) : (
                  // oxlint-disable-next-line react/no-array-index-key -- reference lines carry no id and may share a value; the list is fixed per render
                  <Group key={index}>
                    <Line
                      p1={vec(chartBounds.left, yScale(reference.value))}
                      p2={vec(chartBounds.right, yScale(reference.value))}
                      color={paint.muted}
                      strokeWidth={1.5}
                    >
                      <DashPathEffect intervals={[4, 4]} />
                    </Line>
                    {reference.label
                      ? labels.render({
                          text: reference.label,
                          x: isRtl ? chartBounds.left + 4 : chartBounds.right - 124,
                          y: yScale(reference.value) + 2,
                          width: 120,
                          color: paint.muted,
                        } as never)
                      : null}
                  </Group>
                ),
              )}
              {shown.map(({ item, index }) => (
                <Group key={item.key}>
                  <Scatter
                    points={drawn[item.key] ?? []}
                    color={alphaOf(paint.series[index] ?? "", sizeKey ? 0.85 : 0.95)}
                    radius={(point) => {
                      const row = points.find(
                        (entry) =>
                          sign * (entry[xKey] as number) === point.xValue &&
                          entry[yKey] === point.yValue,
                      );
                      return row ? radiusOf(row) : 5;
                    }}
                  />
                </Group>
              ))}
            </>
          )}
        </LooseCartesianChart>
      </View>
    </ChartFrame>
  );
}
