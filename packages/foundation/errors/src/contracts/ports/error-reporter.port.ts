/**
 * Stackra file contract:
 * Purpose: the `ErrorReporter` port: where an unexpected error goes so a developer can diagnose it (Sentry behind it in
 *          production, a memory driver in tests), with the correlation id its call answered with, when there was one.
 * Boundary: an abstract class that is its own token; drivers implement it with `extends Driver(ErrorReporter)`.
 *           Report what was not handled, once: a refusal is an answer, not a fault, so callers do not report one. A
 *           driver scrubs personal data and adds fingerprints before anything leaves the process (ADR 0232 decision
 *           8); callers pass the error as it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0232 (decision 8), ADR 0294 (decisions 15, 16 and 17), ADR 0147 (logger and telemetry), ADR
 *                     0140 (decision 1: `correlationId`).
 */
import { Port } from "@stackra/contracts";

import type { ErrorReportContext } from "#contracts/types/error-report-context.type";

/**
 * Takes unexpected errors for diagnosis.
 *
 * @example
 * export class MemoryErrorReporterDriver extends Driver(ErrorReporter) {
 *   readonly errors: unknown[] = [];
 *   report(error: unknown): void {
 *     this.errors.push(error);
 *   }
 * }
 *
 * reporter.report(error, { correlationId: envelope.correlationId });
 */
export abstract class ErrorReporter extends Port {
  /**
   * Records one unexpected error; never throws, so reporting cannot add a second failure. `context` names the call
   * it failed, so the report is found from the id the client was answered with.
   */
  abstract report(error: unknown, context?: ErrorReportContext): void;
}
