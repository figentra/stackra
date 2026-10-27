/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `TimePicker` (@stackra-pro/ui): a trigger that opens an hour
 *          and minute wheel in a popover, in a bottom sheet and in a dialog, a 24-hour wheel with a minute step, and
 *          the invalid and disabled states, in the locale the display switcher chose.
 * Boundary: presentation and local demo state only; the picker is @stackra-pro/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Description, FieldError, Label, Text, useDesignSystem } from "@stackra/ui/native";
import { TimePicker, type TimePickerProps } from "@stackra-pro/ui/native";
import { useState } from "react";

import { useInsetSheet } from "#src/components/ui/use-inset-sheet";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  popover: {
    title: "Popover",
    description:
      "The default presentation: the wheel opens beside the trigger and commits as it scrolls.",
    label: "Reminder time",
    selected: "Selected:",
    none: "nothing yet",
  },
  sheet: {
    title: "Bottom sheet",
    description: "The wheel slides up as a bottom sheet, the usual choice on a phone.",
    label: "Opening time",
  },
  dialog: {
    title: "Dialog",
    description: "The wheel opens in a centred dialog.",
    label: "Closing time",
  },
  format: {
    title: "24-hour wheel and minute step",
    description: "`hourFormat={24}` drops the AM/PM column and `minuteInterval` steps the minutes.",
    label: "Shift start",
    hint: "Every 15 minutes.",
  },
  invalid: {
    title: "Invalid",
    description: "`isInvalid` gives the trigger the danger border and shows the message.",
    label: "Delivery slot",
    hint: "Must be during opening hours.",
    error: "Please pick a time between 9:00 and 17:00.",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` stops the trigger from opening.",
    label: "Cutoff time",
  },
} as const;

/** The three presentations this page shows; the popover is anchored to the trigger, the others to the screen. */
type Presentation = "popover" | "dialog" | "bottom-sheet";

/** Props of {@link TimeEntry}. */
interface TimeEntryProps extends Omit<TimePickerProps, "children"> {
  /** The visible field name; also the accessible name of the picker. */
  label: string;
  /** How the wheel opens. */
  presentation?: Presentation;
  /** Help text under the trigger, hidden while the field is invalid. */
  hint?: string;
  /** The message shown while the field is invalid. */
  error?: string;
}

/** One labelled picker: field name, trigger, the wheel in the chosen presentation, help and error text. */
function TimeEntry({ label, presentation = "popover", hint, error, ...rest }: TimeEntryProps) {
  const insetSheet = useInsetSheet();
  return (
    <TimePicker label={label} {...rest}>
      <Label>{label}</Label>
      <TimePicker.Select presentation={presentation}>
        <TimePicker.Trigger>
          <TimePicker.Value />
          <TimePicker.TriggerIndicator />
        </TimePicker.Trigger>
        <TimePicker.Portal>
          <TimePicker.Overlay />
          {presentation === "bottom-sheet" ? (
            <TimePicker.Content presentation="bottom-sheet" {...insetSheet}>
              <TimePicker.Wheel />
            </TimePicker.Content>
          ) : presentation === "dialog" ? (
            <TimePicker.Content presentation="dialog">
              <TimePicker.Wheel />
            </TimePicker.Content>
          ) : (
            <TimePicker.Content presentation="popover" width="trigger">
              <TimePicker.Wheel />
            </TimePicker.Content>
          )}
        </TimePicker.Portal>
      </TimePicker.Select>
      {hint ? <Description hideOnInvalid>{hint}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </TimePicker>
  );
}

/** The TimePicker page: one section per presentation and state, in a scrollable screen. */
export function TimePickerScreen() {
  const { locale } = useDesignSystem();
  const [picked, setPicked] = useState<TimePickerProps["value"]>(undefined);

  return (
    <Screen>
      <Section title={STRINGS.popover.title} description={STRINGS.popover.description}>
        <TimeEntry label={STRINGS.popover.label} locale={locale} onValueChange={setPicked} />
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.popover.selected} ${picked?.label ?? STRINGS.popover.none}`}
        </Text>
      </Section>

      <Section title={STRINGS.sheet.title} description={STRINGS.sheet.description}>
        <TimeEntry label={STRINGS.sheet.label} locale={locale} presentation="bottom-sheet" />
      </Section>

      <Section title={STRINGS.dialog.title} description={STRINGS.dialog.description}>
        <TimeEntry label={STRINGS.dialog.label} locale={locale} presentation="dialog" />
      </Section>

      <Section title={STRINGS.format.title} description={STRINGS.format.description}>
        <TimeEntry
          label={STRINGS.format.label}
          locale={locale}
          hourFormat={24}
          minuteInterval={15}
          hint={STRINGS.format.hint}
        />
      </Section>

      <Section title={STRINGS.invalid.title} description={STRINGS.invalid.description}>
        <TimeEntry
          label={STRINGS.invalid.label}
          locale={locale}
          isInvalid
          hint={STRINGS.invalid.hint}
          error={STRINGS.invalid.error}
        />
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <TimeEntry label={STRINGS.disabled.label} locale={locale} isDisabled />
      </Section>
    </Screen>
  );
}
