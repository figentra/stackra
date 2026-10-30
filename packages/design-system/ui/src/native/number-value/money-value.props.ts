/**
 * Stackra file contract:
 * Purpose: `MoneyValueProps`, the props of the native `MoneyValue`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { MoneyValueContractProps } from "#contracts/types/money-value-contract-props.type";

/** Props of the native MoneyValue. */
export type MoneyValueProps = MoneyValueContractProps & {
  /** Styles the text. */
  readonly className?: string | undefined;
};
