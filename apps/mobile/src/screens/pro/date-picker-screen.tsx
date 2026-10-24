/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `DatePicker` (@stackra/ui-pro): a trigger field that opens
 *          the calendar in a popover, in a bottom sheet (`@gorhom/bottom-sheet`, through HeroUI Native), with a
 *          display format and a limited range, and with the invalid state and its message, in the locale the
 *          display switcher chose.
 * Boundary: presentation and local demo state only; the picker is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-403 FR-011.
 */
import { getLocalTimeZone, today } from "@internationalized/date";
import { useDesignSystem } from "@stackra/ui/native";
import { DatePicker, type DatePickerProps } from "@stackra/ui-pro/native";
import { Description, FieldError, Label, Typography } from "heroui-native";
import { useState } from "react";

import { CalendarParts } from "#src/components/ui/calendar-parts";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  popover: {
    title: "Popover",
    description: "The default presentation: the calendar opens beside the trigger.",
    label: "Event date",
    selected: "Selected:",
    none: "nothing yet",
  },
  sheet: {
    title: "Bottom sheet",
    description: "The calendar slides up as a bottom sheet, the usual choice on a phone.",
    label: "Delivery date",
  },
  format: {
    title: "Display format and range",
    description:
      "`dateDisplayFormat` sets the text in the trigger; `minValue` stops dates in the past.",
    label: "Booking date",
    hint: "Today or later.",
  },
  invalid: {
    title: "Invalid",
    description: "`isInvalid` gives the trigger the danger border and shows the message.",
    label: "Ship date",
    hint: "Must be a business day.",
    error: "Please pick a business day.",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` stops the trigger from opening.",
    label: "Deadline",
  },
} as const;

/** The two presentations this page shows; the popover is anchored to the trigger, the sheet to the screen. */
type Presentation = "popover" | "bottom-sheet";

/** Props of {@link DateField}. */
interface DateFieldProps extends Omit<DatePickerProps, "children"> {
  /** The visible field name; also the accessible name of the picker. */
  label: string;
  /** How the calendar opens. */
  presentation?: Presentation;
  /** Help text under the trigger, hidden while the field is invalid. */
  hint?: string;
  /** The message shown while the field is invalid. */
  error?: string;
  /** True to stop dates before today from being picked. */
  hasMinimumToday?: boolean;
}

/** One labelled picker: field name, trigger, the calendar in the chosen presentation, help and error text. */
function DateField({
  label,
  presentation = "popover",
  hint,
  error,
  hasMinimumToday = false,
  ...rest
}: DateFieldProps) {
  const calendar = (
    <DatePicker.Calendar {...(hasMinimumToday ? { minValue: today(getLocalTimeZone()) } : {})}>
      <CalendarParts hasYearPicker />
    </DatePicker.Calendar>
  );
  return (
    <DatePicker label={label} {...rest}>
      <Label>{label}</Label>
      <DatePicker.Select presentation={presentation}>
        <DatePicker.Trigger>
          <DatePicker.Value />
          <DatePicker.TriggerIndicator />
        </DatePicker.Trigger>
        <DatePicker.Portal>
          <DatePicker.Overlay />
          {presentation === "bottom-sheet" ? (
            <DatePicker.Content presentation="bottom-sheet">{calendar}</DatePicker.Content>
          ) : (
            <DatePicker.Content presentation="popover" width="trigger">
              {calendar}
            </DatePicker.Content>
          )}
        </DatePicker.Portal>
      </DatePicker.Select>
      {hint ? <Description hideOnInvalid>{hint}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </DatePicker>
  );
}

/** The DatePicker page: one section per presentation and state, in a scrollable screen. */
export function DatePickerScreen() {
  const { locale } = useDesignSystem();
  const [picked, setPicked] = useState<DatePickerProps["value"]>(undefined);

  return (
    <Screen>
      <Section title={STRINGS.popover.title} description={STRINGS.popover.description}>
        <DateField label={STRINGS.popover.label} locale={locale} onValueChange={setPicked} />
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.popover.selected} ${picked?.label ?? STRINGS.popover.none}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.sheet.title} description={STRINGS.sheet.description}>
        <DateField label={STRINGS.sheet.label} locale={locale} presentation="bottom-sheet" />
      </Section>

      <Section title={STRINGS.format.title} description={STRINGS.format.description}>
        <DateField
          label={STRINGS.format.label}
          locale={locale}
          dateDisplayFormat="long"
          hint={STRINGS.format.hint}
          hasMinimumToday
        />
      </Section>

      <Section title={STRINGS.invalid.title} description={STRINGS.invalid.description}>
        <DateField
          label={STRINGS.invalid.label}
          locale={locale}
          isInvalid
          hint={STRINGS.invalid.hint}
          error={STRINGS.invalid.error}
        />
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <DateField label={STRINGS.disabled.label} locale={locale} isDisabled />
      </Section>
    </Screen>
  );
}
