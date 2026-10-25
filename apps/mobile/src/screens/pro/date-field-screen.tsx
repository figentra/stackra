/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `DateField` (@stackra-pro/ui): a masked `dd/mm/yyyy` input with
 *          a calendar button that opens in a bottom sheet, the loose input mode with a popover, the required state
 *          with its hint, the invalid state with its message, and the disabled state, in the locale the display
 *          switcher chose.
 * Boundary: presentation and local demo state only; the field is @stackra-pro/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Description, FieldError, Label, Text, useDesignSystem } from "@stackra/ui/native";
import { DateField, type DateFieldProps } from "@stackra-pro/ui/native";
import { useState } from "react";

import { CalendarParts } from "#src/components/ui/calendar-parts";
import { useInsetSheet } from "#src/components/ui/inset-sheet";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  masked: {
    title: "Masked input with a bottom sheet",
    description:
      "Digits get their slashes as you type and leaving the field commits the date; the calendar button picks one instead.",
    label: "Event date",
    selected: "Selected:",
    none: "nothing yet",
  },
  loose: {
    title: "Loose input with a popover",
    description:
      '`inputMode="loose"` keeps the text as typed; the calendar opens beside the field.',
    label: "Ship date",
  },
  required: {
    title: "Required",
    description: "`isRequired` marks the field; the hint explains why.",
    label: "Delivery date",
    hint: "Required for logistics.",
  },
  invalid: {
    title: "Invalid",
    description: "`isInvalid` gives the field the danger border and shows the message.",
    label: "Return by",
    hint: "Must be a business day.",
    error: "Please enter a valid return date.",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` turns off the input and the calendar button.",
    label: "Deadline",
  },
  calendarButton: "Open the calendar",
} as const;

/** Props of {@link DateEntry}. */
interface DateEntryProps extends Omit<DateFieldProps, "children"> {
  /** The visible field name; also the accessible name of the field. */
  label: string;
  /** How the calendar opens. */
  presentation?: "popover" | "bottom-sheet";
  /** Help text under the field, hidden while the field is invalid. */
  hint?: string;
  /** The message shown while the field is invalid. */
  error?: string;
}

/** One labelled field: name, masked input, calendar button, the calendar in the chosen presentation, help and error. */
function DateEntry({ label, presentation = "popover", hint, error, ...rest }: DateEntryProps) {
  const insetSheet = useInsetSheet();
  const calendar = (
    <DateField.Calendar>
      <CalendarParts hasYearPicker />
    </DateField.Calendar>
  );
  return (
    <DateField label={label} {...rest}>
      <Label>{label}</Label>
      <DateField.InputGroup>
        <DateField.Input accessibilityLabel={label} />
        <DateField.Suffix>
          <DateField.Select presentation={presentation}>
            <DateField.Trigger accessibilityLabel={STRINGS.calendarButton}>
              <DateField.TriggerIndicator />
            </DateField.Trigger>
            <DateField.Portal>
              <DateField.Overlay />
              {presentation === "bottom-sheet" ? (
                <DateField.Content presentation="bottom-sheet" {...insetSheet}>
                  {calendar}
                </DateField.Content>
              ) : (
                <DateField.Content presentation="popover" width="full">
                  {calendar}
                </DateField.Content>
              )}
            </DateField.Portal>
          </DateField.Select>
        </DateField.Suffix>
      </DateField.InputGroup>
      {hint ? <Description hideOnInvalid>{hint}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </DateField>
  );
}

/** The DateField page: one section per input mode and state, in a scrollable screen. */
export function DateFieldScreen() {
  const { locale } = useDesignSystem();
  const [picked, setPicked] = useState<DateFieldProps["value"]>(undefined);

  return (
    <Screen>
      <Section title={STRINGS.masked.title} description={STRINGS.masked.description}>
        <DateEntry
          label={STRINGS.masked.label}
          locale={locale}
          presentation="bottom-sheet"
          inputMode="masked"
          onValueChange={setPicked}
        />
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.masked.selected} ${picked?.label ?? STRINGS.masked.none}`}
        </Text>
      </Section>

      <Section title={STRINGS.loose.title} description={STRINGS.loose.description}>
        <DateEntry label={STRINGS.loose.label} locale={locale} inputMode="loose" />
      </Section>

      <Section title={STRINGS.required.title} description={STRINGS.required.description}>
        <DateEntry
          label={STRINGS.required.label}
          locale={locale}
          isRequired
          hint={STRINGS.required.hint}
        />
      </Section>

      <Section title={STRINGS.invalid.title} description={STRINGS.invalid.description}>
        <DateEntry
          label={STRINGS.invalid.label}
          locale={locale}
          isInvalid
          hint={STRINGS.invalid.hint}
          error={STRINGS.invalid.error}
        />
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <DateEntry label={STRINGS.disabled.label} locale={locale} isDisabled />
      </Section>
    </Screen>
  );
}
