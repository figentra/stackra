/**
 * Stackra file contract:
 * Purpose: the native `CandlestickChart` on Victory Native and Skia: one candle per period (a wick from low to high and
 *          a body from open to close; a rise hollow in success, a fall filled in danger), volume bars along the bottom
 *          quarter, a readout of the pressed period's prices, and one image whose value reads every period.
 * Boundary: candles drawn as Skia lines and rects on Victory's scale; axis labels through the Paragraph API. Periods
 *           are handed over reversed in Arabic so time reads from the right.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.1; STA-1371.
 */
import { Group, Line, Rect, vec } from "@shopify/react-native-skia";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { useChartPressState } from "victory-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { CandlestickChartProps } from "#native/candlestick-chart/candlestick-chart.props";
import { alphaOf } from "#native/chart/alpha-of.function";
import { ChartFrame } from "#native/chart/chart-frame";
import { ChartReadout } from "#native/chart/chart-readout";
import { LooseCartesianChart } from "#native/chart/loose-cartesian-chart";
import { useAxisLabels } from "#native/chart/use-axis-labels";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";

/** Candles of open, high, low and close, with volume. */
export function CandlestickChart({
  data,
  label,
  xFormat,
  valueFormat,
  showVolume,
  height = 280,
  showTooltip = true,
  className,
}: CandlestickChartProps): ReactElement {
  const { locale, isRtl } = useChartLocale();
  const t = useUiText();
  const paint = useChartPaint(["success", "danger"]);
  const [rise = "", fall = ""] = paint.series;
  const labels = useAxisLabels(paint.muted);
  // oxlint-disable-next-line unicorn/no-array-reverse -- reverses an array built here, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
  const rows = isRtl ? [...data].reverse() : [...data];
  const hasVolume = showVolume ?? data.some((row) => typeof row.volume === "number");
  const maxVolume = Math.max(1, ...data.map((row) => row.volume ?? 0));
  const low = Math.min(...data.map((row) => row.low));
  const high = Math.max(...data.map((row) => row.high));
  const price = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const count = (figure: number) => formatChartNumber(figure, locale, { notation: "compact" });
  const period = (value: unknown) => formatChartCategory(value, locale, xFormat);
  const K = UI_KEYS.ui.chart;
  const { state, isActive } = useChartPressState({
    x: "",
    y: { low: 0, high: 0, open: 0, close: 0 },
  });
  const [pressed, setPressed] = useState(-1);
  useAnimatedReaction(
    () => (state.isActive.value ? state.matchedIndex.value : -1),
    (index, previous) => {
      if (index !== previous) runOnJS(setPressed)(index);
    },
  );
  const row = isActive ? rows[pressed] : undefined;
  const spoken = data
    .map(
      (item) =>
        `${period(item.date)}: ${t(K.open)} ${price(item.open)}, ${t(K.high)} ${price(item.high)}, ${t(K.low)} ${price(item.low)}, ${t(K.close)} ${price(item.close)}`,
    )
    .join("; ");
  // One label per row up to six; past six, five labels spread over the periods.
  const step = rows.length <= 6 ? 1 : Math.ceil(rows.length / 5);
  const ticks = rows
    .map((_, index) => index)
    .filter((index) => index % step === Math.floor((step - 1) / 2));
  return (
    <ChartFrame
      label={label}
      spoken={spoken}
      legend={[]}
      className={className}
      readout={
        row && showTooltip ? (
          <ChartReadout
            title={period(row.date)}
            items={[
              {
                label: t(K.open),
                value: price(row.open),
                color: row.close >= row.open ? rise : fall,
              },
              {
                label: t(K.high),
                value: price(row.high),
                color: row.close >= row.open ? rise : fall,
              },
              {
                label: t(K.low),
                value: price(row.low),
                color: row.close >= row.open ? rise : fall,
              },
              {
                label: t(K.close),
                value: price(row.close),
                color: row.close >= row.open ? rise : fall,
              },
              ...(typeof row.volume === "number"
                ? [{ label: t(K.volume), value: count(row.volume), color: paint.muted }]
                : []),
            ]}
          />
        ) : null
      }
    >
      <View style={{ height }}>
        <LooseCartesianChart
          data={rows.map((item) => ({
            date: item.date,
            low: item.low,
            high: item.high,
            open: item.open,
            close: item.close,
          }))}
          xKey="date"
          yKeys={["low", "high", "open", "close"]}
          {...(showTooltip ? { chartPressState: state } : {})}
          padding={{ top: 8, bottom: 4 }}
          domainPadding={{ left: 10, right: 10, top: 8, bottom: 8 }}
          // The bottom quarter is left to the volume bars.
          domain={{ y: [hasVolume ? low - (high - low) / 3 : low, high] }}
          frame={{ lineWidth: 0 }}
          xAxis={{
            labelRenderer: labels,
            formatXLabel: period,
            lineWidth: 0,
            labelColor: paint.muted,
            tickValues: ticks,
            tickCount: ticks.length,
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
            const band = (chartBounds.right - chartBounds.left) / Math.max(1, rows.length);
            const body = Math.max(band * 0.6, 3);
            const floor = chartBounds.bottom;
            const reach = (chartBounds.bottom - chartBounds.top) / 4;
            return rows.map((item, index) => {
              const at = (key: string) => points[key]?.[index]?.y;
              const x = points["high"]?.[index]?.x ?? 0;
              const [top, bottom, open, close] = [at("high"), at("low"), at("open"), at("close")];
              if ([top, bottom, open, close].some((value) => typeof value !== "number"))
                return null;
              const isRise = item.close >= item.open;
              const color = isRise ? rise : fall;
              const upper = Math.min(open as number, close as number);
              const volume =
                hasVolume && typeof item.volume === "number"
                  ? (item.volume / maxVolume) * reach
                  : 0;
              return (
                <Group key={item.date}>
                  {volume > 0 ? (
                    <Rect
                      x={x - body / 2}
                      y={floor - volume}
                      width={body}
                      height={volume}
                      color={alphaOf(paint.muted, 0.22)}
                    />
                  ) : null}
                  <Line
                    p1={vec(x, top as number)}
                    p2={vec(x, bottom as number)}
                    color={color}
                    strokeWidth={1.5}
                  />
                  <Rect
                    x={x - body / 2}
                    y={upper}
                    width={body}
                    height={Math.max(Math.abs((open as number) - (close as number)), 1.5)}
                    color={isRise ? paint.surface : color}
                  />
                  {isRise ? (
                    <Rect
                      x={x - body / 2}
                      y={upper}
                      width={body}
                      height={Math.max(Math.abs((open as number) - (close as number)), 1.5)}
                      color={color}
                      // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
                      style="stroke"
                      strokeWidth={1.5}
                    />
                  ) : null}
                </Group>
              );
            });
          }}
        </LooseCartesianChart>
      </View>
    </ChartFrame>
  );
}
