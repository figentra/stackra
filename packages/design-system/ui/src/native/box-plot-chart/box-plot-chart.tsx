/**
 * Stackra file contract:
 * Purpose: the native `BoxPlotChart`: one box per group from its lower to upper quartile with the median across it,
 *          Tukey whiskers and outlier rings on one shared scale, the group's name under it, a press readout of its
 *          summary, and every summary spoken after the chart's name.
 * Boundary: Views placed in percent of the plot and RN Text; groups run right to left in Arabic.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { type ReactElement, useState } from "react";
import { Pressable, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { boxStatsOf } from "#core/functions/box-stats-of.function";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { alphaOf } from "#native/chart/alpha-of.function";
import type { BoxPlotChartProps } from "#native/box-plot-chart/box-plot-chart.props";
import { ChartFrame } from "#native/chart/chart-frame";
import { ChartReadout } from "#native/chart/chart-readout";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import { Text } from "#native/text/text";

/** The words' keys. */
const K = UI_KEYS.ui.chart;

/** One box per group. */
export function BoxPlotChart(props: BoxPlotChartProps): ReactElement {
  const { groups, label, valueFormat, palette, height = 240 } = props;
  const { locale, words } = useChartLocale();
  const t = useUiText();
  const paint = useChartPaint(groups.map((group, index) => chartColorOf(group, index, palette)));
  const [pressed, setPressed] = useState(-1);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const boxes = groups.flatMap((group, index) => {
    const stats = boxStatsOf(group.values);
    return stats ? [{ group, stats, color: paint.series[index] ?? "" }] : [];
  });
  const low = Math.min(...boxes.map((box) => box.stats.min));
  const high = Math.max(...boxes.map((box) => box.stats.max));
  // A little room above and below, so a whisker cap or outlier ring is never cut by the plot's edge.
  const pad = (high - low || 1) * 0.06;
  const percent = (figure: number) => ((figure - (low - pad)) / (high - low + 2 * pad)) * 100;
  const parts = [t(K.minimum), t(K.lower_quartile), t(K.median), t(K.upper_quartile), t(K.maximum)];
  const table = {
    head: [words.category, ...parts, t(K.outliers)],
    rows: boxes.map(({ group, stats }) => [
      group.label,
      ...[stats.min, stats.q1, stats.median, stats.q3, stats.max].map(value),
      stats.outliers.map(value).join("، "),
    ]),
  };
  const active = boxes[pressed];
  return (
    <ChartFrame
      label={label}
      spoken={chartTextOf(table, locale)}
      legend={[]}
      className={props.className}
      readout={
        active && props.showTooltip !== false ? (
          <ChartReadout
            title={active.group.label}
            items={[
              active.stats.max,
              active.stats.q3,
              active.stats.median,
              active.stats.q1,
              active.stats.min,
            ].map((figure, index) => ({
              label: parts[4 - index] ?? "",
              value: value(figure),
              color: active.color,
            }))}
          />
        ) : null
      }
    >
      <View className="flex-row border-b" style={{ height, borderColor: paint.grid }}>
        {boxes.map(({ group, stats, color }, index) => (
          <Pressable
            key={group.key}
            className="h-full flex-1 items-center"
            onPressIn={() => setPressed(index)}
            onPressOut={() => setPressed(-1)}
          >
            <View
              className="absolute w-px"
              style={{
                bottom: `${percent(stats.low)}%`,
                top: `${100 - percent(stats.high)}%`,
                backgroundColor: color,
              }}
            />
            {(
              [
                ["low", stats.low],
                ["high", stats.high],
              ] as const
            ).map(([whisker, end]) => (
              <View
                key={whisker}
                className="absolute h-px w-4"
                style={{ bottom: `${percent(end)}%`, backgroundColor: color }}
              />
            ))}
            <View
              className="absolute w-3/5 max-w-12 rounded-sm border-2"
              style={{
                bottom: `${percent(stats.q1)}%`,
                top: `${100 - percent(stats.q3)}%`,
                borderColor: color,
                backgroundColor: alphaOf(color, 0.2),
              }}
            />
            <View
              className="absolute h-0.5 w-3/5 max-w-12"
              style={{ bottom: `${percent(stats.median)}%`, backgroundColor: color }}
            />
            {stats.outliers.map((outlier, at) => (
              <View
                // oxlint-disable-next-line react/no-array-index-key -- outliers are bare numbers that may repeat; their place in the sorted list is their identity
                key={at}
                className="absolute size-2 rounded-full border-2"
                style={{
                  bottom: `${percent(outlier)}%`,
                  marginBottom: -4,
                  borderColor: color,
                  backgroundColor: paint.surface,
                }}
              />
            ))}
          </Pressable>
        ))}
      </View>
      <View className="flex-row">
        {boxes.map(({ group }) => (
          <Text
            key={group.key}
            type="caption"
            tone="muted"
            numberOfLines={1}
            className="flex-1 text-center text-[10px]"
          >
            {group.label}
          </Text>
        ))}
      </View>
    </ChartFrame>
  );
}
