/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `ErrorReporter` port, the one a test's `useDrivers("memory")` picks: it keeps
 *          every reported error in `errors`, in order, and the context each came with in `contexts` (same index), for a
 *          test to assert on.
 * Boundary: nothing leaves the process and nothing is scrubbed, since nothing is sent; `report` never throws. The list
 *           grows until `clear()`.
 * Runtime: isomorphic
 * Governing contract: ADR 0232 (decision 8); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";

import { ErrorReporter } from "#contracts/ports/error-reporter.port";
import type { ErrorReportContext } from "#contracts/types/error-report-context.type";

/**
 * Keeps reported errors in memory.
 *
 * @example
 * expect((app.get(ErrorReporter) as MemoryErrorReporterDriver).errors).toEqual([]);
 */
export class MemoryErrorReporterDriver extends Driver(ErrorReporter) {
  /** Every reported error, oldest first. */
  readonly errors: unknown[] = [];

  /** The context each error in `errors` was reported with, at the same index (`undefined` when none). */
  readonly contexts: (ErrorReportContext | undefined)[] = [];

  /** Keeps `error` in `errors` and its context in `contexts` for the test to read. */
  report(error: unknown, context?: ErrorReportContext): void {
    this.errors.push(error);
    this.contexts.push(context);
  }

  /** Forgets the errors reported so far. */
  clear(): void {
    this.errors.length = 0;
    this.contexts.length = 0;
  }
}
