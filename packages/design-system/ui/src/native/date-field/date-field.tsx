/**
 * Stackra file contract:
 * Purpose: the native `DateField`, the adapted form of ADR 0318 decision 8: a labelled field over one day that opens
 *          the platform's date picker when pressed (Android's dialog, the inline calendar in an inset sheet on iOS),
 *          holding a `CalendarDate` and converting it to and from the platform's `Date` at local noon.
 * Boundary: `DateInput` without a calendar button or a controllable open state; the field keeps its own. Every other
 *           prop of `@expo/ui`'s DateTimePicker that the field does not own passes through to the picker.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decision 8); ADR 0055 (forms).
 */
import type { ReactElement } from "react";

import { DateInput } from "#native/date-field/date-input";
import type { DateFieldProps } from "#native/date-field/date-field.props";

/**
 * A labelled field over one day. Pair `value` with `onChange` to control it, or give `defaultValue`; `onChange`
 * receives the picked `CalendarDate`.
 */
export function DateField(props: DateFieldProps): ReactElement {
  return <DateInput {...props} />;
}
