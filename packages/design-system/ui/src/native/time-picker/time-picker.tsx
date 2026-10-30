/**
 * Stackra file contract:
 * Purpose: the native `TimePicker`: the TimeField with a clock button named by `pickerButtonLabel` and the overlay's
 *          open state, the wheel stepping minutes by `minuteStep` (5 by default).
 * Boundary: the TimeField with its button; "Choose a time" is the default name, from the `ui` catalogue.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312.
 */
import type { ReactElement } from "react";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { TimeField } from "#native/time-field/time-field";
import type { TimePickerProps } from "#native/time-picker/time-picker.props";

/** A time field with a clock button. */
export function TimePicker({
  pickerButtonLabel,
  minuteStep = 5,
  ...rest
}: TimePickerProps): ReactElement {
  const t = useUiText();
  return (
    <TimeField
      {...rest}
      minuteStep={minuteStep}
      pickerButtonLabel={pickerButtonLabel ?? t(FORMS_KEYS.ui.time_picker.open)}
    />
  );
}
