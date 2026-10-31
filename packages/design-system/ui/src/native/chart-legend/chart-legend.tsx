/**
 * Stackra file contract:
 * Purpose: the native `ChartLegend`: a centred, wrapping row of swatches and series labels under a chart. With
 *          `onToggle` every entry is a pressable toggle that hides or shows its series (`selected` while shown), and a
 *          hidden series reads as a hollow swatch and a struck label, so the state never rests on colour alone.
 * Boundary: Views and RN Text, so Arabic labels are shaped by the platform; follows the reading direction.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.4.1, 1.4.11 and 4.1.2; STA-1371.
 */
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import { THEME_PX } from "#core/constants/theme-px.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { ChartLegendProps } from "#native/chart-legend/chart-legend.props";
import { Text } from "#native/text/text";

/** The `hiddenKeys` default, one array for every render. */
const NO_HIDDEN_KEYS: NonNullable<ChartLegendProps["hiddenKeys"]> = [];

/** A row of series swatches and labels, toggles when the chart can hide series. */
export function ChartLegend({
  series,
  palette,
  onToggle,
  hiddenKeys = NO_HIDDEN_KEYS,
  showComparison = false,
  className,
}: ChartLegendProps): ReactElement {
  const t = useUiText();
  const paint = useChartPaint(series.map((item, index) => chartColorOf(item, index, palette)));
  return (
    <View
      {...(onToggle
        ? { accessibilityLabel: t(UI_KEYS.ui.chart.series) }
        : {
            importantForAccessibility: "no-hide-descendants" as const,
            accessibilityElementsHidden: true,
          })}
      className={["flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1", className]
        .filter(Boolean)
        .join(" ")}
    >
      {series.map((item, index) => {
        const isHidden = hiddenKeys.includes(item.key);
        const color = paint.series[index];
        const body = (
          <>
            <View
              className="size-2 rounded-[var(--radius-pill)]"
              style={
                isHidden
                  ? { borderWidth: THEME_PX.focusRing.width, borderColor: color }
                  : { backgroundColor: color }
              }
            />
            <Text
              type="caption"
              tone="muted"
              className="text-xs"
              style={isHidden ? { textDecorationLine: "line-through" } : undefined}
            >
              {item.label}
            </Text>
          </>
        );
        return onToggle ? (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: !isHidden }}
            accessibilityLabel={item.label}
            hitSlop={8}
            onPress={() => onToggle(item.key)}
            className="flex-row items-center gap-1.5"
          >
            {body}
          </Pressable>
        ) : (
          <View key={item.key} className="flex-row items-center gap-1.5">
            {body}
          </View>
        );
      })}
      {showComparison ? (
        <View className="flex-row items-center gap-1.5">
          <View className="h-0.5 w-3 border-t-2 border-dashed border-muted" />
          <Text type="caption" tone="muted" className="text-xs">
            {t(UI_KEYS.ui.chart.previous_period)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
