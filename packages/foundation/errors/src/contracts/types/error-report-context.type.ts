/**
 * Stackra file contract:
 * Purpose: `ErrorReportContext`, what a caller may hand `ErrorReporter#report` beside the error: the correlation id
 *          the failed call's answer carried, so the report and the client's envelope name the same call.
 * Boundary: a type only. It carries ids, never request context, input, a header value or a person (ADR 0184); a driver
 *           may drop it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (decision 1: the envelope's `correlationId`); ADR 0184 (decision 6); ADR 0232
 *                     (decision 8).
 */

/** The ids a report carries beside the error. */
export interface ErrorReportContext {
  /** The `correlationId` of the envelope the failed call answered with (ADR 0140), when it answered one. */
  readonly correlationId?: string;
}
