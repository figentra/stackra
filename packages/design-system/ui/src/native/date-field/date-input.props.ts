/**
 * Stackra file contract:
 * Purpose: `DateInputProps`: props of the native `DateInput` in `date-input.tsx`.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312 (open state); ADR 0318 (decisions 8 and 10); ADR 0055 (forms); ADR 0165 (HeroUI Native on
 *          native); WCAG 2.2 SC 1.3.1, 3.3.1, 4.1.2, 4.1.3.
 */
import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import type { DateInputPickerProps } from "#native/date-field/date-input-picker.props";

/** Props of {@link DateInput}: the DatePicker's contract and the picker's own props. */
export type DateInputProps = DatePickerContractProps &
  DateInputPickerProps & {
    /** The input's accessible name when the label is not a string. */
    readonly accessibilityLabel?: string | undefined;
    /** Styles the root, as on web. */
    readonly className?: string | undefined;
  };
