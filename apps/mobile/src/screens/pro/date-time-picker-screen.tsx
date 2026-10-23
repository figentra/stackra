/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `DateTimePicker` (@stackra/ui-pro): a trigger that opens a
 *          date and time wheel in a popover and in a bottom sheet, a 24-hour wheel with a minute step and a limited
 *          date range, and the invalid and disabled states, in the locale the display switcher chose.
 * Boundary: presentation and local demo state only; the picker is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { getLocalTimeZone, today } from "@internationalized/date";
import { useDesignSystem } from "@stackra/ui/native";
import { DateTimePicker, type DateTimePickerProps } from "@stackra/ui-pro/native";
import { Description, FieldError, Label, Typography } from "heroui-native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  popover: {
    title: "Popover",
    description:
      "The default presentation: the wheel opens beside the trigger and commits as it scrolls.",
    label: "Reminder",
    selected: "Selected:",
    none: "nothing yet",
  },
  sheet: {
    title: "Bottom sheet",
    description: "The wheel slides up as a bottom sheet, the usual choice on a phone.",
    label: "Pickup time",
  },
  format: {
    title: "24-hour wheel, minute step and limits",
    description:
      "`hourFormat={24}` drops the AM/PM column, `minuteInterval` steps the minutes, and `minValue` and `maxValue` bound the days.",
    label: "Appointment",
    hint: "The next three months, every 15 minutes.",
  },
  invalid: {
    title: "Invalid",
    description: "`isInvalid` gives the trigger the danger border and shows the message.",
    label: "Cutoff",
    hint: "Must be during business hours.",
    error: "Please select a valid cutoff date and time.",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` stops the trigger from opening.",
    label: "Deadline",
  },
} as const;

/** Props of {@link DateTimeEntry}. */
interface DateTimeEntryProps extends Omit<DateTimePickerProps, "children"> {
  /** The visible field name; also the accessible name of the picker. */
  label: string;
  /** How the wheel opens. */
  presentation?: "popover" | "bottom-sheet";
  /** Help text under the trigger, hidden while the field is invalid. */
  hint?: string;
  /** The message shown while the field is invalid. */
  error?: string;
}

/** One labelled picker: field name, trigger, the wheel in the chosen presentation, help and error text. */
function DateTimeEntry({
  label,
  presentation = "popover",
  hint,
  error,
  ...rest
}: DateTimeEntryProps) {
  return (
    <DateTimePicker label={label} {...rest}>
      <Label>{label}</Label>
      <DateTimePicker.Select presentation={presentation}>
        <DateTimePicker.Trigger>
          <DateTimePicker.Value />
          <DateTimePicker.TriggerIndicator />
        </DateTimePicker.Trigger>
        <DateTimePicker.Portal>
          <DateTimePicker.Overlay />
          {presentation === "bottom-sheet" ? (
            <DateTimePicker.Content presentation="bottom-sheet">
              <DateTimePicker.Wheel />
            </DateTimePicker.Content>
          ) : (
            <DateTimePicker.Content presentation="popover" width="trigger">
              <DateTimePicker.Wheel />
            </DateTimePicker.Content>
          )}
        </DateTimePicker.Portal>
      </DateTimePicker.Select>
      {hint ? <Description hideOnInvalid>{hint}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </DateTimePicker>
  );
}

/** The DateTimePicker page: one section per presentation and state, in a scrollable screen. */
export function DateTimePickerScreen() {
  const { locale } = useDesignSystem();
  const [picked, setPicked] = useState<DateTimePickerProps["value"]>(undefined);
  const now = today(getLocalTimeZone());

  return (
    <Screen>
      <Section title={STRINGS.popover.title} description={STRINGS.popover.description}>
        <DateTimeEntry label={STRINGS.popover.label} locale={locale} onValueChange={setPicked} />
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.popover.selected} ${picked?.label ?? STRINGS.popover.none}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.sheet.title} description={STRINGS.sheet.description}>
        <DateTimeEntry label={STRINGS.sheet.label} locale={locale} presentation="bottom-sheet" />
      </Section>

      <Section title={STRINGS.format.title} description={STRINGS.format.description}>
        <DateTimeEntry
          label={STRINGS.format.label}
          locale={locale}
          hourFormat={24}
          minuteInterval={15}
          minValue={now}
          maxValue={now.add({ months: 3 })}
          dateTimeDisplayFormat="medium"
          hint={STRINGS.format.hint}
        />
      </Section>

      <Section title={STRINGS.invalid.title} description={STRINGS.invalid.description}>
        <DateTimeEntry
          label={STRINGS.invalid.label}
          locale={locale}
          isInvalid
          hint={STRINGS.invalid.hint}
          error={STRINGS.invalid.error}
        />
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <DateTimeEntry label={STRINGS.disabled.label} locale={locale} isDisabled />
      </Section>
    </Screen>
  );
}
