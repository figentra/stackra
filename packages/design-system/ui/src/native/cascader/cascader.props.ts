/**
 * Stackra file contract:
 * Purpose: `CascaderProps`, the props of the native `Cascader`: the shared contract, a name for a field without a
 *          string label and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D).
 */
import type { CascaderContractProps } from "#contracts/types/cascader-contract-props.type";

/** Props of the native Cascader. */
export type CascaderProps = CascaderContractProps & {
  /** The field's name for assistive technology when it has no string `label`. */
  readonly accessibilityLabel?: string | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
};
