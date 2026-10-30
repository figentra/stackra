/**
 * Stackra file contract:
 * Purpose: `ListboxProps`, the props of the native `Listbox`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ListboxContractProps } from "#contracts/types/listbox-contract-props.type";

/** Props of the native Listbox. */
export type ListboxProps = ListboxContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
