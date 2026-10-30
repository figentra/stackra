/**
 * Stackra file contract:
 * Purpose: `TimeClockProps`, the props of the web `TimeClock`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { TimeClockContractProps } from "#contracts/types/time-clock-contract-props.type";

/** Props of the web TimeClock. */
export type TimeClockProps = TimeClockContractProps & {
  /** Styles the outer element. */
  readonly className?: string | undefined;
};
