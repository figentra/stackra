/**
 * Stackra file contract:
 * Purpose: `DateInput`, the one body of the native DateField and DatePicker (ADR 0318 decision 8): HeroUI Native's
 *          TextField with a label, a read-only input showing the day as the provider's locale writes it, the
 *          description and the error. Pressing the input (or the calendar button, when the DatePicker gives one) opens
 *          `@expo/ui`'s platform picker: Android's date dialog, which reports its day on OK, or on iOS the inline
 *          calendar in a dialog whose Done reports the day shown (today on an empty field, so today can be picked).
 *          A day is converted from the platform `Date` at local noon, refused when `isDateUnavailable` says so (the
 *          field says why, and the iOS dialog stays open for another day), and otherwise reported. The open state is
 *          the overlay vocabulary: controlled with `isOpen` and `onOpenChange`, or the field's own.
 * Boundary: internal to `date-field` and `date-picker`, not in the `./native` barrel. The platform pickers cannot grey
 *           out single days, so an unavailable day is refused when picked instead of shown; the bounds are the pickers'
 *           own `minimumDate` and `maximumDate`. iOS uses a centred dialog, not a sheet, so a field inside a sheet (a
 *           FilterBar's date range) never stacks a second sheet. The input is never editable: the platform picker is how
 *           a day is entered on a phone. Read-only keeps the picker shut but is not announced as disabled. `name` does
 *           not reach the input. "Select a date", "Done", "Cancel" and the refusal are English defaults until i18n
 *           ships. Needs the native `DesignSystemProvider` (locale and scheme) and, on iOS, what the native Modal needs.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (open state); ADR 0318 (decisions 8 and
 *          10); ADR 0055 (forms); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 1.3.1, 3.3.1, 4.1.2, 4.1.3.
 */
import { DateTimePicker, type DateTimePickerProps } from "@expo/ui/community/datetime-picker";
import type { CalendarDate } from "@internationalized/date";
import {
  Description,
  FieldError,
  Input,
  Label,
  TextField as HeroTextField,
  useThemeColor,
} from "heroui-native";
import { useState, type ReactElement } from "react";
import { AccessibilityInfo, Platform, Pressable, View } from "react-native";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Button } from "#native/button/button";
import { toCalendarDate, toPlatformDate } from "#native/date-field/platform-date";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { IconButton } from "#native/icon-button/icon-button";
import { Modal } from "#native/modal/modal";
import { Text } from "#native/text/text";

/** The platform picker's props the field passes through; the rest are the field's own. */
export type DateInputPickerProps = Omit<
  DateTimePickerProps,
  | "value"
  | "onChange"
  | "onValueChange"
  | "onDismiss"
  | "mode"
  | "minimumDate"
  | "maximumDate"
  | "disabled"
  | "locale"
  | "presentation"
  | "timeZoneName"
>;

/** Props of {@link DateInput}: the DatePicker's contract and the picker's own props. */
export type DateInputProps = DatePickerContractProps &
  DateInputPickerProps & {
    /** The input's accessible name when the label is not a string. */
    readonly accessibilityLabel?: string | undefined;
    /** Styles the root, as on web. */
    readonly className?: string | undefined;
  };

// shortcut: English words until @stackra/i18n ships; then the keys `ui::date-field.*`.
const WORDS = {
  empty: "Select a date",
  done: "Done",
  cancel: "Cancel",
  unavailable: "That day is not available. Choose another.",
} as const;

/** The day the picker opens on when the field is empty: today, kept inside the bounds. */
function startDayOf(minValue?: CalendarDate, maxValue?: CalendarDate): CalendarDate {
  const today = toCalendarDate(new Date());
  if (minValue && today.compare(minValue) < 0) return minValue;
  if (maxValue && today.compare(maxValue) > 0) return maxValue;
  return today;
}

/** A labelled field over one day that opens the platform's date picker. */
export function DateInput({
  label,
  description,
  errorMessage,
  variant = "primary",
  isFullWidth = true,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  isDateUnavailable,
  isOpen,
  defaultOpen,
  onOpenChange,
  calendarButtonLabel,
  // `name` is the form adapter's key; a native input has no form to submit under it.
  name: _name,
  className,
  accessibilityLabel,
  ...picker
}: DateInputProps): ReactElement {
  const { locale, resolvedColorScheme } = useDesignSystem();
  const accent = useThemeColor("accent");
  const [ownDay, setOwnDay] = useState<CalendarDate | null>(defaultValue ?? null);
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  // The day the iOS calendar shows before Done; `null` until the user moves it.
  const [shown, setShown] = useState<CalendarDate | null>(null);
  const [isRefused, setRefused] = useState(false);
  const day = value === undefined ? ownDay : value;
  const isLocked = Boolean(isDisabled || isReadOnly);
  const open = (isOpen ?? ownOpen) && !isLocked;
  const text = day
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(toPlatformDate(day))
    : "";
  const name = accessibilityLabel ?? (typeof label === "string" ? label : undefined);

  const setOpen = (next: boolean) => {
    if (next) setShown(null);
    if (isOpen === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  /** Reports `next` and closes, or refuses an unavailable day and says why. */
  const pick = (next: CalendarDate) => {
    if (isDateUnavailable?.(next)) {
      setRefused(true);
      AccessibilityInfo.announceForAccessibility(WORDS.unavailable);
      // Android's dialog has closed itself; the iOS dialog stays open for another day.
      if (Platform.OS !== "ios") setOpen(false);
      return;
    }
    setRefused(false);
    if (value === undefined) setOwnDay(next);
    if (!day || day.compare(next) !== 0) onChange?.(next);
    setOpen(false);
  };

  const isIos = Platform.OS === "ios";
  const platformPicker = (
    <DateTimePicker
      {...(isIos ? { display: "inline" as const } : {})}
      themeVariant={resolvedColorScheme}
      accentColor={accent}
      {...picker}
      value={toPlatformDate(shown ?? day ?? startDayOf(minValue, maxValue))}
      onValueChange={(_event, date) =>
        isIos ? setShown(toCalendarDate(date)) : pick(toCalendarDate(date))
      }
      onDismiss={() => setOpen(false)}
      {...omitUndefined({
        minimumDate: minValue && toPlatformDate(minValue),
        maximumDate: maxValue && toPlatformDate(maxValue),
      })}
      locale={locale.replaceAll("-", "_")}
    />
  );

  return (
    <HeroTextField
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      className={[isFullWidth ? "" : "self-start", className].filter(Boolean).join(" ")}
    >
      {label == null ? null : <Label>{label}</Label>}
      <View className="flex-row items-center gap-2">
        <Pressable
          className="flex-1"
          disabled={isLocked}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={name}
          accessibilityValue={{ text: text || WORDS.empty }}
          // Read-only is not disabled: the field still shows and submits its day.
          accessibilityState={{ disabled: Boolean(isDisabled), expanded: open }}
        >
          <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
            <Input value={text} placeholder={WORDS.empty} variant={variant} editable={false} />
          </View>
        </Pressable>
        {calendarButtonLabel === undefined ? null : (
          <IconButton
            icon="calendar"
            label={calendarButtonLabel}
            variant="tertiary"
            isDisabled={isLocked}
            onPress={() => setOpen(true)}
          />
        )}
      </View>
      {isRefused ? (
        <Text tone="danger" type="small" accessibilityLiveRegion="polite">
          {WORDS.unavailable}
        </Text>
      ) : null}
      {description == null ? null : <Description hideOnInvalid>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      {isIos ? (
        <Modal isOpen={open} onOpenChange={setOpen} label={name}>
          <Modal.Header>
            <Modal.Title>{label ?? name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{open ? platformPicker : null}</Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={() => setOpen(false)}>
              {WORDS.cancel}
            </Button>
            <Button onPress={() => pick(shown ?? day ?? startDayOf(minValue, maxValue))}>
              {WORDS.done}
            </Button>
          </Modal.Footer>
        </Modal>
      ) : open ? (
        platformPicker
      ) : null}
    </HeroTextField>
  );
}
