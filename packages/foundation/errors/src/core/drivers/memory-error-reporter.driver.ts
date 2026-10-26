/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `ErrorReporter` port, the one a test's `useDrivers("memory")` picks: it keeps
 *          every reported error in `errors`, in order, for a test to assert on.
 * Boundary: nothing leaves the process and nothing is scrubbed, since nothing is sent; `report` never throws. The list
 *           grows until `clear()`.
 * Runtime: isomorphic
 * Governing contract: ADR 0232 (decision 8); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";

import { ErrorReporter } from "#contracts/ports/error-reporter.port";

/**
 * Keeps reported errors in memory.
 *
 * @example
 * expect((app.get(ErrorReporter) as MemoryErrorReporterDriver).errors).toEqual([]);
 */
export class MemoryErrorReporterDriver extends Driver(ErrorReporter) {
  /** Every reported error, oldest first. */
  readonly errors: unknown[] = [];

  /** Keeps `error`. */
  report(error: unknown): void {
    this.errors.push(error);
  }

  /** Forgets the errors reported so far. */
  clear(): void {
    this.errors.length = 0;
  }
}
