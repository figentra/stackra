/**
 * Stackra file contract:
 * Purpose: `SchedulerProps`, the props of the native `Scheduler`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { SchedulerContractProps } from "#contracts/types/scheduler-contract-props.type";

/** Props of the native Scheduler. */
export type SchedulerProps = SchedulerContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
