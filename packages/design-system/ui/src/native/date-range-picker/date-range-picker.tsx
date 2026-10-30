/**
 * Stackra file contract:
 * Purpose: the native `DateRangePicker`: a labelled field over a range of days that opens a modal with the preset
 *          ranges as chips over a RangeCalendar; Done keeps the range, Cancel drops it.
 * Boundary: the shell is PickerField's; the presets `dateRangeOfPreset`'s, named from the `ui` catalogue. The range
 *           is written with the locale's range format and the customer's digits; it stays Gregorian in the Hijri
 *           option.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312; WCAG 2.2
 *          SC 4.1.2.
 */
import { getLocalTimeZone, today as todayIn } from "@internationalized/date";
import { withDigits } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";

import { DateRangePreset } from "#contracts/enums/date-range-preset.enum";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { dateRangeOfPreset } from "#core/functions/date-range-of-preset.function";
import { formatDateRange } from "#core/functions/format-date-range.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { RangeCalendar } from "#native/range-calendar/range-calendar";
import { Text } from "#native/text/text";
import { PickerField } from "#native/time-field/picker-field";
import type { DateRangePickerProps } from "#native/date-range-picker/date-range-picker.props";

/** A labelled field over a range of days, with presets. */
export function DateRangePicker({
  presets = DateRangePreset,
  calendar,
  calendarButtonLabel,
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  today,
  name: _name,
  ...field
}: DateRangePickerProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.date_range_picker;
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const [own, setOwn] = useState<DateRangeValue | null>(defaultValue ?? null);
  const range = value === undefined ? own : value;
  const [shown, setShown] = useState<DateRangeValue | null>(null);
  const [key, setKey] = useState(0);
  const from = today ?? todayIn(getLocalTimeZone());
  const text = range ? withDigits(formatDateRange(range, locale), numerals) : "";
  return (
    <PickerField
      {...field}
      text={text}
      icon="calendar"
      buttonLabel={calendarButtonLabel ?? t(K.calendar)}
      onOpenChange={(open) => {
        if (open) setShown(null);
        field.onOpenChange?.(open);
      }}
      onDone={() => {
        const next = shown ?? range;
        if (!next?.start || !next.end) return;
        if (value === undefined) setOwn(next);
        onChange?.(next);
      }}
    >
      <View className="gap-3">
        {presets.length > 0 ? (
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t(K.presets)}
            className="flex-row flex-wrap gap-2"
          >
            {presets.map((preset) => (
              <Pressable
                key={preset}
                accessibilityRole="button"
                onPress={() => {
                  setShown(dateRangeOfPreset(preset, from));
                  setKey((n) => n + 1);
                }}
                className="min-h-9 justify-center rounded-full bg-default px-3"
              >
                <Text type="small">{t(K[preset])}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <RangeCalendar
          key={key}
          value={shown ?? range}
          onChange={setShown}
          {...omitUndefined({ minValue, maxValue, calendar })}
        />
      </View>
    </PickerField>
  );
}
