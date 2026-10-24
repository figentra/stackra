/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `DateField` (@stackra/ui): a labelled field over one calendar
 *          day that opens the platform's date picker, empty and filled, bounded between two days, with a day that is
 *          refused, each state (required, invalid, disabled, read-only), and a live field whose day is read out.
 * Boundary: presentation and local demo state only; the field is @stackra/ui's, nothing here is styled by hand. The
 *          days are `CalendarDate`s from `@internationalized/date`, counted from today so the samples stay in range.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { getLocalTimeZone, isWeekend, today, type CalendarDate } from "@internationalized/date";
import { Button, DateField, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Empty and filled",
    description:
      "An empty field says so; a filled one writes its day in the locale of the design-system provider.",
    empty: "Due date",
    emptyHint: "Pick a day from the calendar.",
    filled: "Delivery date",
  },
  bounded: {
    title: "Bounded",
    description:
      "`minValue` and `maxValue` bound the calendar: a day outside them cannot be picked.",
    label: "Pickup date",
    hint: "From today to two months ahead.",
  },
  unavailable: {
    title: "A refused day",
    description:
      "`isDateUnavailable` refuses a day: the picker cannot grey out single days, so picking one is refused with a message.",
    label: "Delivery on a working day",
    hint: "Weekends are closed.",
  },
  states: {
    title: "States",
    description:
      "Each state of the field. Disabled and read-only keep their day and never open the picker.",
    required: "Required",
    invalid: "Invalid",
    invalidError: "Choose a day in the future.",
    disabled: "Disabled",
    readOnly: "Read-only",
  },
  live: {
    title: "Try it",
    description:
      "Pick a day; the readout shows it as an ISO date, and `null` once the field is cleared from outside.",
    label: "Appointment",
    chosen: (day: CalendarDate | null) => `Chosen day: ${day?.toString() ?? "none"}`,
    next: "Set it to next week",
    clear: "Clear the field",
  },
} as const;

/** Today, and the days the samples are counted from. */
const TODAY = today(getLocalTimeZone());
const NEXT_WEEK = TODAY.add({ weeks: 1 });
const LAST = TODAY.add({ months: 2 });

/** True for a day the samples refuse: Saturdays and Sundays. */
const isClosed = (day: CalendarDate) => isWeekend(day, "en-US");

/** The DateField page: one section per option, in a scrollable screen. */
export function DateFieldScreen() {
  const [day, setDay] = useState<CalendarDate | null>(null);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <DateField label={STRINGS.basics.empty} description={STRINGS.basics.emptyHint} />
        <DateField label={STRINGS.basics.filled} defaultValue={NEXT_WEEK} />
      </Section>

      <Section title={STRINGS.bounded.title} description={STRINGS.bounded.description}>
        <DateField
          label={STRINGS.bounded.label}
          description={STRINGS.bounded.hint}
          minValue={TODAY}
          maxValue={LAST}
          defaultValue={NEXT_WEEK}
        />
      </Section>

      <Section title={STRINGS.unavailable.title} description={STRINGS.unavailable.description}>
        <DateField
          label={STRINGS.unavailable.label}
          description={STRINGS.unavailable.hint}
          isDateUnavailable={isClosed}
        />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <DateField label={STRINGS.states.required} isRequired />
        <DateField
          label={STRINGS.states.invalid}
          isInvalid
          errorMessage={STRINGS.states.invalidError}
          defaultValue={TODAY.subtract({ days: 3 })}
        />
        <DateField label={STRINGS.states.disabled} isDisabled defaultValue={NEXT_WEEK} />
        <DateField label={STRINGS.states.readOnly} isReadOnly defaultValue={NEXT_WEEK} />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <DateField label={STRINGS.live.label} value={day} onChange={setDay} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.chosen(day)}
        </Text>
        <Button size="sm" variant="secondary" onPress={() => setDay(NEXT_WEEK)}>
          {STRINGS.live.next}
        </Button>
        <Button size="sm" variant="tertiary" onPress={() => setDay(null)}>
          {STRINGS.live.clear}
        </Button>
      </Section>
    </Screen>
  );
}
