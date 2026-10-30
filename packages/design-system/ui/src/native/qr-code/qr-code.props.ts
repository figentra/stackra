/**
 * Stackra file contract:
 * Purpose: `QrCodeProps`, the props of the native `QrCode`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { QrCodeContractProps } from "#contracts/types/qr-code-contract-props.type";

/** Props of the native QrCode. */
export type QrCodeProps = QrCodeContractProps & {
  /** Styles the tile. */
  readonly className?: string | undefined;
};
