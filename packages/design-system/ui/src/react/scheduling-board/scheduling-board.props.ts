/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardProps`, the props of the web `SchedulingBoard`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); shared modules step 4a (LEADER,
 *          2026-11-09).
 */
import type { SchedulingBoardContractProps } from "#contracts/types/scheduling-board-contract-props.type";

/** Props of the web SchedulingBoard. */
export type SchedulingBoardProps = SchedulingBoardContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
