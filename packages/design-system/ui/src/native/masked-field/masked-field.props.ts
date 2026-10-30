/**
 * Stackra file contract:
 * Purpose: `MaskedFieldProps`, the props of the native `MaskedField` in `masked-field.tsx`.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-1371 (wave C).
 */
import type { MaskedFieldContractProps } from "#contracts/types/masked-field-contract-props.type";

/** Props of the native MaskedField: the shared contract, a class name and the accessible name without a label. */
export type MaskedFieldProps = MaskedFieldContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
  /** The field's name for assistive technology when it has no string `label`. */
  readonly accessibilityLabel?: string | undefined;
};
