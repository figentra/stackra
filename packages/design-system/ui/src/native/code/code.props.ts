/**
 * Stackra file contract:
 * Purpose: `CodeProps`, the props of the native `Code`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { CodeContractProps } from "#contracts/types/code-contract-props.type";

/** Props of the native Code. */
export type CodeProps = CodeContractProps & {
  /** Styles the element. */
  readonly className?: string | undefined;
};
