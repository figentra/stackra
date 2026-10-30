/**
 * Stackra file contract:
 * Purpose: `NumberValueProps`, the props of the web `NumberValue`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { NumberValueContractProps } from "#contracts/types/number-value-contract-props.type";

/** Props of the web NumberValue. */
export type NumberValueProps = NumberValueContractProps & {
  /** Styles the text. */
  readonly className?: string | undefined;
};
