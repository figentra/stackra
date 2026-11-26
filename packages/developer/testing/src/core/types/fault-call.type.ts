/**
 * Stackra file contract:
 * Purpose: `FaultCall`, one call a fault-injected target received: the method, its 1-based number among that method's
 *          calls, the arguments, and the fault it took (`undefined` when it passed through).
 * Boundary: a public type of the `.` entry; `injectFaults` records one per call and hands it to a rule's `error`.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 4: fault injection); ADR 0269 (decision 2: generic kit).
 */
import type { FaultTiming } from "#core/types/fault-timing.type";

/** One recorded call of a fault-injected target. */
export interface FaultCall {
  /** The method called. */
  readonly method: string;
  /** Its number among the calls of `method`, from 1. */
  readonly call: number;
  /** The arguments it received. */
  readonly args: readonly unknown[];
  /** The fault it took; `undefined` when the call reached the target and its answer came back. */
  readonly fault: FaultTiming | undefined;
}
