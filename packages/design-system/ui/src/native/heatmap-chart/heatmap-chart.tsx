/**
 * Stackra file contract:
 * Purpose: the native `HeatmapChart`: a grid of cells, one per column and row category, shaded in five steps of one
 *          colour; pressing a cell writes its row, column and value above the grid; the "Less … More" scale sits
 *          under it, and the whole grid is one image whose value reads every cell.
 * Boundary: Views and RN Text, so Arabic labels shape natively and the columns follow the reading direction.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1; STA-1371.
 */
import { type ReactElement, useState } from "react";
import { Pressable, View } from "react-native";

import { THEME_PX } from "#core/constants/theme-px.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { heatLevelOf } from "#core/functions/heat-level-of.function";
import { heatmapGridOf } from "#core/functions/heatmap-grid-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { heatPaintOf } from "#native/chart/heat-paint-of.function";
import { HeatScale } from "#native/chart/heat-scale";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { HeatmapChartProps } from "#native/heatmap-chart/heatmap-chart.props";
import { Text } from "#native/text/text";

/** A grid of shaded cells. */
export function HeatmapChart({
  data,
  xKey,
  yKey,
  valueKey,
  label,
  valueFormat,
  color = "chart-ramp-1",
  showLegend = true,
  className,
}: HeatmapChartProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const paint = useChartPaint([color]);
  const grid = heatmapGridOf(data, xKey, yKey, valueKey);
  const [pressed, setPressed] = useState<readonly [number, number] | null>(null);
  const value = (figure: number | null | undefined) =>
    typeof figure === "number" ? formatChartNumber(figure, locale, valueFormat) : "–";
  const cell = (row: number, column: number) =>
    t(UI_KEYS.ui.chart.cell, {
      row: grid.rows[row] ?? "",
      column: grid.columns[column] ?? "",
      value: value(grid.cells[row]?.[column]),
    });
  const spoken = grid.rows
    .flatMap((_, row) => grid.columns.map((__, column) => cell(row, column)))
    .join("; ");
  return (
    <View className={["w-full gap-2", className].filter(Boolean).join(" ")}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={label}
        accessibilityValue={{ text: spoken }}
        className="gap-1"
      >
        <Text type="caption" tone="muted" className="min-h-4 text-xs">
          {pressed ? cell(pressed[0], pressed[1]) : ""}
        </Text>
        <View className="flex-row gap-1">
          <View className="w-8" />
          {grid.columns.map((column) => (
            <Text
              key={column}
              type="caption"
              tone="muted"
              numberOfLines={1}
              className="flex-1 text-center text-3xs"
            >
              {column}
            </Text>
          ))}
        </View>
        {grid.rows.map((row, rowIndex) => (
          <View key={row} className="flex-row items-center gap-1">
            <Text type="caption" tone="muted" numberOfLines={1} className="w-8 text-3xs">
              {row}
            </Text>
            {grid.columns.map((column, columnIndex) => (
              <Pressable
                key={column}
                onPress={() => setPressed([rowIndex, columnIndex])}
                className="h-6 flex-1 rounded-[var(--radius-control-inner)]"
                style={{
                  backgroundColor: heatPaintOf(
                    heatLevelOf(grid.cells[rowIndex]?.[columnIndex], grid.min, grid.max),
                    paint,
                  ),
                  ...(pressed?.[0] === rowIndex && pressed[1] === columnIndex
                    ? { borderWidth: THEME_PX.focusRing.width, borderColor: paint.foreground }
                    : {}),
                }}
              />
            ))}
          </View>
        ))}
      </View>
      {showLegend ? <HeatScale paint={paint} /> : null}
    </View>
  );
}
