/**
 * Stackra file contract:
 * Purpose: the native `TimelineChart` (a gantt): one lane per row with its name at the reading start, each task a bar
 *          from its start to its end day with its name on a surface chip, month or week ticks along the top, faint
 *          tick lines through the lanes and a dashed "Today" line; one image whose value reads every task and its dates.
 * Boundary: Views placed with `start` in percent of the span, so time runs right to left in Arabic with no code of its
 *           own; RN Text throughout. No motion.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { isArabic } from "#core/functions/is-arabic.function";
import { timelineLayoutOf } from "#core/functions/timeline-layout-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import { Text } from "#native/text/text";
import type { TimelineChartProps } from "#native/timeline-chart/timeline-chart.props";

/** The task dates' default format. */
const DAY_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/** Lanes of tasks over time. */
export function TimelineChart({
  rows,
  tasks,
  label,
  today,
  dateFormat = DAY_FORMAT,
  className,
}: TimelineChartProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const layout = timelineLayoutOf(rows, tasks, today);
  const paint = useChartPaint(layout.bars.map(({ task }) => chartColorOf(task, 0)));
  const date = (iso: string) => formatChartCategory(iso, locale, dateFormat);
  const tick = (time: number) =>
    formatChartCategory(time, locale, layout.unit === "month" ? { month: "short" } : DAY_FORMAT);
  const spoken = layout.bars
    .map(
      ({ task, row }) =>
        `${rows[row]?.label ?? ""}: ${task.label} ${date(task.start)} – ${date(task.end)}`,
    )
    .join(isArabic(locale) ? "، " : ", ");
  const lines = layout.ticks.map(({ date: time, at }) => (
    <View
      key={time}
      className="absolute inset-y-0 border-s border-separator/60"
      style={{ start: `${at * 100}%` }}
    />
  ));
  const todayLine =
    layout.today === null ? null : (
      <View
        className="absolute inset-y-0 border-s-2 border-dashed border-muted"
        style={{ start: `${layout.today * 100}%` }}
      />
    );
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityValue={{ text: spoken }}
      className={["w-full", className].filter(Boolean).join(" ")}
    >
      <View className="flex-row">
        <View className="w-20" />
        <View className="h-5 flex-1">
          {layout.ticks.map(({ date: time, at }) => (
            <Text
              key={time}
              type="caption"
              tone="muted"
              className="absolute ps-1"
              style={{ start: `${at * 100}%` }}
            >
              {tick(time)}
            </Text>
          ))}
        </View>
      </View>
      {rows.map((row, index) => (
        <View key={row.key} className="flex-row items-center">
          <Text type="caption" tone="muted" numberOfLines={1} className="w-20 pe-2">
            {row.label}
          </Text>
          <View className="h-10 flex-1 border-t border-separator/60">
            {lines}
            {layout.bars
              .map((bar, position) => ({ ...bar, color: paint.series[position] }))
              .filter((bar) => bar.row === index)
              .map(({ task, at, length, color }) => (
                <View
                  key={task.key}
                  className="absolute top-2 h-6 flex-row items-center overflow-hidden rounded-[var(--radius-control)] px-1"
                  style={{
                    start: `${at * 100}%`,
                    width: `${length * 100}%`,
                    backgroundColor: color,
                  }}
                >
                  <Text
                    type="caption"
                    numberOfLines={1}
                    className="rounded-[var(--radius-control-inner)] bg-surface/85 px-1.5"
                  >
                    {task.label}
                  </Text>
                </View>
              ))}
            {todayLine}
          </View>
        </View>
      ))}
      {layout.today === null ? null : (
        <View className="flex-row">
          <View className="w-20" />
          <View className="h-5 flex-1">
            <Text
              type="caption"
              tone="muted"
              className="absolute"
              style={{ start: `${layout.today * 100}%` }}
            >
              {t(UI_KEYS.ui.chart.today)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
