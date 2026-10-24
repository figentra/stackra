/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `WheelDateTimePicker` (@stackra/ui-pro): a controlled date and
 *          time wheel with the chosen value read back, a 24-hour wheel with a minute step, a limited date range with
 *          a custom date label, a wheel that reports only when it comes to rest, and the disabled state, in the
 *          locale the display switcher chose.
 * Boundary: presentation and local demo state only; the wheel is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { CalendarDateTime, getLocalTimeZone, today } from "@internationalized/date";
import { Text, useDesignSystem } from "@stackra/ui/native";
import { WheelDateTimePicker } from "@stackra/ui-pro/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  controlled: {
    title: "Controlled",
    description: "The wheel runs from today for a year, with an AM/PM column.",
    name: "Reminder date and time",
    value: "Selected:",
  },
  twentyFour: {
    title: "24-hour and minute step",
    description:
      "`hourFormat={24}` drops the AM/PM column and `minuteInterval={15}` steps the minutes.",
    name: "Appointment date and time",
  },
  bounded: {
    title: "Limits and date label",
    description:
      "`minValue` and `maxValue` bound the days; `formatDate` shows Today for the current day.",
    name: "Pickup date and time",
    today: "Today",
  },
  commit: {
    title: "Commit on rest",
    description: "`onValueCommit` fires once, after every column has stopped.",
    name: "Departure date and time",
    value: "Committed:",
    none: "nothing yet",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` blocks every column.",
    name: "Deadline date and time",
  },
} as const;

/** The WheelDateTimePicker page: one section per option and state, in a scrollable screen. */
export function WheelDateTimePickerScreen() {
  const { locale } = useDesignSystem();
  const now = today(getLocalTimeZone());
  const [value, setValue] = useState(
    () => new CalendarDateTime(now.year, now.month, now.day, 9, 30),
  );
  const [committed, setCommitted] = useState<CalendarDateTime | null>(null);

  return (
    <Screen>
      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <WheelDateTimePicker
          label={STRINGS.controlled.name}
          locale={locale}
          value={value}
          onValueChange={setValue}
        />
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.value} ${value.toString()}`}
        </Text>
      </Section>

      <Section title={STRINGS.twentyFour.title} description={STRINGS.twentyFour.description}>
        <WheelDateTimePicker
          label={STRINGS.twentyFour.name}
          locale={locale}
          hourFormat={24}
          minuteInterval={15}
          defaultValue={new CalendarDateTime(now.year, now.month, now.day, 14, 45)}
        />
      </Section>

      <Section title={STRINGS.bounded.title} description={STRINGS.bounded.description}>
        <WheelDateTimePicker
          label={STRINGS.bounded.name}
          locale={locale}
          minValue={now}
          maxValue={now.add({ months: 3 })}
          formatDate={(date, { isToday }) =>
            isToday ? STRINGS.bounded.today : `${date.month}/${date.day}`
          }
        />
      </Section>

      <Section title={STRINGS.commit.title} description={STRINGS.commit.description}>
        <WheelDateTimePicker
          label={STRINGS.commit.name}
          locale={locale}
          onValueCommit={setCommitted}
        />
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.commit.value} ${committed?.toString() ?? STRINGS.commit.none}`}
        </Text>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <WheelDateTimePicker label={STRINGS.disabled.name} locale={locale} isDisabled />
      </Section>
    </Screen>
  );
}
