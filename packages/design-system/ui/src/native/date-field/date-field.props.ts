/**
 * Stackra file contract:
 * Purpose: `DateFieldProps`, the props of the native `DateField` in `date-field.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318 (decision 8); ADR 0055 (forms).
 */
import type { DateValueContractProps } from "#contracts/types/date-value-contract-props.type";
import type { DateInputPickerProps } from "#native/date-field/date-input-picker.props";

/** Props of the native DateField: the shared contract plus the platform picker's own props, passed through. */
export type DateFieldProps = DateValueContractProps &
  DateInputPickerProps & {
    /** The field's accessible name when the label is not a string. */
    readonly accessibilityLabel?: string | undefined;
    /** Styles the root, as on web. */
    readonly className?: string | undefined;
  };
