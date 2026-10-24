/**
 * Stackra file contract:
 * Purpose: `ConsoleErrorReporterDriver`, the reporter `bootApp` falls back to when the wiring binds no `ErrorReporter`
 *          driver (or when boot itself failed), so an unexpected error is still written somewhere a developer looks.
 * Boundary: built by `bootApp` and the target runtimes only, never listed in a wiring; not exported. Writes the error
 *           as it is to `console.error` and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0232 (decision 8); ADR 0294 (decision 16 Driver row).
 */
import { Driver } from "@stackra/container";
import { ErrorReporter } from "@stackra/errors/contracts";

/**
 * Writes each reported error to the console.
 *
 * @example
 * const reporter = container.has(ErrorReporter) ? container.get(ErrorReporter) : new ConsoleErrorReporterDriver();
 */
export class ConsoleErrorReporterDriver extends Driver(ErrorReporter) {
  /** Writes `error` to `console.error`; a failing console is ignored, so reporting never adds a second failure. */
  report(error: unknown): void {
    try {
      // oxlint-disable-next-line no-console -- reason: the fallback reporter's one job is the console
      console.error(error);
    } catch {
      // nowhere left to report to
    }
  }
}
