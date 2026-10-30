/**
 * Stackra file contract:
 * Purpose: `BytesValueProps`, the props of the native `BytesValue`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { BytesValueContractProps } from "#contracts/types/bytes-value-contract-props.type";

/** Props of the native BytesValue. */
export type BytesValueProps = BytesValueContractProps & {
  /** Styles the text. */
  readonly className?: string | undefined;
};
