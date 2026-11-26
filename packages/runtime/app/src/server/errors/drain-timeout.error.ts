/**
 * Stackra file contract:
 * Purpose: `DrainTimeoutError`, what the server `createApp` reports through the `ErrorReporter` when its drain deadline
 *          (`HttpConfig.drainTimeoutSeconds`) passes with calls still in flight: the server stops waiting for them and
 *          shuts down anyway, so the shutdown hooks (the outbox flush among them) still run before the platform's
 *          SIGKILL.
 * Boundary: a plain `Error`, not a refusal: no caller receives it; it is reported once and never thrown. It carries the
 *           count of calls abandoned and the deadline, never a call's input, caller or result.
 * Runtime: node
 * Governing contract: ADR 0143 (decision 3: draining timeouts); ADR 0295 (decision 8: `drain()`); ADR 0232
 *                     (decision 8: report an unexpected error once).
 */

/**
 * The drain deadline passed with calls still in flight.
 *
 * @example
 * reporter.report(new DrainTimeoutError(2, 20)); // "2 calls still in flight after the 20 s drain deadline"
 */
export class DrainTimeoutError extends Error {
  /** How many calls were still in flight at the deadline. */
  readonly pending: number;

  /** The deadline that passed, in seconds. */
  readonly timeoutSeconds: number;

  /**
   * @param pending - the calls still in flight.
   * @param timeoutSeconds - the deadline, in seconds.
   */
  constructor(pending: number, timeoutSeconds: number) {
    super(
      `${pending} ${pending === 1 ? "call" : "calls"} still in flight after the ${timeoutSeconds} s drain deadline; shutting down without them`,
    );
    this.name = "DrainTimeoutError";
    this.pending = pending;
    this.timeoutSeconds = timeoutSeconds;
  }
}
