/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `DateRangePicker` (@stackra-pro/ui): a trigger that opens a
 *          range calendar in a popover, in a bottom sheet and in a dialog, with a display format, a separator and a
 *          limited range, and with the invalid and disabled states, in the locale the display switcher chose.
 * Boundary: presentation and local demo state only; the picker is @stackra-pro/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { getLocalTimeZone, today } from "@internationalized/date";
import { Description, FieldError, Label, Text, useDesignSystem } from "@stackra/ui/native";
import { DateRangePicker, type DateRangePickerProps } from "@stackra-pro/ui/native";
import { useState } from "react";

import { useInsetSheet } from "#src/components/ui/use-inset-sheet";
import { RangeCalendarParts } from "#src/components/ui/range-calendar-parts";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  popover: {
    title: "Popover",
    description:
      "The default presentation: tap a start day, then an end day, and the calendar closes.",
    label: "Trip dates",
    selected: "Selected:",
    none: "nothing yet",
  },
  sheet: {
    title: "Bottom sheet",
    description: "The range calendar slides up as a bottom sheet, the usual choice on a phone.",
    label: "Booking window",
  },
  dialog: {
    title: "Dialog",
    description: "The range calendar opens in a centred dialog.",
    label: "Leave period",
  },
  format: {
    title: "Display format, separator and limits",
    description:
      "`dateDisplayFormat` and `rangeSeparator` set the text in the trigger; `minValue` stops dates in the past.",
    label: "Stay dates",
    hint: "Today or later.",
    separator: " to ",
  },
  invalid: {
    title: "Invalid",
    description: "`isInvalid` gives the trigger the danger border and shows the message.",
    label: "Shipping window",
    hint: "Must fall on business days.",
    error: "Please pick a range of business days.",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` stops the trigger from opening.",
    label: "Contract period",
  },
} as const;

/** The three presentations this page shows; the popover is anchored to the trigger, the others to the screen. */
type Presentation = "popover" | "dialog" | "bottom-sheet";

/** Props of {@link RangeEntry}. */
interface RangeEntryProps extends Omit<DateRangePickerProps, "children"> {
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

/** One labelled picker: field name, trigger, the range calendar in the chosen presentation, help and error text. */
function RangeEntry({
  label,
  presentation = "popover",
  hint,
  error,
  hasMinimumToday = false,
  ...rest
}: RangeEntryProps) {
  const insetSheet = useInsetSheet();
  const calendar = (
    <DateRangePicker.Calendar {...(hasMinimumToday ? { minValue: today(getLocalTimeZone()) } : {})}>
      <RangeCalendarParts hasYearPicker />
    </DateRangePicker.Calendar>
  );
  return (
    <DateRangePicker label={label} {...rest}>
      <Label>{label}</Label>
      <DateRangePicker.Select presentation={presentation}>
        <DateRangePicker.Trigger>
          <DateRangePicker.Value />
          <DateRangePicker.TriggerIndicator />
        </DateRangePicker.Trigger>
        <DateRangePicker.Portal>
          <DateRangePicker.Overlay />
          {presentation === "bottom-sheet" ? (
            <DateRangePicker.Content presentation="bottom-sheet" {...insetSheet}>
              {calendar}
            </DateRangePicker.Content>
          ) : presentation === "dialog" ? (
            <DateRangePicker.Content presentation="dialog">{calendar}</DateRangePicker.Content>
          ) : (
            <DateRangePicker.Content presentation="popover" width="trigger">
              {calendar}
            </DateRangePicker.Content>
          )}
        </DateRangePicker.Portal>
      </DateRangePicker.Select>
      {hint ? <Description hideOnInvalid>{hint}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </DateRangePicker>
  );
}

/** The DateRangePicker page: one section per presentation and state, in a scrollable screen. */
export function DateRangePickerScreen() {
  const { locale } = useDesignSystem();
  const [picked, setPicked] = useState<DateRangePickerProps["value"]>(undefined);

  return (
    <Screen>
      <Section title={STRINGS.popover.title} description={STRINGS.popover.description}>
        <RangeEntry label={STRINGS.popover.label} locale={locale} onValueChange={setPicked} />
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.popover.selected} ${picked?.label ?? STRINGS.popover.none}`}
        </Text>
      </Section>

      <Section title={STRINGS.sheet.title} description={STRINGS.sheet.description}>
        <RangeEntry label={STRINGS.sheet.label} locale={locale} presentation="bottom-sheet" />
      </Section>

      <Section title={STRINGS.dialog.title} description={STRINGS.dialog.description}>
        <RangeEntry label={STRINGS.dialog.label} locale={locale} presentation="dialog" />
      </Section>

      <Section title={STRINGS.format.title} description={STRINGS.format.description}>
        <RangeEntry
          label={STRINGS.format.label}
          locale={locale}
          dateDisplayFormat="long"
          rangeSeparator={STRINGS.format.separator}
          hint={STRINGS.format.hint}
          hasMinimumToday
        />
      </Section>

      <Section title={STRINGS.invalid.title} description={STRINGS.invalid.description}>
        <RangeEntry
          label={STRINGS.invalid.label}
          locale={locale}
          isInvalid
          hint={STRINGS.invalid.hint}
          error={STRINGS.invalid.error}
        />
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <RangeEntry label={STRINGS.disabled.label} locale={locale} isDisabled />
      </Section>
    </Screen>
  );
}
