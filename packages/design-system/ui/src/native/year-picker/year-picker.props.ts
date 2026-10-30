/**
 * Stackra file contract:
 * Purpose: `YearPickerProps`, the props of the native `YearPicker`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { YearPickerContractProps } from "#contracts/types/year-picker-contract-props.type";

/** Props of the native YearPicker. */
export type YearPickerProps = YearPickerContractProps & {
  /** Styles the grid. */
  readonly className?: string | undefined;
};
