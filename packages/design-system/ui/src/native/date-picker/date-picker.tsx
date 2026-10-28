/**
 * Stackra file contract:
 * Purpose: the native `DatePicker` on `@expo/ui`'s community DateTimePicker (ADR 0318 decision 8): the DateField with
 *          a calendar button named by `calendarButtonLabel` and the overlay's open state, so an app opens the platform
 *          picker with `isOpen` exactly as it opens a Popover (ADR 0312).
 * Boundary: `DateInput` with the button and the open state; the day, the bounds, the refused days and the local-noon
 *           conversion are the DateField's. "Choose a date" is the button's default name, from the `ui`
 *           catalogue in the active locale.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (open state); ADR 0318 (decision 8);
 *          ADR 0055 (forms); WCAG 2.2 SC 4.1.2.
 */
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { DateInput } from "#native/date-field/date-input";
import type { DatePickerProps } from "#native/date-picker/date-picker.props";

/**
 * A labelled field over one day with a calendar button. Pair `value` with `onChange` to control the day and `isOpen`
 * with `onOpenChange` to control the picker.
 */
export function DatePicker({
  calendarButtonLabel: calendarButtonLabelProp,
  ...rest
}: DatePickerProps): ReactElement {
  const t = useUiText();
  const calendarButtonLabel = calendarButtonLabelProp ?? t(UI_KEYS.ui.date_picker.calendar);
  return <DateInput {...rest} calendarButtonLabel={calendarButtonLabel} />;
}
