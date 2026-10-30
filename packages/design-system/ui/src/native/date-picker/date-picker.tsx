/**
 * Stackra file contract:
 * Purpose: the native `DatePicker` on `@expo/ui`'s community DateTimePicker (ADR 0318 decision 8): the DateField with
 *          a calendar button named by `calendarButtonLabel` and the overlay's open state, so an app opens the platform
 *          picker with `isOpen` exactly as it opens a Popover (ADR 0312).
 *          `calendar: "islamic-umalqura"` writes the chosen day's Hijri date under the field (the platform picker has
 *          no Hijri calendar); the value stays Gregorian.
 * Boundary: `DateInput` with the button and the open state; the day, the bounds, the refused days and the local-noon
 *           conversion are the DateField's. "Choose a date" is the button's default name, from the `ui`
 *           catalogue in the active locale.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (open state); ADR 0318 (decision 8);
 *          ADR 0055 (forms); WCAG 2.2 SC 4.1.2.
 */
import { dateTimeFormatIn } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { getLocalTimeZone, today as todayIn, type CalendarDate } from "@internationalized/date";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { calendarLocaleOf } from "#core/functions/calendar-locale-of.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { DateInput } from "#native/date-field/date-input";
import { NativeDatePresets } from "#native/date-picker/native-date-presets";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Text } from "#native/text/text";
import type { DatePickerProps } from "#native/date-picker/date-picker.props";

/**
 * A labelled field over one day with a calendar button. Pair `value` with `onChange` to control the day and `isOpen`
 * with `onOpenChange` to control the picker.
 */
export function DatePicker({
  calendarButtonLabel: calendarButtonLabelProp,
  calendar = "gregory",
  presets,
  today,
  ...rest
}: DatePickerProps): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const [own, setOwn] = useState<CalendarDate | null>(rest.defaultValue ?? null);
  const calendarButtonLabel = calendarButtonLabelProp ?? t(UI_KEYS.ui.date_picker.calendar);
  const field = <DateInput {...rest} calendarButtonLabel={calendarButtonLabel} />;
  if (presets?.length) {
    // With presets the field runs controlled, so a preset can set the day the platform picker shows.
    const day = rest.value === undefined ? own : rest.value;
    const pick = (next: CalendarDate | null) => {
      setOwn(next);
      rest.onChange?.(next);
    };
    return (
      <View className="gap-2">
        <DateInput {...rest} value={day} onChange={pick} calendarButtonLabel={calendarButtonLabel} />
        <NativeDatePresets
          presets={presets}
          today={today ?? todayIn(getLocalTimeZone())}
          chosen={day}
          onPick={pick}
        />
      </View>
    );
  }
  if (calendar === "gregory") return field;
  // The platform picker has no Hijri calendar, so the Hijri day is written under the field (ADR 0192 decision 3).
  const day = rest.value === undefined ? own : rest.value;
  return (
    <View className="gap-1">
      <DateInput
        {...rest}
        calendarButtonLabel={calendarButtonLabel}
        onChange={(next) => {
          setOwn(next);
          rest.onChange?.(next);
        }}
      />
      {day ? (
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {dateTimeFormatIn(
            calendarLocaleOf(locale, calendar),
            { dateStyle: "long", timeZone: "UTC" },
            numerals,
          ).format(day.toDate("UTC"))}
        </Text>
      ) : null}
    </View>
  );
}
