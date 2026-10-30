/**
 * Stackra file contract:
 * Purpose: the native `ComposedChart` on Victory Native: some series as columns (rounded data ends, grouped) and the
 *          rest as 2px monotone lines over them, the quiet horizontal grid, category labels under the plot, and while
 *          scrubbed the `ChartCrosshair` (soft band, dashed guide, ringed dots, a selection tick per category) with a
 *          readout of every series' value above the plot.
 * Boundary: a new chart beside `CartesianFigure`, which it does not touch. Labels are Skia paragraphs (shaping and
 *           bidi for Arabic); right to left the categories run from the right. Paths ease in only without Reduce
 *           Motion. Stacked columns are drawn grouped on native (shortcut, see below).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); chart style
 *          spec (2026-10-28) section 6; WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import { Skia, TextAlign } from "@shopify/react-native-skia";
import { useThemeColor } from "heroui-native";
import { type ReactElement, type ReactNode, useMemo, useState } from "react";
import { View } from "react-native";
import { runOnJS, useAnimatedReaction, useReducedMotion } from "react-native-reanimated";
import {
  Bar,
  BarGroup,
  CartesianChart,
  type ChartBounds,
  createParagraphLabelRenderer,
  Line,
  type PointsArray,
  useChartPressState,
} from "victory-native";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chartTableOf } from "#core/functions/chart-table-of.function";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { ChartFrame } from "#native/chart/chart-frame";
import { ChartCrosshair } from "#native/chart-crosshair/chart-crosshair";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { ComposedChartProps } from "#native/composed-chart/composed-chart.props";
import { haptics } from "#native/haptics/haptics";
import { Text } from "#native/text/text";

/** A loose Victory row. */
type Row = Record<string, string | number | null>;

/** Victory's chart, typed for keys known only at run time. */
const Chart = CartesianChart as unknown as (props: {
  readonly children: (args: {
    readonly points: Record<string, PointsArray>;
    readonly chartBounds: ChartBounds;
  }) => ReactNode;
  readonly [prop: string]: unknown;
}) => ReactElement;

/** Columns and lines over one category axis. */
export function ComposedChart(props: ComposedChartProps): ReactElement {
  const { data, series, label, xKey, xFormat, valueFormat, height = 240, palette } = props;
  const { locale, isRtl, words } = useChartLocale();
  const isReduced = useReducedMotion();
  const lineKeys = new Set(props.lineKeys ?? series.slice(-1).map((item) => item.key));
  const paint = useChartPaint(series.map((item, index) => chartColorOf(item, index, palette)));
  const keys = series.map((item) => item.key);
  const rows = useMemo(() => {
    const copy = data.map((row) => ({ ...row }) as Row);
    // oxlint-disable-next-line unicorn/no-array-reverse -- reverses an array built here, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
    return isRtl ? copy.reverse() : copy;
  }, [data, isRtl]);
  const { state, isActive } = useChartPressState({
    x: "" as string | number,
    y: Object.fromEntries(keys.map((key) => [key, 0])),
  });
  const [pressed, setPressed] = useState(-1);
  const surface = useThemeColor("surface");
  // A selection tick each time the finger crosses into another category, as a scrubber should feel.
  const scrubTo = (index: number) => {
    if (index >= 0) haptics.play("selection");
    setPressed(index);
  };
  useAnimatedReaction(
    () => (state.isActive.value ? state.matchedIndex.value : -1),
    (index, previous) => {
      if (index !== previous) runOnJS(scrubTo)(index);
    },
  );
  const labels = useMemo(
    () =>
      createParagraphLabelRenderer({
        paragraphStyle: { maxLines: 1, textAlign: TextAlign.Center },
        // oxlint-disable-next-line react/capitalized-calls -- Skia.Color is Skia's colour parser, a namespace method, not a component
        textStyle: { fontSize: 10, color: Skia.Color(paint.muted) },
        maxWidth: ({ text }) => text.length * 6.5 + 8,
      }),
    [paint.muted],
  );
  const animate = isReduced ? undefined : ({ type: "timing", duration: 300 } as const);
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
  const row = isActive ? rows[pressed] : undefined;
  const barIndexes = series
    .map((item, index) => (lineKeys.has(item.key) ? -1 : index))
    .filter((index) => index >= 0);
  return (
    <ChartFrame
      label={label}
      spoken={chartTextOf(table, locale)}
      legend={(props.showLegend ?? series.length > 1) ? series : []}
      className={props.className}
      readout={
        row && props.showTooltip !== false ? (
          <View className="gap-1.5 rounded-lg border border-separator bg-overlay px-3 py-2">
            <Text type="caption" tone="muted" className="font-medium">
              {category(row[xKey])}
            </Text>
            {series.map((item, index) => (
              <View key={item.key} className="flex-row items-center gap-2">
                <View
                  className={
                    lineKeys.has(item.key) ? "h-3 w-1 rounded-full" : "size-2 rounded-full"
                  }
                  style={{ backgroundColor: paint.series[index] }}
                />
                <Text type="caption" tone="muted" className="flex-1">
                  {item.label}
                </Text>
                <Text type="caption" className="font-semibold">
                  {typeof row[item.key] === "number" ? value(row[item.key] as number) : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null
      }
    >
      <View style={{ height }}>
        <Chart
          data={rows}
          xKey={xKey}
          yKeys={keys}
          {...(props.showTooltip === false ? {} : { chartPressState: state })}
          padding={{ top: 8, bottom: 4 }}
          domainPadding={{ left: 32, right: 32, top: 8 }}
          domain={{ y: [0] }}
          frame={{ lineWidth: 0 }}
          xAxis={{
            labelRenderer: labels,
            formatXLabel: category,
            lineWidth: 0,
            labelColor: paint.muted,
          }}
          yAxis={[
            {
              axisSide: isRtl ? "right" : "left",
              labelColor: paint.muted,
              lineColor: paint.grid,
              lineWidth: props.showGrid === false ? 0 : 1,
              tickCount: 4,
            },
          ]}
        >
          {({ points, chartBounds }) => {
            // shortcut: stacked columns draw grouped on native; switch to StackedBar when a product needs stacks here.
            const columns =
              barIndexes.length === 1 ? (
                <Bar
                  points={points[keys[barIndexes[0] ?? 0] ?? ""] ?? []}
                  chartBounds={chartBounds}
                  color={paint.series[barIndexes[0] ?? 0] ?? ""}
                  innerPadding={0.45}
                  roundedCorners={{ topLeft: 4, topRight: 4 }}
                  {...(animate ? { animate } : {})}
                />
              ) : barIndexes.length > 1 ? (
                <BarGroup
                  chartBounds={chartBounds}
                  betweenGroupPadding={0.3}
                  withinGroupPadding={0.1}
                  roundedCorners={{ topLeft: 4, topRight: 4 }}
                >
                  {barIndexes.map((index) => (
                    <BarGroup.Bar
                      key={keys[index]}
                      points={points[keys[index] ?? ""] ?? []}
                      color={paint.series[index] ?? ""}
                      {...(animate ? { animate } : {})}
                    />
                  ))}
                </BarGroup>
              ) : null;
            const span = (chartBounds.right - chartBounds.left) / Math.max(1, rows.length);
            return (
              <>
                {props.showTooltip === false ? null : (
                  <ChartCrosshair
                    state={state}
                    bounds={chartBounds}
                    bandWidth={barIndexes.length > 0 ? span * 0.8 : 0}
                    dots={series.flatMap((item, index) =>
                      lineKeys.has(item.key)
                        ? [{ key: item.key, color: paint.series[index] ?? "" }]
                        : [],
                    )}
                    guideColor={paint.muted}
                    bandColor={paint.foreground}
                    ringColor={surface}
                  />
                )}
                {columns}
                {series.map((item, index) =>
                  lineKeys.has(item.key) ? (
                    <Line
                      key={item.key}
                      points={points[item.key] ?? []}
                      color={paint.series[index] ?? ""}
                      strokeWidth={2}
                      curveType="monotoneX"
                      {...(animate ? { animate } : {})}
                    />
                  ) : null,
                )}
              </>
            );
          }}
        </Chart>
      </View>
    </ChartFrame>
  );
}
