/**
 * Stackra file contract:
 * Purpose: `FaultInjection<T>`, what `injectFaults` hands back: the wrapped target to bind in place of the real one,
 *          every call it received in order (faulted or not), and `heal()`, which stops every rule.
 * Boundary: a public type of the `.` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 4: fault injection); ADR 0269 (decision 2: generic kit).
 */
import type { FaultCall } from "#core/types/fault-call.type";

/** A target with faults injected, and what happened to it. */
export interface FaultInjection<T extends object> {
  /** The target as the code under test sees it: bind or pass this one instead of the real object. */
  readonly target: T;
  /** Every call the target received from outside, oldest first, with the fault each took. */
  readonly calls: readonly FaultCall[];
  /** The calls of `method`, oldest first. */
  readonly callsOf: (method: keyof T & string) => readonly FaultCall[];
  /** The calls that took a fault, oldest first. */
  readonly faults: () => readonly FaultCall[];
  /** Stops every rule: later calls all reach the target (the provider or database came back). */
  readonly heal: () => void;
}
