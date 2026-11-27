/**
 * Stackra file contract:
 * Purpose: `FaultRule`, which calls of one method of a fault-injected target fail, when, and with what error.
 * Boundary: a public type of the `.` entry; `injectFaults` reads a list of them. The first rule that matches a call
 *           wins.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 4: fault injection); ADR 0269 (decision 2: generic kit).
 */
import type { FaultCall } from "#core/types/fault-call.type";
import type { FaultTiming } from "#core/types/fault-timing.type";

/** Which calls of `method` fail, when, and how. */
export interface FaultRule<K extends string = string> {
  /** The method whose calls fail. */
  readonly method: K;
  /** The calls of `method` that fail, counted from 1: one, a list, or `"every"`. Default: the first. */
  readonly calls?: number | readonly number[] | "every";
  /** `before` (default): the target is never reached. `after`: the target acts, then the answer is lost. */
  readonly when?: FaultTiming;
  /** Makes the error a faulted call fails with (a fresh one per call). Default: an `InjectedFaultError`. */
  readonly error?: (call: FaultCall) => unknown;
}
