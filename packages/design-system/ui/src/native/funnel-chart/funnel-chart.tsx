/**
 * Stackra file contract:
 * Purpose: the native `FunnelChart`: one row per step, the name at the reading start, a centred bar as wide as its
 *          share of the first step, and its value with the conversion from the step before at the end.
 * Boundary: Views and design-system Text only (no Skia text), so Arabic shapes and digits follow the provider; the
 *           whole funnel is one image whose spoken value lists every step.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { funnelRowsOf } from "#core/functions/funnel-rows-of.function";
import { sortChartItems } from "#core/functions/sort-chart-items.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { FunnelChartProps } from "#native/funnel-chart/funnel-chart.props";
import { Text } from "#native/text/text";

/** A funnel of steps. */
export function FunnelChart({
  stages,
  label,
  valueFormat,
  color = "chart-ramp-1",
  showConversion = true,
  sort,
  className,
}: FunnelChartProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const paint = useChartPaint([color]);
  const percent = (value: number) =>
    formatChartNumber(value, locale, { style: "percent", maximumFractionDigits: 1 });
  const rows = sortChartItems(
    funnelRowsOf(stages),
    sort,
    (row) => row.stage.value,
    (row) => row.stage.label,
    locale,
  ).map((row) => ({
    ...row,
    value: formatChartNumber(row.stage.value, locale, valueFormat),
    note:
      showConversion && row.conversion !== null
        ? t(UI_KEYS.ui.funnel_chart.conversion, { value: percent(row.conversion) })
        : "",
  }));
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityValue={{
        text: rows
          .map((row) => [row.stage.label, row.value, row.note].filter(Boolean).join(" "))
          .join("، "),
      }}
      className={["w-full gap-2", className].filter(Boolean).join(" ")}
    >
      {rows.map((row) => (
        <View key={row.stage.key} className="flex-row items-center gap-3">
          <Text type="caption" tone="muted" numberOfLines={1} className="w-20">
            {row.stage.label}
          </Text>
          <View className="h-7 flex-1 flex-row justify-center rounded bg-default/40">
            <View
              className="h-full rounded"
              style={{
                width: `${Math.max(row.share * 100, 1)}%`,
                backgroundColor: paint.series[0],
              }}
            />
          </View>
          <View className="items-end">
            <Text type="small" className="font-semibold">
              {row.value}
            </Text>
            {row.note ? (
              <Text type="caption" tone="muted">
                {row.note}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
