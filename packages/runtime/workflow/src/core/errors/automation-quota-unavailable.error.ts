/**
 * Stackra file contract:
 * Purpose: `AutomationQuotaUnavailableError`, thrown when a trigger's queued start finds a tenant's automation quota it
 *          cannot read on an attempt that is not its last: a 503 the queue retries, so the occurrence starts its runs
 *          once the quota answers. On the last attempt the start records `quota_unavailable` instead.
 * Boundary: retryable; it names no tenant and no quota figure. A schedule start and an in-process start never throw it.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * An automation quota that could not be read, on an attempt a retry follows.
 *
 * @example
 * throw AutomationQuotaUnavailableError.create();
 */
export class AutomationQuotaUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
