/**
 * Stackra file contract:
 * Purpose: the native `HistogramChart`: raw values counted into equal bins (`histogramBinsOf`), one touching column per
 *          bin, a press readout of the bin's edges and count, and every bin spoken after the chart's name.
 * Boundary: Views and RN Text (Arabic shaped by the platform); the row runs right to left in Arabic like every category
 *           axis. Only the first and last edges are written under more than six bins.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { type ReactElement, useState } from "react";
import { Pressable, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { histogramBinsOf } from "#core/functions/histogram-bins-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { ChartFrame } from "#native/chart/chart-frame";
import { ChartReadout } from "#native/chart/chart-readout";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { HistogramChartProps } from "#native/histogram-chart/histogram-chart.props";
import { Text } from "#native/text/text";

/** The words' keys. */
const K = UI_KEYS.ui.chart;

/** Counts of values in equal bins. */
export function HistogramChart(props: HistogramChartProps): ReactElement {
  const { values, label, valueFormat, color = "chart-ramp-1", height = 240 } = props;
  const { locale } = useChartLocale();
  const t = useUiText();
  const paint = useChartPaint([color]);
  const [pressed, setPressed] = useState(-1);
  const edge = (value: number) =>
    formatChartNumber(value, locale, { maximumFractionDigits: 1, ...valueFormat });
  const bins = histogramBinsOf(values, { binCount: props.binCount, binWidth: props.binWidth });
  const top = Math.max(1, ...bins.map((bin) => bin.count));
  const names = bins.map((bin) => `${edge(bin.from)}–${edge(bin.to)}`);
  const table = {
    head: [t(K.bin), t(K.count)],
    rows: bins.map((bin, index) => [names[index] ?? "", formatChartNumber(bin.count, locale)]),
  };
  const bin = bins[pressed];
  return (
    <ChartFrame
      label={label}
      spoken={chartTextOf(table, locale)}
      legend={[]}
      className={props.className}
      readout={
        bin && props.showTooltip !== false ? (
          <ChartReadout
            title={names[pressed] ?? ""}
            items={[
              {
                label: t(K.count),
                value: formatChartNumber(bin.count, locale),
                color: paint.series[0] ?? "",
              },
            ]}
          />
        ) : null
      }
    >
      <View
        className="flex-row items-end gap-px border-b"
        style={{ height, borderColor: paint.grid }}
      >
        {bins.map((item, index) => (
          <Pressable
            key={item.from}
            className="h-full flex-1 justify-end"
            onPressIn={() => setPressed(index)}
            onPressOut={() => setPressed(-1)}
          >
            <View
              className="rounded-t-sm"
              style={{
                height: `${(item.count / top) * 100}%`,
                backgroundColor: paint.series[0],
                opacity: pressed === -1 || pressed === index ? 1 : 0.6,
              }}
            />
          </Pressable>
        ))}
      </View>
      <View className="flex-row justify-between">
        {(bins.length <= 6 ? names : [edge(bins[0]?.from ?? 0), edge(bins.at(-1)?.to ?? 0)]).map(
          (name, index) => (
            <Text
              // oxlint-disable-next-line react/no-array-index-key -- edge labels are formatted numbers that may repeat after rounding; their place on the axis is their identity
              key={index}
              type="caption"
              tone="muted"
              className="flex-1 text-center text-[10px]"
            >
              {name}
            </Text>
          ),
        )}
      </View>
    </ChartFrame>
  );
}
