/**
 * Stackra file contract:
 * Purpose: `InjectedFaultError`, the default error of a call `injectFaults` failed: a plain `Error` naming the method
 *          and the call number, so code under test sees an unexpected failure (not a refusal) unless the rule supplies
 *          its own error.
 * Boundary: a plain `Error` subclass, so the `.` entry stays generic (ADR 0269 decision 2): no `@stackra/errors`
 *           refusal. A rule that needs a domain refusal (a provider outage, a lost answer) passes `error`.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 4: fault injection); ADR 0269 (decision 2: generic kit).
 */
import type { FaultTiming } from "#core/types/fault-timing.type";

/**
 * The default error of an injected fault.
 *
 * @example
 * await expect(store.remove(id)).rejects.toBeInstanceOf(InjectedFaultError);
 */
export class InjectedFaultError extends Error {
  /** The faulted method. */
  readonly method: string;

  /** Its call number, from 1. */
  readonly call: number;

  /** Whether the target acted before the fault (`after`) or was never reached (`before`). */
  readonly timing: FaultTiming;

  /**
   * @param method - the faulted method.
   * @param call - its call number, from 1.
   * @param timing - when the fault struck.
   */
  constructor(method: string, call: number, timing: FaultTiming) {
    super(
      timing === "before"
        ? `injected fault: ${method} call ${call} failed before it reached the target`
        : `injected fault: ${method} call ${call} acted, then its answer was lost`,
    );
    this.name = "InjectedFaultError";
    this.method = method;
    this.call = call;
    this.timing = timing;
  }
}
