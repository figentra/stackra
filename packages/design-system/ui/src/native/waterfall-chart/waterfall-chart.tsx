/**
 * Stackra file contract:
 * Purpose: the native `WaterfallChart` on Victory Native and Skia: a bridge from a start total to an end total, each
 *          step a bar floating from the running total (rises in success, falls in danger, totals in the accent), with
 *          a readout of the pressed bar's change and running total, and one image whose value reads every bar.
 * Boundary: bars drawn as Skia rects on Victory's scale; axis labels through the Paragraph API. Rows are handed over
 *           reversed in Arabic so the bridge reads from the right.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.1; STA-1371.
 */
import { RoundedRect } from "@shopify/react-native-skia";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { useChartPressState } from "victory-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { WATERFALL_COLOR } from "#core/constants/waterfall-color.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { waterfallRowsOf } from "#core/functions/waterfall-rows-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { ChartFrame } from "#native/chart/chart-frame";
import { ChartReadout } from "#native/chart/chart-readout";
import { LooseCartesianChart } from "#native/chart/loose-cartesian-chart";
import { useAxisLabels } from "#native/chart/use-axis-labels";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { WaterfallChartProps } from "#native/waterfall-chart/waterfall-chart.props";

/** A bridge from one total to the next. */
export function WaterfallChart({
  start,
  steps,
  endLabel,
  label,
  valueFormat,
  height = 240,
  showTooltip = true,
  className,
}: WaterfallChartProps): ReactElement {
  const { locale, isRtl } = useChartLocale();
  const t = useUiText();
  const paint = useChartPaint([WATERFALL_COLOR.total, WATERFALL_COLOR.up, WATERFALL_COLOR.down]);
  const colorOf = { total: paint.series[0], up: paint.series[1], down: paint.series[2] } as const;
  const labels = useAxisLabels(paint.muted);
  const ordered = waterfallRowsOf(start, steps, endLabel);
  // oxlint-disable-next-line unicorn/no-array-reverse -- reverses an array built here, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
  const rows = isRtl ? [...ordered].reverse() : ordered;
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const signed = (figure: number) =>
    formatChartNumber(figure, locale, { ...valueFormat, signDisplay: "exceptZero" });
  const { state, isActive } = useChartPressState({ x: "", y: { low: 0, high: 0 } });
  const [pressed, setPressed] = useState(-1);
  useAnimatedReaction(
    () => (state.isActive.value ? state.matchedIndex.value : -1),
    (index, previous) => {
      if (index !== previous) runOnJS(setPressed)(index);
    },
  );
  const row = isActive ? rows[pressed] : undefined;
  const spoken = ordered
    .map(
      (item) =>
        `${item.label}: ${item.kind === "total" ? value(item.total) : `${signed(item.value)}, ${value(item.total)}`}`,
    )
    .join("; ");
  return (
    <ChartFrame
      label={label}
      spoken={spoken}
      legend={[]}
      className={className}
      readout={
        row && showTooltip ? (
          <ChartReadout
            title={row.label}
            items={[
              ...(row.kind === "total"
                ? []
                : [
                    {
                      label: t(UI_KEYS.ui.chart.change),
                      value: signed(row.value),
                      color: colorOf[row.kind] ?? "",
                    },
                  ]),
              {
                label: t(UI_KEYS.ui.chart.total),
                value: value(row.total),
                color: colorOf[row.kind] ?? "",
              },
            ]}
          />
        ) : null
      }
    >
      <View style={{ height }}>
        <LooseCartesianChart
          data={rows.map((item) => ({ label: item.label, low: item.low, high: item.high }))}
          xKey="label"
          yKeys={["low", "high"]}
          {...(showTooltip ? { chartPressState: state } : {})}
          padding={{ top: 8, bottom: 4 }}
          domainPadding={{ left: 28, right: 28, top: 12 }}
          domain={{
            y: [
              Math.min(0, ...rows.map((item) => item.low)),
              Math.max(...rows.map((item) => item.high)),
            ],
          }}
          frame={{ lineWidth: 0 }}
          xAxis={{
            labelRenderer: labels,
            lineWidth: 0,
            labelColor: paint.muted,
            tickCount: rows.length,
          }}
          yAxis={[
            {
              axisSide: isRtl ? "right" : "left",
              labelRenderer: labels,
              formatYLabel: (figure: unknown) =>
                typeof figure === "number"
                  ? formatChartNumber(figure, locale, { notation: "compact", ...valueFormat })
                  : "",
              labelColor: paint.muted,
              lineColor: paint.grid,
              lineWidth: 1,
              tickCount: 4,
            },
          ]}
        >
          {({ points, chartBounds }) => {
            const width =
              ((chartBounds.right - chartBounds.left) / Math.max(1, rows.length)) * 0.56;
            return rows.map((item, index) => {
              const top = points["high"]?.[index];
              const bottom = points["low"]?.[index];
              if (!top || !bottom || typeof top.y !== "number" || typeof bottom.y !== "number")
                return null;
              return (
                <RoundedRect
                  key={item.key}
                  x={top.x - width / 2}
                  y={top.y}
                  width={width}
                  height={Math.max(bottom.y - top.y, 2)}
                  r={4}
                  color={colorOf[item.kind] ?? paint.muted}
                />
              );
            });
          }}
        </LooseCartesianChart>
      </View>
    </ChartFrame>
  );
}
