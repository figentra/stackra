/**
 * Stackra file contract:
 * Purpose: `AutomationQuotaUnavailableError`, thrown when a trigger event would start an automation whose tenant's
 *          quota cannot be read: a 503 the outbox retries, so the occurrence starts its runs once the quota answers.
 * Boundary: retryable; it names no tenant and no quota figure. A schedule start never throws it (it records a skip).
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * An automation quota that could not be read.
 *
 * @example
 * throw AutomationQuotaUnavailableError.create();
 */
export class AutomationQuotaUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
