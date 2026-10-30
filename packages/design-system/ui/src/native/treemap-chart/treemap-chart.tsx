/**
 * Stackra file contract:
 * Purpose: the native `TreemapChart`: tiles sized by value in the shared squarified layout, painted in the palette
 *          with a 2px surface gap, each lit softly from the top (`LitFill`, flat in a flat brand) with its name and
 *          value on a small surface label.
 * Boundary: Views placed with `start`, so Arabic starts at the right; labels are design-system Text (no Skia text).
 *           The plot is one image whose spoken value lists every tile.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1; STA-1371.
 */
import { type ReactElement, useState } from "react";
import { View } from "react-native";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { sortChartItems } from "#core/functions/sort-chart-items.function";
import { treemapLayoutOf } from "#core/functions/treemap-layout-of.function";
import { LitFill } from "#native/chart/lit-fill";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import { Text } from "#native/text/text";
import type { TreemapChartProps } from "#native/treemap-chart/treemap-chart.props";

/** Tiles of a whole. */
export function TreemapChart({
  items,
  label,
  valueFormat,
  palette,
  height = 240,
  sort,
  className,
}: TreemapChartProps): ReactElement {
  const { locale } = useChartLocale();
  const [width, setWidth] = useState(0);
  const paint = useChartPaint(items.map((item, index) => chartColorOf(item, index, palette)));
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityValue={{
        text: items.map((item) => `${item.label} ${value(item.value)}`).join("، "),
      }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      className={["w-full", className].filter(Boolean).join(" ")}
      style={{ height }}
    >
      {width > 0
        ? treemapLayoutOf(
            sortChartItems(
              items,
              sort,
              (item) => item.value,
              (item) => item.label,
              locale,
            ),
            width / height,
            sort !== undefined,
          ).map((tile) => (
            <View
              key={tile.item.key}
              className="absolute overflow-hidden rounded-[var(--radius-control)] border-2 border-surface p-1.5"
              style={{
                start: `${tile.x}%`,
                top: `${tile.y}%`,
                width: `${tile.width}%`,
                height: `${tile.height}%`,
                backgroundColor: paint.series[items.indexOf(tile.item)],
              }}
            >
              <LitFill
                color={paint.series[items.indexOf(tile.item)] ?? ""}
                lift={paint.lift}
                height={(tile.height / 100) * height}
              />
              <View className="self-start rounded-[var(--radius-control-inner)] bg-surface/85 px-1.5 py-0.5">
                <Text type="caption" tone="muted" numberOfLines={1}>
                  {tile.item.label}
                </Text>
                <Text type="caption" numberOfLines={2} className="font-semibold">
                  {value(tile.item.value)}
                </Text>
              </View>
            </View>
          ))
        : null}
    </View>
  );
}
