/**
 * Stackra file contract:
 * Purpose: the native `BulletChart`: one row per measure, its label at the reading start, then a scale with the
 *          qualitative bands (the muted colour at three strengths), the value bar in the accent across the middle,
 *          the target as an upright tick, and the value at the reading end; every measure is spoken after the name.
 * Boundary: Views with logical `start` insets, so the scale grows from the reading start (the right in Arabic), and
 *           RN Text.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { bulletScaleOf } from "#core/functions/bullet-scale-of.function";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { BulletChartProps } from "#native/bullet-chart/bullet-chart.props";
import { alphaOf } from "#native/chart/alpha-of.function";
import { ChartFrame } from "#native/chart/chart-frame";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import { Text } from "#native/text/text";

/** The bands' strengths of the muted colour, nearest the start first. */
const BAND_OPACITY = [0.32, 0.2, 0.1] as const;

/** Measures against their targets. */
export function BulletChart({
  items,
  label,
  valueFormat,
  color = "chart-ramp-1",
  className,
}: BulletChartProps): ReactElement {
  const { locale, words } = useChartLocale();
  const t = useUiText();
  const paint = useChartPaint([color]);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const table = {
    head: [words.category, words.value, t(UI_KEYS.ui.chart.target)],
    rows: items.map((item) => [
      item.label,
      value(item.value),
      item.target === undefined ? "" : value(item.target),
    ]),
  };
  return (
    <ChartFrame label={label} spoken={chartTextOf(table, locale)} legend={[]} className={className}>
      <View className="gap-3">
        {items.map((item) => {
          const scale = bulletScaleOf(item);
          return (
            <View key={item.key} className="flex-row items-center gap-3">
              <Text type="caption" tone="muted" numberOfLines={1} className="w-24 text-xs">
                {item.label}
              </Text>
              <View className="h-6 flex-1 overflow-hidden rounded-[var(--radius-control-inner)]">
                {scale.bands.map((band, index) => (
                  <View
                    key={band.from}
                    className="absolute inset-y-0"
                    style={{
                      start: `${band.from}%`,
                      width: `${band.to - band.from}%`,
                      backgroundColor: alphaOf(
                        paint.muted,
                        BAND_OPACITY[Math.min(index, BAND_OPACITY.length - 1)] ?? 0.1,
                      ),
                    }}
                  />
                ))}
                <View
                  className="absolute start-0 rounded-e-[var(--radius-control-inner)]"
                  style={{
                    top: "30%",
                    bottom: "30%",
                    width: `${scale.value}%`,
                    backgroundColor: paint.series[0],
                  }}
                />
                {scale.target === null ? null : (
                  <View
                    className="absolute w-0.5"
                    style={{
                      top: "15%",
                      bottom: "15%",
                      start: `${scale.target}%`,
                      marginStart: -1,
                      backgroundColor: paint.foreground,
                    }}
                  />
                )}
              </View>
              <Text type="small" className="font-semibold tabular-nums">
                {value(item.value)}
              </Text>
            </View>
          );
        })}
      </View>
    </ChartFrame>
  );
}
