/**
 * Stackra file contract:
 * Purpose: `TransferListProps`, the props of the native `TransferList`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D).
 */
import type { TransferListContractProps } from "#contracts/types/transfer-list-contract-props.type";

/** Props of the native TransferList. */
export type TransferListProps = TransferListContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
