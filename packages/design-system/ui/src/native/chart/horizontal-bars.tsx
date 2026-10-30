/**
 * Stackra file contract:
 * Purpose: `HorizontalBars`, the native BarChart's `horizontal` orientation: one row per category with its label at
 *          the reading start and its bars growing toward the reading end (side by side per series, or one stacked bar),
 *          each bar's value written after it.
 * Boundary: Views, not Victory Native, coloured with the theme values `useChartPaint` resolves (the accent ramp
 *           included): flex lays the rows out in the layout direction, so Arabic grows bars from the
 *           right with no mirroring code, and every value is shown, so no press readout is needed. Bar lengths are a
 *           share of the largest value (or stack).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chartTableOf } from "#core/functions/chart-table-of.function";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { sortChartItems } from "#core/functions/sort-chart-items.function";
import { ChartFrame } from "#native/chart/chart-frame";
import type { HorizontalBarsProps } from "#native/chart/horizontal-bars.props";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import { Text } from "#native/text/text";

/** A row's number for `key`, zero for a gap. */
const numberOf = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

/** A bar's data end is rounded (the reading end, so the right in English and the left in Arabic); its base is square. */
// oxlint-disable-next-line stackra/no-literal-radius -- reason: a data mark's end cap, not a surface; React Native styles cannot read the --radius-* tokens, and a brand's corners do not reshape chart marks.
const END_ROUNDED = { borderTopEndRadius: 4, borderBottomEndRadius: 4 } as const;

/** Bars along their categories. */
export function HorizontalBars(props: HorizontalBarsProps): ReactElement {
  const { series, label, xKey, xFormat, valueFormat } = props;
  const { locale, words } = useChartLocale();
  const data = sortChartItems(
    props.data,
    props.sort,
    (row) => series.reduce((sum, item) => sum + numberOf(row[item.key]), 0),
    (row) => formatChartCategory(row[xKey], locale, xFormat),
    locale,
  );
  const isStacked = props.stacked === true;
  const paint = useChartPaint(
    series.map((item, index) => chartColorOf(item, index, props.palette)),
  );
  const table = chartTableOf({
    data,
    series,
    categoryKey: xKey,
    locale,
    valueFormat,
    categoryFormat: xFormat,
    words,
  });
  const totals = data.map((row) => series.reduce((sum, item) => sum + numberOf(row[item.key]), 0));
  const max = Math.max(
    1,
    ...(isStacked ? totals : data.flatMap((row) => series.map((item) => numberOf(row[item.key])))),
  );
  // The largest bar takes 80% of the row, leaving room for its value after it.
  const width = (figure: number) => ({ width: `${(figure / max) * 80}%` as const });
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  return (
    <ChartFrame
      label={label}
      spoken={chartTextOf(table, locale)}
      legend={(props.showLegend ?? series.length > 1) ? series : []}
      palette={props.palette}
      className={props.className}
    >
      <View className="gap-3">
        {data.map((row, rowIndex) => (
          <View key={String(row[xKey])} className="flex-row items-center gap-3">
            <Text type="caption" tone="muted" numberOfLines={1} className="w-16 text-xs">
              {formatChartCategory(row[xKey], locale, xFormat)}
            </Text>
            <View className="flex-1 gap-1">
              {isStacked ? (
                <View className="flex-row items-center gap-2">
                  <View
                    className="flex-row overflow-hidden"
                    style={[width(totals[rowIndex] ?? 0), END_ROUNDED]}
                  >
                    {series.map((item, index) => (
                      <View
                        key={item.key}
                        className="h-5"
                        style={{
                          flex: numberOf(row[item.key]),
                          backgroundColor: paint.series[index],
                        }}
                      />
                    ))}
                  </View>
                  <Text type="caption" className="text-xs tabular-nums">
                    {value(totals[rowIndex] ?? 0)}
                  </Text>
                </View>
              ) : (
                series.map((item, index) => (
                  <View key={item.key} className="flex-row items-center gap-2">
                    <View
                      className={series.length > 1 ? "h-3" : "h-5"}
                      style={[
                        width(numberOf(row[item.key])),
                        END_ROUNDED,
                        { backgroundColor: paint.series[index] },
                      ]}
                    />
                    <Text type="caption" className="text-xs tabular-nums">
                      {typeof row[item.key] === "number" ? value(row[item.key] as number) : ""}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        ))}
      </View>
    </ChartFrame>
  );
}
