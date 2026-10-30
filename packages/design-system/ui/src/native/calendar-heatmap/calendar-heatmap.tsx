/**
 * Stackra file contract:
 * Purpose: the native `CalendarHeatmap`: an activity graph with one cell per day and a column per week (the locale's
 *          first weekday on top), shaded in five steps by the day's value, month names over the weeks they start,
 *          a readout of the pressed day, the "Less … More" scale, and one image whose value reads the days with values.
 * Boundary: Views and RN Text in a horizontal ScrollView that opens at the latest week; the weeks follow the reading
 *           direction. Dates are calendar days in UTC.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1; STA-1371.
 */
import { type ReactElement, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { calendarWeeksOf } from "#core/functions/calendar-weeks-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { heatLevelOf } from "#core/functions/heat-level-of.function";
import { weekStartOf } from "#core/functions/week-start-of.function";
import type { CalendarHeatmapProps } from "#native/calendar-heatmap/calendar-heatmap.props";
import { heatPaintOf } from "#native/chart/heat-paint-of.function";
import { HeatScale } from "#native/chart/heat-scale";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import { Text } from "#native/text/text";

/** Days as shaded cells, a column per week. */
export function CalendarHeatmap({
  values,
  start,
  end,
  label,
  valueFormat,
  color = "chart-ramp-1",
  weekStart,
  showLegend = true,
  className,
}: CalendarHeatmapProps): ReactElement {
  const { locale } = useChartLocale();
  const paint = useChartPaint([color]);
  // oxlint-disable-next-line unicorn/no-array-sort -- a fresh array from map, sorted in place
  const dates = values.map((item) => item.date.slice(0, 10)).sort();
  // No days and no range draws an empty calendar.
  const first = start ?? dates[0] ?? end ?? "";
  const last = end ?? dates.at(-1) ?? first;
  const weeks = calendarWeeksOf(values, first, last, weekStart ?? weekStartOf(locale));
  const shown = weeks.flat().filter((item) => item.isInRange && item.value !== null);
  const min = Math.min(...shown.map((item) => item.value ?? 0));
  const max = Math.max(...shown.map((item) => item.value ?? 0));
  const [pressed, setPressed] = useState<string | null>(null);
  const day = (date: string) =>
    formatChartCategory(date, locale, { weekday: "short", day: "numeric", month: "short" });
  const value = (figure: number | null) =>
    figure === null ? "–" : formatChartNumber(figure, locale, valueFormat);
  const pressedDay = weeks.flat().find((item) => item.date === pressed);
  return (
    <View className={["w-full gap-2", className].filter(Boolean).join(" ")}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={label}
        accessibilityValue={{
          text: shown.map((item) => `${day(item.date)}: ${value(item.value)}`).join("; "),
        }}
        className="gap-1"
      >
        <Text type="caption" tone="muted" className="min-h-4 text-xs">
          {pressedDay ? `${day(pressedDay.date)}: ${value(pressedDay.value)}` : ""}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={(view) => view?.scrollToEnd({ animated: false })}
        >
          <View className="flex-row gap-[3px]">
            {weeks.map((week, index) => {
              const firstOfMonth = week.find((item) => item.isInRange && item.date.endsWith("-01"));
              return (
                <View key={week[0]?.date ?? index} className="gap-[3px]">
                  <Text
                    type="caption"
                    tone="muted"
                    numberOfLines={1}
                    className="h-3 w-3 overflow-visible text-[9px] leading-3"
                  >
                    {firstOfMonth
                      ? formatChartCategory(firstOfMonth.date, locale, { month: "short" })
                      : ""}
                  </Text>
                  {week.map((item) => (
                    <Pressable
                      key={item.date}
                      disabled={!item.isInRange}
                      onPress={() => setPressed(item.date)}
                      className="size-3 rounded-[3px]"
                      style={{
                        opacity: item.isInRange ? 1 : 0,
                        backgroundColor: heatPaintOf(heatLevelOf(item.value, min, max), paint),
                        ...(pressed === item.date
                          ? { borderWidth: 1.5, borderColor: paint.foreground }
                          : {}),
                      }}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      {showLegend ? <HeatScale paint={paint} /> : null}
    </View>
  );
}
