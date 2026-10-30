/**
 * Stackra file contract:
 * Purpose: `MultiSelectProps`, the props of the native `MultiSelect` in `multi-select.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); gap inventory row 4.
 */
import type { MultiSelectContractProps } from "#contracts/types/multi-select-contract-props.type";

/** Props of the native MultiSelect: the shared contract plus a root class and a spoken name for a field without a label. */
export type MultiSelectProps = MultiSelectContractProps & {
  /** Classes for the root. */
  readonly className?: string | undefined;
  /** The field's spoken name when `label` is not a string. */
  readonly accessibilityLabel?: string | undefined;
};
