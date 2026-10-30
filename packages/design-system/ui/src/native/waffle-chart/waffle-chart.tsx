/**
 * Stackra file contract:
 * Purpose: the native `WaffleChart`: parts of a whole as a grid of squares (10 by 10 by default), each part a run of
 *          squares in its series' theme colour handed out by `waffleCellsOf`, filled row by row from the reading start;
 *          under it a legend of each part's name, value and share.
 * Boundary: Views in a wrapping row, so the provider's direction fills them from the right in Arabic; squares up to
 *           18pt, shrunk to fit the width. One image whose spoken value reads each part's value and share. No motion.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1, 1.4.1 and 1.4.11;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { WAVE_D_CHART_KEYS } from "#core/constants/wave-d-chart-keys.constant";
import { chartTableOf } from "#core/functions/chart-table-of.function";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { waffleCellsOf } from "#core/functions/waffle-cells-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { ChartFrame } from "#native/chart/chart-frame";
import { sliceColorsOf } from "#native/chart/slice-colors-of.function";
import { useCanvasSize } from "#native/chart/use-canvas-size";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import { Text } from "#native/text/text";
import type { WaffleChartProps } from "#native/waffle-chart/waffle-chart.props";

/** The largest square's side and the gap between squares, in points. */
const CELL = 18;
const GAP = 3;

/** Parts of a whole as squares. */
export function WaffleChart({
  data,
  series,
  label,
  nameKey,
  valueKey,
  valueFormat,
  palette = "categorical",
  columns = 10,
  rows = 10,
  showLegend = true,
  className,
}: WaffleChartProps): ReactElement {
  const { locale, words } = useChartLocale();
  const t = useUiText();
  const paint = useChartPaint(sliceColorsOf(data, series, nameKey, palette));
  const { width, onLayout } = useCanvasSize();
  const values = data.map((row) => (typeof row[valueKey] === "number" ? row[valueKey] : 0));
  const total = values.reduce((sum, figure) => sum + Math.max(0, figure), 0);
  const counts = waffleCellsOf(values, columns * rows);
  const shareOf = (figure: number) =>
    formatChartNumber(total > 0 ? Math.max(0, figure) / total : 0, locale, {
      style: "percent",
      maximumFractionDigits: 1,
    });
  const base = chartTableOf({
    data,
    series,
    categoryKey: nameKey,
    valueKey,
    locale,
    valueFormat,
    words,
  });
  const table = {
    head: [...base.head, t(WAVE_D_CHART_KEYS.ui.waffle_chart.share)],
    rows: base.rows.map((row, index) => [...row, shareOf(values[index] ?? 0)]),
  };
  const owners = counts.flatMap((count, part) => Array.from({ length: count }, () => part));
  const cell = Math.min(CELL, Math.max(2, (width - GAP * (columns - 1)) / columns));
  const names = base.rows.map((row) => row[0] ?? "");
  return (
    <ChartFrame label={label} spoken={chartTextOf(table, locale)} legend={[]} className={className}>
      <View onLayout={onLayout} className="items-center">
        {width > 0 ? (
          <View
            className="flex-row flex-wrap"
            style={{ width: columns * cell + (columns - 1) * GAP, gap: GAP }}
          >
            {Array.from({ length: columns * rows }, (_, index) => {
              const owner = owners[index];
              return (
                <View
                  key={index}

                  style={{
                    width: cell,
                    height: cell,
                    backgroundColor:
                      owner === undefined ? paint.grid : (paint.series[owner] ?? paint.grid),
                  }}
                />
              );
            })}
          </View>
        ) : null}
      </View>
      {showLegend ? (
        <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-1.5">
          {names.map((name, index) => (
            <View key={name} className="flex-row items-center gap-1.5">
              <View
                className="size-2"
                style={{ backgroundColor: paint.series[index] ?? paint.grid }}
              />
              <Text type="caption" tone="muted" className="text-xs">
                {name}
              </Text>
              <Text type="caption" className="text-xs font-semibold">
                {formatChartNumber(values[index] ?? 0, locale, valueFormat)}
              </Text>
              <Text type="caption" tone="muted" className="text-xs">
                {shareOf(values[index] ?? 0)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ChartFrame>
  );
}
