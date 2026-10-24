/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `RangeCalendar` (@stackra/ui-pro): a controlled range with the
 *          chosen start and end read back, one limited by `minValue` and `maxValue`, one with weekends unavailable
 *          that a range may not span, one with the year picker, and the disabled state, in the locale the display
 *          switcher chose.
 * Boundary: presentation and local demo state only; the calendar is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { getLocalTimeZone, isWeekend, today } from "@internationalized/date";
import { Text, useDesignSystem } from "@stackra/ui/native";
import { RangeCalendar, type RangeCalendarProps } from "@stackra/ui-pro/native";
import { useState } from "react";

import { RangeCalendarParts } from "#src/components/ui/range-calendar-parts";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  selected: {
    title: "Selected range",
    description: "A controlled calendar: tap a start day, then an end day.",
    name: "Trip dates",
    value: "Selected:",
    none: "nothing yet",
    to: "to",
  },
  range: {
    title: "Minimum and maximum",
    description:
      "Only today and the next two months can be picked; earlier and later days are disabled.",
    name: "Booking dates",
  },
  unavailable: {
    title: "Unavailable days",
    description:
      "Weekends are marked unavailable through `isDateUnavailable`, and a range cannot span them.",
    name: "Working days",
  },
  year: {
    title: "Year picker",
    description: "The heading opens a year list.",
    name: "Event dates",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` turns off every day and the month buttons.",
    name: "Dates, unavailable",
  },
} as const;

/** The range the calendar reports, taken from its own props so the page repeats no date type. */
type Range = NonNullable<RangeCalendarProps["value"]>;

/** The RangeCalendar page: one section per state, in a scrollable screen. */
export function RangeCalendarScreen() {
  const { locale } = useDesignSystem();
  const [range, setRange] = useState<Range | null>(null);
  const now = today(getLocalTimeZone());

  return (
    <Screen>
      <Section title={STRINGS.selected.title} description={STRINGS.selected.description}>
        <RangeCalendar
          label={STRINGS.selected.name}
          locale={locale}
          value={range}
          onChange={setRange}
        >
          <RangeCalendarParts />
        </RangeCalendar>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.selected.value} ${
            range
              ? `${range.start.toString()} ${STRINGS.selected.to} ${range.end.toString()}`
              : STRINGS.selected.none
          }`}
        </Text>
      </Section>

      <Section title={STRINGS.range.title} description={STRINGS.range.description}>
        <RangeCalendar
          label={STRINGS.range.name}
          locale={locale}
          minValue={now}
          maxValue={now.add({ months: 2 })}
        >
          <RangeCalendarParts />
        </RangeCalendar>
      </Section>

      <Section title={STRINGS.unavailable.title} description={STRINGS.unavailable.description}>
        <RangeCalendar
          label={STRINGS.unavailable.name}
          locale={locale}
          isDateUnavailable={(date) => isWeekend(date, locale)}
        >
          <RangeCalendarParts />
        </RangeCalendar>
      </Section>

      <Section title={STRINGS.year.title} description={STRINGS.year.description}>
        <RangeCalendar label={STRINGS.year.name} locale={locale}>
          <RangeCalendarParts hasYearPicker />
        </RangeCalendar>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <RangeCalendar label={STRINGS.disabled.name} locale={locale} isDisabled>
          <RangeCalendarParts />
        </RangeCalendar>
      </Section>
    </Screen>
  );
}
