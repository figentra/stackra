/**
 * Stackra file contract:
 * Purpose: `StackedMeterProps`, the props of the native `StackedMeter`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { StackedMeterContractProps } from "#contracts/types/stacked-meter-contract-props.type";

/** Props of the native StackedMeter. */
export type StackedMeterProps = StackedMeterContractProps & {
  readonly className?: string | undefined;
};
