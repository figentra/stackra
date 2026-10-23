/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Calendar` (@stackra/ui-pro): a controlled calendar with a
 *          selected date, one limited by `minValue` and `maxValue`, one with the year picker and event dots, and
 *          the disabled state, in the locale the display switcher chose.
 * Boundary: presentation and local demo state only; the calendar is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0304 (decision 6); STA-403 FR-011.
 */
import { getLocalTimeZone, today, type DateValue } from "@internationalized/date";
import { useDesignSystem } from "@stackra/ui/native";
import { Calendar } from "@stackra/ui-pro/native";
import { Typography } from "heroui-native";
import { useState } from "react";

import { CalendarParts } from "../../components/ui/calendar-parts";
import { Screen } from "../../components/ui/screen";
import { Section } from "../../components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  selected: {
    title: "Selected date",
    description: "A controlled calendar: tap a day to select it.",
    name: "Delivery date",
    value: "Selected:",
  },
  range: {
    title: "Minimum and maximum",
    description:
      "Only today and the next two months can be picked; earlier and later days are disabled.",
    name: "Booking date",
  },
  events: {
    title: "Year picker and event dots",
    description: "The heading opens a year list, and days with an event carry a dot.",
    name: "Event date",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` turns off every day and the month buttons.",
    name: "Calendar, unavailable",
  },
} as const;

/** The days of the shown month that carry an event dot. */
const EVENT_DAYS = [3, 7, 12, 15, 21, 28] as const;

/** The Calendar page: one section per state, in a scrollable screen. */
export function CalendarScreen() {
  const { locale } = useDesignSystem();
  const [date, setDate] = useState<DateValue>(() => today(getLocalTimeZone()));
  const now = today(getLocalTimeZone());

  return (
    <Screen>
      <Section title={STRINGS.selected.title} description={STRINGS.selected.description}>
        <Calendar label={STRINGS.selected.name} locale={locale} value={date} onChange={setDate}>
          <CalendarParts />
        </Calendar>
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.selected.value} ${date.toString()}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.range.title} description={STRINGS.range.description}>
        <Calendar
          label={STRINGS.range.name}
          locale={locale}
          defaultValue={now}
          minValue={now}
          maxValue={now.add({ months: 2 })}
        >
          <CalendarParts />
        </Calendar>
      </Section>

      <Section title={STRINGS.events.title} description={STRINGS.events.description}>
        <Calendar label={STRINGS.events.name} locale={locale} defaultValue={now}>
          <CalendarParts hasYearPicker eventDays={EVENT_DAYS} />
        </Calendar>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <Calendar label={STRINGS.disabled.name} locale={locale} isDisabled>
          <CalendarParts />
        </Calendar>
      </Section>
    </Screen>
  );
}
