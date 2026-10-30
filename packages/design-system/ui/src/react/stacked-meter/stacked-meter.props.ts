/**
 * Stackra file contract:
 * Purpose: `StackedMeterProps`, the props of the web `StackedMeter`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { StackedMeterContractProps } from "#contracts/types/stacked-meter-contract-props.type";

/** Props of the web StackedMeter. */
export type StackedMeterProps = StackedMeterContractProps & {
  readonly className?: string | undefined;
};
