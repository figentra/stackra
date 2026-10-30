/**
 * Stackra file contract:
 * Purpose: `PeriodPickerProps`, the props of the native `PeriodPicker`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decision 17); STA-1371.
 */
import type { PeriodPickerContractProps } from "#contracts/types/period-picker-contract-props.type";

/** Props of the native PeriodPicker. */
export type PeriodPickerProps = PeriodPickerContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
