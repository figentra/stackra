/**
 * Stackra file contract:
 * Purpose: the native `RangeBarChart`: one floating bar per category from its low to its high value, standing
 *          (`vertical`) or lying (`horizontal`, growing from the reading start), a press readout of the range, and
 *          every range spoken after the chart's name.
 * Boundary: Views placed in percent of one shared scale and RN Text; categories run right to left in Arabic.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { type ReactElement, useState } from "react";
import { Pressable, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { ChartFrame } from "#native/chart/chart-frame";
import { ChartReadout } from "#native/chart/chart-readout";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { RangeBarChartProps } from "#native/range-bar-chart/range-bar-chart.props";
import { Text } from "#native/text/text";

/** The words' keys. */
const K = UI_KEYS.ui.chart;

/** A finite number, or null for a gap. */
const numberOf = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** Floating bars from a low to a high value. */
export function RangeBarChart(props: RangeBarChartProps): ReactElement {
  const {
    data,
    xKey,
    fromKey,
    toKey,
    label,
    xFormat,
    valueFormat,
    color = "chart-ramp-1",
    height = 240,
  } = props;
  const { locale, words } = useChartLocale();
  const t = useUiText();
  const paint = useChartPaint([color]);
  const [pressed, setPressed] = useState(-1);
  const isHorizontal = props.orientation === "horizontal";
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const rows = data.map((row) => {
    const from = numberOf(row[fromKey]);
    const to = numberOf(row[toKey]);
    return {
      name: formatChartCategory(row[xKey], locale, xFormat),
      from,
      to,
      range:
        from === null || to === null ? null : ([Math.min(from, to), Math.max(from, to)] as const),
    };
  });
  const ends = rows.flatMap((row) => row.range ?? []);
  const low = Math.min(...ends);
  const span = Math.max(...ends) - low || 1;
  // Ten percent of room on each side, so the shortest range still reads as floating.
  const percent = (figure: number) => 10 + ((figure - low) / span) * 80;
  const cell = (figure: number | null) => (figure === null ? "" : value(figure));
  const table = {
    head: [words.category, t(K.low), t(K.high)],
    rows: rows.map((row) => [row.name, cell(row.from), cell(row.to)]),
  };
  const active = rows[pressed];
  return (
    <ChartFrame
      label={label}
      spoken={chartTextOf(table, locale)}
      legend={[]}
      className={props.className}
      readout={
        active?.range && props.showTooltip !== false ? (
          <ChartReadout
            title={active.name}
            items={[
              { label: t(K.high), value: value(active.range[1]), color: paint.series[0] ?? "" },
              { label: t(K.low), value: value(active.range[0]), color: paint.series[0] ?? "" },
            ]}
          />
        ) : null
      }
    >
      {isHorizontal ? (
        <View className="gap-3">
          {rows.map((row, index) => (
            <Pressable
              key={row.name}
              className="flex-row items-center gap-3"
              onPressIn={() => setPressed(index)}
              onPressOut={() => setPressed(-1)}
            >
              <Text type="caption" tone="muted" numberOfLines={1} className="w-16 text-xs">
                {row.name}
              </Text>
              <View className="h-5 flex-1">
                {row.range ? (
                  <View
                    className="absolute h-full rounded"
                    style={{
                      start: `${percent(row.range[0])}%`,
                      width: `${percent(row.range[1]) - percent(row.range[0])}%`,
                      minWidth: 4,
                      backgroundColor: paint.series[0],
                    }}
                  />
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          <View className="flex-row border-b" style={{ height, borderColor: paint.grid }}>
            {rows.map((row, index) => (
              <Pressable
                key={row.name}
                className="h-full flex-1 items-center"
                onPressIn={() => setPressed(index)}
                onPressOut={() => setPressed(-1)}
              >
                {row.range ? (
                  <View
                    className="absolute w-3/5 max-w-10 rounded"
                    style={{
                      bottom: `${percent(row.range[0])}%`,
                      top: `${100 - percent(row.range[1])}%`,
                      minHeight: 4,
                      backgroundColor: paint.series[0],
                    }}
                  />
                ) : null}
              </Pressable>
            ))}
          </View>
          <View className="flex-row">
            {rows.map((row) => (
              <Text
                key={row.name}
                type="caption"
                tone="muted"
                numberOfLines={1}
                className="flex-1 text-center text-[10px]"
              >
                {row.name}
              </Text>
            ))}
          </View>
        </>
      )}
    </ChartFrame>
  );
}
