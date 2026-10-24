/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `DatePicker` (@stackra/ui): a labelled field over one calendar
 *          day with a calendar button, empty and filled, bounded between two days, with a day that is refused, each
 *          state (required, invalid, disabled, read-only), a picker the page opens and closes from outside, and a
 *          live picker whose day is read out.
 * Boundary: presentation and local demo state only; the picker is @stackra/ui's, nothing here is styled by hand. The
 *          days are `CalendarDate`s from `@internationalized/date`, counted from today so the samples stay in range.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { getLocalTimeZone, isWeekend, today, type CalendarDate } from "@internationalized/date";
import { Button, DatePicker, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Empty and filled",
    description:
      "An empty picker says so; a filled one writes its day in the locale of the design-system provider.",
    empty: "Due date",
    emptyHint: "Press the field or the calendar button.",
    emptyButton: "Choose the due date",
    filled: "Delivery date",
    filledButton: "Choose the delivery date",
  },
  bounded: {
    title: "Bounded",
    description:
      "`minValue` and `maxValue` bound the calendar: a day outside them cannot be picked.",
    label: "Pickup date",
    hint: "From today to two months ahead.",
    button: "Choose the pickup date",
  },
  unavailable: {
    title: "A refused day",
    description:
      "`isDateUnavailable` refuses a day: the picker cannot grey out single days, so picking one is refused with a message.",
    label: "Delivery on a working day",
    hint: "Weekends are closed.",
    button: "Choose the delivery day",
  },
  states: {
    title: "States",
    description:
      "Each state of the picker. Disabled and read-only keep their day and never open the calendar.",
    required: "Required",
    invalid: "Invalid",
    invalidError: "Choose a day in the future.",
    disabled: "Disabled",
    readOnly: "Read-only",
  },
  controlled: {
    title: "Opened from outside",
    description:
      "The page holds `isOpen`, so its own button opens the picker exactly as it would open a popover.",
    label: "Reminder date",
    open: "Open the reminder picker",
    button: "Choose the reminder date",
    state: (isOpen: boolean) => `The picker is ${isOpen ? "open" : "closed"}.`,
  },
  live: {
    title: "Try it",
    description:
      "Pick a day; the readout shows it as an ISO date, and `null` once the picker is cleared from outside.",
    label: "Appointment",
    button: "Choose the appointment date",
    chosen: (day: CalendarDate | null) => `Chosen day: ${day?.toString() ?? "none"}`,
    next: "Set it to next week",
    clear: "Clear the picker",
  },
} as const;

/** Today, and the days the samples are counted from. */
const TODAY = today(getLocalTimeZone());
const NEXT_WEEK = TODAY.add({ weeks: 1 });
const LAST = TODAY.add({ months: 2 });

/** True for a day the samples refuse: Saturdays and Sundays. */
const isClosed = (day: CalendarDate) => isWeekend(day, "en-US");

/** The DatePicker page: one section per option, in a scrollable screen. */
export function DatePickerScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [day, setDay] = useState<CalendarDate | null>(null);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <DatePicker
          label={STRINGS.basics.empty}
          description={STRINGS.basics.emptyHint}
          calendarButtonLabel={STRINGS.basics.emptyButton}
        />
        <DatePicker
          label={STRINGS.basics.filled}
          calendarButtonLabel={STRINGS.basics.filledButton}
          defaultValue={NEXT_WEEK}
        />
      </Section>

      <Section title={STRINGS.bounded.title} description={STRINGS.bounded.description}>
        <DatePicker
          label={STRINGS.bounded.label}
          description={STRINGS.bounded.hint}
          calendarButtonLabel={STRINGS.bounded.button}
          minValue={TODAY}
          maxValue={LAST}
          defaultValue={NEXT_WEEK}
        />
      </Section>

      <Section title={STRINGS.unavailable.title} description={STRINGS.unavailable.description}>
        <DatePicker
          label={STRINGS.unavailable.label}
          description={STRINGS.unavailable.hint}
          calendarButtonLabel={STRINGS.unavailable.button}
          isDateUnavailable={isClosed}
        />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <DatePicker label={STRINGS.states.required} isRequired />
        <DatePicker
          label={STRINGS.states.invalid}
          isInvalid
          errorMessage={STRINGS.states.invalidError}
          defaultValue={TODAY.subtract({ days: 3 })}
        />
        <DatePicker label={STRINGS.states.disabled} isDisabled defaultValue={NEXT_WEEK} />
        <DatePicker label={STRINGS.states.readOnly} isReadOnly defaultValue={NEXT_WEEK} />
      </Section>

      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <DatePicker
          label={STRINGS.controlled.label}
          calendarButtonLabel={STRINGS.controlled.button}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
        <Button size="sm" variant="secondary" onPress={() => setIsOpen(true)}>
          {STRINGS.controlled.open}
        </Button>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.controlled.state(isOpen)}
        </Text>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <DatePicker
          label={STRINGS.live.label}
          calendarButtonLabel={STRINGS.live.button}
          value={day}
          onChange={setDay}
        />
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
