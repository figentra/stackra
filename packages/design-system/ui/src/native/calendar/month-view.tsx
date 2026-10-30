/**
 * Stackra file contract:
 * Purpose: `MonthView`, the native month grid of Calendar and RangeCalendar: previous and next month buttons, the
 *          month heading (with the Hijri months in the Hijri option), narrow weekday names and one button per day,
 *          read by its full date and selected state, with the Hijri day under it in the Hijri option.
 * Boundary: internal; the grid is `monthGridOf` (the locale's first weekday); what a press does is the caller's. Days
 *           and headings are written in the customer's digits.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0192; WCAG 2.2
 *          SC 2.5.8 and 4.1.2; STA-1371.
 */
import type { CalendarDate } from "@internationalized/date";
import { dateTimeFormatIn } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { calendarLocaleOf } from "#core/functions/calendar-locale-of.function";
import { monthGridOf } from "#core/functions/month-grid-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { MonthViewProps } from "#native/calendar/month-view-props.type";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { IconButton } from "#native/icon-button/icon-button";
import { Text } from "#native/text/text";

/** A `CalendarDate` as a UTC instant, for Intl. */
const instant = (date: CalendarDate) => date.toDate("UTC");

/** One month of days. */
export function MonthView({
  month,
  onMonthChange,
  isSelected,
  isOff,
  onPress,
  calendar = "gregory",
  label,
  className,
}: MonthViewProps): ReactElement {
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const t = useUiText();
  const K = FORMS_KEYS.ui.range_calendar;
  const isHijri = calendar === "islamic-umalqura";
  const hijri = isHijri ? calendarLocaleOf(locale, calendar) : locale;
  const zone = { timeZone: "UTC" } as const;
  const heading = dateTimeFormatIn(
    locale,
    { month: "long", year: "numeric", ...zone },
    numerals,
  ).format(instant(month));
  const hijriHeading = isHijri
    ? [
        ...new Set(
          [month.set({ day: 1 }), month.set({ day: month.calendar.getDaysInMonth(month) })].map(
            (d) =>
              dateTimeFormatIn(hijri, { month: "long", year: "numeric", ...zone }, numerals).format(
                instant(d),
              ),
          ),
        ),
      ].join(" – ")
    : null;
  const dayNumber = dateTimeFormatIn(locale, { day: "numeric", ...zone }, numerals);
  const hijriDay = dateTimeFormatIn(hijri, { day: "numeric", ...zone }, numerals);
  const fullDate = dateTimeFormatIn(hijri, { dateStyle: "full", ...zone }, numerals);
  const weekday = dateTimeFormatIn(locale, { weekday: "narrow", ...zone }, numerals);
  const grid = monthGridOf(month, locale);
  const firstRow = grid[0] ?? [];

  return (
    <View accessibilityLabel={label} className={`gap-2 ${className ?? ""}`}>
      <View className="flex-row items-center gap-2">
        <IconButton
          icon="chevron-left"
          label={t(K.previous)}
          variant="tertiary"
          onPress={() => onMonthChange(month.subtract({ months: 1 }))}
        />
        <View className="flex-1 items-center">
          <Text className="font-semibold" accessibilityRole="header">
            {heading}
          </Text>
          {hijriHeading ? (
            <Text type="small" tone="muted">
              {hijriHeading}
            </Text>
          ) : null}
        </View>
        <IconButton
          icon="chevron-right"
          label={t(K.next)}
          variant="tertiary"
          onPress={() => onMonthChange(month.add({ months: 1 }))}
        />
      </View>
      <View className="flex-row" importantForAccessibility="no-hide-descendants">
        {firstRow.map((_, column) => {
          const sample = grid.flat().find((date, at) => date && at % 7 === column);
          return (
            // oxlint-disable-next-line react/no-array-index-key -- a month grid's cells are fixed weekday columns and week rows that never reorder
            <Text key={column} type="small" tone="muted" align="center" className="flex-1">
              {sample ? weekday.format(instant(sample)) : ""}
            </Text>
          );
        })}
      </View>
      {grid.map((week, row) => (
        // oxlint-disable-next-line react/no-array-index-key -- a month grid's cells are fixed weekday columns and week rows that never reorder
        <View key={row} className="flex-row">
          {week.map((date, column) =>
            date ? (
              <Pressable
                key={date.toString()}
                disabled={isOff(date)}
                onPress={() => onPress(date)}
                accessibilityRole="button"
                accessibilityLabel={fullDate.format(instant(date))}
                accessibilityState={{ selected: isSelected(date), disabled: isOff(date) }}
                className={`min-h-11 flex-1 items-center justify-center rounded-[var(--radius-control)] ${isSelected(date) ? "bg-accent-soft" : ""} ${isOff(date) ? "opacity-40" : ""}`}
              >
                <Text
                  className={isSelected(date) ? "font-semibold text-accent-soft-foreground" : ""}
                >
                  {dayNumber.format(instant(date))}
                </Text>
                {isHijri ? (
                  <Text type="caption" tone="muted">
                    {hijriDay.format(instant(date))}
                  </Text>
                ) : null}
              </Pressable>
            ) : (
              // oxlint-disable-next-line react/no-array-index-key -- a month grid's cells are fixed weekday columns and week rows that never reorder
              <View key={column} className="flex-1" />
            ),
          )}
        </View>
      ))}
    </View>
  );
}
