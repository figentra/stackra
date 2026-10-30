/**
 * Stackra file contract:
 * Purpose: the native `DateTimePicker`: the native DatePicker and TimeField side by side under one label, their day and
 *          time joined into one `CalendarDateTime`.
 * Boundary: the day is the DatePicker's (with its Hijri option), the time the TimeField's wheel. A change of either
 *           reports the whole moment once both are set. The bounds apply to the day.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312.
 */
import { CalendarDateTime, toCalendarDate, type CalendarDate } from "@internationalized/date";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import type { TimeValue } from "#contracts/types/time-value.type";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { DatePicker } from "#native/date-picker/date-picker";
import { Text } from "#native/text/text";
import { TimeField } from "#native/time-field/time-field";
import type { DateTimePickerProps } from "#native/date-time-picker/date-time-picker.props";

/** A day and a time in one field. */
export function DateTimePicker({
  label,
  description,
  errorMessage,
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  hourCycle,
  calendar,
  calendarButtonLabel,
  isDisabled,
  isReadOnly,
  isInvalid,
  isRequired,
  className,
}: DateTimePickerProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.date_time_picker;
  const start = value ?? defaultValue ?? null;
  const [day, setDay] = useState<CalendarDate | null>(start ? toCalendarDate(start) : null);
  const [time, setTime] = useState<TimeValue | null>(
    start ? { hour: start.hour, minute: start.minute } : null,
  );
  const report = (nextDay: CalendarDate | null, nextTime: TimeValue | null) => {
    if (nextDay && nextTime) {
      onChange?.(
        new CalendarDateTime(
          nextDay.year,
          nextDay.month,
          nextDay.day,
          nextTime.hour,
          nextTime.minute,
        ),
      );
    }
  };
  const flags = omitUndefined({ isDisabled, isReadOnly, isInvalid, isRequired });
  return (
    <View className={`gap-1 ${className ?? ""}`}>
      {label == null ? null : <Text className="font-medium">{label}</Text>}
      <View className="flex-row gap-2">
        <View className="flex-[3]">
          <DatePicker
            {...flags}
            accessibilityLabel={t(K.date)}
            value={value ? toCalendarDate(value) : day}
            onChange={(next) => {
              setDay(next);
              report(next, time);
            }}
            {...omitUndefined({
              calendar,
              calendarButtonLabel,
              minValue: minValue && toCalendarDate(minValue),
              maxValue: maxValue && toCalendarDate(maxValue),
            })}
          />
        </View>
        <View className="flex-[2]">
          <TimeField
            {...flags}
            accessibilityLabel={t(K.time)}
            value={value ? { hour: value.hour, minute: value.minute } : time}
            onChange={(next) => {
              setTime(next);
              report(day, next);
            }}
            {...omitUndefined({ hourCycle })}
          />
        </View>
      </View>
      {description == null ? null : (
        <Text type="small" tone="muted">
          {description}
        </Text>
      )}
      {isInvalid && errorMessage ? (
        <Text type="small" tone="danger">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
