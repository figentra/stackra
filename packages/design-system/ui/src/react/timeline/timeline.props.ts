/**
 * Stackra file contract:
 * Purpose: `TimelineProps`, the props of the web `Timeline`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { TimelineContractProps } from "#contracts/types/timeline-contract-props.type";

/** Props of the web Timeline. */
export type TimelineProps = TimelineContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
