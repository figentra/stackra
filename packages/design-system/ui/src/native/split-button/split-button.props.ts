/**
 * Stackra file contract:
 * Purpose: `SplitButtonProps`, the props of the native `SplitButton` in `split-button.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312.
 */
import type { ViewProps } from "react-native";
import type { SplitButtonContractProps } from "#contracts/types/split-button-contract-props.type";

/**
 * Props of the native SplitButton: the shared contract plus the row `View`'s own props, passed through. The two halves
 * are the component's, so `children` keeps the contract's meaning (the primary label).
 */
export type SplitButtonProps = SplitButtonContractProps &
  Omit<ViewProps, keyof SplitButtonContractProps>;
