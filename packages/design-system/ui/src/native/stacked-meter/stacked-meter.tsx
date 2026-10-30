/**
 * Stackra file contract:
 * Purpose: the native `StackedMeter`: a title with "used of whole", one rounded bar split into coloured parts from
 *          the reading start over a muted track, and a legend of each part's name and amount.
 * Boundary: the bar is hidden from assistive technology; the title and legend are the text read.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); WCAG 2.2 SC 1.4.1; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { meterSharesOf } from "#core/functions/meter-shares-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { StackedMeterProps } from "#native/stacked-meter/stacked-meter.props";
import { Text } from "#native/text/text";

/** One bar of parts of a whole. */
export function StackedMeter({
  segments,
  label,
  max,
  valueFormat,
  palette,
  showLegend = true,
  className,
}: StackedMeterProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const paint = useChartPaint(
    segments.map((segment, index) => chartColorOf(segment, index, palette)),
  );
  const { shares, total } = meterSharesOf(segments, max);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  return (
    <View className={["w-full gap-2", className].filter(Boolean).join(" ")}>
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="text-sm font-medium">{label}</Text>
        <Text type="caption" tone="muted">
          {t(UI_KEYS.ui.stacked_meter.total, {
            used: value(total),
            max: value(Math.max(total, max ?? 0)),
          })}
        </Text>
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className="h-2.5 w-full flex-row gap-0.5 overflow-hidden rounded-full bg-default/50"
      >
        {segments.map((segment, index) =>
          (shares[index] ?? 0) > 0 ? (
            <View
              key={segment.key}
              className="h-full"
              style={{
                width: `${(shares[index] ?? 0) * 100}%`,
                backgroundColor: paint.series[index],
              }}
            />
          ) : null,
        )}
      </View>
      {showLegend ? (
        <View className="flex-row flex-wrap gap-x-4 gap-y-1">
          {segments.map((segment, index) => (
            <View key={segment.key} className="flex-row items-center gap-1.5">
              <View
                className="size-2 rounded-full"
                style={{ backgroundColor: paint.series[index] }}
              />
              <Text type="caption" tone="muted">
                {segment.label}
              </Text>
              <Text type="caption" className="font-medium">
                {value(segment.value)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
