/**
 * Stackra file contract:
 * Purpose: `ForecastQueryInvalidError`, the refusal of a forecast query that is malformed: a bad horizon, frequency,
 *          model list, series count, id, length or value, or a query the forecast service refused.
 * Boundary: a refusal (`validation`); `reason` says what is wrong and never echoes a series value.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 8); ADR 0140 (refusals); ADR 0328 (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A forecast query is malformed. */
export class ForecastQueryInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** What is wrong, such as `a series needs at least 3 points`. */
  reason!: string;
}
