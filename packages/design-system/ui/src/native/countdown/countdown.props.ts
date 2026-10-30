/**
 * Stackra file contract:
 * Purpose: `CountdownProps`, the props of the native `Countdown`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { CountdownContractProps } from "#contracts/types/countdown-contract-props.type";

/** Props of the native Countdown. */
export type CountdownProps = CountdownContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
