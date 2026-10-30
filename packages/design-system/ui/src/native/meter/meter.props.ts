/**
 * Stackra file contract:
 * Purpose: `MeterProps`, the props of the native `Meter`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { MeterContractProps } from "#contracts/types/meter-contract-props.type";

/** Props of the native Meter. */
export type MeterProps = MeterContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
