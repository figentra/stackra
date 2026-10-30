/**
 * Stackra file contract:
 * Purpose: `BarcodeProps`, the props of the native `Barcode`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { BarcodeContractProps } from "#contracts/types/barcode-contract-props.type";

/** Props of the native Barcode. */
export type BarcodeProps = BarcodeContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
